# Soft dashboard verification — 2026-11-02

## Implementation and functional checks

- Deterministic reference palette saved in `reference.measurement.json`; full active DNA lives in `../management-workspace.dna.json`.
- TypeScript passes; 57 tests pass; optimized Next.js build passes; deployment tracing excludes local databases, environment files and test data.
- Added two meaningful chart checks: approved/pending use the same axis even when pending dominates, and Bézier controls remain within adjacent observed values (no invented extrema).
- Browser checks used existing local records read-only. Login/logout creates and revokes QA sessions; no member records or staff accounts were edited. No Supabase data or deployment changed.
- Counts reconcile with bootstrap records. All three summary-card filters apply and toggle the shared group selector correctly. Counts, table and chart share the original filters.
- Approved and pending monthly curves have keyboard and pointer tooltips; column view remains available. Zero data shows zero counts and disables review access without NaN or fictitious percentages.
- Detailed sheet search, filters, sorting, select/export, CSV, column customization, density, pagination and profile/edit view verified. Group list/review/statistics, public search empty state, account menu, accounts directory, password view, mobile drawer and progressive registration remain usable.
- Viewports 320, 390, 480, 760, 988, 1200, 1440 and 1920: no document overflow, summary overlap or clipped summary labels. Dense tables scroll inside their own container.
- Reduced motion keeps existing animations disabled. No browser exceptions observed.

## Visual inspection

Inspected actual desktop overview, 390px mobile overview, registration and operational sheets. Summary is now structurally rebuilt as a white total ring, two gradient group filters, gray Children strip and an open latest-registration list. The duplicate overview donut panel was folded into the summary; group statistics retain their composition chart. Blue/coral monthly observations and right-side distribution follow the supplied analytical hierarchy. Existing original logo and brand order are preserved.

Screenshots: `.local/audits/soft-dashboard/` (ignored local artifacts).

- `final-overview-1440.png`, `final-overview-988.png`, `final-overview-390.png`, `final-overview-1920.png`
- `empty.png`, `sheet.png`, `profile.png`, `edit-profile.png`, `group-statistics.png`
- `intake-revealed.png`, `intake-390.png`, `accounts.png`, `login.png`, `mobile-menu.png`

## Color and contrast

Browser-computed tokens exactly match the measured background #f5f6fa, ink #0c0d0e, accent #3e7ff1, coral #f89082 and cyan #98def5. Readable derived colors are explicitly documented in the DNA.

| Pair | Contrast ratio |
|---|---:|
| Body / cool canvas | 18.01:1 |
| Secondary text / cool canvas | 5.56:1 |
| White / primary-action blue | 5.66:1 |
| Dark feature-card text / strongest blue endpoint | 5.10:1 |

Official whole-image verification was run, then the warm gradient’s coral region strengthened and verification repeated against the active DNA at the same k=8:

| Capture | Mean ΔE | Max ΔE | Coverage drift | Overall |
|---|---:|---:|---:|---|
| First full-page capture | 2.05 | 34.10 | 0.6226 | FAIL |
| Final 1440px viewport | 1.12 | 15.18 | 0.5879 | FAIL: coverage |

Final mean/max color distances meet the tool’s thresholds (5/20). Overall comparison still fails its 0.35 coverage threshold. The reference’s outer gray presentation frame occupies 31.98% of its measured palette, while the working application uses that space for content. Long white sheets further affect full-page coverage. Different capture height is noted explicitly: the improvement in aggregate scores is not a controlled same-frame A/B result.

Do not describe this as a pixel-identical reconstruction or an overall palette-verification pass. The reference colors, hierarchy and soft surface language were applied; whole-image area proportions differ intentionally. Raw outputs are saved locally in `palette-first.txt` and `palette-final.txt`.
