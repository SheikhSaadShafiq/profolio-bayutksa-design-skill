# Single-file bundling

## The rule

One HTML file. Every asset inlined. Zero network requests.

## Why

These documents get emailed, dropped in Slack, opened on a plane, opened from
a USB stick two years later by someone doing an audit. A deliverable that
renders differently depending on whether a font CDN is reachable is not a
record of anything. The whole value of a handoff document is that it is fixed.

It also means the deliverable cannot silently drift: a linked stylesheet would
keep changing as the design system moves, so v3 opened today would not show
what v3 showed when it was signed off.

## What gets inlined

| asset | how |
|---|---|
| CSS | `<style>`, with `url()` rewritten to data URIs |
| JS | `<script>` |
| fonts | base64 woff2 data URI inside `@font-face` |
| images | data URI |
| Lottie | inline JSON in a `<script type="application/json">` |
| node ledger | inline JSON, id `__ids` |
| QA report | inline JSON, id `__qa` |

Remote `@import` of a font stylesheet is dropped, not followed — it cannot be
inlined and leaving it in is a silent network dependency. Subset and embed the
font instead.

## Size

Soft budget 12 MB, hard limit 25 MB. `bundle.py` warns at the first and
refuses at the second.

Fonts and screenshots dominate. In order of effect:

1. Subset fonts to the glyphs actually used. A full Arabic + Latin family is
   several hundred KB per weight; a subset is tens.
2. Ship woff2 only. No woff, ttf or otf fallbacks — every browser that will
   open this supports woff2.
3. Compress screenshots. WebP at quality 80 is usually indistinguishable and a
   fraction of PNG.
4. Prefer live HTML over screenshots. A rendered screen is markup plus shared
   CSS; a screenshot of it is a quarter-megabyte image.

If a deliverable genuinely cannot fit, split by platform rather than dropping
assets — two honest documents beat one with missing pieces.

## Sources stay split

Git holds the split sources. The bundle is a build artifact.

Never hand-edit a bundled file. It is minified-adjacent, data URIs make diffs
useless, and the next rebuild silently discards the edit. If the bundle is
wrong, the source is wrong.

## Verification

`bundle.py` fails the build if any `http://` or `https://` reference survives
in `src` or `href`. That check is the thing that keeps the rule true over time
— without it, one added `<link>` quietly reintroduces a network dependency and
nobody notices until someone opens it offline.
