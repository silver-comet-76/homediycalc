/**
 * Shared calculator island — one React component drives all ten P0
 * calculators from their config objects (see CalculatorConfig.ts).
 *
 * The island owns every behavior that is the same across calculators:
 * imperial/metric toggle (converting entered values, never clearing them),
 * input validation with inline errors, live results, Reset, copyable
 * shopping list, and Add to Project (LocalStorage via src/lib/project.ts).
 * It contains no calculation math: all math lives in the pure formula
 * modules under src/lib/formulas/ and all conversion in src/lib/units.ts.
 */

import { useEffect, useMemo, useState } from "react";
import { NumberInput, ResultPanel, UnitToggle, type UnitSystem } from "./CalculatorInputs";
import type { CalculatorConfig, CalcOutput, FieldSpec, ModeSpec } from "./CalculatorConfig";
import { costShoppingListLine } from "./CalculatorConfig";
import {
  convertArea,
  convertCoverage,
  convertLength,
  convertVolume,
  type AreaUnit,
  type CoverageUnit,
  type LengthUnit,
  type VolumeUnit,
} from "../../lib/units";
import { parseNumber, validateField } from "../../lib/validation";
import { addItemToProject, prefixWarning, STAIR_SAFETY_VERSION } from "../../lib/project";
import { CALCULATOR_CONFIGS } from "../../calculators/index";

const MAX_DEFAULTS: Record<string, number> = {
  length: 10000,
  area: 1000000,
  volume: 1000000,
  number: 1000000,
  count: 10000,
  percent: 100,
  price: 1000000,
};

function defaultUnit(field: FieldSpec, system: UnitSystem): string {
  if (!field.unitKind) return "";
  return system === "imperial" ? (field.impUnit ?? "") : (field.metUnit ?? "");
}

function defaultValue(field: FieldSpec, system: UnitSystem): string {
  return system === "imperial" ? field.defaultImp : field.defaultMet;
}

/** Convert a displayed value between two units of the same family. */
function convertValue(
  raw: string,
  from: string,
  to: string,
  unitKind: FieldSpec["unitKind"],
): string {
  const value = parseNumber(raw);
  if (value === undefined || from === to || !unitKind) return raw;
  let converted: number;
  if (unitKind === "length") {
    converted = convertLength(value, from as LengthUnit, to as LengthUnit);
  } else if (unitKind === "area") {
    converted = convertArea(value, from as AreaUnit, to as AreaUnit);
  } else if (unitKind === "coverage") {
    converted = convertCoverage(value, from as CoverageUnit, to as CoverageUnit);
  } else {
    converted = convertVolume(value, from as VolumeUnit, to as VolumeUnit);
  }
  return String(Math.round(converted * 10000) / 10000);
}

/** Convert a parsed value to the canonical unit its formula expects. */
function toCanonical(value: number, unit: string, field: FieldSpec): number {
  if (!field.unitKind) return value;
  if (field.unitKind === "length") {
    return convertLength(value, unit as LengthUnit, (field.canonicalUnit ?? "ft") as LengthUnit);
  }
  if (field.unitKind === "area") {
    return convertArea(value, unit as AreaUnit, (field.canonicalUnit ?? "ft2") as AreaUnit);
  }
  if (field.unitKind === "coverage") {
    return convertCoverage(
      value,
      unit as CoverageUnit,
      (field.canonicalUnit ?? "ft2/gal") as CoverageUnit,
    );
  }
  return convertVolume(value, unit as VolumeUnit, (field.canonicalUnit ?? "ft3") as VolumeUnit);
}

/**
 * Convert a canonical-unit value to the display unit, with full
 * precision (no rounding). The unrounded form is what the QA-16A-05
 * canonical validation error reports, so the precise physical value
 * is visible even when the rounded display hides the excess.
 */
function canonicalToDisplay(value: number, unit: string, field: FieldSpec): number {
  if (!field.unitKind || !unit) return value;
  if (field.unitKind === "length") {
    return convertLength(value, (field.canonicalUnit ?? "ft") as LengthUnit, unit as LengthUnit);
  }
  if (field.unitKind === "area") {
    return convertArea(value, (field.canonicalUnit ?? "ft2") as AreaUnit, unit as AreaUnit);
  }
  if (field.unitKind === "coverage") {
    return convertCoverage(
      value,
      (field.canonicalUnit ?? "ft2/gal") as CoverageUnit,
      unit as CoverageUnit,
    );
  }
  return convertVolume(value, (field.canonicalUnit ?? "ft3") as VolumeUnit, unit as VolumeUnit);
}

/**
 * Convert a canonical-unit bound (field.min / field.max) to the display
 * unit, so validation compares against the value the user actually sees.
 * Mirrors toCanonical in reverse. Rounded to 4 decimals (matching
 * convertValue) so the bound is exact in the display unit — e.g. the
 * 7.75 in riser cap converts to exactly 19.685 cm, not
 * 19.685000000078738.
 */
function fromCanonical(value: number, unit: string, field: FieldSpec): number {
  return Math.round(canonicalToDisplay(value, unit, field) * 10000) / 10000;
}

/** Format a number with up to 10 decimal places, trimming trailing zeros. */
function formatPrecise(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return value.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
}

function modeDefaults(mode: ModeSpec, system: UnitSystem) {
  const values: Record<string, string> = {};
  const units: Record<string, string> = {};
  for (const field of mode.fields) {
    values[field.id] = defaultValue(field, system);
    units[field.id] = defaultUnit(field, system);
  }
  return { values, units };
}

/**
 * Collapse binary floating-point conversion noise out of a canonical
 * value. 383.54 cm is exactly 151 in, but convertLength returns
 * 151.00000000000003 in — one ulp above the 151 in single-flight limit,
 * which would wrongly warn on the exact metric equivalent of the limit.
 * Twelve significant digits keeps every genuine user-entered difference
 * (the tests use differences down to 1e-5) while collapsing conversion
 * noise (~1e-13 relative, cf. the ceilUp tolerance in ADR-11). This
 * runs only when a canonical value is derived from a display string;
 * a retained canonical value is never re-derived or re-rounded on a
 * unit switch, so it is preserved exactly across switches.
 */
function cleanCanonical(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}

/**
 * Canonical value for a displayed string in its current unit, or
 * undefined when the display is empty or non-numeric. Select fields
 * store their value as a number, so they pass through unchanged.
 */
function canonicalFromDisplay(raw: string, unit: string, field: FieldSpec): number | undefined {
  const parsed = parseNumber(raw);
  if (parsed === undefined) return undefined;
  return cleanCanonical(toCanonical(parsed, unit, field));
}

/** Canonical defaults for a mode in a unit system (the physical input behind the display defaults). */
function modeCanonical(mode: ModeSpec, system: UnitSystem): Record<string, number> {
  const canon: Record<string, number> = {};
  for (const field of mode.fields) {
    const value = canonicalFromDisplay(
      defaultValue(field, system),
      defaultUnit(field, system),
      field,
    );
    if (value !== undefined) canon[field.id] = value;
  }
  return canon;
}

export interface GenericCalculatorProps {
  /** Calculator slug. The full config is resolved client-side from
   * CALCULATOR_CONFIGS: Astro serializes island props to JSON, so a
   * config object (which carries compute functions) cannot be passed
   * as a prop — the functions would be dropped on hydration. */
  slug: string;
  calculatorName: string;
}

export function GenericCalculator({ slug, calculatorName }: GenericCalculatorProps) {
  const config: CalculatorConfig =
    CALCULATOR_CONFIGS[slug] ??
    (() => {
      throw new Error(`No calculator config for slug: ${slug}`);
    })();
  const [system, setSystem] = useState<UnitSystem>("imperial");
  const [modeId, setModeId] = useState<string>(config.defaultMode);
  const firstMode = config.modes[0];
  if (!firstMode) throw new Error(`No modes configured for ${config.slug}`);
  const mode = config.modes.find((m) => m.id === modeId) ?? firstMode;
  const [values, setValues] = useState<Record<string, string>>(
    () => modeDefaults(mode, "imperial").values,
  );
  const [fieldUnits, setFieldUnits] = useState<Record<string, string>>(
    () => modeDefaults(mode, "imperial").units,
  );
  // Full-precision canonical values (feet / square feet / cubic feet /
  // US gallons / ft² per gallon, or the field's canonicalUnit override)
  // are the source of truth for computation. Display strings are
  // rounded to 4 decimals on a unit switch, so re-deriving canonical
  // values from them would drift the physical input — e.g. 151.00001 in
  // → 383.54 cm → back to 151 in, silently dropping the over-limit
  // excess. Canonical values are therefore retained exactly across
  // switches and only re-derived on an actual user edit, mode switch,
  // or Reset. See switchSystem / handleFieldChange below.
  const [canonicalValues, setCanonicalValues] = useState<Record<string, number>>(() =>
    modeCanonical(mode, "imperial"),
  );
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [saved, setSaved] = useState(false);
  // Set after hydration so tests (and users) can tell the island is live:
  // the server-rendered HTML has no data-hydrated attribute.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  function switchMode(nextModeId: string) {
    const next = config.modes.find((m) => m.id === nextModeId);
    if (!next) return;
    setModeId(nextModeId);
    const defaults = modeDefaults(next, system);
    setValues(defaults.values);
    setFieldUnits(defaults.units);
    setCanonicalValues(modeCanonical(next, system));
    setCopied(false);
    setSaved(false);
  }

  function switchSystem(next: UnitSystem) {
    if (next === system) return;
    const nextValues: Record<string, string> = {};
    const nextUnits: Record<string, string> = {};
    for (const field of mode.fields) {
      const oldUnit = fieldUnits[field.id] ?? "";
      const newUnit = defaultUnit(field, next);
      // Derive the new display string from the retained canonical
      // value, never from the old (rounded) display string, so the
      // display can never drift from the physical input. The canonical
      // value itself is left untouched. Fields with no retained
      // canonical value (empty or invalid input) fall back to
      // converting the display string, as before.
      const retained = canonicalValues[field.id];
      nextValues[field.id] =
        field.unitKind && retained !== undefined
          ? String(fromCanonical(retained, newUnit, field))
          : convertValue(values[field.id] ?? "", oldUnit, newUnit, field.unitKind);
      nextUnits[field.id] = newUnit;
    }
    setValues(nextValues);
    setFieldUnits(nextUnits);
    setSystem(next);
  }

  function changeFieldUnit(field: FieldSpec, nextUnit: string) {
    const oldUnit = fieldUnits[field.id] ?? "";
    const retained = canonicalValues[field.id];
    const nextValue =
      field.unitKind && retained !== undefined
        ? String(fromCanonical(retained, nextUnit, field))
        : convertValue(values[field.id] ?? "", oldUnit, nextUnit, field.unitKind);
    setValues((prev) => ({
      ...prev,
      [field.id]: nextValue,
    }));
    setFieldUnits((prev) => ({ ...prev, [field.id]: nextUnit }));
  }

  /** A user edit makes the new display value authoritative: its canonical value is re-derived from what was typed, in the field's current unit. An empty or invalid entry drops the field's canonical value so no stale value is used. */
  function handleFieldChange(field: FieldSpec, value: string) {
    setValues((prev) => ({ ...prev, [field.id]: value }));
    const nextCanonical = canonicalFromDisplay(value, fieldUnits[field.id] ?? "", field);
    setCanonicalValues((prev) => {
      const next = { ...prev };
      if (nextCanonical === undefined) {
        delete next[field.id];
      } else {
        next[field.id] = nextCanonical;
      }
      return next;
    });
  }

  function reset() {
    const defaults = modeDefaults(mode, system);
    setValues(defaults.values);
    setFieldUnits(defaults.units);
    setCanonicalValues(modeCanonical(mode, system));
    setCopied(false);
    setSaved(false);
  }

  // Validate every field against its display bounds AND, for fields
  // with an explicit bound in a convertible unit, against the
  // retained canonical value (QA-16A-05). The display string is
  // rounded to 4 decimals on a unit switch, so it can pass while the
  // retained canonical — the value computation actually uses —
  // violates the bound (e.g. max riser 7.75001 in displays as
  // 19.685 cm, the cap, after switching to metric). The canonical
  // check is therefore authoritative: when it fails the field is
  // invalid, no computation runs, and the error states the precise
  // physical value in the current display unit so the excess (or
  // shortfall) is visible. Display validation is unchanged (bounds
  // converted to the display unit via fromCanonical); computation
  // uses the retained canonical values, not a re-conversion of the
  // rounded display strings — see the canonicalValues state.
  const { errors, canonical, present } = useMemo(() => {
    const errs: Record<string, string> = {};
    const canon: Record<string, number> = {};
    const pres = new Set<string>();
    for (const field of mode.fields) {
      const raw = values[field.id] ?? "";
      const isPercent = field.kind === "percent";
      const isPrice = field.kind === "price";
      // Explicit bounds are stored in the canonical unit; convert them to
      // the display unit before validating, so a metric entry is judged
      // against a metric bound (e.g. the 7.75 in riser cap is 19.685 cm).
      // Fields without an explicit bound keep the existing defaults.
      const displayMin =
        field.min !== undefined && field.unitKind
          ? fromCanonical(field.min, fieldUnits[field.id] ?? "", field)
          : (field.min ?? 0);
      const displayMax =
        field.max !== undefined && field.unitKind
          ? fromCanonical(field.max, fieldUnits[field.id] ?? "", field)
          : (field.max ?? MAX_DEFAULTS[field.kind] ?? 1000000);
      const result = validateField(raw, {
        label: field.label,
        optional: field.optional,
        min: displayMin,
        exclusiveMin: field.min === undefined && !(isPercent || isPrice || field.kind === "select"),
        max: displayMax,
        integer: field.kind === "count",
      });
      if (result.error) {
        errs[field.id] = result.error;
      } else if (result.present && result.value !== undefined) {
        // The retained canonical value is the physical input; fall
        // back to converting the display value only when no canonical
        // value is retained (defensive — edits and switches keep the
        // two in sync).
        const retained = canonicalValues[field.id];
        const physical =
          retained !== undefined
            ? retained
            : canonicalFromDisplay(raw, fieldUnits[field.id] ?? "", field);
        // QA-16A-05: validate the physical (canonical) value against
        // the canonical bounds. A rounded display can conceal a
        // violation; the canonical value is what is computed from,
        // so it must pass too. Only explicit bounds on convertible
        // fields are checked here — for every other field the
        // display value and the canonical value are the same number,
        // so the display check above is already exact.
        if (field.unitKind && physical !== undefined) {
          const unit = fieldUnits[field.id] ?? "";
          if (field.min !== undefined && physical < field.min) {
            errs[field.id] =
              `${field.label} must be at least ${formatPrecise(displayMin)}${unit ? ` ${unit}` : ""}` +
              ` — the value entered is ${formatPrecise(canonicalToDisplay(physical, unit, field))}${unit ? ` ${unit}` : ""}.`;
            continue;
          }
          if (field.max !== undefined && physical > field.max) {
            errs[field.id] =
              `${field.label} must be ${formatPrecise(displayMax)}${unit ? ` ${unit}` : ""} or less` +
              ` — the value entered is ${formatPrecise(canonicalToDisplay(physical, unit, field))}${unit ? ` ${unit}` : ""}.`;
            continue;
          }
        }
        pres.add(field.id);
        if (physical !== undefined) canon[field.id] = physical;
      }
    }
    return { errors: errs, canonical: canon, present: pres };
  }, [mode, values, fieldUnits, canonicalValues]);

  const hasErrors = Object.keys(errors).length > 0;
  // The active unit system is passed through so a mode that formats
  // lengths in its results (e.g. the Stair Calculator, Phase 16A) can
  // present them in the selected system. The calculation itself stays
  // canonical — only the presentation converts.
  const result: CalcOutput | null = hasErrors ? null : mode.compute(canonical, present, system);

  const costLine = result ? costShoppingListLine(result) : undefined;
  // Safety warnings (e.g. the Stair 151 in limit, Phase 16A) travel
  // with the result: the plain-text copy has no amber styling, so
  // each warning is prefixed "Warning: " and placed directly under
  // the header, before the result lines, so it cannot be missed.
  const shoppingList = result
    ? [
        `${calculatorName} — ${mode.label}`,
        ...(result.warnings ?? []).map(prefixWarning),
        ...result.lines,
        ...(costLine !== undefined ? [costLine] : []),
      ].join("\n")
    : "";

  async function copyShoppingList() {
    if (!shoppingList) return;
    try {
      await navigator.clipboard.writeText(shoppingList);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 4000);
    }
  }

  function addToProject() {
    if (!result) return;
    addItemToProject({
      calculatorSlug: slug,
      label: `${calculatorName} — ${mode.label}`,
      lines: result.lines,
      costUsd: result.costUsd,
      // A partial cost (ADR-13) keeps its flag, label, and detail
      // through the save, so My Project never presents a bricks-only
      // figure as a total (ADR-16).
      costPartial: result.costPartial,
      costLabel: result.costLabel,
      costDetail: result.costDetail,
      // A safety warning (Phase 16A, e.g. the Stair 151 in limit)
      // travels with the item so My Project, reload, and export keep
      // it — an over-limit result is never saved as if compliant.
      warnings: result.warnings,
      // QA-16A-06: a Stair item saved now carries the current
      // safety-review marker, so My Project can tell it apart from a
      // legacy Stair record saved before warnings existed. Non-Stair
      // items are unaffected.
      ...(slug === "stair-calculator" ? { stairSafetyVersion: STAIR_SAFETY_VERSION } : {}),
      savedAt: Date.now(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  /**
   * Result block (warnings + results + worked line + actions). Rendered
   * inside the inputs card in the original layout; Direction C+ renders
   * it as a separated sibling card below the inputs (audit F8).
   */
  const cplus = config.designCplus === true;
  const resultBlock = result ? (
    <>
      {result.warnings && result.warnings.length > 0 ? (
        <div className="mb-4 space-y-2">
          {result.warnings.map((warning) => (
            <p
              key={warning}
              role="alert"
              className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
            >
              {warning}
            </p>
          ))}
        </div>
      ) : null}
      <ResultPanel
        title="Results"
        rows={
          result.costUsd !== undefined
            ? [
                ...result.rows,
                {
                  label: result.costLabel ?? "Estimated cost",
                  value: `$${result.costUsd.toFixed(2)}`,
                  detail: result.costDetail ?? "From the prices you entered only.",
                },
              ]
            : result.rows
        }
        note={
          result.note ??
          "Package quantities are always rounded up — you are never told to buy less than you need."
        }
        shoppingList={shoppingList}
        onCopyShoppingList={copyShoppingList}
        heroFirstRow={cplus}
      />
      {result.workedLine ? (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Your calculation: </span>
          {result.workedLine}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={addToProject} className="btn-primary">
          Add to Project
        </button>
        {copied ? (
          <p role="status" className="text-sm font-medium text-green-700">
            Shopping list copied.
          </p>
        ) : null}
        {copyFailed ? (
          <p role="status" className="text-sm font-medium text-red-700">
            Copy did not work in this browser — select the list text manually.
          </p>
        ) : null}
        {saved ? (
          <p role="status" className="text-sm font-medium text-green-700">
            Saved to{" "}
            <a href="/my-project/" className="font-semibold">
              My Project
            </a>
            .
          </p>
        ) : null}
      </div>
    </>
  ) : null;

  return (
    <>
      <div className="card" data-hydrated={hydrated ? "true" : undefined}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <UnitToggle value={system} onChange={switchSystem} />
          <button type="button" onClick={reset} className="btn-secondary px-3 py-1.5 text-sm">
            Reset
          </button>
        </div>

        {config.modes.length > 1 ? (
          <fieldset className="mt-5">
            <legend className="label">Calculation method</legend>
            <div className="flex flex-wrap gap-2">
              {config.modes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={modeId === m.id}
                  onClick={() => switchMode(m.id)}
                  className={
                    modeId === m.id
                      ? "toggle-pressed rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {mode.fields.map((field) =>
            field.kind === "select" ? (
              <div key={field.id}>
                <label htmlFor={`${config.slug}-${mode.id}-${field.id}`} className="label">
                  {field.label}
                </label>
                <select
                  id={`${config.slug}-${mode.id}-${field.id}`}
                  value={values[field.id] ?? ""}
                  onChange={(event) => handleFieldChange(field, event.target.value)}
                  aria-invalid={errors[field.id] ? true : undefined}
                  aria-describedby={
                    errors[field.id]
                      ? `${config.slug}-${mode.id}-${field.id}-error`
                      : field.hint
                        ? `${config.slug}-${mode.id}-${field.id}-hint`
                        : undefined
                  }
                  className="input-field"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors[field.id] ? (
                  <p
                    id={`${config.slug}-${mode.id}-${field.id}-error`}
                    role="alert"
                    className="mt-1 text-sm font-medium text-red-700"
                  >
                    {errors[field.id]}
                  </p>
                ) : field.hint ? (
                  <p
                    id={`${config.slug}-${mode.id}-${field.id}-hint`}
                    className="mt-1 text-sm text-slate-500"
                  >
                    {field.hint}
                  </p>
                ) : null}
              </div>
            ) : (
              <div key={field.id}>
                <NumberInput
                  id={`${config.slug}-${mode.id}-${field.id}`}
                  label={field.label}
                  value={values[field.id] ?? ""}
                  onChange={(value) => handleFieldChange(field, value)}
                  unit={field.unitKind ? fieldUnits[field.id] : undefined}
                  error={errors[field.id]}
                  hint={field.hint}
                  required={!field.optional}
                />
                {field.allowUnitSelect && field.unitOptions ? (
                  <label className="mt-1 block text-sm text-slate-600">
                    Unit for {field.label.toLowerCase()}:{" "}
                    <select
                      aria-label={`${field.label} unit`}
                      value={fieldUnits[field.id] ?? ""}
                      onChange={(event) => changeFieldUnit(field, event.target.value)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    >
                      {field.unitOptions.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ),
          )}
        </div>

        {!cplus && result ? <div className="mt-6">{resultBlock}</div> : null}
        {!result ? (
          <p className="mt-6 text-slate-600">
            Enter your measurements above to see results. Fix any highlighted fields first — a
            result is only shown when every required input is valid.
          </p>
        ) : null}
      </div>
      {cplus && result ? <div className="mt-4">{resultBlock}</div> : null}
    </>
  );
}
