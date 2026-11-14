# Interface motion

Manrope and the existing visual layout are retained. The motion layer uses CSS and the native Web Animations API; no additional runtime package is required.

## Choreography

- `InterfaceMotion` is mounted once in the root layout. Delegated pointer feedback reaches lazy-loaded buttons, toolbars, navigation and dashboard actions. Press compresses to 96.5%; release briefly settles through 101.8% over 320 ms. No click is synthesized and no action is delayed. Pointer cancellation, window blur, visibility and preference changes clear animations.
- `usePageMotion` animates incoming workspace content for 380 ms without remounting children. Rapid navigation cancels the previous animation. Pointer/keyboard input immediately settles the page so editing never happens inside a moving coordinate system.
- `SegmentedControl` measures its selected native button and slides one decorative indicator. ResizeObserver follows labels and responsive widths. Selection and accessibility state update immediately; the animation is visual only.
- Native dialogs keep focus trapping, Escape handling and focus restoration. Opening uses 360 ms; the close icon/Escape uses a guarded 160 ms exit. Form-driven completion/unmount still happens immediately. Cleanup cancels pending exits.
- Menus/tooltips use short 160–240 ms entrances. Tag popovers retain their separate 700 ms desktop delay and immediate touch behavior; tag sheet cells have no new hover background.

## Charts

`AtlasPanel` owns a one-shot IntersectionObserver reveal. Each panel starts when at least 12% enters the viewport. SVG lines draw using their measured path length; orbit arcs sweep to the actual stroke-dasharray. Bars grow from their zero baseline; bubbles settle by scale; waffle and matrix cells appear in bounded stagger. Labels, axes, data attributes and semantic counts remain at their actual values. Completed effects retain no fill transforms or SVG overrides. Filtering does not restart the sequence; direct chart interaction cancels its entrance immediately.

The existing dashboard counter hook still settles on editing/filtering, but incidental pointer movement no longer aborts the entrance. Existing group charts retain their initial reveal. There is no table-row entrance cascade and no perpetual decorative animation.

## Accessibility and scope

CSS and WAAPI respect `prefers-reduced-motion`, including a preference change during playback. Reduced motion keeps the final data and immediate interactions. Native focus indicators, tooltips and controls remain operable. Registration paper/card/envelope choreography, request timing, roles and persistence are unchanged.

## Verification

- TypeScript and 76 existing unit tests.
- Playwright fixture-only tests in Chromium and WebKit: SVG line/ring/bar reveals, settled counts, no retained transforms, native-dialog close, segmented marker geometry, rapid navigation and reduced motion.
- Atlas charts/filter/tooltip/empty-data and responsive checks at 1600, 1360, 1100, 760, 390 and 320 px.
- Existing tag popup/editor regression and WebKit registration preview tests (normal/reduced motion, mobile, zero registration requests).

Graphify's existing graph located shared UI and dashboard entry points. The new Atlas modules were newer than the graph and were verified against current source/runtime rather than assumed present in graph traversal.

## Navigation performance correction (2026-11-06)

A Chromium CDP trace using the 372-row fixture (360 approved) and 4× CPU throttling reproduced the reported pause: returning to overview produced a 1,200 ms frame gap. The sampled CPU profile was dominated by `registrationDate`, which constructed locale date formatting repeatedly; the cross-chart model also repeatedly traversed the same records. Reusing one Vietnam DateTimeFormat, reusing the sheet Collator, and aggregating cross-chart data in one pass retain the same calendar, sorting and totals.

The final navigation sequence after optimization measured 200 ms for returning to overview (group navigation measured 133–183 ms) under the same 4× CPU setup. These are local fixture/development measurements, not guarantees for every device or production dataset. The normal-speed entrance test measured 76 ms and 47 ms between pointerdown and starting the page-heading animation.

Motion changes:

- Page motion now animates small ready surfaces instead of placing the entire table/dashboard into a transformed GPU layer. It starts after lazy content is available and uses an observer only while a skeleton is present. Counter text cannot postpone its frame.
- Chart effects run in passive effects. Waffle and matrix entrances animate two groups rather than hundreds of individual cells. Finished animations are cancelled/released. Analytical panels use layout/style containment. Experimental content-visibility estimates were removed after a mobile popup regression; actual section heights remain stable.
- Press feedback is 85 ms into 98% scale, followed by a 220 ms release. Delegation reaches native buttons, button links and disclosure controls; tag cells and resize separators remain excluded.
- Action tooltips open after 280 ms on pointer hover, immediately for keyboard focus, and dismiss on Escape/scroll/click. They have an anchored arrow, actual-width viewport clamping, a 160 ms entrance and 90 ms decorative exit. Exiting content is removed from accessibility descriptions immediately. Reduced motion skips these effects. Native dialog tooltips keep their existing fallback.

Verification commands (fixture-only local browser harnesses): `.local/navigation-latency-qa.mjs`, `.local/optimized-tooltip-qa.mjs` (Chromium/WebKit), `.local/interface-motion-qa.mjs`, `.local/atlas-layout-qa.mjs` and `.local/recognition-minimal-qa.mjs`. All browser requests are intercepted; no real registrations are sent.

A production build was temporarily run with fixture-intercepted API requests for animation evaluation. It is not the current local runtime: `npm start` requires the cloud backend configuration and returned503 for real local API requests. The local server has been restored to `npm run dev`, and real `/api/bootstrap` returns200. The same 4× CPU fixture sequence on that build measured a maximum 67 ms frame gap, including returning to overview. This production measurement is reported separately from the comparable before/after development measurements above. Build and deployment trace checks passed.
