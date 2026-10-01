---
name: "design-grid"
description: Read or define a product's layout grid — columns, gutters, margins, maximum width, the spacing scale and its base unit, breakpoints, and how each layout changes between them — and place new screens on it, with an overlay to check every edge lines up. Use when designing a new page, dashboard or responsive layout; whenever someone asks about the grid, columns, spacing, breakpoints, density or why something does not line up; and when a design's spacing feels off. Measures the grid from the product's own renders when it has one, and proposes one, flagged, when it does not. Works for any product and platform, inside its context card.
version: '1.0.0'
---

# Design grid

Find the grid the product already uses, put new work on it, and show where
anything sits off it.

## Why this exists

Spacing that is almost right reads as wrong: a card 3px narrower than the
one beside it, a header that starts 12px right of its column. People feel it
before they can say it. A grid makes "aligned" checkable: every edge sits on
a column or a step of the spacing scale, or it is a mistake.

## What this skill does NOT do

- It does not impose a 12-column grid on a product that uses another. It
  measures what the product does and records it.
- It does not choose the components that go in the grid. It places them.
- It does not check rendered alignment in every state. design-qa's `lay`
  checks do that on every render.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML, screenshots, a URL or a Figma frame | yes |
| the product's screens | renders of existing pages, to measure | no, but measuring needs them |
| the context card | `design/context.json` (`references/context.md`): grid, spacing tokens, platforms | yes, built if missing |

## Run order

1. **Context.** Read the card's `grid`, `tokens.space` and `platforms`.
2. **Measure, if the card lacks it.** On a few of the product's own
   shipped screens, at each platform width, with
   `node scripts/measure.mjs <screen> --widths <widths>` and
   `references/measure.md`: the
   content column's width and margins, the gutters between repeated items,
   the column count, and the spacing values that recur. Record each as
   `measured`, and write it back to the card.
3. **Define what is missing.** If the product has no grid at some width,
   propose one that fits its existing spacing scale, flagged `[new]`.
4. **Place the design.** For each new screen: which columns each block
   spans, at each width, and which spacing step separates it from the
   next. Note what reflows, stacks or hides between breakpoints.
5. **Overlay.** Write `grid-overlay.css` (`references/overlay.md`), so the
   columns can be laid over any screen and checked by eye.
6. **Emit** `grid.json` (`schema/grid.schema.json`) and `grid.md`, then one
   line in chat: the grid per width and anything off it.

## Rules

- **Every gap is a step of the scale.** A value between two steps is
  either a mistake or a new step, and a new step needs a reason.
- **Edges line up across a screen**: a card's content, the heading above
  it and the table below share a left edge unless there is a reason.
- **Related is closer.** The space between things in one group is
  smaller than the space between groups.
- **Breakpoints are the product's**, not a framework's defaults: one value
  per boundary, with no off-by-one pairs like 767/768.
- **Content first.** A column narrower than its content's natural line is
  not saved by a grid.

## Output

```
grid.json         schema v1 (schema/grid.schema.json): per platform width,
                  the grid, the spacing scale, and each screen's placement
grid.md           the same, with a picture of the columns per width
grid-overlay.css  paste into a screen to see the columns
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
output's shape is `schema_version` 1. `references/versioning.md` has the
policy.
