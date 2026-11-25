import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PHASE_16A_RELEASED_AT_MS,
  PROJECT_SCHEMA_VERSION,
  PROJECT_STORAGE_KEY,
  addItemToProject,
  emptyProject,
  escapeCsvCell,
  formatProjectAsCsv,
  formatProjectAsText,
  isItemCostPartial,
  itemCostLabel,
  itemCostNote,
  itemHasWarnings,
  itemNeedsStairRecheck,
  parseProject,
  prefixWarning,
  projectHasPartialCost,
  serializeProject,
  totalProjectCost,
  updateProjectItem,
} from "./project";

const PAINT_ITEM = {
  id: "item-paint-1",
  calculatorSlug: "paint-calculator",
  label: "Paint — Living room walls",
  lines: ["2 gallons of paint", "1 roller cover"],
  quantity: 1,
  costUsd: 48.5,
  room: "Living room",
  savedAt: 1_700_000_000_000,
};

const PRIMER_ITEM = {
  id: "item-primer-1",
  calculatorSlug: "primer-calculator",
  label: "Primer — Living room walls",
  lines: ["2 gallons of primer"],
  quantity: 2,
  costUsd: 30,
  room: "Living room",
  savedAt: 1_700_000_000_001,
};

/** Brick partial-cost item (Phase 8 review response, ADR-16): ¾ in
 * joint, no bag count, brick price $0.50 → 482 bricks × $0.50 = $241
 * bricks-only (see src/lib/formulas/brick.test.ts). */
const BRICK_PARTIAL_ITEM = {
  id: "item-brick-1",
  calculatorSlug: "brick-calculator",
  label: "Brick Calculator — Wall",
  lines: ["Bricks: 482"],
  quantity: 1,
  costUsd: 241,
  costPartial: true,
  costLabel: "Partial cost (bricks only)",
  costDetail: "Excludes mortar — no bag count for this brick size or joint",
  room: "General",
  savedAt: 1_700_000_000_002,
};

/** Stair item over the 151 in single-flight limit (Phase 16A): the
 * 160 in rise warning travels with the result through save, reload,
 * and export. The stored text is the raw warning — the "Warning: "
 * prefix is added at format and render time. */
const STAIR_WARNING_TEXT =
  "This rise exceeds the 2021 IRC single-flight limit of 12 ft 7 in (151 in) — a landing is required between floors (R311.7.3). The numbers below are a straight-flight planning estimate only, not a compliant single-flight design.";

const STAIR_WARNING_ITEM = {
  id: "item-stair-1",
  calculatorSlug: "stair-calculator",
  label: "Stair Calculator — Straight staircase",
  lines: [
    "Risers: 21 at 7.62 in each",
    "Treads: 20 at 10.5 in deep",
    "Total run: 210 in (17.5 ft)",
    "Stringer length: 264.01 in (22 ft)",
  ],
  quantity: 1,
  warnings: [STAIR_WARNING_TEXT],
  room: "General",
  savedAt: 1_700_000_000_003,
};

describe("project storage (LocalStorage key and schema)", () => {
  it("uses the single versioned key decided in Phase 1", () => {
    expect(PROJECT_STORAGE_KEY).toBe("homediycalc:project:v1");
  });

  it("is on schema version 2 in Phase 4", () => {
    expect(PROJECT_SCHEMA_VERSION).toBe(2);
  });

  it("round-trips a version 2 project through serialize/parse", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM });
    expect(parseProject(serializeProject(project))).toEqual(project);
  });

  it("migrates version 1 data instead of dropping it", () => {
    const raw = JSON.stringify({
      version: 1,
      items: [
        {
          calculatorSlug: "paint-calculator",
          label: "Paint — Living room walls",
          lines: ["2 gallons of paint"],
          costUsd: 48.5,
          savedAt: 1_700_000_000_000,
        },
      ],
    });
    const parsed = parseProject(raw);
    expect(parsed.version).toBe(PROJECT_SCHEMA_VERSION);
    expect(parsed.items).toHaveLength(1);
    const item = parsed.items[0];
    expect(item?.calculatorSlug).toBe("paint-calculator");
    expect(item?.lines).toEqual(["2 gallons of paint"]);
    expect(item?.costUsd).toBe(48.5);
    // Migration fills the new fields with defaults — nothing is lost.
    expect(item?.quantity).toBe(1);
    expect(item?.room).toBe("General");
    expect(typeof item?.id).toBe("string");
    expect(parsed.name).toBe("My Project");
  });

  it("returns an empty project for missing or empty stored data", () => {
    expect(parseProject(null)).toEqual(emptyProject());
    expect(parseProject("")).toEqual(emptyProject());
  });

  it("returns an empty project for corrupt JSON instead of throwing", () => {
    expect(parseProject("{not json")).toEqual(emptyProject());
    expect(parseProject("42")).toEqual(emptyProject());
  });

  it("ignores unknown-version data instead of throwing", () => {
    expect(parseProject(JSON.stringify({ version: 99, items: [] }))).toEqual(emptyProject());
  });

  it("drops malformed items and keeps valid ones", () => {
    const raw = JSON.stringify({
      version: 2,
      name: "My Project",
      items: [{ ...PAINT_ITEM }, { calculatorSlug: "broken" }, "not an object"],
    });
    const parsed = parseProject(raw);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.calculatorSlug).toBe("paint-calculator");
  });

  it("fills missing quantity and room with defaults", () => {
    const raw = JSON.stringify({
      version: 2,
      name: "My Project",
      items: [
        {
          id: "x",
          calculatorSlug: "paint-calculator",
          label: "Paint",
          lines: ["1 gallon"],
          savedAt: 100,
        },
      ],
    });
    const parsed = parseProject(raw);
    expect(parsed.items[0]?.quantity).toBe(1);
    expect(parsed.items[0]?.room).toBe("General");
  });
});

describe("project totals", () => {
  it("multiplies unit cost by quantity", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM }, { ...PRIMER_ITEM });
    // 48.50 × 1 + 30 × 2 = 108.50.
    expect(totalProjectCost(project)).toBeCloseTo(108.5, 2);
  });

  it("totals zero for an unpriced project", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM, costUsd: undefined });
    expect(totalProjectCost(project)).toBe(0);
  });
});

describe("project text and CSV export", () => {
  it("formats an empty project as empty text", () => {
    expect(formatProjectAsText(emptyProject())).toBe("");
  });

  it("formats a project as a plain-text shopping list, grouped by room", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM });
    const text = formatProjectAsText(project);
    expect(text).toContain("My Project shopping list");
    expect(text).toContain("Room: Living room");
    expect(text).toContain("Paint — Living room walls:");
    expect(text).toContain("- 2 gallons of paint");
    expect(text).toContain("Estimated total: $48.50");
  });

  it("formats a project as CSV with one row per item plus a total row", () => {
    const project = emptyProject();
    project.name = "Kitchen remodel";
    project.items.push({ ...PAINT_ITEM }, { ...PRIMER_ITEM });
    const csv = formatProjectAsCsv(project);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "Room,Calculator,Item,Details,Quantity,Unit cost (USD),Line total (USD),Cost note,Warning",
    );
    expect(lines[1]).toContain("Living room,paint-calculator,Paint — Living room walls");
    expect(lines[1]).toContain("1,48.50,48.50,");
    expect(lines[2]).toContain("2,30.00,60.00,");
    expect(lines[3]).toContain("Total");
    expect(lines[3]).toContain("108.50");
  });

  it("quotes CSV cells containing commas or quotes", () => {
    const project = emptyProject();
    project.items.push({
      ...PAINT_ITEM,
      label: 'Paint, "eggshell" finish',
      lines: ["2 gallons, white"],
    });
    const csv = formatProjectAsCsv(project);
    expect(csv).toContain('"Paint, ""eggshell"" finish"');
    expect(csv).toContain('"2 gallons, white"');
  });

  it("formats an empty project as a CSV header only", () => {
    const csv = formatProjectAsCsv(emptyProject());
    expect(csv.split("\n")).toHaveLength(1);
    expect(csv).toContain("Line total (USD),Cost note");
  });
});

describe("partial cost preservation (Phase 8 review response, ADR-16)", () => {
  it("round-trips partial-cost fields through serialize/parse", () => {
    const project = emptyProject();
    project.items.push({ ...BRICK_PARTIAL_ITEM });
    const parsed = parseProject(serializeProject(project));
    expect(parsed.items[0]).toEqual(BRICK_PARTIAL_ITEM);
    expect(isItemCostPartial(parsed.items[0]!)).toBe(true);
    expect(projectHasPartialCost(parsed)).toBe(true);
  });

  it("treats items saved before the partial fields existed as full costs", () => {
    const raw = JSON.stringify({
      version: 2,
      name: "My Project",
      items: [{ ...PAINT_ITEM }],
    });
    const parsed = parseProject(raw);
    expect(parsed.items[0]?.costPartial).toBeUndefined();
    expect(isItemCostPartial(parsed.items[0]!)).toBe(false);
    expect(projectHasPartialCost(parsed)).toBe(false);
    expect(itemCostLabel(parsed.items[0]!)).toBe("Estimated cost");
    expect(itemCostNote(parsed.items[0]!)).toBe("");
  });

  it("drops the partial flag when no cost is stored", () => {
    const raw = JSON.stringify({
      version: 2,
      name: "My Project",
      items: [{ ...BRICK_PARTIAL_ITEM, costUsd: undefined }],
    });
    const parsed = parseProject(raw);
    expect(parsed.items[0]?.costPartial).toBeUndefined();
    expect(parsed.items[0]?.costLabel).toBeUndefined();
    expect(isItemCostPartial(parsed.items[0]!)).toBe(false);
  });

  it("labels a partial item and a partial total in the text export", () => {
    const project = emptyProject();
    project.items.push({ ...BRICK_PARTIAL_ITEM }, { ...PAINT_ITEM });
    const text = formatProjectAsText(project);
    expect(text).toContain(
      "Partial cost (bricks only): $241.00 (Excludes mortar — no bag count for this brick size or joint)",
    );
    expect(text).toContain("Estimated cost: $48.50");
    expect(text).toContain("Partial total (incomplete estimate): $289.50");
    expect(text).not.toContain("Estimated total:");
  });

  it("keeps a plain estimated total when no item is partial", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM });
    expect(formatProjectAsText(project)).toContain("Estimated total: $48.50");
    expect(formatProjectAsText(project)).not.toContain("Partial total");
  });

  it("carries a partial item's label and detail in the CSV Cost note column", () => {
    const project = emptyProject();
    project.items.push({ ...BRICK_PARTIAL_ITEM }, { ...PAINT_ITEM });
    const csv = formatProjectAsCsv(project);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Cost note");
    expect(lines[1]).toContain(
      "Partial cost (bricks only); Excludes mortar — no bag count for this brick size or joint",
    );
    expect(lines[2]).toContain("48.50,");
    expect(lines[3]).toContain("Partial total (incomplete estimate)");
    expect(lines[3]).toContain("289.50");
  });

  it("multiplies a partial line total by quantity and stays partial", () => {
    const project = emptyProject();
    project.items.push({ ...BRICK_PARTIAL_ITEM, quantity: 2 });
    expect(totalProjectCost(project)).toBeCloseTo(482, 2);
    expect(projectHasPartialCost(project)).toBe(true);
    expect(formatProjectAsText(project)).toContain("Partial cost (bricks only): $482.00");
    expect(formatProjectAsText(project)).toContain("Partial total (incomplete estimate): $482.00");
  });
});

describe("safety warning preservation (Phase 16A)", () => {
  it("round-trips warnings through serialize/parse", () => {
    const project = emptyProject();
    project.items.push({ ...STAIR_WARNING_ITEM });
    const parsed = parseProject(serializeProject(project));
    expect(parsed.items[0]).toEqual(STAIR_WARNING_ITEM);
    expect(itemHasWarnings(parsed.items[0]!)).toBe(true);
  });

  it("treats items saved before the warnings field existed as warning-free", () => {
    const raw = JSON.stringify({
      version: 2,
      name: "My Project",
      items: [{ ...PAINT_ITEM }],
    });
    const parsed = parseProject(raw);
    expect(parsed.items[0]?.warnings).toBeUndefined();
    expect(itemHasWarnings(parsed.items[0]!)).toBe(false);
    expect(formatProjectAsText(parsed)).not.toContain("Warning:");
    expect(formatProjectAsCsv(parsed)).not.toContain("Warning: ");
  });

  it("drops malformed warnings instead of crashing or keeping junk", () => {
    const raw = JSON.stringify({
      version: 2,
      name: "My Project",
      items: [
        { ...STAIR_WARNING_ITEM, warnings: "not an array" },
        { ...STAIR_WARNING_ITEM, id: "x2", warnings: [STAIR_WARNING_TEXT, "", 42, null] },
        { ...STAIR_WARNING_ITEM, id: "x3", warnings: [] },
      ],
    });
    const parsed = parseProject(raw);
    expect(parsed.items).toHaveLength(3);
    expect(parsed.items[0]?.warnings).toBeUndefined();
    expect(parsed.items[1]?.warnings).toEqual([STAIR_WARNING_TEXT]);
    expect(parsed.items[2]?.warnings).toBeUndefined();
  });

  it("prefixes a warning once, and only once", () => {
    expect(prefixWarning(STAIR_WARNING_TEXT)).toBe(`Warning: ${STAIR_WARNING_TEXT}`);
    expect(prefixWarning(`Warning: ${STAIR_WARNING_TEXT}`)).toBe(`Warning: ${STAIR_WARNING_TEXT}`);
  });

  it("includes the warning under the item in the text export", () => {
    const project = emptyProject();
    project.items.push({ ...STAIR_WARNING_ITEM });
    const text = formatProjectAsText(project);
    expect(text).toContain(`Warning: ${STAIR_WARNING_TEXT}`);
    // The warning sits under the item's lines, before any total.
    const warningAt = text.indexOf("Warning:");
    const linesAt = text.indexOf("- Risers: 21");
    expect(warningAt).toBeGreaterThan(linesAt);
    expect(text).not.toContain("Estimated total:");
  });

  it("adds no warning to the text export for a warning-free item", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM });
    expect(formatProjectAsText(project)).not.toContain("Warning:");
  });

  it("carries the warning in the CSV Warning column", () => {
    const project = emptyProject();
    project.items.push({ ...STAIR_WARNING_ITEM }, { ...PAINT_ITEM });
    const csv = formatProjectAsCsv(project);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Cost note,Warning");
    expect(lines[1]).toContain(`Warning: ${STAIR_WARNING_TEXT}`);
    // The warning-free item has empty Cost note and Warning cells.
    expect(lines[2]?.split(",").slice(-2)).toEqual(["", ""]);
  });

  it("addItemToProject stores warnings and reload keeps them", () => {
    const store = new Map<string, string>();
    (globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    };
    try {
      const { id: _id, quantity: _quantity, room: _room, ...saved } = STAIR_WARNING_ITEM;
      const project = addItemToProject(saved);
      expect(project.items[0]?.warnings).toEqual([STAIR_WARNING_TEXT]);
      const reloaded = parseProject(store.get(PROJECT_STORAGE_KEY)!);
      expect(reloaded.items[0]?.warnings).toEqual([STAIR_WARNING_TEXT]);
      expect(formatProjectAsText(reloaded)).toContain(`Warning: ${STAIR_WARNING_TEXT}`);
    } finally {
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    }
  });

  it("editing quantity, label, or room leaves warnings untouched", () => {
    const store = new Map<string, string>();
    (globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    };
    try {
      const { id: _id, quantity: _quantity, room: _room, ...saved } = STAIR_WARNING_ITEM;
      const project = addItemToProject(saved);
      const item = project.items[0]!;
      const updated = updateProjectItem(item.id, { quantity: 2, room: "Hallway" });
      expect(updated.items[0]?.warnings).toEqual([STAIR_WARNING_TEXT]);
      expect(formatProjectAsText(updated)).toContain(`Warning: ${STAIR_WARNING_TEXT}`);
    } finally {
      delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
    }
  });
});

describe("partial cost through LocalStorage edits (ADR-16)", () => {
  // Vitest runs in node, where localStorage is undefined; the project
  // module guards on typeof localStorage, so these tests stub a minimal
  // in-memory store to exercise add/update round-trips.
  const store = new Map<string, string>();
  const storageStub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };

  beforeEach(() => {
    store.clear();
    (globalThis as unknown as { localStorage: unknown }).localStorage = storageStub;
  });

  afterEach(() => {
    store.clear();
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  });

  it("addItemToProject stores the partial flag, label, and detail", () => {
    const { id: _id, quantity: _quantity, room: _room, ...saved } = BRICK_PARTIAL_ITEM;
    const project = addItemToProject(saved);
    const item = project.items[0]!;
    expect(item.costPartial).toBe(true);
    expect(item.costLabel).toBe("Partial cost (bricks only)");
    expect(item.costDetail).toBe("Excludes mortar — no bag count for this brick size or joint");
    // Reloading from storage keeps the flag.
    expect(projectHasPartialCost(parseProject(store.get(PROJECT_STORAGE_KEY)!))).toBe(true);
  });

  it("editing the unit price clears the partial flag (the price is now the user's own figure)", () => {
    const { id: _id, quantity: _quantity, room: _room, ...saved } = BRICK_PARTIAL_ITEM;
    const project = addItemToProject(saved);
    const item = project.items[0]!;
    const updated = updateProjectItem(item.id, { costUsd: 300 });
    expect(updated.items[0]?.costUsd).toBe(300);
    expect(updated.items[0]?.costPartial).toBeUndefined();
    expect(updated.items[0]?.costLabel).toBeUndefined();
    expect(updated.items[0]?.costDetail).toBeUndefined();
    expect(projectHasPartialCost(updated)).toBe(false);
    expect(formatProjectAsText(updated)).toContain("Estimated total: $300.00");
  });

  it("editing quantity, label, or room leaves the partial flag untouched", () => {
    const { id: _id, quantity: _quantity, room: _room, ...saved } = BRICK_PARTIAL_ITEM;
    const project = addItemToProject(saved);
    const item = project.items[0]!;
    const updated = updateProjectItem(item.id, { quantity: 3 });
    expect(updated.items[0]?.costPartial).toBe(true);
    expect(updated.items[0]?.costLabel).toBe("Partial cost (bricks only)");
    expect(totalProjectCost(updated)).toBeCloseTo(723, 2);
    const renamed = updateProjectItem(item.id, { room: "Kitchen" });
    expect(renamed.items[0]?.costPartial).toBe(true);
  });
});

describe("CSV hardening (QA-16A-03)", () => {
  /** Minimal RFC 4180 row parser (handles quoted cells and doubled
   * quotes) so tests assert on cell content, not raw CSV text. */
  function parseCsvRow(row: string): string[] {
    const cells: string[] = [];
    let i = 0;
    while (i < row.length) {
      if (row[i] === '"') {
        let cell = "";
        i++;
        while (i < row.length) {
          if (row[i] === '"') {
            if (row[i + 1] === '"') {
              cell += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            cell += row[i];
            i++;
          }
        }
        cells.push(cell);
        if (row[i] === ",") i++;
      } else {
        const next = row.indexOf(",", i);
        if (next === -1) {
          cells.push(row.slice(i));
          break;
        }
        cells.push(row.slice(i, next));
        i = next + 1;
      }
    }
    if (row.endsWith(",")) cells.push("");
    return cells;
  }

  /** Cell content of a single escaped cell (unwraps RFC 4180 quoting). */
  function escapedContent(value: string): string {
    return parseCsvRow(escapeCsvCell(value))[0] ?? "";
  }

  it("quotes a CR in a label and round-trips it through a CSV parse", () => {
    expect(escapeCsvCell("Paint\rLiving room")).toBe('"Paint\rLiving room"');
    expect(escapedContent("Paint\rLiving room")).toBe("Paint\rLiving room");
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM, label: "Paint\rLiving room walls" });
    const csv = formatProjectAsCsv(project);
    // A bare CR must not split the row: still header + item + total.
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(parseCsvRow(lines[1]!)[2]).toBe("Paint\rLiving room walls");
  });

  it("quotes CR, LF, and CRLF inside a details line and round-trips them", () => {
    expect(escapedContent("2 gallons\rwhite")).toBe("2 gallons\rwhite");
    expect(escapedContent("2 gallons\nwhite")).toBe("2 gallons\nwhite");
    expect(escapedContent("2 gallons\r\nwhite")).toBe("2 gallons\r\nwhite");
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM, lines: ["2 gallons\rwhite"] });
    const csv = formatProjectAsCsv(project);
    expect(parseCsvRow(csv.split("\n")[1]!)[3]).toBe("2 gallons\rwhite");
  });

  it("neutralises formula-like cells: the parsed content starts with a single quote", () => {
    const formulas = [
      "=2+2",
      "+2+2",
      "-2+2",
      "@SUM(1,1)",
      "\t=2+2",
      "  =2+2",
      "  +2+2",
      "  @SUM(1,1)",
      "\t=SUM(1,1)",
    ];
    for (const formula of formulas) {
      expect(escapedContent(formula).startsWith("'")).toBe(true);
    }
    // Without a comma the escaped text itself starts with the quote.
    expect(escapeCsvCell("=2+2")).toBe("'=2+2");
    expect(escapeCsvCell("  =2+2")).toBe("'  =2+2");
    expect(escapeCsvCell("-2+2")).toBe("'-2+2");
    // With a comma the quote marker survives inside the RFC 4180 quotes.
    expect(escapeCsvCell("@SUM(1,1)")).toBe('"\'@SUM(1,1)"');
  });

  it("neutralises a formula in a label through the CSV export", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM, label: "=2+2" });
    const csv = formatProjectAsCsv(project);
    expect(parseCsvRow(csv.split("\n")[1]!)[2]).toBe("'=2+2");
  });

  it("leaves legitimate values unchanged", () => {
    expect(escapeCsvCell("Paint — Living room walls")).toBe("Paint — Living room walls");
    expect(escapeCsvCell("48.50")).toBe("48.50");
    expect(escapeCsvCell("1")).toBe("1");
    expect(escapeCsvCell("")).toBe("");
    expect(escapeCsvCell("General")).toBe("General");
  });

  it("keeps the nine-column header and numeric columns unaffected", () => {
    const project = emptyProject();
    project.items.push({ ...PAINT_ITEM }, { ...PRIMER_ITEM });
    const csv = formatProjectAsCsv(project);
    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "Room,Calculator,Item,Details,Quantity,Unit cost (USD),Line total (USD),Cost note,Warning",
    );
    // Quantity / Unit cost / Line total are plain numbers, no quote marker.
    expect(parseCsvRow(lines[1]!).slice(4, 7)).toEqual(["1", "48.50", "48.50"]);
    expect(parseCsvRow(lines[2]!).slice(4, 7)).toEqual(["2", "30.00", "60.00"]);
    expect(parseCsvRow(lines[1]!)).toHaveLength(9);
  });

  it("keeps warning text with its 'Warning: ' prefix and no quote marker", () => {
    const project = emptyProject();
    project.items.push({ ...STAIR_WARNING_ITEM });
    const csv = formatProjectAsCsv(project);
    const warningCell = parseCsvRow(csv.split("\n")[1]!)[8]!;
    expect(warningCell).toBe(`Warning: ${STAIR_WARNING_TEXT}`);
    expect(warningCell.startsWith("'")).toBe(false);
  });

  it("keeps partial-cost notes unchanged", () => {
    const project = emptyProject();
    project.items.push({ ...BRICK_PARTIAL_ITEM });
    const csv = formatProjectAsCsv(project);
    const costNoteCell = parseCsvRow(csv.split("\n")[1]!)[7]!;
    expect(costNoteCell).toBe(
      "Partial cost (bricks only); Excludes mortar — no bag count for this brick size or joint",
    );
    expect(costNoteCell.startsWith("'")).toBe(false);
  });

  it("still quotes commas and doubles quotes", () => {
    expect(escapeCsvCell('Paint, "eggshell" finish')).toBe('"Paint, ""eggshell"" finish"');
    expect(escapedContent('Paint, "eggshell" finish')).toBe('Paint, "eggshell" finish');
  });
});

describe("legacy Stair records (QA-16A-04)", () => {
  // Test-only threshold: the production constant is still the unset
  // placeholder (0) until the Phase 16A release timestamp is set.
  const TEST_THRESHOLD = 1_800_000_000_000;

  const legacyStair = {
    ...STAIR_WARNING_ITEM,
    warnings: undefined,
    savedAt: TEST_THRESHOLD - 1,
  };
  const currentStair = {
    ...STAIR_WARNING_ITEM,
    warnings: undefined,
    savedAt: TEST_THRESHOLD + 1,
  };

  it("flags a Stair item without warnings saved before the threshold", () => {
    expect(itemNeedsStairRecheck(legacyStair, TEST_THRESHOLD)).toBe(true);
  });

  it("does not flag a Stair item without warnings saved after the threshold", () => {
    expect(itemNeedsStairRecheck(currentStair, TEST_THRESHOLD)).toBe(false);
  });

  it("does not flag a Stair item WITH warnings, regardless of date", () => {
    expect(
      itemNeedsStairRecheck({ ...STAIR_WARNING_ITEM, savedAt: TEST_THRESHOLD - 1 }, TEST_THRESHOLD),
    ).toBe(false);
    expect(
      itemNeedsStairRecheck({ ...STAIR_WARNING_ITEM, savedAt: TEST_THRESHOLD + 1 }, TEST_THRESHOLD),
    ).toBe(false);
  });

  it("does not flag a non-Stair item without warnings saved before the threshold", () => {
    expect(
      itemNeedsStairRecheck({ ...PAINT_ITEM, savedAt: TEST_THRESHOLD - 1 }, TEST_THRESHOLD),
    ).toBe(false);
  });

  it("flags nothing while the release threshold is unset (0)", () => {
    expect(PHASE_16A_RELEASED_AT_MS).toBe(0);
    // Realistic savedAt values (positive epoch ms) are never before 0.
    expect(itemNeedsStairRecheck(legacyStair)).toBe(false);
    expect(itemNeedsStairRecheck(currentStair)).toBe(false);
    expect(itemNeedsStairRecheck({ ...PAINT_ITEM, savedAt: 1_700_000_000_000 })).toBe(false);
  });
});
