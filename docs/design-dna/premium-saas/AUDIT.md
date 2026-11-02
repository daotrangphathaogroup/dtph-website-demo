# Visual audit — 2026-11-02

Scope: visual refinement of the existing Next.js application. No API, permission,
business-rule, database or source-data changes. The supplied master directive and
DESIGN_GUARDRAILS.md take precedence over older design experiments.

## Existing system

The application already has seven CSS layers, shared Button / Field / Feedback /
Dialog / IconButton / SegmentedControl primitives, a continuous branded header,
collapsible desktop navigation and accessible mobile drawer. Keep these seams.
Geist is self-hosted with Vietnamese glyphs. The original logo and the reading
order Đạo tràng → Phật Hào are retained.

`management-workspace.dna.json` remains the base three-dimension schema. It predates
the currently implemented overview and blue-white palette. Its task-focused modes,
quiet interactions, native cursor and absence of expensive effects remain valid.

## Problems and decisions

| Area | Observed problem | Refinement |
| --- | --- | --- |
| Overall | Blue tinted copy, white boxes and several competing pastels | Neutral ink and secondary copy; blue marks actions and analytics |
| Shell | Active nav, colorful icons, uppercase captions compete | Compact graphite active row, neutral icons, quieter captions |
| Overview | Five separate KPI cards and equally weighted charts | One shared metric strip, primary monthly chart, smaller composition panel |
| Filters | Tall standalone filter card reads as another dashboard module | Compact two-row toolbar integrated with the heading |
| Charts | Monthly trend is below less important charts | Timeline first; composition alongside; compact geography distribution below |
| Tables | Vertical rules and strong header/sticky borders create a spreadsheet cage | Horizontal row rules, precise sticky boundaries, efficient density retained |
| Intake | Every newly revealed group adds another bordered/shadowed card | One continuous form surface with divided sections; subtle active background |
| Details | Every read-only field is a gray box | Unboxed definition rows with whitespace and fine dividers |
| Settings/login | Inconsistent corner sizes and blue-gray text | Same surfaces, input dimensions, text scale and modal spacing |

## Reference interpretation

1. CRM: layered neutral surfaces, restrained utility circles, modular organization.
   Do not copy case workflow, avatars or browser frame.
2. Finance: editorial hierarchy, asymmetric analytics, light surfaces and blue marks.
   Do not copy funnel, grain, decorative stripes, huge typography or AI prompt bar.
3. Personal workspace: calm main/secondary hierarchy, readable whitespace and thin
   chart strokes. Do not import bright gradient cards or fictitious productivity.

Color measurements for all three original images are stored alongside this file.
Finance is the primary palette reference. Its measured background is #f5f6f6,
foreground #0d0d0e and accent #3070e3. Semantic label colors are darkened for readable
small text; saturation and surface coverage are deliberately restrained.

## Benchmark and rollout

Benchmark: authenticated all-group Tổng quan. Preserve simultaneous shared filters,
all counts, all twelve month values, composition, distribution, pending disclosure
and direct detailed sheet. Group modes remain list / pending / statistics.
Rollout uses the same tokens for search, intake, member editing, accounts, password,
login, menus and dialogs. No new rendering dependency or decorative asset.

Verification: actual local Chromium screenshots plus role-aware interactions,
sorting/filtering/export, responsive 320–1440px, keyboard focus, reduced motion,
typecheck, tests and production build. Palette scoring is recorded honestly as a
diagnostic; framing/coverage differences are not fixed by inserting decorations.
