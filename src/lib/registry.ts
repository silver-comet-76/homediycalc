/**
 * Centralized calculator registry — the single source of truth for the 25
 * calculators on HomeDIYCalc.
 *
 * Every calculator is registered exactly once here. Home, All Calculators,
 * category pages, the sitemap, breadcrumbs, and "related calculators" are
 * all generated from this registry. Never hard-code a calculator list in a
 * page. Adding a calculator = registry entry + formula module + tests +
 * React island + Astro page (see AGENTS.md).
 *
 * Priority: P0 ships in Phase 2, P1 in Phase 3, P2 in Phase 4. All 25
 * calculators are shipped; the registry records their live URLs and
 * SEO metadata.
 */

export type Priority = "P0" | "P1" | "P2";

export type CategorySlug =
  | "concrete-and-masonry"
  | "painting"
  | "flooring-and-tiles"
  | "landscaping"
  | "measurement"
  | "interior-and-maintenance";

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  url: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export interface CalculatorMeta {
  slug: string;
  name: string;
  category: CategorySlug;
  priority: Priority;
  /** Live URL: /calculators/<slug>/ — P0 from Phase 2, P1 from Phase 3, P2 from Phase 4. */
  url: string;
  /** Phase in which this calculator ships. */
  phase: 2 | 3 | 4;
  seoTitle: string;
  seoDescription: string;
  /** Slugs of related calculators, used for cross-linking. */
  related: string[];
  /** One-sentence plain-language summary of what the calculator does. */
  summary: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "concrete-and-masonry",
    name: "Concrete and Masonry",
    url: "/categories/concrete-and-masonry/",
    description:
      "Concrete, slabs, bricks, bags, and mortar — work out the volume you need and how many bags or bricks to buy.",
    seoTitle: "Concrete and Masonry Calculators | HomeDIYCalc",
    seoDescription:
      "Free concrete, slab, brick, concrete bag, and mortar calculators. Work out volumes and bag counts before you buy.",
  },
  {
    slug: "painting",
    name: "Painting",
    url: "/categories/painting/",
    description:
      "Paint and primer — work out how many gallons you need for walls, ceilings, and rooms, coats included.",
    seoTitle: "Painting Calculators | HomeDIYCalc",
    seoDescription:
      "Free paint and primer calculators. Work out how many gallons you need for any room, including coats and waste.",
  },
  {
    slug: "flooring-and-tiles",
    name: "Flooring and Tiles",
    url: "/categories/flooring-and-tiles/",
    description:
      "Tile, flooring, grout, and adhesive — work out coverage, boxes, and bags so you order enough the first time.",
    seoTitle: "Flooring and Tile Calculators | HomeDIYCalc",
    seoDescription:
      "Free tile, flooring, grout, and tile adhesive calculators. Work out boxes, coverage, and waste before you order.",
  },
  {
    slug: "landscaping",
    name: "Landscaping",
    url: "/categories/landscaping/",
    description:
      "Gravel, mulch, pavers, and topsoil — work out cubic yards and weight for driveways, beds, and patios.",
    seoTitle: "Landscaping Calculators | HomeDIYCalc",
    seoDescription:
      "Free gravel, mulch, paver, and topsoil calculators. Work out cubic yards and tons for your yard project.",
  },
  {
    slug: "measurement",
    name: "Measurement",
    url: "/categories/measurement/",
    description:
      "Square footage, cubic yards, cubic feet, and board feet — the basic measurements every other calculator builds on.",
    seoTitle: "Measurement Calculators | HomeDIYCalc",
    seoDescription:
      "Free square footage, cubic yard, cubic feet, and board foot calculators. Measure any space or volume accurately.",
  },
  {
    slug: "interior-and-maintenance",
    name: "Interior and Maintenance",
    url: "/categories/interior-and-maintenance/",
    description:
      "Drywall, ceiling tiles, wallpaper, sealant, waterproofing, and baseboards — the finishing and upkeep jobs.",
    seoTitle: "Interior and Maintenance Calculators | HomeDIYCalc",
    seoDescription:
      "Free drywall, ceiling tile, wallpaper, sealant, waterproofing, and baseboard calculators for interior projects.",
  },
];

export const CALCULATORS: CalculatorMeta[] = [
  // ---- P0 (Phase 2) ----
  {
    slug: "concrete-calculator",
    name: "Concrete Calculator",
    category: "concrete-and-masonry",
    priority: "P0",
    url: "/calculators/concrete-calculator/",
    phase: 2,
    seoTitle: "Concrete Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much concrete you need in cubic yards, cubic feet, and bags. Enter length, width, and depth — get an exact order amount.",
    related: ["concrete-slab-calculator", "concrete-bags-calculator", "cubic-yard-calculator"],
    summary:
      "Works out concrete volume in cubic yards, cubic feet, and bags from length, width, and depth.",
  },
  {
    slug: "square-footage-calculator",
    name: "Square Footage Calculator",
    category: "measurement",
    priority: "P0",
    url: "/calculators/square-footage-calculator/",
    phase: 2,
    seoTitle: "Square Footage Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate the square footage of any room or area. Rectangle, circle, and triangle shapes, in square feet and square meters.",
    related: ["cubic-feet-calculator", "flooring-calculator", "tile-calculator"],
    summary: "Works out the area of a room or space in square feet and square meters.",
  },
  {
    slug: "paint-calculator",
    name: "Paint Calculator",
    category: "painting",
    priority: "P0",
    url: "/calculators/paint-calculator/",
    phase: 2,
    seoTitle: "Paint Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much paint you need in gallons. Enter wall area and coats — get gallons, quarts, and a shopping list.",
    related: ["primer-calculator", "square-footage-calculator", "wallpaper-calculator"],
    summary:
      "Works out how many gallons of paint a room needs, based on area, coats, and coverage.",
  },
  {
    slug: "gravel-calculator",
    name: "Gravel Calculator",
    category: "landscaping",
    priority: "P0",
    url: "/calculators/gravel-calculator/",
    phase: 2,
    seoTitle: "Gravel Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much gravel you need in cubic yards and tons. Enter area and depth — get an order amount for driveways and paths.",
    related: ["topsoil-calculator", "mulch-calculator", "cubic-yard-calculator"],
    summary: "Works out gravel volume in cubic yards and weight in tons from area and depth.",
  },
  {
    slug: "mulch-calculator",
    name: "Mulch Calculator",
    category: "landscaping",
    priority: "P0",
    url: "/calculators/mulch-calculator/",
    phase: 2,
    seoTitle: "Mulch Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much mulch you need in cubic yards and bags. Enter bed area and depth — get an exact amount for your garden.",
    related: ["gravel-calculator", "topsoil-calculator", "square-footage-calculator"],
    summary: "Works out mulch volume in cubic yards and bags from bed area and depth.",
  },
  {
    slug: "concrete-slab-calculator",
    name: "Concrete Slab Calculator",
    category: "concrete-and-masonry",
    priority: "P0",
    url: "/calculators/concrete-slab-calculator/",
    phase: 2,
    seoTitle: "Concrete Slab Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate concrete for a slab, patio, or driveway. Enter dimensions and thickness — get cubic yards and bag counts.",
    related: ["concrete-calculator", "concrete-bags-calculator", "gravel-calculator"],
    summary: "Works out concrete volume and bag counts for slabs, patios, and driveways.",
  },
  {
    slug: "cubic-yard-calculator",
    name: "Cubic Yard Calculator",
    category: "measurement",
    priority: "P0",
    url: "/calculators/cubic-yard-calculator/",
    phase: 2,
    seoTitle: "Cubic Yard Calculator | HomeDIYCalc",
    seoDescription:
      "Convert cubic feet to cubic yards and back, or calculate volume from dimensions. Free, instant, and exact.",
    related: ["cubic-feet-calculator", "concrete-calculator", "gravel-calculator"],
    summary:
      "Converts between cubic feet, cubic yards, and cubic meters, or calculates volume from dimensions.",
  },
  {
    slug: "cubic-feet-calculator",
    name: "Cubic Feet Calculator",
    category: "measurement",
    priority: "P0",
    url: "/calculators/cubic-feet-calculator/",
    phase: 2,
    seoTitle: "Cubic Feet Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate volume in cubic feet from length, width, and height. Convert to cubic yards and cubic meters too.",
    related: ["cubic-yard-calculator", "square-footage-calculator", "board-foot-calculator"],
    summary:
      "Works out volume in cubic feet from dimensions, with conversion to cubic yards and cubic meters.",
  },
  {
    slug: "tile-calculator",
    name: "Tile Calculator",
    category: "flooring-and-tiles",
    priority: "P0",
    url: "/calculators/tile-calculator/",
    phase: 2,
    seoTitle: "Tile Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many tiles and boxes you need for a floor or wall. Enter area and tile size — get counts with waste included.",
    related: ["flooring-calculator", "grout-calculator", "tile-adhesive-calculator"],
    summary:
      "Works out tile and box counts from area and tile size, with waste allowance included.",
  },
  {
    slug: "brick-calculator",
    name: "Brick Calculator",
    category: "concrete-and-masonry",
    priority: "P0",
    url: "/calculators/brick-calculator/",
    phase: 2,
    seoTitle: "Brick Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many bricks you need for a wall. Enter wall area and brick size — get a count with mortar joints included.",
    related: ["mortar-calculator", "concrete-calculator", "square-footage-calculator"],
    summary:
      "Works out brick counts for a wall from wall area, brick size, and mortar joint width.",
  },
  // ---- P1 (Phase 3) ----
  {
    slug: "drywall-calculator",
    name: "Drywall Calculator",
    category: "interior-and-maintenance",
    priority: "P1",
    url: "/calculators/drywall-calculator/",
    phase: 3,
    seoTitle: "Drywall Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many drywall sheets you need for walls and ceilings. Enter area — get sheet counts and joint compound estimates.",
    related: ["square-footage-calculator", "ceiling-tile-calculator", "paint-calculator"],
    summary:
      "Works out drywall sheet counts for walls and ceilings, plus joint compound and tape estimates.",
  },
  {
    slug: "concrete-bags-calculator",
    name: "Concrete Bags Calculator",
    category: "concrete-and-masonry",
    priority: "P1",
    url: "/calculators/concrete-bags-calculator/",
    phase: 3,
    seoTitle: "Concrete Bags Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many bags of concrete you need. Enter volume — get bag counts for 40, 60, and 80 lb bags.",
    related: ["concrete-calculator", "concrete-slab-calculator", "mortar-calculator"],
    summary: "Works out bag counts for 40, 60, and 80 lb concrete bags from a target volume.",
  },
  {
    slug: "flooring-calculator",
    name: "Flooring Calculator",
    category: "flooring-and-tiles",
    priority: "P1",
    url: "/calculators/flooring-calculator/",
    phase: 3,
    seoTitle: "Flooring Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many boxes of flooring you need. Enter room area and box coverage — get boxes and planks with waste included.",
    related: ["tile-calculator", "square-footage-calculator", "baseboard-calculator"],
    summary: "Works out flooring box and plank counts from room area and box coverage.",
  },
  {
    slug: "paver-calculator",
    name: "Paver Calculator",
    category: "landscaping",
    priority: "P1",
    url: "/calculators/paver-calculator/",
    phase: 3,
    seoTitle: "Paver Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many pavers you need for a patio or walkway. Enter area and paver size — get counts with waste included.",
    related: ["tile-calculator", "gravel-calculator", "topsoil-calculator"],
    summary: "Works out paver counts for patios and walkways from area and paver size.",
  },
  {
    slug: "topsoil-calculator",
    name: "Topsoil Calculator",
    category: "landscaping",
    priority: "P1",
    url: "/calculators/topsoil-calculator/",
    phase: 3,
    seoTitle: "Topsoil Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much topsoil you need in cubic yards and tons. Enter area and depth — get an order amount for lawns and beds.",
    related: ["gravel-calculator", "mulch-calculator", "cubic-yard-calculator"],
    summary: "Works out topsoil volume in cubic yards and weight in tons from area and depth.",
  },
  {
    slug: "grout-calculator",
    name: "Grout Calculator",
    category: "flooring-and-tiles",
    priority: "P1",
    url: "/calculators/grout-calculator/",
    phase: 3,
    seoTitle: "Grout Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much grout you need. Enter tile area, tile size, and joint width — get grout weight and bag counts.",
    related: ["tile-calculator", "tile-adhesive-calculator", "flooring-calculator"],
    summary: "Works out grout weight and bag counts from tile area, tile size, and joint width.",
  },
  {
    slug: "board-foot-calculator",
    name: "Board Foot Calculator",
    category: "measurement",
    priority: "P1",
    url: "/calculators/board-foot-calculator/",
    phase: 3,
    seoTitle: "Board Foot Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate board feet for lumber. Enter thickness, width, and length — get board feet and an optional cost estimate.",
    related: ["cubic-feet-calculator", "square-footage-calculator", "flooring-calculator"],
    summary: "Works out board feet for lumber from thickness, width, and length.",
  },
  {
    slug: "mortar-calculator",
    name: "Mortar Calculator",
    category: "concrete-and-masonry",
    priority: "P1",
    url: "/calculators/mortar-calculator/",
    phase: 3,
    seoTitle: "Mortar Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much mortar you need for brick or block walls. Enter wall area — get mortar volume and bag counts.",
    related: ["brick-calculator", "concrete-bags-calculator", "concrete-calculator"],
    summary: "Works out mortar volume and bag counts for brick and block walls.",
  },
  // ---- P2 (Phase 3) ----
  {
    slug: "ceiling-tile-calculator",
    name: "Ceiling Tile Calculator",
    category: "interior-and-maintenance",
    priority: "P2",
    url: "/calculators/ceiling-tile-calculator/",
    phase: 4,
    seoTitle: "Ceiling Tile Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many ceiling tiles you need. Enter ceiling area and tile size — get tile and grid counts with waste included.",
    related: ["drywall-calculator", "tile-calculator", "square-footage-calculator"],
    summary: "Works out ceiling tile counts from ceiling area and tile size.",
  },
  {
    slug: "tile-adhesive-calculator",
    name: "Tile Adhesive Calculator",
    category: "flooring-and-tiles",
    priority: "P2",
    url: "/calculators/tile-adhesive-calculator/",
    phase: 4,
    seoTitle: "Tile Adhesive Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many bags of tile adhesive you need. Enter area and coverage per bag — get bag counts.",
    related: ["tile-calculator", "grout-calculator", "flooring-calculator"],
    summary: "Works out tile adhesive bag counts from area and coverage per bag.",
  },
  {
    slug: "primer-calculator",
    name: "Primer Calculator",
    category: "painting",
    priority: "P2",
    url: "/calculators/primer-calculator/",
    phase: 4,
    seoTitle: "Primer Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much primer you need in gallons. Enter area and coats — get gallons with coverage you can adjust.",
    related: ["paint-calculator", "square-footage-calculator", "drywall-calculator"],
    summary: "Works out primer gallons from area, coats, and coverage.",
  },
  {
    slug: "wallpaper-calculator",
    name: "Wallpaper Calculator",
    category: "interior-and-maintenance",
    priority: "P2",
    url: "/calculators/wallpaper-calculator/",
    phase: 4,
    seoTitle: "Wallpaper Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many rolls of wallpaper you need. Enter wall area and roll coverage — get roll counts with pattern repeat.",
    related: ["paint-calculator", "square-footage-calculator", "primer-calculator"],
    summary: "Works out wallpaper roll counts from wall area, roll coverage, and pattern repeat.",
  },
  {
    slug: "sealant-calculator",
    name: "Sealant Calculator",
    category: "interior-and-maintenance",
    priority: "P2",
    url: "/calculators/sealant-calculator/",
    phase: 4,
    seoTitle: "Sealant Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how many tubes of sealant you need. Enter joint length and bead size — get tube counts for caulk and sealant.",
    related: ["waterproofing-calculator", "tile-calculator", "baseboard-calculator"],
    summary: "Works out sealant tube counts from joint length and bead size.",
  },
  {
    slug: "waterproofing-calculator",
    name: "Waterproofing Calculator",
    category: "interior-and-maintenance",
    priority: "P2",
    url: "/calculators/waterproofing-calculator/",
    phase: 4,
    seoTitle: "Waterproofing Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much waterproofing membrane you need. Enter area and coats — get gallons or liters with coverage you can adjust.",
    related: ["sealant-calculator", "paint-calculator", "tile-calculator"],
    summary: "Works out waterproofing gallons or liters from area, coats, and coverage.",
  },
  {
    slug: "baseboard-calculator",
    name: "Baseboard Calculator",
    category: "interior-and-maintenance",
    priority: "P2",
    url: "/calculators/baseboard-calculator/",
    phase: 4,
    seoTitle: "Baseboard Calculator | HomeDIYCalc",
    seoDescription:
      "Calculate how much baseboard you need. Enter wall length minus openings — get linear feet and piece counts with waste.",
    related: ["flooring-calculator", "drywall-calculator", "sealant-calculator"],
    summary: "Works out baseboard linear feet and piece counts from wall length and openings.",
  },
];

/** Look up a calculator by slug. Returns undefined for unknown slugs. */
export function getCalculator(slug: string): CalculatorMeta | undefined {
  return CALCULATORS.find((calc) => calc.slug === slug);
}

/** Look up a category by slug. Returns undefined for unknown slugs. */
export function getCategory(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}

/** All calculators in one category, in registry order. */
export function getCalculatorsByCategory(category: CategorySlug): CalculatorMeta[] {
  return CALCULATORS.filter((calc) => calc.category === category);
}

/** All calculators at one priority level. */
export function getCalculatorsByPriority(priority: Priority): CalculatorMeta[] {
  return CALCULATORS.filter((calc) => calc.priority === priority);
}

/** Related calculators for a registry entry, resolved to full entries. */
export function getRelatedCalculators(calc: CalculatorMeta): CalculatorMeta[] {
  return calc.related
    .map((slug) => getCalculator(slug))
    .filter((entry): entry is CalculatorMeta => entry !== undefined);
}
