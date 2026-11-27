/**
 * Workstream D (Phase 17B2 corrective round): purchase alternatives
 * are mutually exclusive in the shopping list.
 *
 * Sand (bulk vs bags), Raised Bed Soil (premixed bags vs premixed
 * bulk vs mix components separately), Sod (rolls vs pallets), and
 * Lawn Seed (bags vs bulk by the pound) each present two or three
 * ways of buying the same material. Before this round the shopping
 * list carried every alternative at once, so a buyer following it
 * would buy the same material twice. Each calculator now has an
 * explicit "Buy as" select: the shopping-list lines carry only the
 * chosen form, the cost follows the chosen form's price only, and
 * the other form stays visible in the result panel as a labelled
 * alternative (with its own cost when its price was entered).
 * Fence has no such alternatives — its lines are distinct materials
 * that are all needed — so it is verified unchanged here.
 *
 * Every expected value below is hand-derived in the test comments,
 * not copied from the program's output. Row labels, row order, and
 * row values are deliberately unchanged from the previous round, so
 * the lookup-table test and the preservation spec keep passing.
 */
import { describe, expect, it } from "vitest";
import { CALCULATOR_CONFIGS } from "../calculators/index";
import type { CalcOutput } from "../components/react/CalculatorConfig";
import { calculateSand } from "./formulas/sand";
import { calculateRaisedBedSoil } from "./formulas/raised-bed-soil";
import { calculateSod } from "./formulas/sod";
import { calculateLawnSeed } from "./formulas/lawn-seed";
import { convertLength } from "./units";
import {
  formatProjectAsCsv,
  formatProjectAsText,
  parseProject,
  serializeProject,
  type ProjectData,
} from "./project";

/** Run one config mode's compute() with canonical values. */
function compute(
  slug: string,
  modeId: string,
  values: Record<string, number>,
  system?: "imperial" | "metric",
): CalcOutput {
  const config = CALCULATOR_CONFIGS[slug];
  if (!config) throw new Error(`No config for ${slug}`);
  const mode = config.modes.find((m) => m.id === modeId);
  if (!mode) throw new Error(`No mode "${modeId}" for ${slug}`);
  return mode.compute(values, new Set(Object.keys(values)), system);
}

/** The "Buy as" select field on a mode, if it has one. */
function purchaseMethodField(slug: string, modeId: string) {
  const config = CALCULATOR_CONFIGS[slug];
  const mode = config?.modes.find((m) => m.id === modeId);
  return mode?.fields.find((f) => f.id === "purchaseMethod");
}

/** Collapse conversion noise the way the island does (12 significant digits). */
function clean(value: number): number {
  return Number(value.toPrecision(12));
}

// ---------------------------------------------------------------------------
// Sand — bulk vs bags
// ---------------------------------------------------------------------------

/** Default sand job: 10 × 10 ft, 4 in deep, 10% waste, 2,700 lb/yd³, 0.5 ft³ bags. */
const SAND_DEFAULT = {
  length: 10,
  width: 10,
  depth: 4 / 12,
  waste: 10,
  density: 2700,
  bagSize: 0.5,
};

describe("Sand — bulk vs bags", () => {
  it("defaults to bulk and lists only the bulk order (10 × 10 ft, 4 in)", () => {
    // 10 × 10 × 1/3 = 33.33 ft³; × 1.10 = 36.67 ft³ = 1.36 yd³.
    // Bulk: ceil(1.36) = 2 yd³. Bags: ceil(36.67 / 0.5) = 74.
    // Order weight: 2 × 2,700 = 5,400 lb = 2.7 tons.
    const out = compute("sand-calculator", "area", { ...SAND_DEFAULT });
    expect(out.lines).toEqual(["Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))"]);
    expect(out.costUsd).toBeUndefined();
    // Row labels, order, and values are unchanged from the previous round.
    expect(out.rows.map((r) => r.label)).toEqual([
      "Sand volume",
      "Bulk to order",
      "Weight needed",
      "Weight of order",
      "Bags",
    ]);
    expect(out.rows.map((r) => r.value)).toEqual([
      "1.36 yd³",
      "2 yd³",
      "1.83 tons (US short tons)",
      "2.7 tons (US short tons)",
      "74 bags",
    ]);
    const bulkRow = out.rows[1];
    const bagsRow = out.rows[4];
    expect(bulkRow?.detail).toContain("your purchase method");
    expect(bagsRow?.detail).toContain("Alternative");
    expect(out.note).toContain("Buy bulk or bags, not both");
    expect(out.note).toContain("only the bulk order");
  });

  it("with no purchase method passed (lookup-table recompute) the default is still bulk", () => {
    const out = compute("sand-calculator", "area", { ...SAND_DEFAULT });
    expect(out.lines).toEqual(["Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))"]);
  });

  it("bags selected: only the bag line, priced on the bag price", () => {
    // Both prices entered ($40/yd³, $5/bag): bags cost 74 × $5 = $370,
    // bulk would be 2 × $40 = $80 — the bulk figure stays visible only
    // as a labelled alternative in the Bulk row detail.
    const out = compute("sand-calculator", "area", {
      ...SAND_DEFAULT,
      purchaseMethod: 1,
      pricePerYd3: 40,
      pricePerBag: 5,
    });
    expect(out.lines).toEqual(["Sand bags (0.5 ft³ each): 74"]);
    expect(out.costUsd).toBe(370);
    expect(out.rows[1]?.detail).toContain("Alternative");
    expect(out.rows[1]?.detail).toContain("$80.00");
    expect(out.rows[4]?.detail).toContain("your purchase method");
    expect(out.note).toContain("only the bags");
  });

  it("bulk selected: only the bulk line, priced on the bulk price", () => {
    const out = compute("sand-calculator", "area", {
      ...SAND_DEFAULT,
      purchaseMethod: 0,
      pricePerYd3: 40,
      pricePerBag: 5,
    });
    expect(out.lines).toEqual(["Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))"]);
    expect(out.costUsd).toBe(80);
    expect(out.rows[4]?.detail).toContain("Alternative");
    expect(out.rows[4]?.detail).toContain("$370.00");
  });

  it("no silent repricing: a price for the other form never prices the chosen form", () => {
    // Bulk chosen, only a bag price entered: no headline cost — the
    // $370 bag figure is still shown, as a labelled alternative.
    const bulkOnlyBagPrice = compute("sand-calculator", "area", {
      ...SAND_DEFAULT,
      purchaseMethod: 0,
      pricePerBag: 5,
    });
    expect(bulkOnlyBagPrice.costUsd).toBeUndefined();
    expect(bulkOnlyBagPrice.rows[4]?.detail).toContain("$370.00");
    // Bags chosen, only a bulk price entered: likewise no headline cost.
    const bagsOnlyBulkPrice = compute("sand-calculator", "area", {
      ...SAND_DEFAULT,
      purchaseMethod: 1,
      pricePerYd3: 40,
    });
    expect(bagsOnlyBulkPrice.costUsd).toBeUndefined();
    expect(bagsOnlyBulkPrice.rows[1]?.detail).toContain("$80.00");
  });

  it("formula: cost follows the method; without a method the legacy bulk-wins rule holds", () => {
    // Worked example: 50 ft³, 10% waste → 55 ft³, order 3 yd³, 110 bags.
    const base = { volumeFt3: 50, wastePct: 10, densityLbYd3: 2700, bagSizeFt3: 0.5 };
    expect(calculateSand({ ...base, pricePerYd3: 40, pricePerBag: 5 }).costUsd).toBe(3 * 40); // no method: bulk wins, as before
    expect(calculateSand({ ...base, pricePerBag: 5 }).costUsd).toBe(110 * 5);
    expect(
      calculateSand({ ...base, pricePerYd3: 40, pricePerBag: 5, purchaseMethod: "bags" }).costUsd,
    ).toBe(110 * 5);
    expect(
      calculateSand({ ...base, pricePerYd3: 40, pricePerBag: 5, purchaseMethod: "bulk" }).costUsd,
    ).toBe(3 * 40);
    expect(
      calculateSand({ ...base, pricePerBag: 5, purchaseMethod: "bulk" }).costUsd,
    ).toBeUndefined();
    expect(
      calculateSand({ ...base, pricePerYd3: 40, purchaseMethod: "bags" }).costUsd,
    ).toBeUndefined();
  });

  it("metric and imperial give the same shopping list for the same physical job", () => {
    // Same job entered in metric: 3.048 m × 3.048 m × 10.16 cm.
    const metric = compute(
      "sand-calculator",
      "area",
      {
        length: clean(convertLength(3.048, "m", "ft")),
        width: clean(convertLength(3.048, "m", "ft")),
        depth: clean(convertLength(10.16, "cm", "ft")),
        waste: 10,
        density: 2700,
        bagSize: 0.5,
      },
      "metric",
    );
    const imperial = compute("sand-calculator", "area", { ...SAND_DEFAULT }, "imperial");
    expect(metric.lines).toEqual(imperial.lines);
    expect(metric.rows.map((r) => r.value)).toEqual(imperial.rows.map((r) => r.value));
  });

  it("the volume mode has the same select (known volume, 2 yd³)", () => {
    // 2 yd³ = 54 ft³; × 1.10 = 59.4 ft³ = 2.2 yd³; order 3 yd³;
    // bags ceil(59.4 / 0.5) = 119; order weight 3 × 2,700 = 8,100 lb = 4.05 tons.
    const out = compute("sand-calculator", "volume", {
      volume: 54,
      waste: 10,
      density: 2700,
      bagSize: 0.5,
    });
    expect(out.lines).toEqual(["Sand (bulk): 3 yd³ (about 4.05 tons (US short tons))"]);
    const bags = compute("sand-calculator", "volume", {
      volume: 54,
      waste: 10,
      density: 2700,
      bagSize: 0.5,
      purchaseMethod: 1,
    });
    expect(bags.lines).toEqual(["Sand bags (0.5 ft³ each): 119"]);
  });
});

// ---------------------------------------------------------------------------
// Raised Bed Soil — premixed bags vs premixed bulk vs mix components
// ---------------------------------------------------------------------------

/** Default raised-bed job: one 8 × 4 ft bed, 10 in of soil, 10% settling, 60/30/10 mix, 2 ft³ bags. */
const BED_DEFAULT = {
  length: 8,
  width: 4,
  fillDepth: 10 / 12,
  beds: 1,
  settling: 10,
  topsoilPct: 60,
  compostPct: 30,
  aerationPct: 10,
  bagSize: 2,
};

describe("Raised Bed Soil — premixed bags vs bulk vs components", () => {
  it("defaults to premixed bags and lists only the bags (mix is composition, not a purchase)", () => {
    // 8 × 4 × 10/12 = 26.67 ft³; × 1.10 = 29.33 ft³ = 1.09 yd³.
    // Bulk: ceil(1.09) = 2 yd³. Bags: ceil(29.33 / 2) = 15.
    // Mix on the ordered volume: 17.6 / 8.8 / 2.93 ft³.
    const out = compute("raised-bed-soil-calculator", "bed", { ...BED_DEFAULT });
    expect(out.lines).toEqual(["Raised bed soil bags (2 ft³ each): 15"]);
    expect(out.costUsd).toBeUndefined();
    expect(out.rows.map((r) => r.label)).toEqual([
      "Soil volume",
      "Bulk to order",
      "Bags to buy",
      "Mix (60/30/10)",
    ]);
    expect(out.rows.map((r) => r.value)).toEqual([
      "29.33 ft³",
      "2 yd³",
      "15 bags",
      "17.6 / 8.8 / 2.93 ft³",
    ]);
    expect(out.rows[3]?.detail).toContain("not a separate purchase");
    expect(out.rows[2]?.detail).toContain("your purchase method");
    expect(out.rows[1]?.detail).toContain("Alternative");
    expect(out.note).toContain("Buy one form, not all three");
    expect(out.note).toContain("only the bags");
  });

  it("bulk selected: only the bulk line, priced on the bulk price", () => {
    // Both prices entered ($45/yd³, $8/bag): bulk 2 × $45 = $90;
    // bags would be 15 × $8 = $120, shown only as an alternative.
    const out = compute("raised-bed-soil-calculator", "bed", {
      ...BED_DEFAULT,
      purchaseMethod: 1,
      pricePerYd3: 45,
      pricePerBag: 8,
    });
    expect(out.lines).toEqual(["Raised bed soil (bulk): 2 yd³"]);
    expect(out.costUsd).toBe(90);
    expect(out.rows[2]?.detail).toContain("$120.00");
    expect(out.note).toContain("only the bulk order");
  });

  it("bags selected with both prices: priced on the bag price", () => {
    const out = compute("raised-bed-soil-calculator", "bed", {
      ...BED_DEFAULT,
      purchaseMethod: 0,
      pricePerYd3: 45,
      pricePerBag: 8,
    });
    expect(out.lines).toEqual(["Raised bed soil bags (2 ft³ each): 15"]);
    expect(out.costUsd).toBe(120);
    expect(out.rows[1]?.detail).toContain("$90.00");
  });

  it("components selected: the three parts are the whole shopping list, with no cost", () => {
    // The same 29.33 ft³ ordered, split 60/30/10: 17.6 topsoil,
    // 8.8 compost, 2.93 perlite. No premixed line at all, and no cost
    // even though both premixed prices were entered — the parts carry
    // no prices.
    const out = compute("raised-bed-soil-calculator", "bed", {
      ...BED_DEFAULT,
      purchaseMethod: 2,
      pricePerYd3: 45,
      pricePerBag: 8,
    });
    expect(out.lines).toEqual(["Topsoil: 17.6 ft³", "Compost: 8.8 ft³", "Perlite: 2.93 ft³"]);
    expect(out.costUsd).toBeUndefined();
    expect(out.rows[3]?.detail).toContain("buy the three parts separately");
    expect(out.note).toContain("only the three mix components");
    expect(out.note).toContain("no cost is shown for this choice");
  });

  it("formula: cost follows the method; without a method the legacy bulk-wins rule holds", () => {
    const base = {
      soilFt3: 26.6666666667,
      settlingPct: 10,
      topsoilPct: 60,
      compostPct: 30,
      aerationPct: 10,
      bagSizeFt3: 2,
    };
    // Ordered 29.33 ft³ → 2 yd³ bulk, 15 bags.
    expect(calculateRaisedBedSoil({ ...base, pricePerYd3: 45, pricePerBag: 8 }).costUsd).toBe(
      2 * 45,
    ); // no method: bulk wins, as before
    expect(calculateRaisedBedSoil({ ...base, pricePerBag: 8 }).costUsd).toBe(15 * 8);
    expect(
      calculateRaisedBedSoil({ ...base, pricePerYd3: 45, pricePerBag: 8, purchaseMethod: "bags" })
        .costUsd,
    ).toBe(15 * 8);
    expect(
      calculateRaisedBedSoil({
        ...base,
        pricePerYd3: 45,
        pricePerBag: 8,
        purchaseMethod: "components",
      }).costUsd,
    ).toBeUndefined();
  });

  it("metric and imperial give the same shopping list for the same physical job", () => {
    // Same bed in metric: 2.4384 m × 1.2192 m × 25.4 cm.
    const metric = compute(
      "raised-bed-soil-calculator",
      "bed",
      {
        length: clean(convertLength(2.4384, "m", "ft")),
        width: clean(convertLength(1.2192, "m", "ft")),
        fillDepth: clean(convertLength(25.4, "cm", "ft")),
        beds: 1,
        settling: 10,
        topsoilPct: 60,
        compostPct: 30,
        aerationPct: 10,
        bagSize: 2,
      },
      "metric",
    );
    const imperial = compute("raised-bed-soil-calculator", "bed", { ...BED_DEFAULT }, "imperial");
    expect(metric.lines).toEqual(imperial.lines);
    expect(metric.rows.map((r) => r.value)).toEqual(imperial.rows.map((r) => r.value));
  });
});

// ---------------------------------------------------------------------------
// Sod — rolls vs pallets
// ---------------------------------------------------------------------------

/** Default sod job: 20 × 30 ft lawn, 10% waste, 10 ft² rolls, 450 ft² pallets. */
const SOD_DEFAULT = {
  length: 20,
  width: 30,
  waste: 10,
  rollCoverage: 10,
  palletCoverage: 450,
};

describe("Sod — rolls vs pallets", () => {
  it("defaults to pallets and lists only the pallets, keeping the partial-pallet flag", () => {
    // 600 ft² × 1.10 = 660 ft². Rolls: ceil(660 / 10) = 66.
    // Pallets: ceil(660 / 450) = 2; last pallet needs 660 − 450 = 210 ft².
    const out = compute("sod-calculator", "rectangle", { ...SOD_DEFAULT });
    expect(out.lines).toEqual([
      "Sod (pallets): 2 pallets (450 ft² each) — last pallet is partial, you need only 210 ft² of it",
    ]);
    expect(out.costUsd).toBeUndefined();
    expect(out.rows.map((r) => r.label)).toEqual([
      "Lawn area",
      "Area with waste",
      "Rolls to buy",
      "Pallets to buy",
    ]);
    expect(out.rows.map((r) => r.value)).toEqual(["600 ft²", "660 ft²", "66 rolls", "2 pallets"]);
    expect(out.rows[3]?.detail).toContain("your purchase method");
    expect(out.rows[2]?.detail).toContain("Alternative");
    expect(out.note).toContain("Buy rolls or pallets, not both");
    expect(out.note).toContain("only the pallets");
  });

  it("rolls selected: only the roll line, priced on the roll price", () => {
    // Both prices entered ($200/pallet, $8/roll): rolls 66 × $8 = $528;
    // pallets would be 2 × $200 = $400, shown only as an alternative.
    const out = compute("sod-calculator", "rectangle", {
      ...SOD_DEFAULT,
      purchaseMethod: 1,
      pricePerRoll: 8,
      pricePerPallet: 200,
    });
    expect(out.lines).toEqual(["Sod (rolls): 66 rolls (10 ft² each)"]);
    expect(out.costUsd).toBe(528);
    expect(out.rows[3]?.detail).toContain("Alternative");
    expect(out.rows[3]?.detail).toContain("$400.00");
    expect(out.note).toContain("only the rolls");
  });

  it("pallets selected with both prices: priced on the pallet price", () => {
    const out = compute("sod-calculator", "rectangle", {
      ...SOD_DEFAULT,
      purchaseMethod: 0,
      pricePerRoll: 8,
      pricePerPallet: 200,
    });
    expect(out.lines).toEqual([
      "Sod (pallets): 2 pallets (450 ft² each) — last pallet is partial, you need only 210 ft² of it",
    ]);
    expect(out.costUsd).toBe(400);
    expect(out.rows[2]?.detail).toContain("$528.00");
  });

  it("worked example with an exclusion keeps the partial-pallet flag on the pallet line", () => {
    // 20 × 30 ft minus a 100 ft² driveway: 500 ft² × 1.10 = 550 ft².
    // Rolls: 55. Pallets: 2; last pallet needs 550 − 450 = 100 ft².
    const out = compute("sod-calculator", "rectangle", {
      ...SOD_DEFAULT,
      exclusions: 100,
    });
    expect(out.lines).toEqual([
      "Sod (pallets): 2 pallets (450 ft² each) — last pallet is partial, you need only 100 ft² of it",
    ]);
    const rolls = compute("sod-calculator", "rectangle", {
      ...SOD_DEFAULT,
      exclusions: 100,
      purchaseMethod: 1,
      pricePerRoll: 8,
    });
    expect(rolls.lines).toEqual(["Sod (rolls): 55 rolls (10 ft² each)"]);
    expect(rolls.costUsd).toBe(55 * 8);
  });

  it("no silent repricing: a price for the other form never prices the chosen form", () => {
    const rollsOnlyPalletPrice = compute("sod-calculator", "rectangle", {
      ...SOD_DEFAULT,
      purchaseMethod: 1,
      pricePerPallet: 200,
    });
    expect(rollsOnlyPalletPrice.costUsd).toBeUndefined();
    expect(rollsOnlyPalletPrice.rows[3]?.detail).toContain("$400.00");
    const palletsOnlyRollPrice = compute("sod-calculator", "rectangle", {
      ...SOD_DEFAULT,
      purchaseMethod: 0,
      pricePerRoll: 8,
    });
    expect(palletsOnlyRollPrice.costUsd).toBeUndefined();
    expect(palletsOnlyRollPrice.rows[2]?.detail).toContain("$528.00");
  });

  it("formula: cost follows the method; without a method the legacy pallet-wins rule holds", () => {
    const base = {
      grossAreaFt2: 600,
      exclusionsFt2: 100,
      wastePct: 10,
      rollCoverageFt2: 10,
      palletCoverageFt2: 450,
    };
    // Adjusted 550 ft² → 55 rolls, 2 pallets.
    expect(calculateSod({ ...base, pricePerPallet: 200, pricePerRoll: 8 }).costUsd).toBe(2 * 200); // no method: pallet wins, as before
    expect(calculateSod({ ...base, pricePerRoll: 8 }).costUsd).toBe(55 * 8);
    expect(
      calculateSod({ ...base, pricePerPallet: 200, pricePerRoll: 8, purchaseMethod: "rolls" })
        .costUsd,
    ).toBe(55 * 8);
    expect(
      calculateSod({ ...base, pricePerRoll: 8, purchaseMethod: "pallets" }).costUsd,
    ).toBeUndefined();
  });

  it("metric and imperial give the same shopping list for the same physical job", () => {
    // Same lawn in metric: 6.096 m × 9.144 m.
    const metric = compute(
      "sod-calculator",
      "rectangle",
      {
        length: clean(convertLength(6.096, "m", "ft")),
        width: clean(convertLength(9.144, "m", "ft")),
        waste: 10,
        rollCoverage: 10,
        palletCoverage: 450,
      },
      "metric",
    );
    const imperial = compute("sod-calculator", "rectangle", { ...SOD_DEFAULT }, "imperial");
    expect(metric.lines).toEqual(imperial.lines);
    expect(metric.rows.map((r) => r.value)).toEqual(imperial.rows.map((r) => r.value));
  });
});

// ---------------------------------------------------------------------------
// Lawn Seed — bags vs bulk by the pound
// ---------------------------------------------------------------------------

/** Default lawn-seed job: 50 × 100 ft new lawn, 7 lb per 1,000 ft², 10% buffer. */
const SEED_DEFAULT = {
  length: 50,
  width: 100,
  jobType: 0,
  rateUnit: 0,
  rate: 7,
  buffer: 10,
};

describe("Lawn Seed — bags vs bulk by the pound", () => {
  it("defaults to bags: the weight line states the need, the bag line states the purchase", () => {
    // 5,000 ft² × 7 lb/1,000 ft² = 35 lb; × 1.10 = 38.5 lb.
    // Least overbuy from 25/10/3 lb bags: 3 × 10 + 3 × 3 = 39 lb, 6 bags.
    const out = compute("lawn-seed-calculator", "area", { ...SEED_DEFAULT });
    expect(out.lines).toEqual([
      "Grass seed needed: 38.5 lb (17.5 kg) at 7 lb per 1,000 ft², new lawn",
      "Buy as bags: 3 × 10 lb + 3 × 3 lb (6 bags, 39 lb total)",
    ]);
    expect(out.costUsd).toBeUndefined();
    expect(out.rows.map((r) => r.label)).toEqual([
      "Seed needed",
      "Seed with buffer",
      "Bags to buy",
    ]);
    expect(out.rows.map((r) => r.value)).toEqual(["35 lb", "38.5 lb", "3 × 10 lb + 3 × 3 lb"]);
    expect(out.rows[2]?.detail).toContain("your purchase method");
    expect(out.note).toContain("Buy bags or bulk by the pound, not both");
  });

  it("bags selected with a price: priced on the purchased bag weight", () => {
    // 39 lb purchased × $2/lb = $78 (not the 38.5 lb need).
    const out = compute("lawn-seed-calculator", "area", {
      ...SEED_DEFAULT,
      purchaseMethod: 0,
      pricePerLb: 2,
    });
    expect(out.costUsd).toBe(78);
    expect(out.lines).toHaveLength(2);
  });

  it("bulk selected: a single purchase line, priced on the buffered weight", () => {
    // 38.5 lb buffered × $2/lb = $77 — no bag rounding for bulk.
    const out = compute("lawn-seed-calculator", "area", {
      ...SEED_DEFAULT,
      purchaseMethod: 1,
      pricePerLb: 2,
    });
    expect(out.lines).toEqual([
      "Grass seed (bulk, by the pound): 38.5 lb (17.5 kg) at 7 lb per 1,000 ft², new lawn",
    ]);
    expect(out.costUsd).toBe(77);
    expect(out.rows[2]?.detail).toContain("Alternative");
    expect(out.note).toContain("only the bulk seed");
  });

  it("QA case: 1,000 ft² overseeding at 4 lb per 1,000 ft², no buffer", () => {
    // 1,000 ft² × 4 lb/1,000 ft² = 4 lb (the overseeding rate is used
    // as entered — no halving). Bags: least overbuy is 2 × 3 lb = 6 lb.
    // At $3/lb: bulk 4 × $3 = $12; bags 6 × $3 = $18.
    const base = {
      length: 50,
      width: 20,
      jobType: 1,
      rateUnit: 0,
      rate: 4,
      buffer: 0,
      pricePerLb: 3,
    };
    const bulk = compute("lawn-seed-calculator", "area", { ...base, purchaseMethod: 1 });
    expect(bulk.lines).toEqual([
      "Grass seed (bulk, by the pound): 4 lb (1.8 kg) at 4 lb per 1,000 ft², overseeding",
    ]);
    expect(bulk.costUsd).toBe(12);
    const bags = compute("lawn-seed-calculator", "area", { ...base, purchaseMethod: 0 });
    expect(bags.lines).toEqual([
      "Grass seed needed: 4 lb (1.8 kg) at 4 lb per 1,000 ft², overseeding",
      "Buy as bags: 2 × 3 lb (2 bags, 6 lb total)",
    ]);
    expect(bags.costUsd).toBe(18);
  });

  it("formula: bulk is priced on the buffered weight, bags on the purchased weight", () => {
    const base = { netAreaFt2: 5000, rateLbPer1000Ft2: 7, bufferPct: 10, pricePerLb: 2 };
    // Buffered 38.5 lb, purchased 39 lb.
    expect(calculateLawnSeed({ ...base, purchaseMethod: "bulk" }).costUsd).toBe(38.5 * 2);
    expect(calculateLawnSeed({ ...base, purchaseMethod: "bags" }).costUsd).toBe(39 * 2);
    expect(calculateLawnSeed({ ...base }).costUsd).toBe(39 * 2); // no method: bags, as before
  });

  it("metric rate entry gives the same bag purchase as the imperial rate", () => {
    // 34.2 g/m² is the metric form of the 7 lb per 1,000 ft² rate
    // (7 × 4.882 = 34.174, shown as 34.2): the same 38.5 lb need and
    // the same 3 × 10 + 3 × 3 lb purchase. Only the rate text differs.
    const metric = compute(
      "lawn-seed-calculator",
      "area",
      { ...SEED_DEFAULT, rateUnit: 1, rate: 34.2 },
      "metric",
    );
    const imperial = compute("lawn-seed-calculator", "area", { ...SEED_DEFAULT }, "imperial");
    expect(metric.lines[1]).toBe(imperial.lines[1]);
    expect(metric.lines[0]).toContain("38.5 lb");
    expect(imperial.lines[0]).toContain("38.5 lb");
  });
});

// ---------------------------------------------------------------------------
// Fence — no purchase alternatives (verified unchanged)
// ---------------------------------------------------------------------------

describe("Fence — no purchase alternatives", () => {
  it("picket mode lists four distinct materials, all needed, with no alternative wording", () => {
    // 100 ft run, 8 ft spacing, 6 ft high: 13 sections, 14 posts;
    // 39 rails × 1.10 = 43; 200 pickets × 1.10 = 220; 14 × 2 = 28 bags.
    const out = compute("fence-calculator", "picket", {
      runLength: 100,
      postSpacing: 8,
      fenceHeight: 6,
      picketWidth: 6,
      picketGap: 0,
      gateLayout: 1,
      waste: 10,
      concreteBagsPerPost: 2,
    });
    expect(out.lines).toEqual([
      "Fence posts: 14",
      "Fence rails: 43",
      "Fence pickets: 220",
      "Concrete bags (80 lb): 28",
    ]);
    for (const line of out.lines) {
      expect(line).not.toMatch(/alternative|or bags|or bulk/i);
    }
  });

  it("a middle gate still distinguishes gate posts instead of offering an alternative", () => {
    // 20 ft run, 4 ft gate in the middle: 16 ft of fence in two 8 ft
    // runs → 4 posts, 2 of them gate posts; 2 sections × 3 rails × 1.10
    // = 7 rails (6.6 → 7); 16 ft ÷ 0.5 ft = 32 pickets × 1.10 = 36
    // (35.2 → 36); 4 × 2 = 8 concrete bags.
    const out = compute("fence-calculator", "picket", {
      runLength: 20,
      postSpacing: 8,
      fenceHeight: 6,
      picketWidth: 6,
      picketGap: 0,
      gateWidth: 4,
      gateLayout: 2,
      waste: 10,
      concreteBagsPerPost: 2,
    });
    expect(out.lines).toEqual([
      "Fence posts: 4 (including 2 gate posts)",
      "Fence rails: 7",
      "Fence pickets: 36",
      "Concrete bags (80 lb): 8",
    ]);
  });

  it("panel mode lists four distinct materials, all needed", () => {
    // 100 ft run, 6 ft panels: 17 panels (16.67 → 17), 18 posts,
    // 17 gravel boards, 36 Postcrete bags.
    const out = compute("fence-calculator", "panel", {
      runLength: 100,
      panelLength: 6,
      gravelBoards: 1,
      postcreteBagsPerPost: 2,
      gateLayout: 1,
    });
    expect(out.lines).toEqual([
      "Fence panels: 17",
      "Fence posts: 18",
      "Gravel boards: 17",
      "Postcrete bags (20 kg): 36",
    ]);
  });

  it("the priced-materials subtotal labelling from Workstream A is untouched", () => {
    // Only a post price entered: 14 posts × $10 = $140, partial.
    const out = compute("fence-calculator", "picket", {
      runLength: 100,
      postSpacing: 8,
      fenceHeight: 6,
      picketWidth: 6,
      picketGap: 0,
      gateLayout: 1,
      waste: 10,
      concreteBagsPerPost: 2,
      pricePerPost: 10,
    });
    expect(out.costUsd).toBe(140);
    expect(out.costPartial).toBe(true);
    expect(out.costLabel).toBe("Estimated cost — priced materials only");
  });

  it("fence has no purchase-method select (nothing to choose between)", () => {
    expect(purchaseMethodField("fence-calculator", "picket")).toBeUndefined();
    expect(purchaseMethodField("fence-calculator", "panel")).toBeUndefined();
  });

  it("picket mode: gate layout 2 with no gate width entered stays one run", () => {
    // Workstream A rule (config.ts): with no gate width the layout
    // cannot split anything, so segments is forced to 1 even though
    // Gate layout says "one gate in the middle". Hand-derived for a
    // 20 ft run, 8 ft spacing, 6 ft high, 6 in pickets, no gap, 10%
    // waste: sections ceil(20 / 8) = 3, posts 3 + 1 = 4 (no gate
    // posts); rails 3 sections x 3 rails x 1.10 = 9.9 -> 10;
    // pickets 20 ft / 0.5 ft = 40 x 1.10 = 44; concrete 4 x 2 = 8.
    // Contrast the real middle gate (gateWidth 4): same 4 posts but
    // 2 of them gate posts, 7 rails, 36 pickets.
    const out = compute("fence-calculator", "picket", {
      runLength: 20,
      postSpacing: 8,
      fenceHeight: 6,
      picketWidth: 6,
      picketGap: 0,
      gateLayout: 2,
      waste: 10,
      concreteBagsPerPost: 2,
    });
    expect(out.lines).toEqual([
      "Fence posts: 4",
      "Fence rails: 10",
      "Fence pickets: 44",
      "Concrete bags (80 lb): 8",
    ]);
  });

  it("picket mode: gate layout 2 with an explicit zero gate width stays one run", () => {
    // Same 20 ft job as above, but gateWidth entered as 0 rather than
    // left blank: the `gateWidthFt > 0` guard still forces one run,
    // so the quantities are identical.
    const out = compute("fence-calculator", "picket", {
      runLength: 20,
      postSpacing: 8,
      fenceHeight: 6,
      picketWidth: 6,
      picketGap: 0,
      gateWidth: 0,
      gateLayout: 2,
      waste: 10,
      concreteBagsPerPost: 2,
    });
    expect(out.lines).toEqual([
      "Fence posts: 4",
      "Fence rails: 10",
      "Fence pickets: 44",
      "Concrete bags (80 lb): 8",
    ]);
  });

  it("panel mode: gate layout 3 with no gate width entered stays one run", () => {
    // Same forcing rule in panel mode: 20 ft run, 6 ft panels,
    // gravel boards on, 2 Postcrete bags per post. One run gives
    // panels ceil(20 / 6) = 4, posts 4 + 1 = 5, gravel boards 4,
    // Postcrete 5 x 2 = 10. With a real gate the same 20 ft run
    // would split and count 6 posts, so 5 posts proves no split.
    const out = compute("fence-calculator", "panel", {
      runLength: 20,
      panelLength: 6,
      gravelBoards: 1,
      postcreteBagsPerPost: 2,
      gateLayout: 3,
    });
    expect(out.lines).toEqual([
      "Fence panels: 4",
      "Fence posts: 5",
      "Gravel boards: 4",
      "Postcrete bags (20 kg): 10",
    ]);
  });
});

// ---------------------------------------------------------------------------
// The select itself: present on the four calculators, default = 0
// (Reset in the island restores these field defaults)
// ---------------------------------------------------------------------------

describe("Buy as select fields", () => {
  it.each([
    ["sand-calculator", "area", ["Bulk — by the cubic yard", "Bags"]],
    ["sand-calculator", "volume", ["Bulk — by the cubic yard", "Bags"]],
    [
      "raised-bed-soil-calculator",
      "bed",
      ["Premixed soil — bags", "Premixed soil — bulk", "Mix components separately"],
    ],
    [
      "raised-bed-soil-calculator",
      "volume",
      ["Premixed soil — bags", "Premixed soil — bulk", "Mix components separately"],
    ],
    ["sod-calculator", "rectangle", ["Pallets", "Rolls"]],
    ["sod-calculator", "circle", ["Pallets", "Rolls"]],
    ["sod-calculator", "l-shape", ["Pallets", "Rolls"]],
    ["lawn-seed-calculator", "area", ["Bags (standard 25 / 10 / 3 lb)", "Bulk by the pound"]],
  ] as const)("has a Buy as select defaulting to the first option: %s %s", (slug, mode, labels) => {
    const field = purchaseMethodField(slug, mode);
    expect(field).toBeDefined();
    expect(field?.label).toBe("Buy as");
    expect(field?.kind).toBe("select");
    // The island's Reset restores these defaults, so the default
    // purchase method is what Reset returns to.
    expect(field?.defaultImp).toBe("0");
    expect(field?.defaultMet).toBe("0");
    expect(field?.options?.map((o) => o.label)).toEqual(labels);
  });

  it("sand reverse mode has no purchase (it is sand you already have)", () => {
    const config = CALCULATOR_CONFIGS["sand-calculator"];
    const reverse = config?.modes.find((m) => m.id === "reverse");
    expect(reverse?.fields.some((f) => f.id === "purchaseMethod")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// My Project: saved lines, reload, and CSV carry only the chosen form
// ---------------------------------------------------------------------------

describe("My Project round-trip carries only the chosen form", () => {
  function projectWithSandBulk(): ProjectData {
    return {
      version: 2,
      name: "My Project",
      items: [
        {
          id: "test-sand-1",
          calculatorSlug: "sand-calculator",
          label: "Sand Calculator — Area and depth",
          lines: ["Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))"],
          quantity: 1,
          costUsd: 80,
          room: "General",
          savedAt: 1,
        },
      ],
    };
  }

  it("a saved bulk item reloads with its single line and cost intact", () => {
    const reloaded = parseProject(serializeProject(projectWithSandBulk()));
    expect(reloaded.items).toHaveLength(1);
    expect(reloaded.items[0]?.lines).toEqual([
      "Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))",
    ]);
    expect(reloaded.items[0]?.costUsd).toBe(80);
  });

  it("text and CSV exports contain the chosen form only", () => {
    const project = projectWithSandBulk();
    const text = formatProjectAsText(project);
    expect(text).toContain("Sand (bulk): 2 yd³");
    expect(text).not.toContain("Sand bags");
    expect(text).toContain("Estimated cost: $80.00");
    const csv = formatProjectAsCsv(project);
    expect(csv).toContain("Sand (bulk): 2 yd³");
    expect(csv).not.toContain("Sand bags");
  });

  it("an item saved before this round still loads and displays as stored (backward compatible)", () => {
    // A legacy record kept both lines — the stored text is never
    // rewritten, so it loads unchanged and displays sensibly as the
    // record the user saved at the time.
    const legacy: ProjectData = {
      version: 2,
      name: "My Project",
      items: [
        {
          id: "test-legacy-1",
          calculatorSlug: "sand-calculator",
          label: "Sand Calculator — Area and depth",
          lines: [
            "Sand (bulk): 2 yd³ (about 2.7 tons (US short tons))",
            "Sand bags (0.5 ft³ each): 74",
          ],
          quantity: 1,
          room: "General",
          savedAt: 1,
        },
      ],
    };
    const reloaded = parseProject(serializeProject(legacy));
    expect(reloaded.items).toHaveLength(1);
    expect(reloaded.items[0]?.lines).toHaveLength(2);
    expect(formatProjectAsText(reloaded)).toContain("Sand bags (0.5 ft³ each): 74");
  });
});

// ---------------------------------------------------------------------------
// Singular/plural in the "Buy as" alternative details (Phase 17B2 QA
// corrective round, follow-up to Workstream G): a count of 1 reads
// "1 bag" / "1 roll" / "1 pallet", not "1 bags" / "1 rolls" /
// "1 pallets", in the labelled alternative shown in the row detail
// and in the lawn-seed bag line.
// ---------------------------------------------------------------------------
describe("Buy-as alternative details singularize at count 1", () => {
  it("Sand: 'Alternative: 1 bag would cost $5.00' for a 1 × 1 ft job", () => {
    // 1 × 1 ft, 3 in deep: 0.25 ft³ × 110% = 0.28 ft³ → 1 bag of 0.5 ft³.
    const out = compute("sand-calculator", "area", {
      length: 1,
      width: 1,
      depth: 3 / 12,
      waste: 10,
      density: 2700,
      bagSize: 0.5,
      purchaseMethod: 0,
      pricePerBag: 5,
    });
    expect(out.rows[4]?.detail).toContain("Alternative: 1 bag would cost $5.00");
  });

  it("Raised Bed: 'Alternative: 1 bag of premixed soil would cost $8.00' for a 1 × 1 ft bed", () => {
    // 1 × 1 ft, 6 in fill: 0.5 ft³ × 110% settling = 0.55 ft³ → 1 bag of 2 ft³.
    const out = compute("raised-bed-soil-calculator", "bed", {
      length: 1,
      width: 1,
      fillDepth: 6 / 12,
      beds: 1,
      settling: 10,
      topsoilPct: 60,
      compostPct: 30,
      aerationPct: 10,
      bagSize: 2,
      purchaseMethod: 1,
      pricePerBag: 8,
    });
    expect(out.rows[2]?.detail).toContain("Alternative: 1 bag of premixed soil would cost $8.00");
  });

  it("Sod: 'Alternative: 1 roll would cost $8.00' for a 3 × 3 ft lawn", () => {
    // 9 ft² × 110% = 9.9 ft² → 1 roll of 10 ft² (pallets selected).
    const out = compute("sod-calculator", "rectangle", {
      length: 3,
      width: 3,
      waste: 10,
      rollCoverage: 10,
      palletCoverage: 450,
      purchaseMethod: 0,
      pricePerRoll: 8,
    });
    expect(out.rows[2]?.detail).toContain("Alternative: 1 roll would cost $8.00");
  });

  it("Sod: 'Alternative: 1 pallet would cost $200.00' for a 10 × 10 ft lawn", () => {
    // 100 ft² × 110% = 110 ft² → 1 pallet of 450 ft² (rolls selected).
    const out = compute("sod-calculator", "rectangle", {
      length: 10,
      width: 10,
      waste: 10,
      rollCoverage: 10,
      palletCoverage: 450,
      purchaseMethod: 1,
      pricePerPallet: 200,
    });
    expect(out.rows[3]?.detail).toContain("Alternative: 1 pallet would cost $200.00");
  });

  it("Lawn Seed: '(1 bag, 3 lb total)' for a 100 ft² lawn at 3 lb/1,000 ft²", () => {
    // 100 ft² × 3 lb/1,000 ft² = 0.3 lb; × 110% = 0.33 lb → 1 × 3 lb bag.
    const out = compute("lawn-seed-calculator", "area", {
      length: 10,
      width: 10,
      jobType: 0,
      rateUnit: 0,
      rate: 3,
      buffer: 10,
    });
    expect(out.lines).toContain("Buy as bags: 1 × 3 lb (1 bag, 3 lb total)");
  });
});
