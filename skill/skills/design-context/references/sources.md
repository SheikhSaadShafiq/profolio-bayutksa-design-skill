# Reading each kind of source

Best first: a source that names values beats one that only uses them, and a
render beats a picture of a render.

## A design-system skill

Look for `context.json` at its root first; a skill that follows this contract
ships one, and it is already curated. Otherwise read its token sheet (named
values: `measured`), its component registry (`components`), its copy files
(`voice`) and its asset folders (`assets`). Never read its instructions to
infer values; read its data.

## CSS, SCSS, Less

Custom properties (`--name: value`) are the product's named values.
`scripts/scan.py` reads them, resolves `var()` one level at a time, and
classifies each by name, then by shape: colour, size, line height, weight,
radius, shadow, duration, easing, breakpoint, spacing.

A compiled stylesheet (antd, Material, Bootstrap) also names hundreds of
component internals. Where a file named like `tokens.css` exists, its values
win; the rest are the library's, not the product's.

Literals are read for frequency: the font sizes, paddings, radii and
durations used most say what the scale really is, as `derived`.

## Tailwind

`tailwind.config.*` is code, and the script does not run it. It reads the
literal colours and font families out of the theme as `derived`. If the
project's packages are installed, print the resolved theme and record it as
`measured`:

```bash
node -e "const r=require('tailwindcss/resolveConfig');console.log(JSON.stringify(r(require('./tailwind.config.js')).theme,null,1))" > tailwind.theme.json
```

Tailwind 4 keeps its theme in CSS (`@theme { --color-brand: … }`): those are
custom properties, and the scanner reads them like any others.

## Design-token JSON

The W3C format (`$value`, `$type`) and Style Dictionary (`value`, `type`) are
both read. The token path becomes the name: `color.brand.primary`.

## iOS and Android

- iOS: `*.colorset/Contents.json` (colours), the asset catalogue, and
  `Font` / `UIFont` names in code. Sizes are in points; record the unit.
- Android: `res/values/colors.xml`, `dimens.xml`, `themes.xml`, and Compose
  `Color(...)` / `MaterialTheme` definitions. Sizes are in dp and sp.

## A render: HTML files or a URL

With a headless browser, read `getComputedStyle` for a handful of real
elements, never all of them. In the page:

```js
const read = (sel) => { const e = document.querySelector(sel); if (!e) return null;
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  return { sel, font: s.font, size: s.fontSize, line: s.lineHeight, weight: s.fontWeight, family: s.fontFamily,
           color: s.color, bg: s.backgroundColor, radius: s.borderRadius, shadow: s.boxShadow,
           padding: s.padding, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; };
JSON.stringify(['body', 'h1', 'main', 'button', 'table tr', '[class*=card]'].map(read).filter(Boolean));
```

Adjust the selectors to the product's own; each row is one reading:

| element | gives |
|---|---|
| body text | the base size, line height, family, colour |
| the main heading | the top of the scale |
| a primary button | the brand colour, control height, radius, label size |
| a card or panel | surface colour, radius, shadow, padding |
| a table row or list item | row height, dense text size |
| the content column | the grid: its width, side margins, gutter between columns |

Do it at each platform width the product is drawn at. Those widths are the
`platforms`.

## Screenshots

A picture gives colours and proportions, not values. Read colours from
pixels as `derived`, and sizes only relative to something whose size you
know. Never write a screenshot reading as `measured`.

## Figma

If a Figma connector is available, read the file's variables and styles: they
are named values (`measured`). Without one, a Figma link is a screenshot.

## A brief

A brief gives the product, the audience, the market, the platforms and,
sometimes, rules ("never use red for prices"). It rarely gives values. Quote
rules verbatim into `rules`.
