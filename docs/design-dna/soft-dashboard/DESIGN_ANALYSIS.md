# Soft community dashboard — reference analysis

Reference: codex-clipboard-19f9d9d0-c2a8-45b7-8b78-6a8189730498.png, 2048×1536.

## Design system
- Deterministic k=8 palette: background #f5f6fa, ink #0c0d0e, accent #3e7ff1, cyan #98def5, coral #f89082. Full measurement and coverage are saved alongside this document.
- Reference typography appears geometric/humanist sans; exact font is unknown. Retain self-hosted Geist for Vietnamese. Use regular-weight numbers, 48px primary metric, 30px title, 13–14px work text.
- Four-pixel rhythm; 26px analytical corners, 14px fields, pill filters, white low-shadow surfaces.
- Source layout: dominant left analytical area, quieter right column, white profile-like card, two colorful feature cards and a secondary gray strip.

## Design style
Calm, airy and approachable. Color identifies focal information; normal lists and controls stay neutral. Large regular numerals and fine separators replace heavy headers and many nested cards.

## Effects
Two static mesh-like color washes and sparse dotted chart fill. Motion cannot be inferred from one screenshot; retain functional focus, tooltip and intake reveal only. No rendering dependency or animation loop.

## Application mapping
- Profile reference → real approved-member total and community ring, without fabricated personal portraits or progress.
- Warm/cool cards → actual Youth and Congregation counts with shares of the currently filtered approved total. Clicking uses the existing group filter.
- Gray secondary strip → Children count and group filter.
- Meetings list → actual latest pending registrations, profile links and full review access. No fictional calendar events.
- Focusing plot → approved and pending monthly counts on the same axis. Bounded Bézier curves pass through every actual observation; control points cannot overshoot adjacent counts. The existing column view stays available.
- Developed areas → actual ward/age/gender distribution. All categories stay accessible in the scrollable plot.
- The total ring replaces the duplicate overview composition card; group-statistics pages retain their own composition chart.
- Shared colors, shapes and selected states apply across intake, search, accounts, dialogs and detailed sheets. Existing business behavior and database are untouched.

## Adaptation
The screenshot’s outer gray presentation frame is not reproduced as wasted application space. Original logo, Vietnamese terminology, registration steps, staff permissions and compact tables are preserved. Analytics stack below 980px; the total card becomes horizontal on narrow screens. Tables scroll inside their container.
