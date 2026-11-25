/**
 * My Project (shopping list / project planner) — LocalStorage persistence.
 *
 * Decided in Phase 1 (resolves ARCHITECTURE.md §13): the single versioned
 * LocalStorage key is `homediycalc:project:v1`. Saving is explicit only —
 * nothing is persisted until the user clicks "Save to My Project" on a
 * calculator page. Corrupt or old-version stored data is ignored, never
 * crashes the page (ADR-7).
 *
 * Schema version 2 (Phase 4): items gained an `id` (stable handle for
 * editing/removing one item), a `quantity` (how many of this item, default
 * 1), and a `room` (project/room grouping, default "General"); the project
 * gained a `name`. The storage key is unchanged. `parseProject` migrates
 * version 1 data (items without id/quantity/room) instead of dropping it —
 * a migration must never lose existing saved items.
 *
 * Phase 8 review response (ADR-16): items gained three optional
 * partial-cost fields (`costPartial`, `costLabel`, `costDetail`). No
 * schema version bump: the fields are optional, `normalizeItem`
 * carries them through a save/reload round-trip, and items saved
 * before they existed normalize to "not partial" — a version bump is
 * unnecessary when optional fields are safely normalized.
 *
 * This module owns serialization and validation only. It never touches
 * `localStorage` directly in a way that throws: all parse/stringify paths
 * are guarded.
 */

/** LocalStorage key for the saved project (single versioned key). */
export const PROJECT_STORAGE_KEY = "homediycalc:project:v1";

/** Current schema version. Version 1 data is migrated, not dropped. */
export const PROJECT_SCHEMA_VERSION = 2;

/** Default room for items saved without one. */
export const DEFAULT_ROOM = "General";

/** Default project name. */
export const DEFAULT_PROJECT_NAME = "My Project";

export interface ProjectItem {
  /** Stable id, assigned when the item is saved. */
  id: string;
  /** Calculator slug, e.g. "paint-calculator". */
  calculatorSlug: string;
  /** Human-readable label, e.g. "Paint — Living room walls". */
  label: string;
  /** Plain-text shopping list lines for this item. */
  lines: string[];
  /** How many of this item (default 1). */
  quantity: number;
  /** Cost in USD for one of this item, present only when prices were entered. */
  costUsd?: number;
  /**
   * True when costUsd covers only part of the job — e.g. the Brick
   * Calculator's bricks-only figure when the mortar bag count is
   * unknown (ADR-13/ADR-16). Optional and backward-compatible: items
   * saved before this field existed have it undefined and are treated
   * as full costs. A partial cost is never presented as a total: the
   * project UI, text export, CSV export, and project total all label
   * it partial (see formatProjectAsText / formatProjectAsCsv).
   */
  costPartial?: boolean;
  /**
   * Label for a partial cost, e.g. "Partial cost (bricks only)".
   * Only meaningful when costPartial is true.
   */
  costLabel?: string;
  /**
   * Detail for a partial cost — what it excludes and why, e.g.
   * "Excludes mortar — no bag count for this brick size or joint".
   * Only meaningful when costPartial is true.
   */
  costDetail?: string;
  /**
   * Safety warnings that travel with the result — e.g. the Stair
   * Calculator's 151 in single-flight warning (Phase 16A). Optional
   * and backward-compatible (ADR-16 pattern): items saved before
   * this field existed have it undefined and render with no warning.
   * The stored text is the raw warning; the "Warning: " prefix is
   * added at format and render time (see prefixWarning).
   */
  warnings?: string[];
  /** Project/room grouping, e.g. "Kitchen" (default "General"). */
  room: string;
  /** Epoch milliseconds when the item was saved. */
  savedAt: number;
}

export interface ProjectData {
  version: number;
  /** Project name, shown on the My Project page and in exports. */
  name: string;
  items: ProjectItem[];
}

/** Build an empty project document. */
export function emptyProject(): ProjectData {
  return { version: PROJECT_SCHEMA_VERSION, name: DEFAULT_PROJECT_NAME, items: [] };
}

/** New stable id for a saved item. */
export function newItemId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Serialize a project to a JSON string for LocalStorage. */
export function serializeProject(project: ProjectData): string {
  return JSON.stringify({ ...project, version: PROJECT_SCHEMA_VERSION });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validate one stored item (version 1 or 2 shape) and normalize it to
 * the version 2 shape. Returns undefined for malformed items, which
 * the caller drops. Missing id/quantity/room (version 1 items) are
 * filled with defaults — migration, not deletion.
 */
function normalizeItem(raw: unknown): ProjectItem | undefined {
  if (!isRecord(raw)) return undefined;
  if (
    typeof raw.calculatorSlug !== "string" ||
    typeof raw.label !== "string" ||
    !Array.isArray(raw.lines) ||
    !raw.lines.every((line) => typeof line === "string") ||
    typeof raw.savedAt !== "number"
  ) {
    return undefined;
  }
  const quantity =
    typeof raw.quantity === "number" && Number.isInteger(raw.quantity) && raw.quantity >= 1
      ? raw.quantity
      : 1;
  const costUsd =
    typeof raw.costUsd === "number" && Number.isFinite(raw.costUsd) ? raw.costUsd : undefined;
  // Partial-cost fields (ADR-16) survive a save/reload round-trip.
  // They are only meaningful with a finite cost: an unpriced item has
  // no cost to be partial about, and items saved before the fields
  // existed (costPartial undefined) are treated as full costs.
  const costPartial = costUsd !== undefined && raw.costPartial === true;
  const costLabel =
    costPartial && typeof raw.costLabel === "string" && raw.costLabel !== ""
      ? raw.costLabel
      : undefined;
  const costDetail =
    costPartial && typeof raw.costDetail === "string" && raw.costDetail !== ""
      ? raw.costDetail
      : undefined;
  // Safety warnings (Phase 16A) survive a save/reload round-trip.
  // Only non-empty strings are kept; items saved before the field
  // existed (or with a malformed value) normalize to undefined and
  // render with no warning — old records are never dropped.
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter((w): w is string => typeof w === "string" && w !== "")
    : [];
  return {
    id: typeof raw.id === "string" && raw.id !== "" ? raw.id : newItemId(),
    calculatorSlug: raw.calculatorSlug,
    label: raw.label,
    lines: raw.lines as string[],
    quantity,
    costUsd,
    costPartial: costPartial ? true : undefined,
    costLabel,
    costDetail,
    warnings: warnings.length > 0 ? warnings : undefined,
    room: typeof raw.room === "string" && raw.room !== "" ? raw.room : DEFAULT_ROOM,
    savedAt: raw.savedAt,
  };
}

/**
 * Parse stored JSON back into a project. Returns an empty project for
 * missing, corrupt, or unknown-version data — never throws. Version 1
 * data is migrated to version 2 (items keep their lines, cost, and
 * saved date; they gain an id, quantity 1, and the "General" room).
 */
export function parseProject(raw: string | null): ProjectData {
  if (raw === null || raw === "") return emptyProject();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.items)) {
      return emptyProject();
    }
    if (parsed.version !== 1 && parsed.version !== PROJECT_SCHEMA_VERSION) {
      return emptyProject();
    }
    const items = parsed.items
      .map(normalizeItem)
      .filter((item): item is ProjectItem => item !== undefined);
    return {
      version: PROJECT_SCHEMA_VERSION,
      name:
        typeof parsed.name === "string" && parsed.name !== "" ? parsed.name : DEFAULT_PROJECT_NAME,
      items,
    };
  } catch {
    return emptyProject();
  }
}

/** Total estimated cost of a project: sum of unit cost × quantity. */
export function totalProjectCost(project: ProjectData): number {
  return project.items.reduce((sum, item) => sum + (item.costUsd ?? 0) * item.quantity, 0);
}

/** True when at least one item has a cost. */
export function projectHasCost(project: ProjectData): boolean {
  return project.items.some((item) => item.costUsd !== undefined);
}

/** True when an item's cost is partial (covers only part of the job). */
export function isItemCostPartial(item: ProjectItem): boolean {
  return item.costUsd !== undefined && item.costPartial === true;
}

/** True when at least one item has a partial cost. */
export function projectHasPartialCost(project: ProjectData): boolean {
  return project.items.some((item) => isItemCostPartial(item));
}

/** Display label for an item's cost line: its partial label, or "Estimated cost". */
export function itemCostLabel(item: ProjectItem): string {
  return isItemCostPartial(item) ? (item.costLabel ?? "Partial cost") : "Estimated cost";
}

/** Cost-note text for an item, or "" when its cost is complete. */
export function itemCostNote(item: ProjectItem): string {
  if (!isItemCostPartial(item)) return "";
  const label = item.costLabel ?? "Partial cost";
  return item.costDetail ? `${label}; ${item.costDetail}` : label;
}

/** Cost of one item line: unit cost × quantity (0 when unpriced). */
export function itemLineCost(item: ProjectItem): number {
  return (item.costUsd ?? 0) * item.quantity;
}

/**
 * Prefix a warning with "Warning: " unless it already starts with it.
 * Plain-text copies and exports have no amber styling, so the prefix
 * carries the signal. The stored text keeps the raw warning (Phase
 * 16A: the Stair 151 in warning) — the prefix is added at format and
 * render time, never stored twice.
 */
export function prefixWarning(warning: string): string {
  return warning.startsWith("Warning:") ? warning : `Warning: ${warning}`;
}

/** True when an item carries at least one safety warning. */
export function itemHasWarnings(item: ProjectItem): boolean {
  return (item.warnings?.length ?? 0) > 0;
}

/** Format a project as a plain-text shopping list for copy/export.
 * A partial item cost is shown with its partial label and detail, and
 * a project containing any partial cost totals as a "Partial total
 * (incomplete estimate)" — never as an "Estimated total". A safety
 * warning (Phase 16A, e.g. the Stair 151 in limit) is emitted under
 * its item, prefixed "Warning: ", so a copied list never presents an
 * over-limit result as a compliant design. */
export function formatProjectAsText(project: ProjectData): string {
  if (project.items.length === 0) return "";
  const rooms: string[] = [];
  for (const item of project.items) {
    if (!rooms.includes(item.room)) rooms.push(item.room);
  }
  const sections: string[] = [
    "HomeDIYCalc — My Project shopping list",
    `Project: ${project.name}`,
    "",
  ];
  for (const room of rooms) {
    sections.push(`Room: ${room}`);
    for (const item of project.items.filter((i) => i.room === room)) {
      sections.push(`${item.label}:`);
      for (const line of item.lines) sections.push(`  - ${line}`);
      for (const warning of item.warnings ?? []) {
        sections.push(`  ${prefixWarning(warning)}`);
      }
      if (item.quantity > 1) sections.push(`  Quantity: ${item.quantity}`);
      if (item.costUsd !== undefined) {
        const costLine = `  ${itemCostLabel(item)}: $${itemLineCost(item).toFixed(2)}`;
        sections.push(
          isItemCostPartial(item) && item.costDetail
            ? `${costLine} (${item.costDetail})`
            : costLine,
        );
      }
    }
    sections.push("");
  }
  if (projectHasCost(project)) {
    sections.push(
      projectHasPartialCost(project)
        ? `Partial total (incomplete estimate): $${totalProjectCost(project).toFixed(2)}`
        : `Estimated total: $${totalProjectCost(project).toFixed(2)}`,
    );
  }
  return sections.join("\n").trimEnd();
}

/** Escape one CSV cell per RFC 4180. */
export function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format a project as CSV for export. One row per item, plus a total
 * row when any item has a cost. Columns: Room, Calculator, Item,
 * Details, Quantity, Unit cost (USD), Line total (USD), Cost note,
 * Warning. The Cost note column carries a partial item's label and
 * detail, and a project containing any partial cost totals as a
 * "Partial total (incomplete estimate)" row — never as a plain
 * "Total". The Warning column (Phase 16A) carries an item's safety
 * warnings joined by "; " — an over-limit Stair result keeps its
 * warning in the export instead of looking compliant.
 */
export function formatProjectAsCsv(project: ProjectData): string {
  const header = [
    "Room",
    "Calculator",
    "Item",
    "Details",
    "Quantity",
    "Unit cost (USD)",
    "Line total (USD)",
    "Cost note",
    "Warning",
  ];
  const rows: string[][] = [header];
  for (const item of project.items) {
    rows.push([
      item.room,
      item.calculatorSlug,
      item.label,
      item.lines.join("; "),
      String(item.quantity),
      item.costUsd !== undefined ? item.costUsd.toFixed(2) : "",
      item.costUsd !== undefined ? itemLineCost(item).toFixed(2) : "",
      itemCostNote(item),
      (item.warnings ?? []).map(prefixWarning).join("; "),
    ]);
  }
  if (projectHasCost(project)) {
    rows.push([
      "",
      "",
      projectHasPartialCost(project) ? "Partial total (incomplete estimate)" : "Total",
      "",
      "",
      "",
      totalProjectCost(project).toFixed(2),
      "",
      "",
    ]);
  }
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

/** Read the saved project from LocalStorage. Empty when nothing is stored. */
export function loadProject(): ProjectData {
  if (typeof localStorage === "undefined") return emptyProject();
  try {
    return parseProject(localStorage.getItem(PROJECT_STORAGE_KEY));
  } catch {
    return emptyProject();
  }
}

/** Persist a whole project to LocalStorage. Never throws. */
export function saveProject(project: ProjectData): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
  } catch {
    // Storage full or unavailable: the page must not crash.
  }
}

/**
 * Append one item to the saved project in LocalStorage and return the
 * updated project. The item gains an id, quantity 1, and the
 * "General" room. Saving is explicit only — called from the "Add to
 * Project" button on a calculator page.
 */
export function addItemToProject(item: Omit<ProjectItem, "id" | "quantity" | "room">): ProjectData {
  const project = loadProject();
  project.items.push({
    ...item,
    id: newItemId(),
    quantity: 1,
    room: DEFAULT_ROOM,
  });
  saveProject(project);
  return project;
}

export interface ProjectItemPatch {
  label?: string;
  quantity?: number;
  costUsd?: number;
  room?: string;
}

/**
 * Edit one saved item by id. Quantity is clamped to a whole number
 * of at least 1; a non-finite cost (NaN, from an emptied price field)
 * clears the price; a missing item leaves the project unchanged.
 * Editing the unit price clears the partial-cost flag, label, and
 * detail: the edited price is the user's own figure, no longer the
 * calculator's partial output (ADR-16). Editing only the label,
 * quantity, or room leaves the partial flag untouched.
 * Returns the updated project.
 */
export function updateProjectItem(id: string, patch: ProjectItemPatch): ProjectData {
  const project = loadProject();
  const item = project.items.find((entry) => entry.id === id);
  if (item) {
    if (patch.label !== undefined && patch.label !== "") {
      item.label = patch.label;
    }
    if (patch.quantity !== undefined) {
      item.quantity = Math.max(1, Math.floor(patch.quantity) || 1);
    }
    if (patch.costUsd !== undefined) {
      item.costUsd =
        Number.isFinite(patch.costUsd) && patch.costUsd >= 0 ? patch.costUsd : undefined;
      // A user-edited price replaces the calculator's figure: the
      // partial flag no longer describes this cost.
      item.costPartial = undefined;
      item.costLabel = undefined;
      item.costDetail = undefined;
    }
    if (patch.room !== undefined && patch.room !== "") {
      item.room = patch.room;
    }
    saveProject(project);
  }
  return project;
}

/** Remove one saved item by id. Returns the updated project. */
export function removeProjectItem(id: string): ProjectData {
  const project = loadProject();
  const index = project.items.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    project.items.splice(index, 1);
    saveProject(project);
  }
  return project;
}

/** Remove one saved item by index. Returns the updated project. */
export function removeItemFromProject(index: number): ProjectData {
  const project = loadProject();
  project.items.splice(index, 1);
  saveProject(project);
  return project;
}

/** Clear all saved items. Returns an empty project. */
export function clearProject(): ProjectData {
  const project = emptyProject();
  saveProject(project);
  return project;
}
