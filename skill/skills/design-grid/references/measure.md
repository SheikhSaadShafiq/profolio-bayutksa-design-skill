# Measuring a grid from a render

With a headless browser (design-qa's `scripts/browser.mjs` works for any
skill), open a few of the product's own screens at each platform width and
read boxes with `getBoundingClientRect()`. Never read a grid off one screen:
take three or more, and keep what they share.

## What to read

| measure | how |
|---|---|
| content column | the left and right edges of the main content container, below the header and beside any rail; its max width when the window is wider |
| margins | the distance from the viewport (or the rail) to the content column, each side |
| gutter | the gap between items in a repeated row: cards, stat tiles, form columns |
| columns | the content width divided by where repeated items start; check that the starts fall on equal steps |
| spacing scale | the gaps that recur between stacked blocks; round to the nearest step and count |
| base unit | 8 if at least 80% of the gaps are multiples of 8, else 4 if at least 80% are multiples of 4, else none (record the gaps as they are) |

## Reading it

`node scripts/measure.mjs <screen> --widths 1440,375` reads the content
column (its edges, margins, padding and max width), the gutters between
repeated items, and where blocks start. Or, inside the page:

```js
const main = document.querySelector('main, [role=main]')
  || [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return e.children.length && b.width >= innerWidth * 0.4 && b.height > 120; })
       .sort((a, b) => b.getBoundingClientRect().height - a.getBoundingClientRect().height)[0]
  || document.body;
const r = main.getBoundingClientRect(), cs = getComputedStyle(main);
const kids = [...main.querySelectorAll('*')].filter(e => {
  const b = e.getBoundingClientRect();                 /* on screen only: an off-screen track is not a column */
  return b.width > 120 && b.height > 40 && b.left >= r.left - 1 && b.right <= innerWidth + 1;
});
const lefts = {};
kids.forEach(e => { const x = Math.round(e.getBoundingClientRect().left - r.left); lefts[x] = (lefts[x] || 0) + 1; });
JSON.stringify({ content: [Math.round(r.left + parseFloat(cs.paddingInlineStart)), Math.round(r.right - parseFloat(cs.paddingInlineEnd))], max: cs.maxWidth,
  lefts: Object.entries(lefts).sort((a, b) => b[1] - a[1]).slice(0, 12) });
```

The most frequent left edges are the column starts. Their steps give the
column plus gutter. Their count gives the columns.

## Recording

Each value goes into the card's `grid.<platform>` as `measured`, with the
screens it was read from. A value inferred from screenshots instead is
`derived`. A value proposed because the product has none is `assumed` and
marked `[new]` in the output.
