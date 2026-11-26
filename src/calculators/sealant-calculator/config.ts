/**
 * Sealant Calculator config — tubes of caulk/sealant for a joint.
 * See src/lib/formulas/sealant.ts and docs/FORMULAS.md §23.
 */

import type { CalculatorConfig } from "../../components/react/CalculatorConfig";
import { req } from "../../components/react/CalculatorConfig";
import { calculateSealant } from "../../lib/formulas/sealant";
import { formatNumber } from "../../lib/validation";

const fmt = (n: number, d = 2) => formatNumber(n, d);

export const sealantConfig: CalculatorConfig = {
  slug: "sealant-calculator",
  designCplus: true,
  heroResultLabel: "Tubes to buy",
  lookupTable: {
    note: "Assumes a ¼ × ¼ in bead, standard 10.1 fl oz tubes, and 10% waste.",
    headers: ["Joint length", "Sealant needed", "Coverage per tube", "Tubes to buy"],
    rows: [
      ["50 ft of joint", "22.9 fl oz", "24.3 ft/tube", "3 tubes"],
      ["100 ft of joint", "45.7 fl oz", "24.3 ft/tube", "5 tubes"],
      ["150 ft of joint", "68.6 fl oz", "24.3 ft/tube", "7 tubes"],
      ["200 ft of joint", "91.4 fl oz", "24.3 ft/tube", "10 tubes"],
      ["300 ft of joint", "137.1 fl oz", "24.3 ft/tube", "14 tubes"],
    ],
  },
  diagram: "joint",
  defaultMode: "joints",
  formula:
    "A bead is a volume: sealant = joint length × 12 × bead width × bead depth × (1 + waste%), then tubes = sealant ÷ tube volume, rounded up. " +
    "One US fluid ounce is 1.8047 in³, so a standard 10.1 fl oz cartridge holds 18.2 in³. At a 1/4 × 1/4 in bead that covers 24.3 linear feet per tube; " +
    "at 3/8 × 3/8 in it covers 10.8 ft, because the bead's cross-section is squared.",
  howTo: [
    "Measure every joint you are sealing and add the lengths together — around the tub, along the baseboards, around each window — in feet.",
    "Measure the bead you will lay: the width across the joint and the depth into it, in inches. A 1/4 × 1/4 in bead is the common interior size.",
    "For a joint that moves (around a tub, between different materials), the cured depth should be about half the width — a 1/2 in wide joint wants 1/4 in of sealant, with a practical minimum around 1/4 in.",
    "Check the tube size on what you buy. The standard cartridge is 10.1 fl oz; sausages run 20 fl oz and pails are larger still.",
    "Cut the nozzle small and tool the bead smooth. A bead mounded above the joint is waste the tooling removes — the rectangle in the calculation is the bead that stays.",
  ],
  workedExample:
    "100 linear feet of joint with a 1/4 × 1/4 in bead: the volume is 100 × 12 × 0.25 × 0.25 = 75 in³, or 41.6 fl oz. " +
    "With 10% waste that is 45.7 fl oz — 5 tubes of 10.1 fl oz. One tube covers 24.3 ft at this bead size.",
  limitations: [
    "Models the bead as a rectangle (width × depth). A rounded, tooled bead holds a little less; a bead mounded above the joint holds more but wastes it. The rectangle is the standard estimator's shape for a joint that is filled and tooled flush.",
    "Does not include backer rod. Joints deeper than 1/2 in should be packed with backer rod first, so the sealant depth stays near half the width — otherwise the sealant cures poorly and moves badly.",
    "Tube contents vary slightly by brand and product — 10.1 fl oz is the standard cartridge, but check the label. Silicone, polyurethane, and acrylic latex all come in the same size cartridges.",
    "Does not account for joints that need re-caulking because the old sealant was not removed. Old sealant must come out first; new sealant over old sealant does not bond.",
  ],
  faqs: [
    {
      question: "How many linear feet does one tube of caulk cover?",
      answer:
        "It depends entirely on the bead size. A standard 10.1 fl oz cartridge holds 18.2 cubic inches, so at a 1/4 × 1/4 in bead it covers about 24 linear feet; at 3/8 × 3/8 in about 11 feet; at 1/2 × 1/2 in only about 6 feet. Doubling the bead width roughly quarters the coverage, because the cross-section is squared.",
    },
    {
      question: "How much caulk do I need for a bathroom?",
      answer:
        "Measure the joints: around a standard tub is about 15–20 linear feet (two long sides and one short side, plus the wall corners). At a 1/4 in bead, 100 ft of joint needs 5 tubes with 10% waste — a single tub is usually 1 tube, with a second for mistakes. Add the baseboards and window trim separately; they add up fast.",
    },
    {
      question: "What is the difference between caulk and sealant?",
      answer:
        "Caulk is usually acrylic latex: paintable, easy to clean up with water, and best for interior trim gaps that do not move. Sealant usually means silicone or polyurethane: flexible, waterproof, and made for joints that move or get wet — around tubs, showers, and exterior joints. This calculator sizes both the same way; the bead volume is what matters.",
    },
    {
      question: "How deep should a bead of sealant be?",
      answer:
        "About half as deep as it is wide for a joint that moves — a 1/2 in wide joint wants 1/4 in of sealant — with a practical minimum around 1/4 in for bond and a maximum near 1/2 in. Deeper beads cure poorly and waste material the joint never uses. Pack deep joints with backer rod first.",
    },
    {
      question: "Is this the same as a caulk calculator?",
      answer:
        "Yes — in the US, sealant for gaps and joints is usually called caulk. This calculator works out how many tubes of caulk or sealant you need for a bead of a given length and size.",
    },
  ],
  modes: [
    {
      id: "joints",
      label: "Joint length and bead size",
      fields: [
        {
          id: "jointLength",
          label: "Total joint length",
          kind: "length",
          unitKind: "length",
          impUnit: "ft",
          metUnit: "m",
          defaultImp: "100",
          defaultMet: "30.48",
          hint: "Add up every joint you are sealing, in feet.",
        },
        {
          id: "beadWidth",
          label: "Bead width",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "0.25",
          defaultMet: "0.64",
          hint: "1/4 in (0.25 in) is the common interior bead. Wider beads cover far fewer feet per tube.",
        },
        {
          id: "beadDepth",
          label: "Bead depth",
          kind: "length",
          unitKind: "length",
          canonicalUnit: "in",
          impUnit: "in",
          metUnit: "cm",
          defaultImp: "0.25",
          defaultMet: "0.64",
          hint: "For a moving joint, about half the width, with a minimum around 1/4 in.",
        },
        {
          id: "tubeVolume",
          label: "Tube size (fl oz)",
          kind: "number",
          defaultImp: "10.1",
          defaultMet: "10.1",
          min: 1,
          hint: "Standard cartridge 10.1 fl oz (18.2 in³). Sausages are usually 20 fl oz.",
        },
        {
          id: "waste",
          label: "Waste allowance",
          kind: "percent",
          defaultImp: "10",
          defaultMet: "10",
          hint: "Covers the bead you cut off while learning the corners, plus what stays in the nozzle.",
        },
        {
          id: "pricePerTube",
          label: "Price per tube (optional)",
          kind: "price",
          defaultImp: "",
          defaultMet: "",
          optional: true,
        },
      ],
      compute: (v, present) => {
        const r = calculateSealant({
          jointLengthFt: req(v, "jointLength"),
          beadWidthIn: req(v, "beadWidth"),
          beadDepthIn: req(v, "beadDepth"),
          tubeVolumeFlOz: req(v, "tubeVolume"),
          wastePct: req(v, "waste"),
          pricePerTube: present.has("pricePerTube") ? req(v, "pricePerTube") : undefined,
        });
        return {
          rows: [
            {
              label: "Sealant needed",
              value: `${fmt(r.volumeFlOz, 1)} fl oz`,
              detail: `${fmt(r.volumeIn3, 1)} in³ with ${fmt(req(v, "waste"), 0)}% waste`,
            },
            {
              label: "Coverage per tube",
              value: `${fmt(r.coverageFtPerTube, 1)} ft/tube`,
              detail: `${fmt(req(v, "beadWidth"), 2)} × ${fmt(req(v, "beadDepth"), 2)} in bead, ${fmt(req(v, "tubeVolume"), 1)} fl oz tube`,
            },
            {
              label: "Tubes to buy",
              value: `${r.tubes} tubes`,
              detail: `${fmt(req(v, "tubeVolume"), 1)} fl oz tubes — rounded up`,
            },
          ],
          lines: [
            `Sealant (${fmt(req(v, "tubeVolume"), 1)} fl oz tubes): ${r.tubes} tubes (${fmt(r.volumeFlOz, 1)} fl oz)`,
          ],
          costUsd: r.costUsd,
          workedLine: `${fmt(req(v, "jointLength"))} ft × 12 × ${fmt(req(v, "beadWidth"), 2)} in × ${fmt(req(v, "beadDepth"), 2)} in × ${fmt(100 + req(v, "waste"), 0)}% = ${fmt(r.volumeFlOz, 1)} fl oz → ${r.tubes} tubes.`,
        };
      },
    },
  ],
};
