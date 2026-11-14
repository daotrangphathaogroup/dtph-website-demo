# Manrope

The site uses the full Manrope variable font, 200–800, bundled with `next/font/local` in the root layout. All product text inherits `--font-manrope`; there are no runtime requests to Google Fonts. The unmodified TrueType asset is 164,700 bytes and is preloaded with `font-display: swap` and an adjusted Arial fallback.

Source: Google Fonts, `ofl/manrope`, pinned to the commit and SHA-256 in `Manrope.source.json`. License: SIL Open Font License 1.1, included as `OFL-Manrope.txt`.

The downloaded font's cmap was checked for 103 code points covering Vietnamese characters and the đồng symbol; its variable axis was verified as 200–800. Browser checks confirm the actual local font loads at 400/450/500/550/600/700 across the dashboard, sheet, SVG labels, anonymous registration and admin login.
