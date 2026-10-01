# The context step

Every `design-*` skill starts here, before it makes or judges anything. A skill
that picks a style before it knows the product makes work that looks fine on
its own and wrong next to the product: the third shade of green, a 14px label
in a product that uses 13, a bounce in a product that never moves.

The result of this step is the **context card**: `design/context.json`, plus
`design/context.md` for people. Every skill reads the same card, so the search
happens once.

## 1. Find a card

Look, in this order, and stop at the first one found:

1. A path the caller passed, e.g. `--context path/to/context.json`.
2. `design/context.json` in the working folder, then at the project root.
3. A design-system skill **for this product**, loaded in this conversation,
   that ships a `context.json` at its root. Check the card's `product.name`
   is the product you are working on: a card for another product is never
   used. Copy it to `design/context.json`, adding a source of kind `card`
   with the original's path and hash, so a later skill can tell when the
   design-system skill's card changes. Then use it.

A card is current when `sources[].hash` (the first 12 hex digits of each
file's sha1; `ref` is relative to the project root) still matches. If one
changed, re-run the scanner with `--merge`: it re-reads the values that came
from the changed file and keeps everything else. A card copied from a
design-system skill (a `card` source) is copied again when that skill's card
changed: the skill keeps it current.

## 2. No card: build one

`design-context` builds the full card. Any other skill builds the short form
itself: `product` (its name, market and audience), `sources`, `platforms`,
`locales`, `tokens` (colour, type, spacing, motion), `rules` and `gaps`, the
fields a skill needs to stay inside the product's style. Every skill carries the scanner for it:

```bash
python3 scripts/scan.py <the product's code> --name "<product>" --out design/context.json --merge
```

Then fill what code cannot say from the sources below, in the same order,
stopping as soon as a field is filled:

1. **A design-system skill** in the conversation: its token sheet, component
   registry, copy and assets.
2. **The project's code**: CSS custom properties, a Tailwind config, theme
   files (JS, TS, JSON), iOS asset catalogues and SwiftUI, Android themes and
   Compose, font files, the component library.
3. **Rendered screens of the shipped product**: HTML files, a URL,
   screenshots, a Figma link of what is live. Never the design being made or
   judged: its mistakes would become the standard. Measure from the render
   where a browser is available (`scripts/browser.mjs` finds or installs
   one); estimate from images otherwise.
4. **The brief** the person gave.
5. **Nothing found**: ask one question, naming the product, the platform and
   the brand colour, or go on with neutral defaults marked `assumed`.

Ask once, never per call. A style chosen per request is a different style per
request.

**When two sources disagree** (the theme says one grey, the shipped screen
renders another), record both under `gaps`, use what the shipped product
renders, and ask once if it matters to the task.

## 3. Provenance

Every value in the card says where it came from:

| provenance | meaning |
|---|---|
| `measured` | stated directly by the product: a named token in its code, a value its running code resolves, a computed style read from a render |
| `derived` | inferred: from how often a literal is used, from config read without running it, from screenshots, from the pattern of several values |
| `stated` | given by the person or the brief ("the app ships at 375") |
| `assumed` | a default, because nothing in reach said |

A skill may build on an `assumed` value, but it flags every output that
depends on one. An `assumed` value presented as fact is the failure this
whole step exists to prevent.

Check a card, and any JSON this skill writes, against its schema with the
validator every skill carries: `python3 scripts/validate.py <schema> <file>`.

## 4. Working inside the card

- **No new values.** Colours, sizes, fonts, spacing and durations come from
  the card. A value the card does not have is a proposal: it is marked
  `[new]` with the reason, for the designer to accept or replace.
- **The product's rules win.** The card's `rules` override this skill's
  defaults. If they conflict with an accessibility minimum, keep the minimum,
  and flag the conflict.
- **Name things the product's way.** Use the card's component names, colour
  roles and copy terms, not generic ones.
- **Write back what you learn.** A skill that measures something the card
  lacked adds it, with its provenance, so the next skill starts further on.

## 5. Without a browser

Some fields are measured from a render. If no headless browser is available,
fill them from code where possible, mark the rest `derived` or `assumed`, and
say so in the output. Never present a static guess as a measurement.
