# Formulas — HomeDIYCalc

> Status: Phase 5 — all 25 formulas (10 P0 validated by Vitest in Phase 2, 8 P1 validated by Vitest in Phase 3, 7 P2 validated by Vitest in Phase 4, all 2026-11-20) are implemented and **re-validated in Phase 5 (2026-11-20)**: every worked example was hand-computed and compared with the program's output, every formula test file contains a worked-example test, and the full Vitest suite passes 201/201. See the Phase 2, Phase 3, and Phase 4 reference tables below and each formula's validation status.
>
> Conventions used throughout:
> - Canonical internal units: feet (length), square feet (area), cubic feet (volume), US gallons (liquid volume). Metric inputs are converted to canonical units on entry via the unit engine.
> - **Package quantities always round up:** `package qty = ceil(required ÷ package capacity)`.
> - **Cost = rounded package qty × unit price** (cost is computed from what the user actually buys, not the raw required amount). If no price is entered, no cost is shown.
> - Waste is applied to the required amount before packaging: `adjusted = required × (1 + waste%)`.
> - Displayed quantities round to a sensible precision; full precision is kept internally until the final display step.
> - Constants: 1 yd³ = 27 ft³ (exact); 1 ft = 0.3048 m (exact); 1 US gal ≈ 3.785411784 L; 1 ft² ≈ 0.09290304 m².

## Confirmed reference values (Phase 2, checked 2026-11-20)

Every "to be confirmed" value from Phase 0 was checked against a named source before the P0 calculators shipped with it as a default. Each default is editable on its calculator page, and the source is named next to the field. A value that could not be confirmed to a single figure is not given a single default — see mulch density below.

| Value | Confirmed figure | Source (checked 2026-11-20) |
|---|---|---|
| Paint coverage, interior latex | 350 ft²/gal (low end of the 350–400 ft²/gal range at 4 mils wet) | Sherwin-Williams, SuperPaint Interior Latex product data sheet (Aug 2026), coverage 350–400 sq ft per gallon — https://www.sherwin-williams.com/document/PDS/en/035777040461 ; same range on Duration Home Interior Latex — https://www.sherwin-williams.com/document/PDS/en/035777252956/ |
| Concrete bag yields (QUIKRETE Concrete Mix No. 1101) | 40 lb = 0.30 ft³; 60 lb = 0.45 ft³; 80 lb = 0.60 ft³ (45 bags/yd³ at 80 lb) | QUIKRETE Concrete Mix No. 1101 data sheet, revised October 2022, as reproduced in https://calculatingconcrete.com/guides/quikrete/how-many-bags/ and https://www.howmanyyardsdoineed.com/guides/concrete-bag-yields/ |
| Gravel bulk density, general gravel / #57 crushed stone | 2,800 lb/yd³ (1.4 US tons/yd³), loose and dry; published range roughly 2,400–3,000 lb/yd³ by stone type and moisture | Aggregate-supplier density tables, summarized in https://www.gravelcalculate.com/guides/gravel-weight-guide/ (2,800 lb/yd³, 1.4 t/yd³ for crushed stone) and https://renovimo.com/guides/gravel-and-sand-weight-per-yard (#57 stone 2,800 lb/yd³; cites Engineering Toolbox gravel ≈ 105 lb/ft³ dry) |
| Mulch density | **No single figure confirmed** — dry wood mulch runs roughly 400–800 lb/yd³ depending on type and moisture, so the calculator assumes no density and shows a weight only when the user enters one | https://www.stumpsite.com/articles/how-much-does-a-yard-of-mulch-weigh and https://yardandgardenguru.com/how-much-does-a-yard-of-mulch-weigh/ (both give the 400–800 lb/yd³ dry range) |
| Mulch bag size | Standard bag = 2 ft³ (1 yd³ = 13.5 bags) | Same mulch sources as above; 2 ft³ is the standard bag size at garden centers |
| Modular brick + mortar joint | 7⅝ in × 2¼ in × 3⅝ in, ⅜ in joint; 675 bricks per 100 ft² (6.75/ft²) by BIA coursing; mortar 8.1 ft³ per 1,000 bricks (⅜ in joint); brick waste at least 5%, mortar waste 15–25% | Brick Industry Association, Technical Note 10, "Dimensioning and Estimating Brick Masonry", February 2009, Table 4 — accessible copy: https://endicottfiles.com/tn10.pdf |
| Mortar mix yield | One 80 lb bag lays up to 37 standard bricks | QUIKRETE Mason Mix No. 1136 / Mortar Mix No. 1102 data sheets, as reproduced in https://calcwall.com/concrete/mortar-calculator/ |
| Concrete waste default | 10% is the usual general default (5–8% for large simple slabs, 12–15% for complex pours) | https://www.vertigraph.com/learn/how-to-calculate-concrete-yardage ("10% as a general default") and https://www.jobplumb.com/blog/how-much-concrete-do-i-need (5–10%, 10% standard) |
| Concrete order increment | Quarter-yard rounding: most ready-mix suppliers sell and price in quarter-yard increments | https://www.vertigraph.com/learn/how-to-calculate-concrete-yardage ("Concrete is sold by the cubic yard, ordered to the quarter yard") — a supplier convention, not a universal rule, so the calculator also offers whole-yard rounding |


## Confirmed reference values (Phase 3, checked 2026-11-20)

Every default the eight P1 calculators ship with was checked against a named source before shipping. Each default is editable on its calculator page, and the source is named next to the field. A value that could not be confirmed to a single figure is not given a single default — see topsoil density below.

| Value | Confirmed figure | Source (checked 2026-11-20) |
|---|---|---|
| Drywall sheet sizes | 4 × 8 ft = 32 ft² (standard), 4 × 10 ft = 40 ft², 4 × 12 ft = 48 ft² | Standard sheet sizes; 4 × 8 ft as the DIY standard — https://www.measureandbuild.com/drywall-calculator/ and https://www.workshopcalcs.com/articles/how-much-drywall-do-i-need/ |
| Drywall joint compound coverage | About 100 ft²/gal for a Level 4 three-coat finish (USG: about two 4.5 gal pails per 1,000 ft², i.e. 0.29 gal per 4 × 8 sheet; other guides give 1 gal per 85 ft²) | https://www.measureandbuild.com/drywall-calculator/ (100 ft²/gal, Level 4) and https://materialguides.com/guides/drywall-screws-mud-and-tape/ (USG: two 4.5 gal pails per 1,000 ft²) |
| Drywall screws per sheet | About 28 per 4 × 8 sheet on walls, about 35 on ceilings; 4 × 10 ft takes 32 wall / 40 ceiling, 4 × 12 ft takes 40 wall / 50 ceiling (16 in framing; ASTM C840 / GA-216 spacing); about 250 screws per pound for 1¼ in coarse-thread screws | https://materialguides.com/guides/drywall-screws-mud-and-tape/ (per-sheet table: 28/35 for 4 × 8 ft, 32/40 for 4 × 10 ft, 40/50 for 4 × 12 ft; ~250/lb) and https://www.workshopcalcs.com/articles/how-much-drywall-do-i-need/ (~32 per sheet; 4 lb per 1,000 ft²) |
| Drywall paper tape | About 370 linear ft per 1,000 ft²; rolls commonly 250 or 500 ft | https://www.measureandbuild.com/drywall-calculator/ (0.37 ft per ft²) and https://materialguides.com/guides/drywall-screws-mud-and-tape/ (370 ft per 1,000 ft²) |
| Drywall door/window deductions | 20 ft² per door, 15 ft² per window (estimating convention) | https://calc.orbitalfour.com/drywall-calculator.html |
| Concrete bag yields (QUIKRETE No. 1101) | 40 lb = 0.30 ft³; 60 lb = 0.45 ft³; 80 lb = 0.60 ft³ (45 bags/yd³ at 80 lb) — reused from Phase 2, not re-confirmed | QUIKRETE Concrete Mix No. 1101 data sheet, revised October 2022 (see Phase 2 table above) |
| Flooring box coverage | Varies by brand — laminate about 18–24 ft²/box, vinyl plank about 18–30 ft², hardwood about 20–25 ft²; default 20 ft²/box, editable | https://calcthejob.com/flooring-calculator/ (vinyl/laminate 18–24 ft²/box) and https://www.calcmyproject.com/flooring.html (laminate 18–24, vinyl plank 18–30 ft²/box) |
| Flooring waste conventions | 10% straight lay (5–7% for a simple rectangle); 15% diagonal; 15–20% herringbone/chevron | https://calcthejob.com/flooring-calculator/ and https://www.calcmyproject.com/flooring.html |
| Flooring underlayment roll coverage | About 100 ft² per roll | https://www.fishjiang.online/flooring-calculator.html (underlayment rolls ~100 ft²) |
| Paver base depth (ICPI) | 4 in compacted for a patio/walkway, 6 in for a residential driveway; add 2–4 in in frost, wet, or weak soil (8–10 in total for a driveway); bedding sand exactly 1 in | ICPI Tech Spec 2 and 4, as summarized in https://www.measureandbuild.com/paver-base-calculator/ and https://calcthejob.com/paver-calculator/ |
| Paver base compaction loss | Crushed base loses about 20% of its volume to compaction — order 1.25× the compacted volume | https://www.measureandbuild.com/paver-base-calculator/ |
| Bedding sand density | About 2,750 lb/yd³ dry | https://calcthejob.com/paver-calculator/ |
| Polymeric joint sand density | About 100 lb/ft³ (a 50 lb bag is about 0.5 ft³) | https://www.calcbooth.com/paver-calculator/ |
| Topsoil bulk density | **No single figure confirmed** — loose, dry screened topsoil about 2,000 lb/yd³; wet or compacted 2,400–3,400 lb/yd³. Default 2,000 lb/yd³, editable, range stated on the page | https://harvestmath.com/calculators/soil-weight-calculator/ (bulk topsoil 2,000–3,400 lb/yd³, typical 2,400) and https://buildrefs.com/calculators/earthwork-site/soil-weight-calculator/ (loose dry 2,000 lb/yd³; wet/compacted 2,400–2,800) |
| Topsoil bag size | Commonly 0.75 ft³ (Scotts Premium Topsoil); bag sizes vary about 0.5–2 ft³ | https://calcbadger.com/topsoil-calculator/ |
| Grout density | 98.5 lb/ft³ reproduces the MAPEI Ultracolor Plus FA coverage chart to within 2% (10 lb bag covers 156 ft² of 12 × 12 in tile with ⅛ in joints); CUSTOM Polyblend Plus sanded implies about 110 lb/ft³ | https://calcthejob.com/grout-calculator/ (MAPEI Ultracolor Plus FA technical data sheet) |
| Board foot definition | 1 board foot = 1 ft × 1 ft × 1 in = 144 in³ = 1/12 ft³; board feet = thickness (in) × width (in) × length (ft) ÷ 12. Softwood uses nominal dimensions (NIST PS 20-25); rough hardwood uses actual thickness | https://en.wikipedia.org/wiki/Board_feet and https://www.hods.com/lumber-nominal-vs-actual-sizes/ (NIST PS 20-25) |
| Mortar mix ratios (ASTM C270, by volume) | Type N 1:1:6, Type S 1:½:4½, Type M 1:¼:3¾, Type O 1:2:9 (cement : lime : sand); one 94 lb sack of portland cement is about 1 ft³ | ASTM C270, as reproduced in https://www.calcmyproject.com/mortar.html and https://www.buildersmeasures.com/p/mortar-calculator.html |
| Mortar bag rating | One 80 lb bag of QUIKRETE Mortar Mix No. 1102 lays up to 37 standard bricks or 13 standard 8 × 8 × 16 blocks — a maximum, not an average. The data sheet states NO cubic-foot yield per bag, so no volumetric bag yield is claimed (an earlier 0.6 ft³ figure was removed in the PR #2 review response, 2026-11-22). The rating applies only to standard units at the standard ⅜ in joint or narrower (second re-review, 2026-11-22): for wider joints or non-modular brick, no bag count is shown unless the user enters a verified bag yield (ft³ per bag), from which bags = waste-adjusted mortar volume ÷ yield. | https://www.quikrete.com/PDFs/DATA_SHEET-Mortar%20Mix%201102.pdf (QUIKRETE data sheet, YIELD section) |
| Mortar volume per 1,000 bricks | 8.1 ft³ (BIA TN10 Table 4); the geometric joint-volume method gives 8.06 ft³ — confirmed in Phase 2 | Brick Industry Association, Technical Note 10 (see Phase 2 table above) |
| Mortar waste | BIA suggests 15–25% for mortar waste (default 15%) | Brick Industry Association, Technical Note 10 (see Phase 2 table above) |

## Confirmed reference values (Phase 4, checked 2026-11-20)

Every default the seven P2 calculators ship with was checked against a named source before shipping. Each default is editable on its calculator page, and the source is named next to the field. Values that are estimating guidance rather than manufacturer figures are labeled as such — see the primer surface factors and the back-buttering factor below.

| Value | Confirmed figure | Source (checked 2026-11-20) |
|---|---|---|
| Ceiling tile sizes | 2 × 2 ft = 4 ft², 2 × 4 ft = 8 ft² (the two standard drop-ceiling sizes) | Armstrong installation guide (see grid row below) and https://www.ponderloop.com/calculators/drop-ceiling/ |
| Ceiling grid layout | Main beams on 4 ft centers, cross tees 2 ft apart, hanger wires 4 ft apart along each main beam; main beams 12 ft; wall molding in 10 ft pieces | Armstrong, "How to Install Your Armstrong Suspended Ceiling" (LA294998) — https://cdn.menardc.com/main/items/media/ARMST001/Install_Instruct/SuspendedCeilingInstallationInfo.pdf |
| Ceiling grid counts | The geometric grid counts reproduce published room tables (12 × 12 ft room, 2 × 2 ft tiles: 2 main tees, 15 four-foot tees, 18 two-foot tees, 5 wall-angle pieces, 6 hangers) | https://www.ponderloop.com/calculators/drop-ceiling/ (room tables) and https://constructlytools.com/material-calculators/ceiling-tile-calculator/ |
| Ceiling tiles per carton | Commonly 16 per carton for 2 × 2 ft tiles, 8 for 2 × 4 ft — counts vary by product (5, 10, or 16 for 2 × 2 ft), so the field is editable | https://constructlytools.com/material-calculators/ceiling-tile-calculator/ (HomeGuide carton counts) |
| Tile adhesive coverage per 50 lb bag (CUSTOM VersaBond, TDS-119) | 1/4 × 1/4 × 1/4 in square-notch 90–100 ft²; 1/4 × 3/8 × 1/4 in 60–67 ft²; 1/2 × 1/2 × 1/2 in 42–47 ft²; 3/4 in U-notch at 45° 34–38 ft² (42–47 ft² at 30°); 3/16 in V-notch about 95 ft². Calculator defaults to the low end of each range | CUSTOM Building Products VersaBond coverage chart (TDS-119) — https://www.custombuildingproducts.com/products/versabond-lft-rs-rapid-setting-large-format-tile-mortar |
| Back-buttering extra adhesive | About 35% more adhesive (effective coverage ÷ 1.35) — **estimating guidance**, not a manufacturer figure | https://www.tilematerials.com/trowel-size-chart-tile/ (reading of the CUSTOM chart) |
| Primer coverage | Sherwin-Williams ProBlock primers print 400 ft²/gal at 4 mils wet; PVA drywall primer runs 250–300 ft²/gal on new drywall. Calculator defaults to 300 ft²/gal, editable | Sherwin-Williams ProBlock Quick Dry PDS (09/2026) — https://www.sherwin-williams.com/document/PDS/en/790417048138/ and ProBlock Premium PDS (10/2026) — https://www.sherwin-williams.com/document/PDS/en/035777143827/ ; PVA range — https://www.buildcalc.site/calculators/painting-finishing/primer-calculator |
| Primer surface-condition factors | ×1.00 previously painted, ×1.20 new drywall/bare plaster, ×1.30 bare wood, ×1.15 stained/patched — **estimating guidance** derived from the published coverage ranges above (at the 300 ft²/gal default, new drywall works out to 250 ft²/gal, the low end of the PVA range), not manufacturer figures | Derived from the primer coverage sources above |
| When primer is needed | Always on new drywall, joint compound, bare wood, masonry, and metal; over water, smoke, and tannin stains; and for a dark-to-light color change. A sound, previously painted wall in a similar color usually needs none | Sherwin-Williams ProBlock data sheets (surface guidance) and https://www.buildcalc.site/calculators/painting-finishing/primer-calculator |
| Wallpaper roll sizes | US double roll 20.5 in × 33 ft = 56.4 ft² (standard purchase unit; priced per single roll, sold per double roll); US single roll 20.5 in × 16.5 ft = 28.2 ft²; metric roll 0.53 m × 10 m = 57.1 ft² | https://www.measureandbuild.com/wallpaper-calculator/ and https://calcmax.net/en/wallpaper-calculator/ |
| Wallpaper strip method | Strips = ceil(wall length ÷ roll width); strip length = wall height + pattern repeat + 4 in trim; strips per roll = floor(roll length ÷ strip length). Doors and windows are not deducted | https://www.measureandbuild.com/wallpaper-calculator/ and https://calcmax.net/en/wallpaper-calculator/ |
| Sealant tube volume | Standard cartridge 10.1 fl oz = 18.2 in³ (1 fl oz = 1.8047 in³); at a 1/4 × 1/4 in bead one tube covers 24.3 linear ft; at 3/8 × 3/8 in 10.8 ft; at 1/2 × 1/2 in 6.1 ft (volume arithmetic, matching the ~25 ft trade rule of thumb) | https://www.calcmyproject.com/caulk.html and https://engineerfix.com/how-much-caulk-do-i-need-a-coverage-calculator/ |
| Sealant bead depth rule | For moving joints, cured depth about half the width (1/2 in wide joint wants 1/4 in of sealant), practical minimum around 1/4 in, maximum near 1/2 in | https://thedesmoscalculator.com/sealant-calculator/ (joint-depth guidance) |
| Waterproofing liquid coverage (RedGard, TDS-104) | General waterproofing 110 ft²/gal per coat; IAPMO shower-pan liner 80 ft²/gal per coat; crack prevention 100 ft²/gal in one coat (50 ft²/gal per coat for the two-coat ANSI A118.12 application). Two coats minimum | CUSTOM Building Products RedGard TDS-104, as reproduced in https://mans.io/files/viewer/2121533/3 and CUSTOM technical bulletin TB94 — https://tools.custombuildingproducts.com/media/60997801/tb94-understanding-the-coverage-rate-for-redgard.pdf |
| Waterproofing liquid coverage (MAPEI AquaDefense) | About 210 ft² per 3.5 gal pail over two coats — a different rate from RedGard, so the coverage field is editable | https://engineerfix.com/how-to-apply-mapei-aquadefense-waterproofing-membrane/ |
| Waterproofing sheet rolls (Schluter-KERDI) | KERDI 200/10M is 3 ft 3 in × 33 ft = 108 ft² per roll; other rolls 54 ft² (5 m), 75 ft² (7 m), 215 ft² (20 m), 323 ft² (30 m); wide roll 6 ft 7 in × 98 ft 5 in = 646 ft² | Schluter product list — https://sccpublic.s3-external-1.amazonaws.com/sys-master/images/hf0/h2d/9538839805982/Waterproofing.pdf and https://www.schluter.com/schluter-us/en_US/press-release-kerdi-wide?language=en_US |
| Baseboard stock lengths | 8, 12, and 16 ft at most home centers; some suppliers also carry 10 and 14 ft | https://yard-compass.com/calculators/baseboard/ and https://www.gettheamount.com/baseboard-calculator/ |
| Baseboard miter waste | 10% is the trade convention for a simple square room; 15–20% for rooms with alcoves, bay windows, or many outside corners | https://yard-compass.com/calculators/baseboard/ , https://www.gettheamount.com/baseboard-calculator/ , and https://justhetool.com/baseboard-calculator.html |

## 1. Concrete Calculator — `/calculators/concrete-calculator/`

- **Formula:** `volume (ft³) = length (ft) × width (ft) × depth (ft)`; `volume (yd³) = volume (ft³) ÷ 27`.
- **Units:** Inputs in ft/in or m/cm; outputs in yd³, ft³, and m³.
- **Waste:** user-editable percentage; applied to volume before packaging.
- **Packages:** ready-mix by the cubic yard, rounded up to the next 0.25 yd³ by default (the usual supplier increment — see the Phase 2 reference table above; whole-yard rounding is offered as an option) and/or bag counts (QUIKRETE yields in the Phase 2 reference table above).
- **Rounding:** volume displayed to 2 decimal places; yd³ rounded up per the packaging rule above.
- **Limitations:** Assumes a level, rectangular pour of uniform depth. Does not account for slope, uneven subgrade, spillage, or over-excavation beyond the waste allowance.
- **Worked example:** 10 ft × 10 ft slab, 4 in (⅓ ft) deep: 10 × 10 × ⅓ = 33.33 ft³ = 1.23 yd³. With 10% waste: 1.36 yd³ → order 1.5 yd³ (quarter-yard rounding).
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 2. Square Footage Calculator — `/calculators/square-footage-calculator/`

- **Formula:** rectangle `area (ft²) = length (ft) × width (ft)`; circle `area = π × r²`; triangle `area = ½ × base × height`; L-shape `area = L₁ × W₁ + L₂ × W₂` (the two rectangles added together).
- **Units:** Inputs in ft/in or m/cm; outputs in ft², m², yd², and acres.
- **Waste:** not applicable (pure area measurement); the result feeds other calculators' waste inputs.
- **Rounding:** area displayed to 2 decimal places.
- **Limitations:** Measures flat area only; does not deduct openings (that is the Paint calculator's job) or account for irregular shapes beyond the supported shapes.
- **L-shape split:** the two rectangles must not overlap — any shared area would be counted twice. Split the room along the inside corner so the rectangles only meet at an edge.
- **Worked example:** 12 ft × 15 ft room: 12 × 15 = 180 ft² (≈ 16.72 m²). L-shape: 12 × 10 ft plus 6 × 8 ft = 120 + 48 = 168 ft².
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 3. Paint Calculator — `/calculators/paint-calculator/`

- **Formula:** `net area (ft²) = gross wall area − doors/windows area` (where entered); `paint volume = net area × coats ÷ coverage (ft²/gal)`. A standard door deducts 21 ft² — the true 3 × 7 ft area. (The Drywall Calculator, §11, deducts 20 ft² per door instead, as a drywall estimating convention.)
- **Units:** Inputs in ft/in or m/cm; outputs in US gallons (and liters); coverage editable in ft²/gal or m²/L. Coverage is an area-per-volume rate, not a pure area: 350 ft²/gal = 8.59 m²/L (1 ft²/gal = 0.09290304 ÷ 3.785411784 m²/L ≈ 0.024542 m²/L), so the metric default is 8.59 m²/L, not the pure-area figure 32.52.
- **Reference coverage:** 350 ft²/gal per coat (8.59 m²/L in metric) — the low end of the 350–400 ft²/gal range on Sherwin-Williams interior latex data sheets (see the Phase 2 reference table above). The field is user-editable and the reference is labeled as typical for that manufacturer's paint, not guaranteed for any paint.
- **Waste:** user-editable percentage, applied to paint volume.
- **Packages:** gallons rounded up (whole gallons).
- **Cost:** `cost = rounded gallons × price per gallon` (price optional).
- **Rounding:** gallons rounded up to whole gallons for purchase; raw volume shown to 2 decimal places.
- **Limitations:** Coverage varies by surface, color change, and application method; the reference value is an estimate. Does not include primer (see Primer Calculator).
- **Worked example:** net area 400 ft², 2 coats, coverage 350 ft²/gal: 400 × 2 ÷ 350 = 2.29 gal → buy 3 gal. With 10% waste: 2.51 gal → still 3 gal.
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 4. Gravel Calculator — `/calculators/gravel-calculator/`

- **Formula:** `volume (ft³) = length (ft) × width (ft) × depth (ft)`; `volume (yd³) = volume (ft³) ÷ 27`; `weight = volume × density`.
- **Units:** Inputs in ft/in or m/cm; outputs in yd³, ft³, m³, and tons (US short tons) / kg.
- **Reference density:** 2,800 lb/yd³ (≈ 1.4 US tons/yd³) for general gravel / #57 crushed stone, loose and dry — the usual figure in aggregate-supplier tables (see the Phase 2 reference table above; range roughly 2,400–3,000 lb/yd³). The field is user-editable.
- **Waste:** user-editable percentage (compaction/settling allowance), applied to volume.
- **Packages:** bulk by the cubic yard (rounded up); bags by weight where a bag size is entered.
- **Cost:** `cost = rounded yd³ × price per yd³` (price optional).
- **Rounding:** yd³ to 2 decimal places for display, rounded up for ordering; tons to 2 decimal places.
- **Limitations:** Density varies by stone type, size, and moisture; compaction and settling are only approximated by the waste allowance.
- **Worked example:** 10 ft × 10 ft area, 3 in (0.25 ft) deep: 10 × 10 × 0.25 = 25 ft³ = 0.93 yd³. At 2,800 lb/yd³: the unrounded 0.926 yd³ × 2,800 = 2,593 lb ≈ 1.30 US tons.
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 5. Mulch Calculator — `/calculators/mulch-calculator/`

- **Formula:** `volume (ft³) = length (ft) × width (ft) × depth (ft)`; `volume (yd³) = volume (ft³) ÷ 27`; `bags = ceil(volume (ft³) ÷ bag volume (ft³))`.
- **Units:** Inputs in ft/in or m/cm; outputs in yd³, ft³, m³, and bag count (standard bag = 2 ft³ — user-editable).
- **Reference density:** mulch is normally sold by volume, not weight; a weight output is optional and only shown if a density is entered. Typical bagged mulch density is not assumed — no invented density value is used.
- **Waste:** user-editable percentage, applied to volume.
- **Packages:** bulk yd³ rounded up; bags rounded up via `ceil`.
- **Cost:** `cost = rounded qty × unit price` (price per yd³ or per bag, optional).
- **Rounding:** yd³ to 2 decimal places for display; bags are whole numbers rounded up.
- **Limitations:** Does not account for settling/compaction beyond the waste allowance; depth should be measured after spreading, not in the pile.
- **Worked example:** 10 ft × 10 ft bed, 3 in (0.25 ft) deep: 25 ft³ = 0.93 yd³. In 2 ft³ bags: ceil(25 ÷ 2) = 13 bags.
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 6. Concrete Slab Calculator — `/calculators/concrete-slab-calculator/`

- **Formula:** same volume core as the Concrete Calculator: `volume (ft³) = length (ft) × width (ft) × thickness (ft)`; `volume (yd³) = volume (ft³) ÷ 27`. Slab-specific additions: thickened-edge volume `edge (ft³) = 2 × (length + width − 2 × edge width) × edge width × (edge depth − thickness)` — the band is shortened by one edge width at each end so every corner is counted once; and wire-mesh sheets `meshSheets = ceil(slab area ÷ sheet area)` with a standard 8 × 20 ft sheet (160 ft²). Waste applies to the concrete volume only, not to the mesh count; the mesh output is always shown.
- **Units:** Inputs in ft/in or m/cm; outputs in yd³, ft³, m³; bag counts by bag size.
- **Waste:** default 10% for slabs — the usual general default (see the Phase 2 reference table above); user-editable.
- **Packages:** yd³ rounded up to the next quarter yard by default (whole-yard option offered); bags via `ceil`.
- **Cost:** `cost = rounded qty × unit price` (price optional).
- **Rounding:** as for the Concrete Calculator.
- **Limitations:** Assumes uniform thickness unless edge thickening is entered; does not design reinforcement or check structural requirements — a slab's structural design needs a qualified professional (stated on the page and in the Disclaimer).
- **Worked example:** 20 ft × 12 ft slab, 4 in (⅓ ft) thick: 20 × 12 × ⅓ = 80 ft³ = 2.96 yd³. With 10% waste: 3.26 yd³ → order 3.5 yd³ (quarter-yard rounding). With a 1 ft wide, 1 ft deep thickened edge on that slab: 2 × (20 + 12 − 2 × 1) × 1 × (1 − ⅓) = 40.00 ft³ of extra concrete. Mesh: ceil(240 ÷ 160) = 2 sheets.
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 7. Cubic Yard Calculator — `/calculators/cubic-yard-calculator/`

- **Formula:** `volume (ft³) = length (ft) × width (ft) × depth (ft)`; `volume (yd³) = volume (ft³) ÷ 27`; `volume (m³) = volume (ft³) × 0.0283168466`.
- **Units:** Inputs in ft/in/yd or m/cm; outputs in yd³, ft³, and m³.
- **Waste:** not applicable (pure volume conversion/measurement).
- **Rounding:** yd³ and m³ displayed to 2 decimal places.
- **Limitations:** Pure volume math; material-specific conversions (weight, bags) belong to the material calculators.
- **Worked example:** 3 ft × 3 ft × 3 ft: 27 ft³ = 1 yd³ (≈ 0.76 m³).
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 8. Cubic Feet Calculator — `/calculators/cubic-feet-calculator/`

- **Formula:** `volume (ft³) = length (ft) × width (ft) × depth (ft)`; conversions: `yd³ = ft³ ÷ 27`; `m³ = ft³ × 0.0283168466`; `in³ = ft³ × 1,728`.
- **Units:** Inputs in ft/in or m/cm; outputs in ft³, yd³, m³, and in³ where useful.
- **Waste:** not applicable (pure volume conversion/measurement).
- **Rounding:** ft³ displayed to 2 decimal places.
- **Limitations:** Pure volume math; see the Cubic Yard Calculator for yard-focused input.
- **Worked example:** 5 ft × 4 ft × 2 ft: 40 ft³ = 1.48 yd³ (≈ 1.13 m³).
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 9. Tile Calculator — `/calculators/tile-calculator/`

- **Formula:** `tiles needed = ceil(area (ft²) ÷ effective tile area (ft²) × (1 + waste%))`; `boxes = ceil(tiles needed ÷ tiles per box)`. Effective tile area = `(tile length + joint) × (tile width + joint)` — the grout joint widens each tile's footprint, so the joint is part of the divisor, not an afterthought.
- **Units:** Inputs in ft/in or m/cm; tile size in inches or cm; outputs in tile count and box count, plus area in ft²/m².
- **Waste:** user-editable percentage (typical 10% for straight lay, higher for diagonal/pattern — the page states this as guidance, not a rule); applied before rounding to tiles.
- **Packages:** boxes rounded up via `ceil`.
- **Cost:** `cost = rounded boxes × price per box` (price optional).
- **Rounding:** tile count is a whole number rounded up; boxes are whole numbers rounded up.
- **Limitations:** Assumes rectangular tiles and a rectangular area unless a shape input is provided; does not account for cuts at edges beyond the waste allowance; grout and adhesive are separate calculators.
- **Worked example:** 100 ft² floor, 12 in × 12 in tiles, ⅛ in joints, 10% waste: effective tile area = (12.125 × 12.125) ÷ 144 = 1.02 ft²; 100 × 1.10 ÷ 1.02 = 108 tiles. At 10 tiles per box: 11 boxes.
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 10. Brick Calculator — `/calculators/brick-calculator/`

- **Formula:** `wall area (ft²) = length (ft) × height (ft)` (minus openings where entered); `bricks = ceil(wall area ÷ area per brick including mortar joint × (1 + waste%))`. Area per brick including joint = `(brick length + joint) × (brick height + joint)`. `mortar volume (ft³) = pre-waste brick count × joint volume per brick ÷ 1,728 × (1 + mortar waste%)` — the pre-waste count, because brick waste is breakage, not extra joints. `mortar bags = max(ceil(bricks to buy ÷ bricks per bag), ceil(installed bricks × (1 + mortar waste%) ÷ bricks per bag))`, where bricks per bag is the QUIKRETE maximum of up to 37 standard bricks per 80 lb bag (Mortar Mix No. 1102 data sheet) — the larger governs, so the recommendation never undercuts the manufacturer maximum. The data sheet states no cubic-foot yield per bag and no waste allowance: brick breakage is counted once, in the brick count only, and the mortar waste allowance derates the rating only. The same rating rule is used by the Mortar Calculator, so both return the same bag count for the same wall and waste. **The rating applies only to standard geometry — modular brick (7⅝ × 2¼ × 3⅝ in) at the standard ⅜ in joint or narrower, within a 1% tolerance that absorbs metric rounding (9.5 mm, 194 × 57 × 92 mm).** A wider joint needs more mortar per brick while fitting fewer bricks per ft², so the count-based figure falls exactly as the mortar volume rises (80 ft² wall, 15% mortar waste: ⅜ in joint → 5.09 ft³ and 18 bags; ¾ in joint → 8.82 ft³ but only 15 bags by the old rule) — the rating does not apply there, and neither does it for non-modular brick sizes. For such geometry the bag count comes from a verified user-entered yield (ft³ per bag, from the bag's own data sheet): `bags = ceil(waste-adjusted mortar volume ÷ yield)`. With no yield entered, no bag count, bag cost, or shopping-list bag line is shown. A narrower joint is safe: it uses no more mortar per brick than the standard case, so the rating stays a conservative basis (¼ in joint → 3.58 ft³, 19 bags).
- **Units:** Inputs in ft/in or m/cm; brick size in inches or mm; outputs in brick count (and pallets where a pallet size is entered).
- **Reference brick size:** US standard modular brick 7⅝ in × 2¼ in × 3⅝ in with a ⅜ in mortar joint — Brick Industry Association Technical Note 10 (see the Phase 2 reference table above). The field is user-editable. Note: the face-area method used here gives 6.86 bricks/ft², while BIA's coursing table lists 6.75/ft² (675 per 100 ft²) for the same brick — a 1.6% difference, noted on the page.
- **Waste:** user-editable percentage (typical 5–10% for breakage/cuts — stated as guidance); applied before rounding.
- **Packages:** bricks rounded up; pallets via `ceil` where a pallet quantity is entered.
- **Cost:** `cost = (rounded bricks × price per brick) + (bags × price per bag)` (each price optional; an unpriced component adds nothing). Partial cost (Phase 8, 2026-11-22): when the bag count is unknown (rating does not apply, no verified yield entered) and only a mortar price was entered, the cost is suppressed — never $0. When a brick price was entered, the bricks-only figure is shown labeled "Partial cost (bricks only)" and explicitly excludes mortar, in the results row and in the copied shopping list. The partial flag is preserved through My Project (Phase 8 review response, ADR-16): the saved item keeps `costPartial`/`costLabel`/`costDetail`, the item line, room subtotal, and project total all label it partial, the text export and the CSV "Cost note" column carry the exclusion, and editing the unit price clears the flag (the edited price is the user's own figure).
- **Rounding:** brick count is a whole number rounded up.
- **Limitations:** Single-wythe wall assumption unless a wall-thickness input is added in Phase 2; does not give a site-mix breakdown (cement, lime, sand — see Mortar Calculator) or structural requirements.
- **Worked example:** 10 ft × 8 ft wall = 80 ft². Modular brick with ⅜ in joint: face area per brick = (7.625 + 0.375) × (2.25 + 0.375) in = 8 × 2.625 = 21 in² = 0.1458 ft². Bricks = 80 ÷ 0.1458 ≈ 549. With 5% waste: 576 bricks. Mortar: 549 bricks × 13.93 in³ ÷ 1,728 × 1.15 = 5.09 ft³. Bags: max(576 ÷ 37 = 16, 549 × 1.15 ÷ 37 = 18) = 18 bags. At the rating's implied yield (37 × 0.00806 ≈ 0.30 ft³ per bag), 18 bags provide ≈ 5.37 ft³, covering the 5.09 ft³. *(Verified by unit tests in Phase 2; bag method corrected in the PR #2 review response, 2026-11-22 — the old 9-bag volume figure is removed.)* With a ¾ in joint the same wall needs 8.82 ft³ of mortar and the rating no longer applies — no bag count is shown unless a verified yield is entered (8.82 ÷ 0.3 = 30 bags at a 0.3 ft³-per-bag yield). With a ¼ in joint it needs 3.58 ft³ and 19 bags from the rating.
- **Validation status:** validated by Vitest in Phase 2 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 11. Drywall Calculator — `/calculators/drywall-calculator/`

- **Formula:** `wall area (ft²) = 2 × (length + width) × height − doors × 20 ft² − windows × 15 ft²`; `ceiling area (ft²) = length × width` (when included); `sheets to buy = ceil(total area × (1 + waste%) ÷ sheet area)`. Compound `gallons = total area ÷ coverage (ft²/gal)`; `pails = ceil(gallons ÷ pail size)`. Tape `feet = total area × 370 ÷ 1,000`; `rolls = ceil(feet ÷ 250)`. Screws `= wall sheets × screws per sheet (walls) + ceiling sheets × screws per sheet (ceilings)`, where the screws per sheet scale with sheet size: 28 / 35 for 4 × 8 ft, 32 / 40 for 4 × 10 ft, 40 / 50 for 4 × 12 ft. The 20 ft² per door is the drywall estimating convention; the true 3 × 7 ft door area is 21 ft², as used by the Paint Calculator (§3).
- **Units:** Inputs in ft/in or m/cm; outputs in sheets, gallons, feet, and screws.
- **Reference values:** standard sheet 4 × 8 ft = 32 ft²; compound about 100 ft²/gal (2.45 m²/L in metric) for a Level 4 three-coat finish; tape about 370 ft per 1,000 ft²; screws per sheet scale with sheet size — 28 on walls / 35 on ceilings for 4 × 8 ft, 32 / 40 for 4 × 10 ft, 40 / 50 for 4 × 12 ft (see the Phase 3 reference table above). Compound coverage and screws per sheet are user-editable; leaving the screw fields blank uses the standard count for the selected sheet size.
- **Waste:** user-editable percentage (default 10%), applied to the sheet count only — compound, tape, and screws are estimated from the area actually hung.
- **Packages:** sheets, pails, and tape rolls rounded up via `ceil`.
- **Cost:** `cost = sheets × price per sheet + pails × price per pail` (prices optional).
- **Rounding:** sheets/pails/rolls are whole numbers rounded up; compound shown to 2 decimal places.
- **Limitations:** Assumes rectangular walls and ceilings of uniform height. Compound, tape, and screw figures are estimating rules of thumb for a Level 4 finish; a Level 5 skim coat takes much more compound. Corner bead is not included.
- **Worked example:** 12 × 12 ft room, 8 ft walls, 1 door, 2 windows, ceiling included: wall area = 48 × 8 − 20 − 30 = 334 ft²; ceiling 144 ft²; total 478 ft². Sheets hung: 11 walls + 5 ceiling = 16; with 10% waste: 17 sheets. Compound: 478 ÷ 100 = 4.78 gal → 2 pails of 4.5 gal. Tape: 478 × 370 ÷ 1,000 = 176.86 ft → 1 roll. Screws: 11 × 28 + 5 × 35 = 483 (≈ 1.93 lb). In 4 × 12 ft sheets the same room hangs 7 wall + 3 ceiling sheets: 7 × 40 + 3 × 50 = 430 screws.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 12. Concrete Bags Calculator — `/calculators/concrete-bags-calculator/`

- **Formula:** `bags = ceil(volume (ft³) × (1 + waste%) ÷ yield per bag)`, computed separately for 40, 60, and 80 lb bags. Volume from direct entry (yd³/ft³/m³) or from `length × width × depth`.
- **Units:** Inputs in ft/in/yd or m/cm; outputs in bag counts for all three sizes.
- **Reference yields:** QUIKRETE Concrete Mix No. 1101 — 40 lb = 0.30 ft³, 60 lb = 0.45 ft³, 80 lb = 0.60 ft³ (45 bags/yd³ at 80 lb). Reused from Phase 2; not re-confirmed.
- **Waste:** user-editable percentage (default 10%), applied to volume before packaging.
- **Packages:** bag counts rounded up via `ceil` for each size.
- **Cost:** when a price per bag is entered for a size, that size's cost is shown; the cheapest priced option is highlighted. No price = no cost shown.
- **Rounding:** bag counts are whole numbers rounded up.
- **Limitations:** Yields are for QUIKRETE No. 1101; other brands and mixes differ. Bagged concrete is practical up to about 1–2 yd³ — above that, ready-mix is usually cheaper (see the Concrete Calculator). Does not include reinforcement or formwork.
- **Worked example:** 1 yd³ (27 ft³) with 10% waste: 29.7 ft³ → 50 bags of 80 lb (29.7 ÷ 0.60 = 49.5), 66 bags of 60 lb, 99 bags of 40 lb. At $6, $5, and $4 per bag, the 80 lb bags are cheapest at $300.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 13. Flooring Calculator — `/calculators/flooring-calculator/`

- **Formula:** `adjusted area (ft²) = floor area × (1 + waste%)`; `boxes = ceil(adjusted area ÷ coverage per box)`; `planks = boxes × planks per box` (when entered); `underlayment rolls = ceil(floor area ÷ coverage per roll)` (when included) — the waste allowance does not apply to underlayment, which is laid edge-to-edge over the floor area only (offcuts are reusable).
- **Units:** Inputs in ft/in or m/cm; outputs in boxes, planks, and rolls.
- **Reference coverage:** box coverage varies by brand — laminate about 18–24 ft²/box, vinyl plank about 18–30 ft², hardwood about 20–25 ft². The field defaults to 20 ft² and is editable; underlayment rolls cover about 100 ft² each (see the Phase 3 reference table above).
- **Waste:** user-editable percentage (default 10% for a straight lay; 15% diagonal, 15–20% herringbone/chevron), applied before packaging.
- **Packages:** boxes and rolls rounded up via `ceil`.
- **Cost:** `cost = boxes × price per box + rolls × price per roll` (prices optional).
- **Rounding:** boxes and rolls are whole numbers rounded up.
- **Limitations:** Plank flooring sold by the box (laminate, vinyl plank, engineered hardwood). Carpet, sheet vinyl, and individual tiles are measured differently. Transition strips, stair nosings, and trim are not included.
- **Worked example:** 12 × 15 ft room = 180 ft²; with 10% waste: 198 ft². At 20 ft² per box: 10 boxes. At 8 planks per box: 80 planks. At 100 ft² per roll: 2 underlayment rolls.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 14. Paver Calculator — `/calculators/paver-calculator/`

- **Formula:** `paver area (ft²) = (length + joint) × (width + joint) ÷ 144`; `pavers = ceil(area × (1 + waste%) ÷ paver area)`. Base gravel (compacted) `yd³ = extended footprint × base depth ÷ 12 ÷ 27`, where the extended footprint is the paver area plus the base extension on every side — at least 6 in, or the base thickness when the base is deeper than 6 in; loose volume to order `= compacted × 1.25`; `tons = loose yd³ × density ÷ 2,000` (mass is conserved through compaction, so the weight comes from the loose volume ordered). Bedding sand `ft³ = extended footprint × 1 ÷ 12`. When only the area is known, the extended footprint is estimated as if the paved area were square; length and width give the exact figure. Joint sand `in³/ft² = 144 × (L·J + W·J + J²) ÷ ((L+J)(W+J)) × thickness`; `bags = ceil(weight ÷ bag weight)`.
- **Units:** Inputs in ft/in or m/cm; paver size in inches or cm; outputs in paver count, yd³, tons, and bags.
- **Reference values:** ICPI base depth 4 in compacted for a patio/walkway, 6 in for a driveway (add 2–4 in in frost, wet, or weak soil, for 8–10 in total); bedding sand exactly 1 in; base gravel 2,800 lb/yd³; bedding sand about 2,750 lb/yd³ dry; joint sand about 100 lb/ft³ (see the Phase 3 reference table above). Base depth, base density, joint sand density, and bag weight are user-editable.
- **Waste:** user-editable percentage (default 10%), applied to the paver count only.
- **Packages:** pavers and joint sand bags rounded up via `ceil`.
- **Cost:** `cost = pavers × price per paver + loose base yd³ × price per yd³ + joint sand bags × price per bag` (prices optional).
- **Rounding:** paver and bag counts are whole numbers rounded up; yd³ and tons shown to 2 decimal places.
- **Limitations:** Assumes a rectangular paved area on level ground. Base depths follow ICPI guidance for typical residential work — weak or wet subgrade, heavy vehicles, and local frost depth can require more. Joint sand is estimated from the geometric joint volume; the coverage printed on the bag is the final word. Edge restraint and excavation are not included.
- **Worked example:** 16 × 12 ft patio (192 ft²), 12 × 12 in pavers, ⅛ in joints, 2⅜ in thick, 4 in base, 10% waste: effective paver area 1.0209 ft² → 207 pavers. Base (extended footprint 17 × 13 = 221 ft²): 2.73 yd³ compacted → 3.41 yd³ loose (4.77 tons). Bedding sand: 18.42 ft³ = 0.68 yd³ (0.94 tons). Joint sand: 7.02 in³/ft² → 77.95 lb → 2 bags of 50 lb.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 15. Topsoil Calculator — `/calculators/topsoil-calculator/`

- **Formula:** `volume (ft³) = length (ft) × width (ft) × depth (ft)`; `volume (yd³) = volume (ft³) ÷ 27`; `weight = volume × density`; `bags = ceil(volume (ft³) ÷ bag size (ft³))`. Volume can also be entered directly (yd³/ft³/m³).
- **Units:** Inputs in ft/in or m/cm; outputs in yd³, ft³, m³, tons (US short tons) / kg, and bag count.
- **Reference density:** no single confirmed figure — loose, dry screened topsoil about 2,000 lb/yd³; wet or compacted 2,400–3,400 lb/yd³. The field defaults to 2,000 lb/yd³ and is editable; the page states the range (see the Phase 3 reference table above). Bag size commonly 0.75 ft³, editable.
- **Waste:** user-editable settling allowance (default 10%), applied to volume.
- **Packages:** bulk yd³ rounded up to whole yards for ordering (`orderYd3 = ceil(adjusted yd³)`); bags rounded up via `ceil`.
- **Cost:** `cost = rounded yd³ × price per yd³` when a bulk price is entered, otherwise `bags × price per bag` — bulk wins when both prices are entered, because a buyer buys bulk or bags, never both (prices optional).
- **Rounding:** yd³ to 2 decimal places for display; bags are whole numbers rounded up.
- **Limitations:** Weight is an estimate — the same cubic yard can weigh 2,000–3,400 lb depending on texture, organic content, and moisture. The volume is exact; the weight is only as good as the density entered. Does not account for compaction after spreading beyond the settling allowance.
- **Worked example:** 10 ft × 10 ft bed, 6 in (0.5 ft) deep: 10 × 10 × 0.5 = 50 ft³ = 1.85 yd³. With 10% allowance: 55 ft³ = 2.04 yd³. At 2,000 lb/yd³: the unrounded 2.037 yd³ × 2,000 = 4,074 lb ≈ 2.04 US tons. In 0.75 ft³ bags: ceil(55 ÷ 0.75) = 74 bags. Bulk to order: ceil(2.037) = 3 yd³.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 16. Grout Calculator — `/calculators/grout-calculator/`

- **Formula:** `grout (lb/ft²) = (L + W) ÷ (L × W) × joint width × joint depth × 144 × density ÷ 1,728`, with L, W, joint width, and joint depth in inches and density in lb/ft³. `grout (lb) = area × lb/ft² × (1 + extra%)`; `bags = ceil(grout (lb) ÷ bag weight)`.
- **Units:** Inputs in ft/in or m/cm; tile size in inches or cm; outputs in pounds and bag count.
- **Reference density:** 98.5 lb/ft³ reproduces the MAPEI Ultracolor Plus FA coverage chart to within 2% (10 lb bag covers 156 ft² of 12 × 12 in tile with ⅛ in joints); CUSTOM Polyblend Plus sanded implies about 110 lb/ft³. The field is user-editable. Grout is commonly sold in 10 lb and 25 lb bags; the bag weight is editable.
- **Waste:** user-editable extra allowance (default 10%), applied to grout weight.
- **Packages:** bags rounded up via `ceil`.
- **Cost:** `cost = bags × price per bag` (price optional).
- **Rounding:** grout weight shown to 1 decimal place; bags are whole numbers rounded up.
- **Limitations:** The density default matches MAPEI Ultracolor Plus FA sanded grout. Premixed, urethane, epoxy, and unsanded grouts have different densities and coverage — the coverage chart on the bag is the final word. Assumes joints filled to the full tile thickness. Does not include grout sealer or tile adhesive (thinset).
- **Worked example:** 100 ft² floor, 12 in × 12 in tile, ⅜ in thick, ⅛ in joints, 10% extra: joint volume = 1.125 in³/ft²; at 98.5 lb/ft³ that is 0.064 lb/ft²; 100 × 0.064 × 1.10 = 7.05 lb → 1 bag of 10 lb.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 17. Board Foot Calculator — `/calculators/board-foot-calculator/`

- **Formula:** `board feet per piece = thickness (in) × width (in) × length (ft) ÷ 12`; `total board feet = board feet per piece × pieces × (1 + waste%)`; `volume (ft³) = total board feet ÷ 12`.
- **Units:** Inputs in inches/feet or cm/m; outputs in board feet and cubic feet.
- **Reference definition:** 1 board foot = 1 ft × 1 ft × 1 in = 144 in³ = 1/12 ft³. For planed softwood lumber, board footage is calculated from the nominal dimensions (NIST PS 20-25) — a "2×4" counts as 2 in × 4 in, not its smaller dressed size. For rough hardwood, use the actual (rough) thickness (see the Phase 3 reference table above).
- **Waste:** user-editable cutting-waste allowance (default 5%), applied to total board feet.
- **Packages:** not applicable (board feet are a volume measure, not a package); the total is the order quantity.
- **Cost:** `cost = total board feet × price per board foot` (price optional).
- **Rounding:** board feet shown to 2 decimal places.
- **Limitations:** The standard formula for rectangular lumber only — it does not apply to logs, which are measured with log rules (Doyle, Scribner, International). Hardwood grading (NHLA) rounds surface measure to the nearest foot and counts thicknesses under 1 in as 1 in; this calculator uses the plain volume formula. Does not account for defects, knots, or wane.
- **Worked example:** one 2 × 6 board, 8 ft long: 2 × 6 × 8 ÷ 12 = 8 board feet. Ten boards: 80 board feet; with 5% waste: 84 board feet (7 ft³). At $2.50 per board foot: $210.
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 18. Mortar Calculator — `/calculators/mortar-calculator/`

- **Formula:** `units per ft² = 144 ÷ ((length + joint) × (height + joint))`; `units = ceil(area × units per ft²)`; `mortar per unit (in³) = ((length + joint) × (height + joint) − length × height) × depth`; `mortar volume (ft³) = units × mortar per unit ÷ 1,728 × (1 + waste%)`; `bags = ceil(units × (1 + waste%) ÷ units per bag)`, where units per bag is the QUIKRETE maximum of up to 37 standard bricks or 13 standard 8 × 8 × 16 blocks per 80 lb bag (Mortar Mix No. 1102 data sheet) — the rating is derated by the waste allowance because the data sheet states no waste allowance, and it states no cubic-foot yield per bag, so no volumetric bag figure is claimed. **The rating applies only to standard units at the standard ⅜ in joint or narrower, within a 1% tolerance that absorbs metric rounding (9.5 mm joint).** A wider joint needs more mortar per unit while fitting fewer units per ft², so the count-based figure falls exactly as the mortar volume rises (80 ft² modular wall, 15% waste: ⅜ in joint → 5.09 ft³ and 18 bags; ¾ in joint → 8.82 ft³ but only 15 bags by the old rule) — the rating does not apply there. For wider joints the bag count comes from a verified user-entered yield (ft³ per bag, from the bag's own data sheet): `bags = ceil(waste-adjusted mortar volume ÷ yield)`. With no yield entered, no bag count, bag cost, or shopping-list bag line is shown. Site mix: cement, lime, and sand use the ASTM C270 batch yields per ft³ of mortar — Type N 0.17 / 0.17 / 1.0, Type S 0.22 / 0.11 / 1.0, Type M 0.33 / 0.08 / 1.0, Type O 0.11 / 0.22 / 1.0 ft³ (cement / lime / sand); `cement sacks = ceil(cement ft³ ÷ 1)` (one 94 lb sack ≈ 1 ft³). The mix ratios by volume are Type N 1:1:6, Type S 1:½:4½, Type M 1:¼:3¾, Type O 1:2:9; C270 specifies sand at 2¼–3× the cementitious volume and the calculator uses the 3× end (Type M 3¾).
- **Units:** Inputs in ft/in or m/cm; unit size in inches; outputs in ft³, bag count, and site-mix volumes.
- **Reference values:** modular brick 7⅝ × 2¼ × 3⅝ in with a ⅜ in joint (BIA TN10) — geometric joint volume gives 8.06 ft³ per 1,000 bricks vs. BIA's 8.1 ft³; standard block 8 × 8 × 16 in (actual 7⅝ × 7⅝ × 15⅝ in); 80 lb bag lays up to 37 bricks or 13 blocks (QUIKRETE Mortar Mix No. 1102 data sheet — a maximum; the sheet states no cubic-foot yield, so none is claimed); BIA mortar waste 15–25% (see the Phase 3 reference table above). Joint width, waste, and mortar type are user-editable.
- **Waste:** user-editable percentage (default 15%), applied to mortar volume.
- **Packages:** bags and cement sacks rounded up via `ceil`.
- **Cost:** `cost = bags × price per bag` (price optional).
- **Rounding:** mortar volume shown to 2 decimal places; bags and sacks are whole numbers rounded up.
- **Limitations:** Mortar volume is the geometric joint volume. In practice, mortar also fills the cores of hollow block and gaps behind irregular stone — block and stone walls can need more. Bag yields vary by manufacturer. Site-mix parts are the ASTM C270 batch yields per ft³ of mortar — an ordering guide, not an exact dry-volume recipe: the dry volumes do not add up to the mixed volume. Mortar type and strength are structural decisions — follow a qualified professional's specification for load-bearing work.
- **Worked example:** 10 ft × 8 ft modular brick wall = 80 ft², ⅜ in joint, 15% waste: 6.86 bricks/ft² → 549 bricks; mortar = 549 × 13.93 in³ ÷ 1,728 × 1.15 = 5.09 ft³; bags = 549 × 1.15 ÷ 37 = 18. Site-mixed as Type N (1:1:6): 0.87 ft³ cement (1 sack), 0.87 ft³ lime, 5.09 ft³ sand. *(Bag method corrected in the PR #2 review response, 2026-11-22 — the old 9-bag volume figure is removed.)* With a ¾ in joint the same wall needs 8.82 ft³ of mortar and the rating no longer applies — no bag count is shown unless a verified yield is entered (8.82 ÷ 0.3 = 30 bags at a 0.3 ft³-per-bag yield).
- **Validation status:** validated by Vitest in Phase 3 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 19. Ceiling Tile Calculator — `/calculators/ceiling-tile-calculator/`

- **Formula:** `tiles = ceil(area (ft²) × (1 + waste%) ÷ tile area (ft²))`; `cartons = ceil(tiles ÷ tiles per carton)`, where tiles per carton defaults to the tile size — 16 for 2 × 2 ft tiles, 8 for 2 × 4 ft — unless the user enters the count on their carton. Grid (room mode only): `main lines = max(0, ceil(width ÷ 4) − 1)`; `main tees (12 ft) = ceil(main lines × length ÷ 12)`; `4 ft cross tees = (main lines + 1) × max(0, ceil(length ÷ 2) − 1)`; `2 ft cross tees = ceil((width − 2) ÷ 4) × ceil(length ÷ 2)` for 2 × 2 ft tiles only (0 for 2 × 4 ft); `wall angle (10 ft) = ceil(perimeter ÷ 10)`; `hangers = ceil(main lines × length ÷ 4)`.
- **Units:** Inputs in ft/in or m/cm; outputs in tile count, carton count, and grid component counts.
- **Reference values:** 2 × 2 ft tiles (4 ft²) and 2 × 4 ft tiles (8 ft²); Armstrong guide puts main beams on 4 ft centers, cross tees 2 ft apart, hanger wires 4 ft apart; main tees 12 ft, wall angle 10 ft pieces; tiles per carton commonly 16 (2 × 2 ft) or 8 (2 × 4 ft), editable; leaving the field blank uses the common count for the selected tile size (see the Phase 4 reference table above). The geometric grid counts reproduce the published room tables cited there.
- **Waste:** user-editable percentage (default 10%), applied to the tile count only — grid components are counted geometrically, not waste-adjusted.
- **Packages:** cartons and grid components rounded up via `ceil`.
- **Cost:** `cost = cartons × price per carton` (price optional). Grid components are not priced.
- **Rounding:** tile and component counts are whole numbers rounded up.
- **Limitations:** Grid counts are a planning estimate from the room dimensions — border cuts, light fixtures, and joist direction change the real layout; draw the grid before ordering. Assumes a rectangular room with a level ceiling. Does not check that the existing ceiling can carry heavy tiles. The Known area mode counts tiles and cartons only (no dimensions to lay a grid out on).
- **Worked example:** 12 × 12 ft room (144 ft²), 2 × 2 ft tiles, 10% waste: 144 × 1.10 ÷ 4 = 39.6 → 40 tiles; 40 ÷ 16 = 2.5 → 3 cartons. In 2 × 4 ft tiles the same room is 20 tiles — 3 cartons of 8. Grid: 2 main tees (12 ft), 15 four-foot cross tees, 18 two-foot cross tees, 5 pieces of 10 ft wall angle, 6 hanger wires.
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 20. Tile Adhesive Calculator — `/calculators/tile-adhesive-calculator/`

- **Formula:** `bags = ceil(area (ft²) × (1 + waste%) ÷ effective coverage (ft²/bag))`, where `effective coverage = coverage per 50 lb bag × (bag weight ÷ 50) ÷ 1.35 when back-buttering`.
- **Units:** Inputs in ft/in or m/cm; outputs in bags and dry adhesive weight (lb).
- **Reference values:** CUSTOM VersaBond coverage chart (TDS-119) per 50 lb bag — 1/4 × 1/4 × 1/4 in square-notch 90–100 ft², 1/4 × 3/8 × 1/4 in 60–67 ft², 1/2 × 1/2 × 1/2 in 42–47 ft², 3/4 in U-notch at 45° 34–38 ft² (see the Phase 4 reference table above). The calculator defaults to the low end of each range and the coverage is set by the trowel notch selected. Back-buttering adds about 35% (estimating guidance).
- **Waste:** user-editable percentage (default 10%), applied before packaging.
- **Packages:** bags rounded up via `ceil`.
- **Cost:** `cost = bags × price per bag` (price optional).
- **Rounding:** bags are whole numbers rounded up; adhesive weight shown to 1 decimal place.
- **Limitations:** Coverage figures are the low ends of CUSTOM's VersaBond chart for one product — other brands, modified vs. unmodified mortars, and lightweight mixes cover differently; the coverage on the bag is the final word. An uneven substrate, a heavily ridged tile back, or 95% coverage in a wet area can pull coverage 10–20% below the chart. Does not include grout, backer board, or the thinset used to set the backer board.
- **Worked example:** 100 ft² floor, 1/4 × 1/4 in square-notch trowel (90 ft² per 50 lb bag), 10% waste: 100 × 1.10 ÷ 90 = 1.22 → 2 bags (61.1 lb actually needed, 100 lb bought).
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 21. Primer Calculator — `/calculators/primer-calculator/`

- **Formula:** `primer (gal) = net area (ft²) × coats × surface factor ÷ coverage (ft²/gal) × (1 + waste%)`; `gallons to buy = ceil(primer)`.
- **Units:** Inputs in ft/in or m/cm; outputs in US gallons (and liters); coverage editable in ft²/gal or m²/L. Coverage is an area-per-volume rate, not a pure area: 300 ft²/gal = 7.36 m²/L (1 ft²/gal ≈ 0.024542 m²/L), so the metric default is 7.36 m²/L, not the pure-area figure 27.87.
- **Reference coverage:** 300 ft²/gal default (7.36 m²/L in metric) — between Sherwin-Williams ProBlock primers at 400 ft²/gal (4 mils wet) and PVA drywall primer at 250–300 ft²/gal on new drywall (see the Phase 4 reference table above). The field is user-editable. Surface-condition factors: ×1.00 previously painted, ×1.20 new drywall/bare plaster, ×1.30 bare wood, ×1.15 stained/patched — estimating guidance derived from those published ranges, not manufacturer figures.
- **Waste:** user-editable percentage (default 10%), applied to primer volume.
- **Packages:** gallons rounded up to whole gallons.
- **Cost:** `cost = rounded gallons × price per gallon` (price optional).
- **Rounding:** gallons rounded up to whole gallons for purchase; raw volume shown to 2 decimal places.
- **Limitations:** Coverage varies by product and surface; the 300 ft²/gal default is a reference value between two published figures, not a guarantee. The surface factors are estimating guidance. Stain-blocking and shellac-based primers cover less and cost more per gallon. Ceilings, trim, and doors are not included. Primer is a separate coat from paint — the Paint Calculator does not include it.
- **Worked example:** net area 400 ft² of new drywall, 1 coat, coverage 300 ft²/gal, factor 1.20: 400 × 1.20 ÷ 300 = 1.60 gal. With 10% waste: 1.76 gal → buy 2 gal.
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 22. Wallpaper Calculator — `/calculators/wallpaper-calculator/`

- **Formula:** `strips = ceil(wall length (in) ÷ roll width (in))`; `strip length (ft) = wall height + pattern repeat + 4 in trim`; `strips per roll = floor(roll length ÷ strip length)`; `rolls = ceil(strips × (1 + waste%) ÷ strips per roll)`. When no full strip fits on a roll, `strips per roll` is 0 and `rolls` is 0.
- **Units:** Inputs in ft/in or m/cm; roll width and pattern repeat in inches or cm; outputs in strip count and roll count.
- **Reference values:** US double roll 20.5 in × 33 ft = 56.4 ft² (standard purchase unit); US single roll 20.5 in × 16.5 ft = 28.2 ft²; metric roll 0.53 m × 10 m = 57.1 ft² (see the Phase 4 reference table above). The pattern repeat is printed on the roll label; 0 means a plain or random-match paper.
- **Waste:** user-editable percentage (default 10%) for cutting mistakes, applied to the strip count — the pattern-repeat waste is already in the strip length, not in this percentage.
- **Packages:** rolls rounded up via `ceil`.
- **Cost:** `cost = rolls × price per roll` (price optional).
- **Rounding:** strips and rolls are whole numbers; strips per roll rounds down (a strip that does not fit is not a strip).
- **Limitations:** Assumes straight-match paper (each strip cut one full repeat longer than the wall). Half-drop (drop-match) papers can waste more. Assumes all walls are the same height and the room is rectangular. Doors and windows are deliberately not deducted — a strip crossing an opening is still cut full length. Roll sizes are nominal; check the label.
- **Worked example:** 12 × 15 ft room, 8 ft walls (perimeter 54 ft), 18 in pattern repeat, US double roll, 10% waste: strips = ceil(648 ÷ 20.5) = 32; strip length = 8 + 1.5 + 0.33 = 9.83 ft; strips per roll = floor(33 ÷ 9.83) = 3; rolls = ceil(36 ÷ 3) = 12. Area division would have said 9 rolls.
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 23. Sealant Calculator — `/calculators/sealant-calculator/`

- **Formula:** `volume (in³) = joint length (ft) × 12 × bead width (in) × bead depth (in) × (1 + waste%)`; `volume (fl oz) = volume (in³) ÷ 1.8047`; `tubes = ceil(volume (fl oz) ÷ tube volume (fl oz))`; `coverage per tube (ft) = tube volume (in³) ÷ (width × depth) ÷ 12`.
- **Units:** Inputs in ft/in or m/cm; bead size in inches or cm; tube size in US fluid ounces; outputs in fluid ounces, cubic inches, and tube count.
- **Reference values:** standard cartridge 10.1 fl oz = 18.2 in³ (1 fl oz = 1.8047 in³); at a 1/4 × 1/4 in bead one tube covers 24.3 linear ft, at 3/8 × 3/8 in 10.8 ft, at 1/2 × 1/2 in 6.1 ft (see the Phase 4 reference table above). For moving joints the cured depth should be about half the width.
- **Waste:** user-editable percentage (default 10%), applied to sealant volume.
- **Packages:** tubes rounded up via `ceil`.
- **Cost:** `cost = tubes × price per tube` (price optional).
- **Rounding:** tubes are whole numbers rounded up; volume shown to 1 decimal place.
- **Limitations:** Models the bead as a rectangle (width × depth) — the standard estimator's shape for a tooled joint; a rounded bead holds a little less. Does not include backer rod for joints deeper than 1/2 in, which should be packed first. Tube contents vary slightly by brand. Does not account for removing old sealant first.
- **Worked example:** 100 linear ft of joint, 1/4 × 1/4 in bead, 10% waste: volume = 100 × 12 × 0.0625 × 1.10 = 82.5 in³ = 45.7 fl oz → 5 tubes of 10.1 fl oz. Coverage is 24.3 ft per tube at this bead size.
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 24. Waterproofing Calculator — `/calculators/waterproofing-calculator/`

- **Formula:** liquid: `gallons = area (ft²) × coats ÷ coverage per coat (ft²/gal) × (1 + waste%)`; `containers = ceil(gallons ÷ container size (gal))`. Sheet: `rolls = ceil(area (ft²) × (1 + waste%) ÷ coverage per roll (ft²))`.
- **Units:** Inputs in ft/in or m/cm; outputs in US gallons (and liters) or roll count; liquid coverage editable in ft²/gal or m²/L, sheet coverage in ft²/roll or m²/roll. Liquid coverage is an area-per-volume rate, not a pure area: 110 ft²/gal = 2.70 m²/L (1 ft²/gal ≈ 0.024542 m²/L), so the metric default is 2.70 m²/L, not the pure-area figure 10.22. Coverage per roll is a pure area and converts as one (108 ft² = 10.03 m² per roll).
- **Reference values:** RedGard (TDS-104) general waterproofing 110 ft²/gal per coat (2.70 m²/L in metric), IAPMO shower-pan liner 80 ft²/gal per coat, crack prevention 100 ft²/gal in one coat; MAPEI AquaDefense about 210 ft² per 3.5 gal pail over two coats; Schluter-KERDI 200/10M roll 3 ft 3 in × 33 ft = 108 ft² (see the Phase 4 reference table above). Two coats is the minimum for a liquid membrane.
- **Waste:** user-editable percentage (default 10%), applied before packaging.
- **Packages:** containers and rolls rounded up via `ceil`.
- **Cost:** `cost = containers × price per container` or `rolls × price per roll` (price optional).
- **Rounding:** gallons shown to 2 decimal places; containers and rolls are whole numbers rounded up.
- **Limitations:** Coverage rates are product-specific — the 110 ft²/gal default is RedGard's general rate; other liquids print different rates and the coverage on the product is the final word. The coat count is a requirement, not a choice: one coat, however thick, does not reach the rated dry-film thickness. Does not include KERDI-BAND, pre-formed corners, pipe seals, or drain seals for sheet membrane, or the thinset used to bond it. Waterproofing does not substitute for a sloped floor or a working drain.
- **Worked example:** 100 ft² shower (walls and floor), liquid membrane, 2 coats at 110 ft²/gal per coat, 10% waste: 100 × 2 ÷ 110 × 1.10 = 2.00 gal → 2 one-gallon containers. As sheet membrane: 100 × 1.10 ÷ 108 = 1.02 → 2 rolls of KERDI 200/10M. An 80 ft² area needs 1 roll (80 × 1.10 ÷ 108 = 0.81).
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## 25. Baseboard Calculator — `/calculators/baseboard-calculator/`

- **Formula:** `net length (ft) = max(0, perimeter − doors × door width)` (or the total wall length entered directly); `adjusted length = net length × (1 + waste%)`; `pieces = ceil(adjusted length ÷ piece length)`; `purchased length = pieces × piece length`.
- **Units:** Inputs in ft/in or m/cm; outputs in linear feet and piece counts.
- **Reference values:** stock lengths 8, 12, and 16 ft at most home centers (some suppliers also carry 10 and 14 ft); 10% miter-cut allowance is the trade convention for a simple square room, 15–20% for rooms with alcoves, bay windows, or many outside corners (see the Phase 4 reference table above). Standard door width 3 ft.
- **Waste:** user-editable percentage (default 10%), applied before packaging.
- **Packages:** pieces rounded up via `ceil`.
- **Cost:** `cost = purchased length × price per linear foot` (price optional).
- **Rounding:** pieces are whole numbers rounded up; lengths shown to 2 decimal places.
- **Limitations:** The waste allowance covers miter and scarf cuts, not a cut plan — whether a wall fits a stick decides the real waste, and the purchased length is shown next to the net length so the difference is visible. Assumes a rectangular room with square corners; irregular rooms should be measured wall by wall in the Known wall length mode. Does not include shoe molding, nails, glue, or caulk.
- **Worked example:** 12 × 12 ft room, one 3 ft door, 8 ft stock, 10% waste: perimeter 48 ft − 3 ft = 45 ft net; 45 × 1.10 = 49.5 ft → 7 pieces (56 ft purchased). In 12 ft stock: 5 pieces (60 ft purchased).
- **Validation status:** validated by Vitest in Phase 4 (2026-11-20) — worked example, boundary cases, and rounding-up behavior all pass; re-validated in Phase 5 (2026-11-20): worked example hand-checked against the program's output, Vitest 201/201 pass; see `docs/QA-REPORT.md`.

## Shared rules (all calculators)

- **Package qty = ceil(required ÷ package capacity).** Never round down a purchase quantity.
- **Cost = rounded qty × unit price.** Cost is computed from what the user buys; no price entered means no cost shown.
- **1 yd³ = 27 ft³; 1 US gal ≈ 3.785411784 L; board feet = T(in) × W(in) × L(ft) ÷ 12** (board foot formula documented here for reference; the Board Foot Calculator itself is P1).
- **Validation:** zero/negative/empty required inputs produce an inline error and no result.
- **Status note:** the 10 P0 formulas above were documented in Phase 0 and **validated by Vitest in Phase 2 (2026-11-20)**, the 8 P1 formulas (§§11–18) were **validated by Vitest in Phase 3 (2026-11-20)**, and the 7 P2 formulas (§§19–25) were **validated by Vitest in Phase 4 (2026-11-20)**. All 25 were **re-validated in Phase 5 (2026-11-20)**: each worked example was hand-computed and compared with the program's output (all 25 match; the only apparent mismatches in the hand-check were the checker's own rounding — gravel 2,592.59 lb shown as 2,593 lb, sealant 45.71 fl oz shown as 45.7 fl oz — and binary floating-point artifacts the `ceilUp` helper exists to absorb), and the full Vitest suite passes 201/201. Every reference value marked "to be confirmed" in Phase 0 is confirmed in the Phase 2 reference table above with its source, except mulch density, which has no single confirmed figure and is therefore not assumed anywhere. Topsoil density likewise has no single confirmed figure and is therefore not assumed as a fixed fact — the calculator defaults to 2,000 lb/yd³ for loose, dry screened topsoil and states the range. The primer surface-condition factors and the tile-adhesive back-buttering factor are labeled estimating guidance, not manufacturer figures, in both the Phase 4 reference table and their formula sections.
