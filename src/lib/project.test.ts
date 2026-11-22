import { describe, expect, it } from "vitest";
import {
  PROJECT_SCHEMA_VERSION,
  PROJECT_STORAGE_KEY,
  emptyProject,
  formatProjectAsCsv,
  formatProjectAsText,
  parseProject,
  serializeProject,
  totalProjectCost,
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
    expect(lines[0]).toBe("Room,Calculator,Item,Details,Quantity,Unit cost (USD),Line total (USD)");
    expect(lines[1]).toContain("Living room,paint-calculator,Paint — Living room walls");
    expect(lines[1]).toContain("1,48.50,48.50");
    expect(lines[2]).toContain("2,30.00,60.00");
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
    expect(csv).toContain("Line total (USD)");
  });
});
