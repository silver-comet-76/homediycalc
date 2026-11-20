/**
 * Baseboard Calculator config — linear feet and stock pieces.
 * See src/lib/formulas/baseboard.ts and docs/FORMULAS.md §25.
 */

import type { CalculatorConfig, FieldSpec } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import {
  calculateBaseboard,
  roomNetLengthFt,
} from "../../lib/formulas/baseboard";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

function baseboardOutput(
  netLengthFt: number,
  v: Record<string, number>,
  present: Set<string>,
) {
  const r = calculateBaseboard({
    netLengthFt,
    pieceLengthFt: req(v, "pieceLength"),
    wastePct: req(v, "waste"),
    pricePerFt: present.has("pricePerFt") ? req(v, "pricePerFt") : undefined,
  });
  return {
    rows: [
      {
        label: "Net wall length",
        value: `${fmt(netLengthFt)} ft`,
        detail: "Wall length minus door openings",
      },
      {
        label: "Length with waste",
        value: `${fmt(r.adjustedFt)} ft`,
        detail: `${fmt(req(v, "waste"), 0)}% for miter cuts`,
      },
      {
        label: "Pieces to buy",
        value: `${r.pieces} pieces`,
        detail: `${fmt(req(v, "pieceLength"), 0)} ft stock — rounded up`,
      },
      {
        label: "Length purchased",
        value: `${fmt(r.purchasedFt)} ft`,
        detail: `${r.pieces} × ${fmt(req(v, "pieceLength"), 0)} ft — the offcuts are the difference`,
      },
    ],
    lines: [
      `Baseboard (${fmt(req(v, "pieceLength"), 0)} ft pieces): ${r.pieces} pieces (${fmt(r.purchasedFt)} ft)`,
      `Net wall length ${fmt(netLengthFt)} ft with ${fmt(req(v, "waste"), 0)}% miter waste`,
    ],
    costUsd: r.costUsd,
    workedLine: `${fmt(netLengthFt)} ft × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.adjustedFt)} ft ÷ ${fmt(req(v, "pieceLength"), 0)} ft = ${r.pieces} pieces (${fmt(r.purchasedFt)} ft purchased).`,
    note: "The purchased length is longer than the wall length — that is the offcut waste from cutting fixed-length sticks. A 14 ft wall from a 16 ft stick leaves a 2 ft offcut no other wall can use.",
  };
}

const COMMON_FIELDS: FieldSpec[] = [
  {
    id: "pieceLength",
    label: "Stock piece length",
    kind: "select",
    defaultImp: "8",
    defaultMet: "8",
    options: [
      { value: "8", label: "8 ft pieces — fit in a car, more joints" },
      { value: "12", label: "12 ft pieces — the common compromise" },
      { value: "16", label: "16 ft pieces — fewest joints, needs a truck" },
    ],
    hint: "Trim is stocked in 8, 12, and 16 ft lengths at most home centers; some suppliers also carry 10 and 14 ft. Longer pieces mean fewer seams on long walls.",
  },
  { id: "waste", label: "Waste allowance", kind: "percent", defaultImp: "10", defaultMet: "10", hint: "10% is the trade convention for a simple square room. Use 15–20% for alcoves, bay windows, or many outside corners." },
  { id: "pricePerFt", label: "Price per linear foot (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
];

export const baseboardConfig: CalculatorConfig = {
  slug: "baseboard-calculator",
  diagram: "linear",
  defaultMode: "room",
  formula:
    "Net length = room perimeter − door openings. Adjusted length = net length × (1 + waste%). " +
    "Pieces = adjusted length ÷ stock piece length, rounded up; purchased length = pieces × piece length. " +
    "Stock comes in 8, 12, and 16 ft lengths, and 10% is the usual miter-cut allowance for a simple square room (15–20% for rooms with alcoves or many outside corners).",
  howTo: [
    "Measure each wall at floor level, in feet, and add them up — or enter the room length and width and let the calculator take the perimeter.",
    "Subtract the doorways: baseboard does not run across a doorway threshold. A standard interior door is about 3 ft wide.",
    "Pick the stock length you can carry home: 8 ft fits in a car but needs a joint on any wall over 8 ft; 16 ft spans most walls in one piece but needs a truck or a roof rack.",
    "Cope the inside corners rather than mitering them — a coped joint stays tight when the wood shrinks. Miter the outside corners at 45°.",
    "Cut the longest walls first, then use the offcuts on the short walls and closets. One spare piece is cheap insurance against a bad cut.",
  ],
  workedExample:
    "A 12 × 12 ft room with one 3 ft door: the perimeter is 48 ft, minus the door is 45 ft net. " +
    "With 10% for miter cuts that is 49.5 ft — 7 pieces of 8 ft stock (56 ft purchased) or 5 pieces of 12 ft stock (60 ft purchased).",
  limitations: [
    "The waste allowance covers miter and scarf cuts, not a cut plan. Whether a wall fits a stick decides the real waste: a 14 ft wall from a 16 ft stick wastes 2 ft, and no percentage captures that. The purchased length shown next to the net length makes the difference visible.",
    "Assumes a rectangular room with square corners. Rooms with bump-outs, bays, pillars, or angled walls need to be measured wall by wall — use the Known wall length mode and add the runs up.",
    "Does not include shoe molding (quarter round), which runs the same length again if you are fitting it, or the nails, glue, and caulk.",
    "Door widths vary: measure your doors rather than trusting the 3 ft default if they are wider or double doors.",
  ],
  faqs: [
    {
      question: "How much baseboard do I need for a 12 × 12 room?",
      answer:
        "48 ft of perimeter, minus one 3 ft door, is 45 ft net. With 10% for miter cuts that is 49.5 ft — 7 pieces of 8 ft stock (56 ft purchased) or 5 pieces of 12 ft stock (60 ft purchased). The 12 ft pieces cost a little more material but leave fewer visible joints.",
    },
    {
      question: "How long are baseboard pieces?",
      answer:
        "Commonly 8, 12, or 16 feet at most home centers; some suppliers also carry 10 and 14 ft. Shorter stock fits in a car and wastes less on short walls, but any wall longer than the piece needs a scarf joint in the middle. Longer stock spans whole walls but is awkward to transport.",
    },
    {
      question: "How much extra baseboard should I buy for waste?",
      answer:
        "About 10% over the net perimeter for a simple square room — that covers the 45° miter cuts at the corners and the odd bad cut. Go to 15% or 20% for rooms with alcoves, bay windows, or many outside corners, which are harder to cut and waste more of each piece.",
    },
    {
      question: "Do I subtract doors when measuring for baseboard?",
      answer:
        "Yes. Baseboard does not run across a doorway threshold, so subtract each door's width — about 3 ft for a standard interior door. Closet openings count too if the baseboard stops at them.",
    },
  ],
  modes: [
    {
      id: "room",
      label: "Room dimensions",
      fields: [
        { id: "length", label: "Room length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "12", defaultMet: "3.66" },
        { id: "width", label: "Room width", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "12", defaultMet: "3.66" },
        { id: "doors", label: "Doors", kind: "count", defaultImp: "1", defaultMet: "1", min: 0, max: 50, hint: "Each door deducts the door width below — baseboard does not run across a threshold." },
        { id: "doorWidth", label: "Door width", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "3", defaultMet: "0.91", hint: "About 3 ft for a standard interior door. Measure yours if they are wider or double doors." },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => {
        const net = roomNetLengthFt(req(v, "length"), req(v, "width"), req(v, "doors"), req(v, "doorWidth"));
        return baseboardOutput(net, v, present);
      },
    },
    {
      id: "length",
      label: "Known wall length",
      fields: [
        { id: "wallLength", label: "Total wall length", kind: "length", unitKind: "length", impUnit: "ft", metUnit: "m", defaultImp: "45", defaultMet: "13.72", hint: "Wall length after subtracting door openings. Add up the runs wall by wall for irregular rooms." },
        ...COMMON_FIELDS,
      ],
      compute: (v, present) => baseboardOutput(req(v, "wallLength"), v, present),
    },
  ],
};
