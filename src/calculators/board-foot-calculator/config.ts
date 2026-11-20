/**
 * Board Foot Calculator config — board feet for lumber, with piece
 * count and optional cost. A pure measurement calculator (like the
 * Cubic Feet Calculator): the waste allowance covers cutting waste.
 * See src/lib/formulas/board-foot.ts and docs/FORMULAS.md §17.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateBoardFoot } from "../../lib/formulas/board-foot";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const boardFootConfig: CalculatorConfig = {
  slug: "board-foot-calculator",
  diagram: "board",
  defaultMode: "single",
  formula:
    "Board feet = thickness (in) × width (in) × length (ft) ÷ 12. " +
    "One board foot is the volume of a board 1 ft × 1 ft × 1 in " +
    "(144 in³, or 1/12 ft³). Total = board feet per piece × pieces × " +
    "(1 + waste%). For planed softwood lumber, use the nominal dimensions " +
    "— a '2×4' counts as 2 in × 4 in, not its smaller dressed size. " +
    "For rough hardwood, use the actual (rough) thickness.",
  howTo: [
    "Measure the board's thickness and width in inches, and its length in feet. The standard order is thickness × width × length.",
    "For planed softwood from a lumber yard, use the nominal size — a 2×4 is sold as 2 in × 4 in even though it actually measures 1½ in × 3½ in. Board footage is charged on the nominal size.",
    "For rough hardwood, use the actual rough thickness (a 4/4 board is 1 in, 8/4 is 2 in) and the actual width.",
    "Enter how many identical pieces you need, and add a cutting-waste allowance — 5% is a good default for straight cuts.",
  ],
  workedExample:
    "One 2 × 6 board, 8 ft long: 2 × 6 × 8 ÷ 12 = 8 board feet. " +
    "Ten boards are 80 board feet; with 5% cutting waste that is 84 board feet " +
    "(7 ft³). At $2.50 per board foot, the cost is $210.",
  limitations: [
    "This is the standard board-foot formula for rectangular lumber. It does not apply to logs, which are measured with log rules (Doyle, Scribner, or International) that estimate sawn yield, not volume.",
    "Nominal vs. actual matters: using dressed (actual) dimensions for softwood understates the board footage your supplier charges for. When in doubt, ask the supplier which dimensions they bill on.",
    "Hardwood grading has its own rules (NHLA): surface measure is rounded to the nearest foot, and thicknesses under 1 in count as 1 in. This calculator uses the plain volume formula, which is what most small buyers need.",
    "Does not account for defects, knots, or wane — inspect boards before buying, and add waste for culling bad pieces.",
  ],
  faqs: [
    {
      question: "What is a board foot?",
      answer:
        "A board foot is a unit of lumber volume: a piece 1 foot long, 1 foot wide, and 1 inch thick — 144 cubic inches. Any volume equivalent is also a board foot, so a 2 inch thick board that is 1 foot by 6 inches is one board foot too. Lumber is usually priced per board foot.",
    },
    {
      question: "How do you calculate board feet?",
      answer:
        "Multiply thickness in inches × width in inches × length in feet, then divide by 12. A 2 × 6 × 8 ft board is 2 × 6 × 8 ÷ 12 = 8 board feet. If all three dimensions are in inches, divide by 144 instead.",
    },
    {
      question: "Do I use nominal or actual dimensions for a 2×4?",
      answer:
        "Nominal. A 2×4 is sold and billed as 2 in × 4 in, even though it actually measures 1½ in × 3½ in after planing. A 2×4×8 ft board is 5.33 board feet on the nominal count. For rough hardwood, use the actual rough thickness instead.",
    },
    {
      question: "How many board feet are in a cubic foot?",
      answer:
        "12 board feet. One board foot is 1/12 of a cubic foot, so multiply cubic feet by 12 to get board feet — or divide board feet by 12 to get cubic feet.",
    },
  ],
  modes: [
    {
      id: "single",
      label: "Board size and count",
      fields: [
        { id: "thickness", label: "Thickness", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", defaultImp: "2", defaultMet: "5.08", allowUnitSelect: true, unitOptions: ["in", "cm", "mm"], hint: "Nominal thickness for softwood (a 2×4 counts as 2 in); rough thickness for hardwood." },
        { id: "width", label: "Width", kind: "length", unitKind: "length", canonicalUnit: "in", impUnit: "in", metUnit: "cm", defaultImp: "6", defaultMet: "15.24", allowUnitSelect: true, unitOptions: ["in", "cm", "mm"] },
        { id: "length", label: "Length", kind: "length", unitKind: "length", canonicalUnit: "ft", impUnit: "ft", metUnit: "m", defaultImp: "8", defaultMet: "2.44" },
        { id: "pieces", label: "Number of pieces", kind: "count", defaultImp: "10", defaultMet: "10", min: 0 },
        { id: "waste", label: "Cutting waste allowance", kind: "percent", defaultImp: "5", defaultMet: "5", hint: "5% is a good default for straight cuts; more for culling defects or angled cuts." },
        { id: "pricePerBoardFoot", label: "Price per board foot (optional)", kind: "price", defaultImp: "", defaultMet: "", optional: true },
      ],
      compute: (v, present) => {
        const r = calculateBoardFoot({
          thicknessIn: req(v, "thickness"),
          widthIn: req(v, "width"),
          lengthFt: req(v, "length"),
          pieces: req(v, "pieces"),
          wastePct: req(v, "waste"),
          pricePerBoardFoot: present.has("pricePerBoardFoot")
            ? req(v, "pricePerBoardFoot")
            : undefined,
        });
        return {
          rows: [
            {
              label: "Board feet per piece",
              value: `${fmt(r.boardFeetPerPiece)} bf`,
              detail: `${fmt(req(v, "thickness"), 2)} × ${fmt(req(v, "width"), 2)} in × ${fmt(req(v, "length"), 2)} ft`,
            },
            {
              label: "Total board feet",
              value: `${fmt(r.boardFeetTotal)} bf`,
              detail: `${fmt(req(v, "pieces"), 0)} pieces with ${fmt(req(v, "waste"), 0)}% cutting waste`,
            },
            {
              label: "Volume",
              value: `${fmt(r.volumeFt3)} ft³`,
              detail: "1 board foot = 1/12 ft³",
            },
          ],
          lines: [
            `Lumber (${fmt(req(v, "thickness"), 2)} × ${fmt(req(v, "width"), 2)} in × ${fmt(req(v, "length"), 2)} ft, ${fmt(req(v, "pieces"), 0)} pieces): ${fmt(r.boardFeetTotal)} board feet`,
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "thickness"), 2)} × ${fmt(req(v, "width"), 2)} × ${fmt(req(v, "length"), 2)} ÷ 12 = ${fmt(r.boardFeetPerPiece)} bf per piece; ${fmt(req(v, "pieces"), 0)} pieces × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.boardFeetTotal)} bf.`,
        };
      },
    },
  ],
};
