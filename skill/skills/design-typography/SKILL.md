---
name: "design-typography"
description: Set the type in a design inside the product's own scale — the hierarchy on each screen, sizes, weights, line heights and line lengths, numerals, truncation and wrapping, how a second script (Arabic beside Latin, or any other pair) sits with the first, and display type for banners, promos, heroes and explorations — and flag any size, weight or face the product does not have. Use when designing a new screen, banner, campaign or onboarding moment; whenever someone asks which font, size or weight to use, why a heading feels weak or a screen feels busy, or how Arabic should look beside English; and when type needs a consistency review. Works for any product, inside its context card.
version: '1.0.0'
---

# Design typography

Use the product's type to say what matters first, and make it hold up in
every language and at every length.

## Why this exists

Type is most of an interface. A screen with six sizes has no hierarchy; a
heading one weight too light loses to the table under it; a label that fits
in English wraps in Arabic and pushes a button off its row. The product's
scale already answers most of this. The job is to use it with intent, and
to notice the few places it truly runs out.

## What this skill does NOT do

- It does not add a typeface. A face the product does not use is a brand
  decision, proposed and flagged, never slipped in.
- It does not change the product's scale. A size the scale lacks is a
  proposal `[new]`, with the reason the existing steps do not work.
- It does not write the words. `design-copy` does; this skill makes them
  readable.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML, screenshots, a URL or a Figma frame | yes |
| the context card | `design/context.json` (`references/context.md`): type families, scale, locales | yes, built if missing |
| the surface | product screen, or display (banner, promo, hero, exploration) | yes |

## Run order

1. **Context.** Read the card's `tokens.type` (families and scale) and
   `locales`. Note the faces per script and the sizes that exist.
2. **Roles per screen.** Assign each piece of text one role from
   `references/hierarchy.md` (display, title, heading, body, label,
   caption, numeral) and each role one step of the scale. A screen uses at
   most four sizes; weight and colour do the rest.
3. **Check what renders.** `node scripts/measure.mjs <screen> --fonts`
   (Chromium) names the face that actually draws each element's text, which
   can differ from the stylesheet: a font that did not load, a button in the
   browser's default face because form controls do not inherit it (they need
   `font: inherit`), Arabic falling back to whatever the system has. Each is
   a finding.
4. **Check reading.** Line length, line height, the space between
   paragraphs, alignment, and numerals (tabular in tables and prices).
5. **Second script.** For each locale, the face, the optical size, the
   line height and the direction (`references/hierarchy.md` § Scripts).
   Check every label at its longest in every language.
6. **Display type**, for banners, promos and explorations, with
   `references/display.md`: one message, the scale's largest steps or a
   flagged display size, contrast over images, and how it scales down.
7. **Emit** `type.json`, checked with
   `python3 scripts/validate.py schema/type.schema.json type.json`, and
   `type.md`: the roles, each piece of text's role and step, and the `[new]`
   list. Then one line in chat.

   A scale whose steps do not keep one ratio is continued from its top two
   steps (their ratio); the new step is `[new]`.

## Rules

- **Hierarchy with as little as possible**: size first, then weight, then
  colour. Changing all three at once shouts.
- **One typeface per script** unless the product already pairs two.
- **Body text 14px or more on screens; no text under 11px.**
- **Numbers line up**: tabular figures wherever numbers are compared, in
  columns, prices and counts.
- **Text is never in a picture**, so it can be translated, resized and read
  aloud.
- **Truncate only what can be recovered**: an ellipsis on a name is fine if
  the full name is one tap away; never on a price or a status.

## Output

```
type.json   schema v1 (schema/type.schema.json): roles, assignments, [new]
type.md     the hierarchy per screen and the decisions, for people
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
output's shape is `schema_version` 1. `references/versioning.md` has the
policy.
