# The grid overlay

A stylesheet that draws the columns over any screen, so alignment can be
checked by eye. Fill in the values from the grid; add one block per
breakpoint. It uses logical properties, so it mirrors in a right-to-left
layout by itself.

```css
/* grid-overlay.css: add class="grid-on" to <html> to show it */
html.grid-on::after {
  content: "";
  position: fixed;
  inset-block: 0;
  inset-inline-start: calc(var(--grid-offset, 0px) + var(--grid-margin));
  inset-inline-end: var(--grid-margin);
  max-inline-size: var(--grid-max, none);       /* the columns and gutters only, margins excluded */
  margin-inline: var(--grid-center, 0);          /* auto for a centred layout; 0 when it starts at the margin */
  pointer-events: none;
  z-index: 2147483647;
  background: repeating-linear-gradient(
    to right,
    rgba(255, 0, 80, 0.08) 0,
    rgba(255, 0, 80, 0.08) calc((100% - (var(--grid-columns) - 1) * var(--grid-gutter)) / var(--grid-columns)),
    transparent calc((100% - (var(--grid-columns) - 1) * var(--grid-gutter)) / var(--grid-columns)),
    transparent calc((100% - (var(--grid-columns) - 1) * var(--grid-gutter)) / var(--grid-columns) + var(--grid-gutter))
  );
}
[dir="rtl"].grid-on::after { transform: scaleX(-1); }   /* the stripes start at the right edge */
:root { --grid-columns: 12; --grid-gutter: 24px; --grid-margin: 24px; --grid-max: none; --grid-offset: 0px; --grid-center: 0; }
@media (max-width: 767px) { :root { --grid-columns: 4; --grid-gutter: 16px; --grid-margin: 16px; } }
```

- `--grid-offset` is the width of a fixed side rail, so the columns start
  where the content does.
- `--grid-margin` is the distance from the viewport (or the rail) to the
  first column: the content column's margin plus its padding, as measured.
- `--grid-center: auto` only for a layout whose content column is centred
  at a maximum width.

Unequal tracks (`2fr 1fr 1fr 140px`, the grid's `tracks`): the striped overlay
draws equal columns only. Check those with the screen's own grid instead:
outline every cell (`[style*=grid] > * { outline: 1px solid rgba(255,0,80,.4) }`)
and compare its edges with the header's.

Check it on a screenshot at each width: the first column's edge sits on the
content's start edge. The overlay colour is only for checking; it never ships.
