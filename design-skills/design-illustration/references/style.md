# The style fingerprint, and drawing in it

## Measuring the fingerprint

Read three or more of the product's illustrations, as SVG where possible:

| property | how |
|---|---|
| size | the viewBox, and the size it is shown at |
| stroke | `stroke-width` at the shown size (scale by shown ÷ viewBox) |
| caps and joins | `stroke-linecap`, `stroke-linejoin` |
| fills | outline only, flat fills, or both; any gradients |
| palette | every fill and stroke colour, mapped to the product's tokens |
| perspective | flat, isometric, or three-quarter |
| detail | roughly how many shapes, and the smallest feature's size |
| people | whether people appear, and how they are drawn |

Where the art is only a raster image, measure what you can from pixels
(palette, stroke weight) and mark the fingerprint `derived`.

Write the fingerprint down before drawing anything. Two illustrations that
disagree on stroke or perspective are an inconsistency to report, not a
licence to pick either.

## Drawing

- Start from the moment's meaning in one noun phrase: "an empty tray",
  "a check inside a document", "a magnifier over an empty list".
- Same viewBox scale as the product's art, the same stroke and caps, the
  same fill approach.
- Colours by reference only, in a `style` attribute so a variable works:
  `style="fill: var(--color-…, #fallback)"`, or `currentColor` for an SVG
  placed inline. One accent at most.
- Simple geometry: rectangles, circles, rounded paths. Optimise to a few
  dozen path commands.
- No text, no logos, no real products.
- Test at the size it is shown, and in dark mode if the product has one.

## Reuse by meaning

| moment | common meanings in product art |
|---|---|
| empty (first use) | an empty container, a blank page, a seedling |
| empty (no results) | a magnifier, an empty list, a filter |
| success | a check, a tick in a circle, a completed document |
| error | a broken link, a warning sign, a cloud with a cross |
| offline | a cloud with a slash, an unplugged cable |
| locked | a padlock, a closed box |

Match the product's own meaning first: if its empty states show an empty
tray, a new empty state shows the same tray, not a seedling.
