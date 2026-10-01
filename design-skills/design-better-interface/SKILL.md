---
name: "design-better-interface"
description: Polish a nearly finished design across five domains — accessibility, layout, writing, typography and visual detail — find the craft issues that make it feel unfinished before it is handed over or shipped, rank them by severity, and pin each one onto the design itself as a numbered annotation with its fix, in quick mode (high severity only) or full. Use when a design is close to done and someone asks to polish it, tighten it, clean it up, make it feel premium or check the details; and at the hi-fi gate after design-review and before design-qa. Reviews and annotates; it does not redesign. Works for any product, inside its context card.
version: '1.0.0'
---

# Better interface

The last pass before a design is called done: every detail checked, every
issue pinned where it is, every fix in the product's own terms.

## Why this exists

The difference between a design that feels finished and one that does not
is a hundred small things: an icon a pixel off-centre, two radii where there
should be one, a label in title case beside one in sentence case, a shadow
heavier than the rest. Each is trivial; together they are the impression.
A list of them is easy to lose; numbered pins on the design are hard to
miss and easy to work through.

## What this skill does NOT do

- It does not question the design's structure: `design-review` does that,
  before this pass.
- It does not measure every state and width: `design-qa` does that, after
  this pass.
- It does not redesign. Each finding fixes a detail inside the design as
  it is.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML screens (pins need HTML), or screenshots | yes |
| the context card | `design/context.json` (`references/context.md`) | yes, built if missing |
| the mode | `quick` (high severity only) or `full` | no; full by default |

## Run order

1. **Context.** Read the card: its tokens are the measure of "consistent".
   If design-review has run, read its `review.json`: a detail it already
   reports is cited by its id (`R-007`), not reported again. Its levels map
   to this skill's: blocking → high, important → medium, polish → low.
2. **Look closely.** Render each screen at its platform width and look at
   the picture zoomed in, not only at the markup.
3. **Five domains**, one at a time, with `references/domains.md`:
   accessibility, layout, writing, typography, visual detail.
4. **Rank**: high (looks broken or excludes someone), medium (looks
   unfinished), low (refinement). In quick mode, keep the highs.
5. **Pin.** Write `polish.json` and check it with
   `python3 scripts/validate.py schema/polish.schema.json polish.json`. Each
   finding's `screen` is the screen's file name, and it points at its element
   with a CSS `selector`, or with a `region` on a screenshot. Then, for every
   screen, run
   `node scripts/annotate.mjs <screen.html> polish.json --out <dir> --png --width <platform width>`.
   Each screen gets a copy with numbered pins and the full list beside it,
   and a picture. The script names any finding it could not pin: an element
   not found, or not visible in this state.
6. **Emit**, then one line in chat: the count per severity, and the three
   to fix first.

## Rules

- **Every finding has a fix** in the product's tokens and components:
  "use `--radius-md` (8px) like the other cards", never "make it
  consistent".
- **Measure, don't eyeball**, where a number exists: the radius, the gap,
  the size, the contrast.
- **Consistency is with the product**, not with taste: two radii are
  fine if the product uses two on purpose (the card's tokens say).
- **One issue per pin.**
- **Optical, not only mathematical.** A play icon centred by its box looks
  off; say so, and how much to nudge it.

## Output

```
polish.json                schema v1 (schema/polish.schema.json): the findings
<screen>.annotated.html    each screen with its numbered pins and the list
<screen>.annotated.png     a picture of it, when a browser is available
better-interface.md        the findings by severity, for people
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
output's shape is `schema_version` 1. `references/versioning.md` has the
policy.
