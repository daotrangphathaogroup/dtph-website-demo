# Atlas dashboard · 2026-11-06

The three user references are inspiration for a new management layout, not replicas. Reference 2 supplies the dominant neutral/blue palette, reference 1 supplies pastel card hierarchy, and reference 3 supplies asymmetric/orbital motifs and a warm chart accent. The portfolio's warm outer frame and unrelated sample content are excluded.

## Evidence

- All three references measured deterministically with k=8; original measurements and per-source palettes are retained.
- `atlas.dna.json` contains the complete three-dimensional profile. Adapted color verification uses an explicit 4% / 95% / 1% weighted reference histogram with unchanged measured hex samples. Layout inspiration is evaluated separately from color weights.
- Final adapted palette verification: PASS; mean ΔE 0.84, max ΔE 12.09, coverage drift 0.1511.
- Individual original-reference reports are retained. References 1 and 3 fail as pixel-color targets because their accents/outer framing differ intentionally; they are structural references. These failures are not claimed as fidelity passes.

## Implementation

`OverviewSummary` is rebuilt into total + three group cards. `AtlasCharts` supplies seven bespoke chart panels in a responsive twelve-column composition: bounded monthly ribbons, independent percentage orbits, ranked geography stacks, care waffle, merit bubble matrix, team tick meters, and demographic butterfly.

All counts originate from the shared filtered approved-member set. No synthetic series, growth deltas or attendance claims are introduced. Profile data, registration flow, role permissions, pending workflow, sheet functions and minimal tag cells remain intact. Per-source measurements and the design profile are under this directory; screenshots are local audit artifacts.

## Validation

- 76 automated tests pass; TypeScript passes.
- Chromium and WebKit: 1600, 1360, 1100, 760, 390 and 320 px; no document overflow. Compact filters, reset, group drilldown, month tooltip, keyboard arrows/Escape, empty dataset and mobile tooltip bounds pass.
- Recognition tag interactions pass after the layout change: 700 ms desktop hover, cancellation, immediate touch, anchored callout, filtering and multiple-tag editing. Test requests use fixtures; no real registrations or database writes.
- Graphify query identifies the shared dashboard/filter/chart-geometry entry points. Its existing graph predates AtlasCharts; current source and runtime checks supply the evidence for newly added chart modules. The result is saved in Graphify memory, and project navigation instructions now require Graphify by default.
