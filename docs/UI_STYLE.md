# Current UI direction

The latest user request asks for a more modern, future-facing interface that remains simple. The active implementation is in `src/styles/tokens.css` and the existing modular stylesheets. Older reference DNA files describe prior iterations, not the current palette.

## Shared system

- Cool light canvas `#f5f7fa`, white work surfaces, graphite text `#172b3a`.
- Functional blue-teal accent `#096d87` for primary actions, focus and progress. Warm yellow remains reserved for pending work; green/red retain approval/rejection meaning.
- Continuous white topbar with original Phật Hào logo, white navigation rail and graphite selected row.
- Existing self-hosted Geist, compact readable numerals, thin borders, restrained 8–18px corner scale and subtle surface shadows.
- Inputs, buttons, menus, table controls, profile dialogs, account pages and authentication share the same tokens. No extra rendering libraries or assets.

## Screen treatment

Dashboard keeps all user-approved statistics and shared filters, using a graphite total metric, quiet white analytical cards, blue chart strokes and semantic pending state. Member tables retain selection, column resizing, sorting, density, pagination and CSV export.

Guided registration remains centered. Previously revealed clusters stay mounted and editable with subdued surfaces; the active cluster gets a white surface and soft focus boundary. A thin segmented progress indicator reinforces the existing cluster count. New-cluster animation and utility popovers respect reduced motion.

## Validation

TypeScript and all 54 tests pass. Local Chromium checks cover the guided intake against an isolated in-memory backend, actual portrait cropping, picker and retry behavior; dashboard filters/charts/list; search; sheet and column popup; profile dialog; account menu/list; password and mobile navigation. Responsive checks include 320, 390, 760, 988, 1280 and 1440px across these flows. No document overflow or browser errors were observed.

Main text contrast: graphite on canvas 13.56:1, secondary text on white 5.51:1, primary action white/teal 5.92:1. These are the key token pairs, not a claim of a complete accessibility audit.
