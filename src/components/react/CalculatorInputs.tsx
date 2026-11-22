/**
 * Shared React input components for calculator islands (Phases 2–4).
 * These are the building blocks every calculator page will use: a labeled
 * number input with inline validation, an imperial/metric unit toggle, and
 * a results panel. They contain no calculation math — formulas live in
 * src/lib/formulas/ and conversions live in src/lib/units.ts.
 */

export interface NumberInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Unit shown next to the label, e.g. "ft" or "m". */
  unit?: string;
  min?: number;
  max?: number;
  step?: string;
  /** Inline validation message; when set, no result may be shown. */
  error?: string;
  /** Optional hint shown under the field, e.g. a reference value. */
  hint?: string;
  required?: boolean;
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = "any",
  error,
  hint,
  required = false,
}: NumberInputProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {unit ? ` (${unit})` : ""}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className="input-field"
        value={value}
        min={min}
        max={max}
        step={step}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export type UnitSystem = "imperial" | "metric";

export interface UnitToggleProps {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

/**
 * Imperial/metric toggle. Switching converts the values already entered —
 * it never clears them (PRD FR-1). Conversion itself happens through
 * src/lib/units.ts in the owning island.
 */
export function UnitToggle({ value, onChange }: UnitToggleProps) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">Unit system</legend>
      <button
        type="button"
        aria-pressed={value === "imperial"}
        onClick={() => onChange("imperial")}
        className={
          value === "imperial"
            ? "toggle-pressed rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        }
      >
        Imperial (ft, in, gal)
      </button>
      <button
        type="button"
        aria-pressed={value === "metric"}
        onClick={() => onChange("metric")}
        className={
          value === "metric"
            ? "toggle-pressed rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            : "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        }
      >
        Metric (m, cm, L)
      </button>
    </fieldset>
  );
}

export interface ResultRow {
  label: string;
  value: string;
  /** Secondary detail, e.g. the raw amount before rounding up. */
  detail?: string;
}

export interface ResultPanelProps {
  title: string;
  rows: ResultRow[];
  /** Note shown under the results, e.g. the rounding rule. */
  note?: string;
  /** Optional plain-text shopping list and a copy handler. */
  shoppingList?: string;
  onCopyShoppingList?: () => void;
}

/**
 * Results display for a calculator island. Package quantities shown here
 * are always rounded up by the formula module (PRD FR-6); this component
 * only renders what it is given.
 */
export function ResultPanel({
  title,
  rows,
  note,
  shoppingList,
  onCopyShoppingList,
}: ResultPanelProps) {
  return (
    <section aria-label={title} className="card bg-brand-50">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0"
          >
            <dt className="text-slate-700">{row.label}</dt>
            <dd className="text-right font-bold text-slate-900">
              {row.value}
              {row.detail ? (
                <span className="block text-sm font-normal text-slate-600">{row.detail}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
      {note ? <p className="mt-4 text-sm text-slate-600">{note}</p> : null}
      {shoppingList && onCopyShoppingList ? (
        <button type="button" onClick={onCopyShoppingList} className="btn-secondary mt-4">
          Copy shopping list
        </button>
      ) : null}
    </section>
  );
}
