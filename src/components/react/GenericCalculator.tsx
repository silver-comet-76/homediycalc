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
import { addItemToProject, prefixWarning } from "../../lib/project";
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
 * Convert a canonical-unit bound (field.min / field.max) to the display
 * unit, so validation compares against the value the user actually sees.
 * Mirrors toCanonical in reverse. Rounded to 4 decimals (matching
 * convertValue) so the bound is exact in the display unit — e.g. the
 * 7.75 in riser cap converts to exactly 19.685 cm, not
 * 19.685000000078738.
 */
function fromCanonical(value: number, unit: string, field: FieldSpec): number {
  if (!field.unitKind || !unit) return value;
  let converted: number;
  if (field.unitKind === "length") {
    converted = convertLength(
      value,
      (field.canonicalUnit ?? "ft") as LengthUnit,
      unit as LengthUnit,
    );
  } else if (field.unitKind === "area") {
    converted = convertArea(value, (field.canonicalUnit ?? "ft2") as AreaUnit, unit as AreaUnit);
  } else if (field.unitKind === "coverage") {
    converted = convertCoverage(
      value,
      (field.canonicalUnit ?? "ft2/gal") as CoverageUnit,
      unit as CoverageUnit,
    );
  } else {
    converted = convertVolume(
      value,
      (field.canonicalUnit ?? "ft3") as VolumeUnit,
      unit as VolumeUnit,
    );
  }
  return Math.round(converted * 10000) / 10000;
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
      nextValues[field.id] = convertValue(values[field.id] ?? "", oldUnit, newUnit, field.unitKind);
      nextUnits[field.id] = newUnit;
    }
    setValues(nextValues);
    setFieldUnits(nextUnits);
    setSystem(next);
  }

  function changeFieldUnit(field: FieldSpec, nextUnit: string) {
    const oldUnit = fieldUnits[field.id] ?? "";
    setValues((prev) => ({
      ...prev,
      [field.id]: convertValue(prev[field.id] ?? "", oldUnit, nextUnit, field.unitKind),
    }));
    setFieldUnits((prev) => ({ ...prev, [field.id]: nextUnit }));
  }

  function reset() {
    const defaults = modeDefaults(mode, system);
    setValues(defaults.values);
    setFieldUnits(defaults.units);
    setCopied(false);
    setSaved(false);
  }

  // Validate every field; build canonical values for the ones that pass.
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
        pres.add(field.id);
        canon[field.id] = toCanonical(result.value, fieldUnits[field.id] ?? "", field);
      }
    }
    return { errors: errs, canonical: canon, present: pres };
  }, [mode, values, fieldUnits]);

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
      savedAt: Date.now(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
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
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [field.id]: event.target.value }))
                }
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
                onChange={(value) => setValues((prev) => ({ ...prev, [field.id]: value }))}
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

      {result ? (
        <div className="mt-6">
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
        </div>
      ) : (
        <p className="mt-6 text-slate-600">
          Enter your measurements above to see results. Fix any highlighted fields first — a result
          is only shown when every required input is valid.
        </p>
      )}
    </div>
  );
}
