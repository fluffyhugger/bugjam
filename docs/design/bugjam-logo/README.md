# Handoff: BugJam Logo Mark

## Overview
A standalone icon mark (favicon / app mark) for **BugJam**, a bug-tracking product. The mark is an abstract, friendly bug form built entirely from circles and rounded rectangles: a wide rounded body with a vertical center seam and two antenna dots above it. No wordmark is part of the mark itself, though a nav-bar lockup (mark + "BugJam" text) is shown as a usage example.

## About the Design Files
The file in this bundle (`BugJam Logo.dc.html`) is a **design reference created in HTML** — a prototype showing the intended geometry, proportions, and color, not production code to copy directly. The task is to **recreate this mark in the target codebase's environment** using its established patterns. For a logo specifically, the right output is almost certainly a **single SVG file** (plus PNG/ICO exports for favicons), not a stack of positioned `<div>`s. The HTML uses divs only because it is a browser-rendered mock. Geometry below is given as exact ratios so it can be authored as SVG at any size.

## Fidelity
**High-fidelity.** Colors, proportions, and optical sizing are final. Reproduce the geometry to the ratios given.

## The Mark — geometry
Defined on a square canvas of side `S` (the mark's bounding box). All values are fractions of `S`.

| Element | Value |
|---|---|
| Body width | `1.000 S` |
| Body height | `0.780 S`, anchored to the bottom of the canvas |
| Body corner radius | elliptical: `0.390 S` horizontal / `0.420 S` vertical (i.e. `border-radius: 39% / 42%` — a soft superellipse, not a full circle) |
| Antenna dots | two circles, diameter `0.130 S` |
| Antenna dot position | top-aligned to the canvas top edge; left dot's left edge at `0.180 S`, right dot's right edge at `0.180 S` from the right |
| Center seam | rect, width `0.040 S`, height `0.520 S`, fully rounded ends (radius = half width) |
| Seam position | horizontally centered; bottom edge at `0.130 S` from the canvas bottom — so the seam runs from just inside the body's bottom up through the top of the body |

The seam is **knocked out** of the body — it is background-colored, not a separate ink shape. In SVG this should be a cut-out (mask or `fill-rule="evenodd"` path) so the mark works on any ground.

Reference pixel values at `S = 200px` (the large version in the mock): dots 26×26 at `top: 0`, `left: 36` / `right: 36`; body 200×156 at bottom, radius `78px / 84px`; seam 8×104, `left: 96`, `bottom: 26`.

### Small sizes
Rendered at 64, 32, 28 (nav), and 16 px in the mock, using the same ratios with sub-pixel values. At 16px the seam is 1px wide — if it renders muddy in a real favicon, hint it to a crisp 1px or drop it entirely and ship the body + dots only.

## Color
Two approved treatments, both shown in the mock:
- **Primary** — cream mark on near-black: ink `#EFE7D6`, ground `#141311`.
- **Reversed** — near-black mark on cream: ink `#141311`, ground `#EFE7D6`.

The mark is monochrome. There is no gradient, stroke, or shadow.

## Design Tokens
```
--cream:      #EFE7D6   /* primary ink / brand color */
--ink-dark:   #141311   /* dark ground / reversed ink */
--hairline:   rgba(239, 231, 214, 0.14)   /* borders on dark */
--muted:      opacity 0.5–0.6 on cream    /* secondary text */
```

Typography used in the presentation sheet and the nav lockup (Google Fonts):
- **Space Grotesk** — 400/500/700. Wordmark "BugJam": 19px, weight 500, letter-spacing −0.01em.
- **JetBrains Mono** — 400/500. Labels: 10–11px, letter-spacing 0.18em, uppercase.

Note: the wordmark typeface has not been formally approved as part of the logo — only the icon was commissioned. Confirm before treating Space Grotesk as the locked wordmark.

## Usage
- **Clear space:** keep at least `0.25 S` of empty space on all sides.
- **Minimum size:** 16px. Below that, use a solid body with no seam.
- Do not rotate, recolor outside the two approved treatments, add effects, or stretch non-uniformly.

## Nav-bar lockup (example, in the mock)
Mark at 28px, `gap: 14px`, then "BugJam" at 19px/500. Container: 18px 24px padding, 1px `--hairline` border, 6px radius. Nav links at 14px, 0.5 opacity, 22px gap, right-aligned.

## Interactions & Behavior
None. The mark is static; the mock has no state, animation, or hover behavior.

## Assets
No external image assets. All shapes are CSS-drawn. Fonts load from Google Fonts.

## Deliverables to produce in the codebase
1. `bugjam-mark.svg` — cream fill, `currentColor` preferred so it can be recolored.
2. Favicon exports: 16, 32, 180 (apple-touch), 512 (PWA), plus `favicon.ico`.
3. Optional React/Vue component wrapping the SVG with a `size` and `color` prop.

## Files
- `BugJam Logo.dc.html` — the design reference (presentation sheet: primary, reversed, size ramp, nav lockup).
