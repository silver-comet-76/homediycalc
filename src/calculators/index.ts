/**
 * Per-calculator configs, keyed by slug. The dynamic calculator route
 * (src/pages/calculators/[slug].astro) renders the config for the
 * requested slug; P2 configs do not exist yet, so those URLs 404
 * until a later phase — no unshipped page is ever linked or listed.
 */

import type { CalculatorConfig } from "../components/react/CalculatorConfig";
import { concreteConfig } from "./concrete-calculator/config";
import { squareFootageConfig } from "./square-footage-calculator/config";
import { paintConfig } from "./paint-calculator/config";
import { gravelConfig } from "./gravel-calculator/config";
import { mulchConfig } from "./mulch-calculator/config";
import { concreteSlabConfig } from "./concrete-slab-calculator/config";
import { cubicYardConfig } from "./cubic-yard-calculator/config";
import { cubicFeetConfig } from "./cubic-feet-calculator/config";
import { tileConfig } from "./tile-calculator/config";
import { brickConfig } from "./brick-calculator/config";
import { drywallConfig } from "./drywall-calculator/config";
import { concreteBagsConfig } from "./concrete-bags-calculator/config";
import { flooringConfig } from "./flooring-calculator/config";
import { paverConfig } from "./paver-calculator/config";
import { topsoilConfig } from "./topsoil-calculator/config";
import { groutConfig } from "./grout-calculator/config";
import { boardFootConfig } from "./board-foot-calculator/config";
import { mortarConfig } from "./mortar-calculator/config";
import { ceilingTileConfig } from "./ceiling-tile-calculator/config";
import { tileAdhesiveConfig } from "./tile-adhesive-calculator/config";
import { primerConfig } from "./primer-calculator/config";
import { wallpaperConfig } from "./wallpaper-calculator/config";
import { sealantConfig } from "./sealant-calculator/config";
import { waterproofingConfig } from "./waterproofing-calculator/config";
import { baseboardConfig } from "./baseboard-calculator/config";

export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  "concrete-calculator": concreteConfig,
  "square-footage-calculator": squareFootageConfig,
  "paint-calculator": paintConfig,
  "gravel-calculator": gravelConfig,
  "mulch-calculator": mulchConfig,
  "concrete-slab-calculator": concreteSlabConfig,
  "cubic-yard-calculator": cubicYardConfig,
  "cubic-feet-calculator": cubicFeetConfig,
  "tile-calculator": tileConfig,
  "brick-calculator": brickConfig,
  "drywall-calculator": drywallConfig,
  "concrete-bags-calculator": concreteBagsConfig,
  "flooring-calculator": flooringConfig,
  "paver-calculator": paverConfig,
  "topsoil-calculator": topsoilConfig,
  "grout-calculator": groutConfig,
  "board-foot-calculator": boardFootConfig,
  "mortar-calculator": mortarConfig,
  "ceiling-tile-calculator": ceilingTileConfig,
  "tile-adhesive-calculator": tileAdhesiveConfig,
  "primer-calculator": primerConfig,
  "wallpaper-calculator": wallpaperConfig,
  "sealant-calculator": sealantConfig,
  "waterproofing-calculator": waterproofingConfig,
  "baseboard-calculator": baseboardConfig,
};

/** Slugs of the calculators shipped in Phases 2 (P0), 3 (P1), and 4 (P2). */
export const SHIPPED_CALCULATOR_SLUGS = Object.keys(CALCULATOR_CONFIGS);

export function getCalculatorConfig(slug: string): CalculatorConfig | undefined {
  return CALCULATOR_CONFIGS[slug];
}
