---
name: "design-context"
description: Find a product's design language — platforms, colours, type, spacing and grid, radii, motion, components, voice, assets and rules — and write it as a context card (design/context.json) that every other design-* skill works inside, so new work matches what the product already is. Use at the start of any design task for a product whose style is not loaded yet; whenever someone asks what a product's tokens, fonts, colours, grid or tone are; when a design skill needs to match an existing product; and before making anything new for a product you have not seen. Reads a design-system skill, the project's code (CSS variables, Tailwind, token JSON, iOS and Android resources), rendered screens, screenshots, a URL or a brief, and marks every value measured, derived or assumed. Works for any product, on any platform.
version: '1.0.0'
---

# Design context

Find out what the product already looks and sounds like, once, and write it
down where every design skill can read it.

## Why this exists

Every design skill needs the same facts before it can do anything well: which
colours exist, which sizes, what the type scale is, how the product talks,
what it never does. Without them, each skill guesses, each guess is plausible,
and the guesses disagree: the copy skill writes in a tone the product never
uses, the motion skill picks 400ms in a product that moves in 200.

The card is the one place those facts live. It is built once, from the best
source in reach, and every value says where it came from.

## What this skill does NOT do

- It does not design or restyle anything. It records what is there.
- It does not invent a value to fill a gap. A gap is listed under `gaps`.
- It does not override rules the product states. They go into `rules`
  verbatim, and they win over any skill's defaults.
- It does not read other skills' instructions. It reads their files: token
  sheets, registries, copy, a shipped `context.json`.

## Inputs

| input | where it comes from | required |
|---|---|---|
| an existing card | `design/context.json`, or a path the caller passes | no |
| a design-system skill | loaded in the conversation; its `context.json`, token sheet, registry, copy | no |
| the project's code | the working folder or a path the person names | no |
| rendered screens | HTML files, a URL, screenshots, a Figma link | no |
| a brief | the person | no |

None is required on its own, but at least one has to exist. With nothing at
all, ask the one question in **Ask** below.

## Run order

1. **Find a card.** Follow `references/context.md` § 1. If a current card
   exists, stop here and report it.
2. **A design-system skill.** If one for this product is loaded and ships
   `context.json` at its root, copy it to `design/context.json` (with a
   `card` source, `references/context.md` § 1) and go to step 4: what the
   product draws is checked even when its card is shipped. If it ships only
   a token sheet and a registry, read them and fill the card by hand.
3. **Scan the code.** The product's own code: its stylesheets, theme and
   token files. Never the design files under review: a defect in a mockup
   would be recorded as a product value.

   ```bash
   python3 scripts/scan.py <the product's code> --name "<product>" --out design/context.json --merge
   ```

   It reads named values (custom properties, token JSON, Tailwind, iOS colour
   sets, Android resources) as `measured`, and the most-used literals as
   `derived`. Where a token sheet exists it wins over a compiled stylesheet,
   which also names every component's internals, and the card points at it
   (`tokens.file`). `--merge` keeps the values the card already has, except
   those from a file that changed since: those it re-reads. Two values for
   one name in two files are listed under `gaps`, to be asked about.
4. **Measure a render**, when there are shipped product screens and a browser
   (`scripts/browser.mjs` finds or installs one). `node scripts/measure.mjs
   <screen> --widths <platform widths> --fonts` reads the computed style of the
   key elements (or use the snippet in `references/sources.md`): body text,
   the main heading, a primary button, a card, a table row, the page's
   content column. That gives the type in use (the `font` shorthand
   included), the grid and the platform widths, as `measured`. Record what
   the product draws that its token sheet does not name under
   `tokens.in_use`: those values are the product's own, not `[new]`, even
   off its scale. Without a browser, estimate from screenshots as
   `derived`, and say so.
5. **Fill what code cannot say.**
   - `platforms`: the screen widths the product is drawn at, and each one's
     `min_target`: the product's own control size where it is measured,
     else WCAG 2.2's 24px for the web (a web product on a phone too), 44pt
     for a native iOS app and 48dp for Android.
   - `formats`: currency (its sign and where it goes), digits per locale,
     dates, times and numbers, as the product writes them.
   - `patterns`: how the product shows an error, a field error, an empty
     list, loading, success and a confirmation, so new work does the same.
   - `components`: the registry or library, and the names people use.
   - `voice`: ten real strings from the product (buttons, an empty state, an
     error, a toast), the tone in one line, and terms the product insists on.
   - `assets`: where the icons, illustrations and images are, and their style.
   - `a11y`: the target, WCAG 2.2 AA unless the product states another.
   - `locales`: each language with its direction and its typeface.
   - `rules`: what the product says it never or always does, quoted.
6. **Gaps.** List every family still empty, plainly. Ask the one question
   only if a gap blocks the caller's task.
7. **Write** `design/context.json` and check it:
   `python3 scripts/validate.py schema/context.schema.json design/context.json`.
   Then `design/context.md`: one short table per family, then the gaps and
   rules.
8. **One line in chat**: the product, how many values are measured, derived
   and assumed, and the gaps.

## Ask

Only when nothing in reach answers it, and only once:

> What product is this for, which platforms does it run on, and what is its
> main brand colour?

Propose an answer from whatever you have, with your confidence. A question
whose answer is in the code reads as not having looked.

## Rules

- **Provenance on every value.** `measured`, `derived` or `assumed`, as
  defined in `references/context.md` § 3. A card that cannot tell a measured
  value from a guess is worse than no card: it makes guesses look like facts.
- **Record, never prescribe.** If the product uses three greys where two
  would do, the card says three. Proposing two is another skill's job.
- **Short over complete.** The card is read at the start of every design
  task. A family with two hundred values keeps the ones with names, and
  points at the full sheet in `tokens.file`.
- **Stale is visible.** Every source carries a hash. When a later skill finds
  the hash changed, it rebuilds the fields that came from that source.

## Output

```
design/
  context.json   the card, schema v1 (schema/context.schema.json)
  context.md     the same, for people: one table per family, gaps, rules
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
card's shape is `schema_version` 1 in `schema/context.schema.json`. Consumers
pin to the schema. `references/versioning.md` has the bump policy.
