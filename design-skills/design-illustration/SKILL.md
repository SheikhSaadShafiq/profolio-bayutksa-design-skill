---
name: "design-illustration"
description: Find or make the illustrations a design needs — empty states, first use, success and error moments, onboarding, banners and spot art — reusing the product's own art first, and drawing new SVG only when nothing fits, in the product's measured style (stroke, palette, fills, perspective, level of detail), every new piece flagged for the designer. Use when a screen needs a spot illustration, an empty-state picture, a hero or banner graphic, or onboarding art; whenever someone asks for an illustration; and when the product's existing art needs an audit for consistency. For icons use design-icons; for photographs use design-prompt-images. Works for any product, inside its context card.
version: '1.0.0'
---

# Design illustration

Use the product's own pictures first; draw new ones only in its hand, and
say which are new.

## Why this exists

An illustration in a different style from the rest of a product is noticed
at once, and an empty state without one feels unfinished. Most products
already own a small set of drawings that covers the common moments. Reusing
them keeps the product consistent; drawing in their measured style, when a
new one is truly needed, keeps it so.

## What this skill does NOT do

- It does not draw icons. Use the design-icons skill for those, when it is
  installed.
- It does not make photographs or realistic scenes. `design-prompt-images`
  writes prompts for those.
- It does not ship new art as final. Every new drawing is `[new art]`,
  for the designer to accept, redraw or replace.
- It does not put words inside a drawing: text lives in the interface, so
  it can be translated.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the moments | where the design needs a picture, and what each moment means | yes |
| the context card | `design/context.json` (`references/context.md`): `assets.illustrations`, palette | yes, built if missing |
| the product's art | its illustration files, or the screens that show them | no, but reuse needs them |

## Run order

1. **Context.** Read the card's assets and palette.
2. **Inventory** the product's art, with `references/style.md`: every
   illustration it ships, what each one shows, and the style fingerprint
   they share (stroke width, line caps, fills, palette, perspective,
   detail, size).
   **A product with no art yet:** take the fingerprint from its interface
   instead (its icon stroke, radii, palette and corner style), mark it
   `assumed`, and ask once: line or filled, and how many colours. The first
   drawing then sets the style for the rest.
3. **Reuse by meaning.** For each moment, an existing drawing that means
   the same thing ("nothing here yet", "all done", "something went
   wrong") is used as it is, with its source.
4. **Draw what is missing**, as SVG, inside the fingerprint
   (`references/style.md` § Drawing): the same viewBox scale, stroke and
   fills, colours only from the palette (as `currentColor` or the
   product's custom properties), the same level of detail.
5. **Alternatives.** Each picture gets its alternative text, or is marked
   decorative when the words beside it say everything.
6. **Emit** the SVGs and `illustration.md`: each moment, reused or
   `[new art]`, its file, where it goes, its alternative. One line in
   chat.

## Rules

- **The fingerprint is measured**, not described from memory: the stroke
  in px at the size it is shown, the palette as values.
- **Fewer, simpler shapes than you think.** Spot illustrations in
  interfaces are small; detail turns to noise at 120px.
- **Themeable.** Colours come from the palette by reference, so the art
  follows a theme or dark mode: placed inline in the screen, with
  `style="fill: var(--token, #fallback)"` (a CSS variable does not work in
  an SVG attribute, and an SVG used as an image file cannot see the page's
  variables, so it also needs the fallback). A palette colour with no CSS
  variable (one only in a Tailwind theme, say) is written as its value, with
  the token's name in a comment.
- **Light.** An inline SVG for an empty state stays under 10KB; optimise
  paths, no embedded raster images.
- **Neutral and respectful.** People drawn are diverse and appropriate to
  the product's market; nothing in a drawing is a real brand or person.

## Output

```
illustrations/   the SVGs (new ones named <moment>.new.svg)
illustration.md  each moment: reused or [new art], file, placement, alt
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry.
`references/versioning.md` has the policy.
