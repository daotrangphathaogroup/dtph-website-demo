# Verification — 2026-11-02

## Rendered interface

Actual Chromium runs against the local application cover the overview, group list,
review queue, statistics, profile viewer/editor, column options, search results and
empty search, accounts, account menu, password, login, mobile drawer and progressive
intake. Screenshots remain local in `.local/audits/premium-saas/` (not published).

Checks preserve actual local counts and shared team/month filters. The timeline is
wider than the composition panel on desktop. Switching distribution/line/bar views,
keyboard chart tooltip, table search/sort/selection/CSV/density/columns, focus return,
mobile drawer and existing workflow controls remain functional. Widths 320, 390,
760, 988, 1200 and 1440px are checked for document overflow.

An independent browser run with an isolated in-memory backend covers the complete
public and Manager registration flows: age routing, portrait crop, optional fields,
duplicate-name referrer picker, confirmation dialog with Escape/back, response-loss
retry and pending/approved behavior. No real member or account changes are made by
these checks. Reduced motion disables intake and utility animations.

## Palette comparison

The deterministic verification utility was run against the actual overview render
and all three measured original references. This is **not** a pixel-copy brief.
Do not report these whole-image results as visual-fidelity PASS:

| Reference | Mean ΔE | Max ΔE | Coverage drift | Result |
| --- | ---: | ---: | ---: | --- |
| finance | 2.09 | 39.28 | 0.4994 | FAIL |
| crm | 5.02 | 44.19 | 1.5182 | FAIL |
| personal | 3.25 | 44.85 | 0.6905 | FAIL |

The finance background mean is close, but the 8-cluster analysis combines the white
panels and near-white canvas into one broad cluster (96.92% in the full-height sheet
screenshot). Original references include large gray outer frames, saturated gradient
blocks, coral graphics and different proportions of text and charts. Those are not
imported merely to meet coverage targets. Small dark anti-aliased glyphs and pale
chart marks also change cluster means. All measured source hexes/configurations are
retained in the DNA, and the primary background/foreground/blue tokens are applied
verbatim. Unsupported source colors are deliberately absent from decorative UI.

## Contrast of principal pairs

- Body on white: **19.43:1**.
- Secondary on white: **5.69:1**.
- Secondary on canvas: **5.25:1**.
- White on primary button: **4.61:1**.
- Blue label on pale blue: **5.91:1**.

These are token-pair checks, not a claim of a full accessibility audit. Plot axes,
secondary text, field labels and menu items retain explicit text alongside color.

## Build and scope

- TypeScript: passed.
- Automated suite: 55 passed, 0 failed.
- Optimized Next.js build and deployment trace check: passed.
- Browser checks: passed on actual local screens; isolated intake and activity-level
  save checks also passed with no production writes.
- Browser console/page errors during the normal UI run: none.
- No backend, API, database schema, source-data or dependency changes in this refactor.
- No commit or deployment is performed as part of this design task.
