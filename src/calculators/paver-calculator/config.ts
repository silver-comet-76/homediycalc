/**
 * Paver Calculator config — paver counts plus base gravel, bedding
 * sand, and joint sand for a patio, walkway, or driveway. Base and
 * sand are information outputs: the paver count is the shopping list,
 * the base/sand figures tell the user what to order underneath.
 * See src/lib/formulas/paver.ts and docs/FORMULAS.md §14.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculatePaver, BASE_COMPACTION_FACTOR } from "../../lib/formulas/paver";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function paverOutput(
  areaFt2: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const r = calculatePaver({
    areaFt2,
    paverLengthIn: req(v, "paverLength"),
    paverWidthIn: req(v, "paverWidth"),
    jointIn: req(v, "joint"),
    paverThicknessIn: req(v, "paverThickness"),
    wastePct: req(v, "waste"),
    baseDepthIn: req(v, "baseDepth"),
    baseDensityLbYd3: req(v, "baseDensity"),
    beddingSandDepthIn: req(v, "beddingSandDepth"),
    beddingSandDensityLbYd3: 2750,
    jointSandDensityLbFt3: req(v, "jointSandDensity"),
    jointSandBagLb: req(v, "jointSandBag"),
    pricePerPaver: present.has("pricePerPaver") ? req(v, "pricePerPaver") : undefined,
    pricePerYd3Base: present.has("pricePerYd3Base") ? req(v, "pricePerYd3Base") : undefined,
    pricePerJointSandBag: present.has("pricePerJointSandBag")
      ? req(v, "pricePerJointSandBag")
      : undefined,
  });
  return {
    rows: [
      {
        label: "Pavers needed",
        value: `${r.pavers} pavers`,
        detail: `${fmt(r.paverAreaFt2, 3)} ft² per paver including a ${fmt(req(v, "joint"), 3)} in joint — ${fmt(req(v, "waste"), 0)}% waste included`,
      },
      {
        label: "Base gravel to order",
        value: `${fmt(r.baseLooseYd3)} yd³`,
        detail: `${fmt(r.baseCompactedYd3)} yd³ compacted (${fmt(req(v, "baseDepth"), 0)} in) — about ${fmt(r.baseTons)} tons`,
      },
      {
        label: "Bedding sand",
        value: `${fmt(r.beddingSandYd3)} yd³`,
        detail: `${fmt(r.beddingSandFt3)} ft³ (${fmt(req(v, "beddingSandDepth"), 0)} in layer) — about ${fmt(r.beddingSandTons)} tons`,
      },
      {
        label: "Joint sand",
        value: `${r.jointSandBags} bags`,
        detail: `${fmt(r.jointSandLb, 1)} lb — ${fmt(req(v, "jointSandBag"), 0)} lb bags`,
      },
    ],
    lines: [
      `Pavers (${fmt(req(v, "paverLength"), 2)} × ${fmt(req(v, "paverWidth"), 2)} in): ${r.pavers}`,
      `Base gravel (${fmt(req(v, "baseDepth"), 0)} in compacted): ${fmt(r.baseLooseYd3)} yd³ loose (about ${fmt(r.baseTons)} tons)`,
      `Bedding sand (1 in layer): ${fmt(r.beddingSandYd3)} yd³ (about ${fmt(r.beddingSandTons)} tons)`,
      `Polymeric joint sand (${fmt(req(v, "jointSandBag"), 0)} lb bags): ${r.jointSandBags} bags`,
    ],
    costUsd: r.costUsd,
    note: "Base and sand figures are ordering information — the base must extend at least 6 in past the paver edge on every side, and compacted gravel loses about 20% of its volume, so the loose volume to order is larger than the compacted volume.",
    workedLine: `${fmt(areaFt2)} ft² × ${fmt(100 + req(v, "waste"), 0)}% ÷ ${fmt(r.paverAreaFt2, 3)} ft² per paver = ${r.pavers} pavers; base ${fmt(areaFt2)} × ${fmt(req(v, "baseDepth"), 0)} in ÷ 27 = ${fmt(r.baseCompactedYd3)} yd³ compacted → ${fmt(r.baseLooseYd3)} yd³ loose.`,
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  { id: "paverLength", label: "Paver length", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", defaultImp: "12", defaultMet: "30.5", allowUnitSelect: true, unitOptions: ["in", "cm", "mm"] },
  { id: "paverWidth", label: "Paver width", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", defaultImp: "12", defaultMet: "30.5", allowUnitSelect: true, unitOptions: ["in", "cm", "mm"] },
  { id: "joint", label: "Joint width", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", min: 0, defaultImp: "0.125", defaultMet: "0.32", hint: "1/8 in (0.125 in) is typical. 0 in for pavers with spacer bars." },
  { id: "paverThickness", label: "Paver thickness", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", defaultImp: "2.375", defaultMet: "6.03", hint: "2⅜ in (60 mm) is the standard patio paver; driveways use 3⅛ in (80 mm)." },
  { id: "waste", label: "Waste allowance", kind: "percent", defaultImp: "10", defaultMet: "10", hint: "10% for a straight lay; 12–15% for herringbone or diagonal patterns." },
  {
    id: "baseDepth",
    label: "Base depth, compacted (in)",
    kind: "number",
    defaultImp: "4",
    defaultMet: "4",
    min: 0,
    hint: "ICPI: 4 in for a patio or walkway, 8 in for a residential driveway. Add 2 in in frost or on clay soil.",
  },
  {
    id: "baseDensity",
    label: "Base gravel density (lb per yd³)",
    kind: "number",
    defaultImp: "2800",
    defaultMet: "2800",
    min: 1,
    hint: "2,800 lb/yd³ is the usual figure for crushed stone (range about 2,400–3,000). Your supplier's ticket wins.",
  },
  { id: "beddingSandDepth", label: "Bedding sand depth (in)", kind: "number", defaultImp: "1", defaultMet: "1", min: 0, hint: "Bedding sand is exactly 1 in — deeper ruts under load. About 2,750 lb/yd³ dry." },
  {
    id: "jointSandDensity",
    label: "Joint sand density (lb per ft³)",
    kind: "number",
    defaultImp: "100",
    defaultMet: "100",
    min: 1,
    hint: "About 100 lb/ft³ for polymeric sand, so a 50 lb bag is about 0.5 ft³.",
  },
  { id: "jointSandBag", label: "Joint sand bag weight (lb)", kind: "number", defaultImp: "50", defaultMet: "50", min: 1, hint: "Polymeric sand is usually sold in 50 lb bags." },
  { id: "pricePerPaver", label: "Price per paver (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
  { id: "pricePerYd3Base", label: "Price per yd³ of base gravel (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
  { id: "pricePerJointSandBag", label: "Price per bag of joint sand (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
];

export const paverConfig: CalculatorConfig = {
  slug: "paver-calculator",
  diagram: "area",
  defaultMode: "dimensions",
  formula:
    "Pavers = area × (1 + waste%) ÷ area per paver, rounded up. " +
    "Area per paver includes the joint: (length + joint) × (width + joint). " +
    `Base gravel (compacted) = area × base depth ÷ 27; order ${BASE_COMPACTION_FACTOR}× that loose volume, ` +
    "because crushed stone loses about 20% of its volume to compaction. " +
    "Bedding sand is a 1 in layer: area × 1/12 ft³. Joint sand is computed " +
    "from the actual joint volume (paver size, joint width, paver thickness), " +
    "not a flat coverage rule — a 50 lb bag covers far less area with small pavers.",
  howTo: [
    "Measure the patio or walkway area in feet. For a rectangle, length × width; for an L-shape, split it into rectangles and add them.",
    "Measure one paver in inches and note the joint width you plan to use — 1/8 in is typical, and many pavers have spacer bars that set it for you.",
    "Choose the base depth: 4 in compacted for a patio or walkway, 8 in for a driveway that carries cars. Add 2 in in frost climates or on clay soil.",
    "Remember the base extends at least 6 in past the paver edge on every side, and the bedding sand layer is exactly 1 in — deeper bedding ruts under load.",
  ],
  workedExample:
    "A 16 × 12 ft patio (192 ft²) of 12 × 12 in pavers with ⅛ in joints and 10% waste: " +
    "207 pavers. The base is 2.37 yd³ compacted at 4 in — order 2.96 yd³ loose (about 3.32 tons). " +
    "Bedding sand is 16 ft³ (0.59 yd³, about 0.81 tons). Joint sand is about 78 lb — 2 bags of 50 lb.",
  limitations: [
    "Assumes a rectangular paved area on reasonably level ground. Slopes, steps, and curves need their own measurements and more waste.",
    "Base depths follow ICPI guidance for typical residential work — weak or wet subgrade, heavy vehicles, and local frost depth can all require more. Check local practice.",
    "Joint sand is estimated from the geometric joint volume at the density you enter. The coverage printed on your polymeric sand bag, for your paver size, is the final word.",
    "Edge restraint, landscape fabric, and excavation/disposal are not included — count edge restraint by the perimeter.",
  ],
  faqs: [
    {
      question: "How deep should the gravel base be under pavers?",
      answer:
        "4 inches compacted for a patio or walkway, and 8 inches for a residential driveway, per ICPI Tech Spec 2. Add 2 inches in frost climates or on clay soil. These are compacted depths — the finished thickness after the plate compactor — so you need to order about 25% more loose gravel than the compacted volume.",
    },
    {
      question: "How thick is the sand under pavers?",
      answer:
        "Exactly 1 inch of coarse, washed concrete sand (ASTM C33), screeded smooth and left uncompacted until the pavers are vibrated into it. Deeper bedding ruts under load; thinner bedding leaves pavers rocking. Do not use masonry sand or stone dust for bedding.",
    },
    {
      question: "How much polymeric sand do I need?",
      answer:
        "It depends on paver size and joint width, not just area — small pavers have far more joint per square foot. For 12 × 12 in pavers with ⅛ in joints, a 50 lb bag covers roughly 190 sq ft; for 4 × 8 in pavers at the same joint width, only about 90 sq ft. This calculator works it out from the joint volume.",
    },
  ],
  modes: [
    {
      id: "dimensions",
      label: "Patio dimensions",
      fields: [
        { id: "length", label: "Length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "16", defaultMet: "4.88" },
        { id: "width", label: "Width", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "12", defaultMet: "3.66" },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) =>
        paverOutput(req(v, "length") * req(v, "width"), v, present),
    },
    {
      id: "area",
      label: "Known area",
      fields: [
        { id: "area", label: "Area to pave", kind: "area", unitKind: "area", impUnit: "ft2", metUnit: "m2", defaultImp: "192", defaultMet: "17.84" },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => paverOutput(req(v, "area"), v, present),
    },
  ],
};
