# Current UI system

The active system is [management-workspace.dna.json](design-dna/management-workspace.dna.json),
updated on 2026-11-02 using the supplied soft personal-dashboard reference.
[Current analysis](design-dna/soft-dashboard/DESIGN_ANALYSIS.md) and
[verification](design-dna/soft-dashboard/VERIFICATION.md) describe this implementation.
The following earlier audit remains historical context:
[Audit](design-dna/premium-saas/AUDIT.md) records the composition decisions;
[verification](design-dna/premium-saas/VERIFICATION.md) records browser coverage,
contrast and the limits of whole-image palette comparison.

## Foundation

- Measured neutral canvas #f5f6fa, white working surfaces, measured ink #0c0d0e.
- Measured blue #3e7ff1 for commit actions, focus and chart marks. Readable secondary
  copy #60636c; subdued green/amber and small activity-level dots convey meaning.
- Self-hosted Geist including Vietnamese. Page title 30px desktop / 24px mobile,
  panel title 16–18px, body 13–14px, secondary 12px, main metric 48px. Weight 500
  for visual hierarchy, 600 only where stronger emphasis is useful.
- 4px spacing rhythm; 32px desktop / 16px mobile content gutters. Corner hierarchy:
  12px small controls, 14px fields, 20px standard panels, 26px analytical panels.
- Opaque white surfaces with low diffused shadows. Two static coral/cyan gradient
  count cards establish the reference hierarchy. No blur or new rendering dependency.

## Composition and components

The continuous topbar retains the original logo and Đạo tràng → Phật Hào reading
order. Neutral full-height navigation supports collapse and a keyboard-managed
mobile drawer. Active navigation is pale blue; counts reserve amber for review.

Tổng quan follows a clear task hierarchy: one labeled six-field filter panel; a
compact approved/group/pending KPI row; a review disclosure directly below; two
bordered analytical panels; and a distinct full-width records section. All three
communities have equal visual weight. Color emphasizes the approved total and
pending work, while subgroup counts stay neutral with small identity dots.
Shared group-card filters remain toggleable. Year and month now use the same
selector pattern as the other filters. The monthly chart and distribution panel
have matching two-level headers. Group pages keep list/review/statistics modes.

Tables use horizontal rules, light headers and precise sticky identity/action edges.
Search, column filters, sorting, density, resizing, selection, CSV and pagination are
unchanged. Valid activity levels display as a small dot plus text, not colored pills.

Guided intake uses one continuous form surface with divided sections. Opened fields
stay editable; only the newest section has Continue/Send. Active editing is subtly
highlighted. Existing portrait crop, referrer picker and confirmation popup remain.

Profile details use unboxed definition rows. Editing uses shared fields and activity
controls. Accounts place the creation form next to the directory on large screens,
then reorganize below 1100px. Login/password use the same text and surface rules.

## Interactions and responsive rules

Color/focus changes use approximately 180ms. Utility tooltip dwell is 450ms; intake
reveal is 240ms. Reduced motion disables transitions/animations. Native cursor and
native dialog focus/Escape behavior are retained. Loading/empty/error/success states
use existing primitives; no fictitious trend data or growth metrics are added.

Below 980px analytical panels reorganize. Overview responds to its actual available column width: below 800px, total and
pending occupy the first KPI row and the three equal subgroup cards follow;
analytics stack. Filters reorganize into three or two columns. Tables
scroll within their container and existing mobile sticky-column strategy remains.

All tokens live in `src/styles/tokens.css`. Existing modular CSS layers own shell,
components, dashboard, sheet and forms. Reuse these rather than a new override sheet.

## Reserved management sidebar

Authenticated workspace pages include a separate right sidebar titled “Huynh đệ
quản lý”. It currently shows an honest empty state; no account list, personal data,
or new API access is implied. A dedicated layout component is ready for the future
management directory. The public workspace does not render it.

On screens at least 1360px wide, the sidebar is a 240px column below the continuous
topbar and stays visible while scrolling. Smaller screens reflow it into a compact
section above the content. Left navigation collapse and the mobile drawer retain
their existing behavior.

## Shell separation

The topbar contains the logo and account controls; no breadcrumb or page path.
The page title remains in the content header. A white topbar with a fine bottom
rule spans the whole workspace. The left sidebar uses the existing
pale blue-gray surface with a right divider, the main area retains its cool canvas,
and the white management sidebar has a left divider. Narrow-screen management
content retains a white background and bottom rule when reflowed above the main.

The refined topbar is 72px on desktop and 60px on mobile, with no drop shadow.
Workspace branding has a clearer two-line wordmark and remains visible on phones.
Staff name and role now share one borderless account control with a dark initial
avatar; narrow phones retain the avatar and accessible account name. The dropdown
keeps Escape, click-outside dismissal and focus return. No breadcrumb or decorative
utility actions are added to fill the header.
