---
name: "design-review"
description: Give a design a senior designer's critique — whether its structure serves the task and whether it is well made — as ranked findings (blocking, important, polish), each pinned to an element, with the reason it matters and a concrete fix in the product's own tokens and components. Use whenever someone asks for a design review, critique, feedback or a second opinion; asks "is this good", "what would you change" or "what's wrong with this screen"; before a wireframe or a hi-fi design is shown to anyone; and after a redesign, to check it improved. Works on HTML, screenshots, a URL or a Figma frame, for any product and platform, inside the product's own style (design-context). Judges; it does not measure every state — design-qa does that — and it does not fix.
version: '1.0.0'
---

# Design review

Critique a design the way a senior designer would: against what it is for and
what the product already is, ranked, with a fix for every finding.

## Why this exists

A design can pass every measurable check and still be wrong: the main action
sits below a table nobody reads, three things compete for first look, the
empty state apologises instead of helping. None of that is a rule violation,
so a QA run passes it. It is judgment, and judgment is cheapest before anyone
has seen the design.

## What this skill does NOT do

- It does not measure every state, platform and locale. That is design-qa's
  job, and the two run side by side: review asks "is it good?", QA asks "does
  it hold up everywhere?".
- It does not fix. It proposes the fix; the skill or person that made the
  design applies it.
- It does not restate a QA finding. If a design-qa `report.json` is in reach,
  anything it already reports is left out.
- It does not judge by taste. Every finding cites the goal, the product's own
  patterns (the context card), or a principle with a user consequence.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML files, screenshots, a URL or a Figma frame | yes |
| the goal | the brief, a PRD, or one line from the person: who does what here | yes |
| the context card | `design/context.json` (`references/context.md`) | yes, built if missing |
| a QA report | design-qa's `report.json` | no |
| the mode | `structure`, `craft` or `quick` | no; from the design's fidelity |

## Modes

| mode | when | looks at |
|---|---|---|
| `structure` | a wireframe, or a hi-fi whose layout is still open | the task, flow, hierarchy, what is on each screen and in what order, states, content priorities |
| `craft` | a hi-fi design | everything in `structure`, plus type, spacing and alignment, colour and contrast, components and their states, consistency with the product, copy, motion, responsiveness |
| `quick` | a fast pass, or a re-review after fixes | blocking findings only |

## Run order

1. **Context.** Read the card, or build it (`references/context.md`). The
   review's numbers (contrast, target sizes, durations, the type scale) come
   from it; `references/rubric.md` has the defaults for what it lacks.
2. **The goal in one line**: who is here, and what they came to do. If the
   brief does not say, ask; a review without a goal can only judge taste.
3. **Look at it.** Render each screen at its platform widths
   (`scripts/browser.mjs` finds or installs a headless browser) and look at the
   pictures, not only the markup. Open what opens: menus, dialogs, sheets.
4. **Walk the task** through the screens as that person, step by step.
   Where they hesitate, backtrack or cannot tell what happened is a
   structural finding.
5. **The rubric.** Go through `references/rubric.md` for the mode, one
   dimension at a time.
6. **Rank and cap.** Blocking first, then important, then polish; within a
   level, by how many people it affects and how badly. At most ten polish
   findings: a long list of small things hides the big ones.
7. **Emit** `review.json` and check it:
   `python3 scripts/validate.py schema/review.schema.json review.json`. Then
   `review.md`.
8. **One line in chat**: the counts per level and the three findings to fix
   first.

## Severity

- **blocking**: someone cannot complete the task, or will do the wrong
  thing; or an accessibility minimum fails on the task's path. The design
  does not go forward. The same failure away from the task's path (a
  footer, a rarely used setting) is important.
- **important**: the task works but is slower, harder or less clear than it
  should be; or the design breaks the product's own patterns.
- **polish**: craft. Alignment, rhythm, a weight or a colour that is close
  but not right.

## A finding

Every finding has all of these, or it is not a finding:

- **where**: the screen and element: a node id, a CSS selector, or a region
  of a screenshot.
- **what**: what is there, with the measured value when there is one
  ("the label is 12px #9D9D9D on white, 2.71:1").
- **why**: the consequence for the person using it, not the rule's name.
- **fix**: concrete, in the product's terms: the token, the component, the
  copy. "Use the product's secondary text colour (#626262, 6.10:1)", never
  "improve contrast". A value the shipped product already draws (the card's
  `tokens.in_use`) is the product's own; only a value it has nowhere is
  `[new]`.

## Rules

- **What works, in one line.** Say what to keep, so a fix does not lose it.
  It is not a finding and is not counted.
- **Against the product first.** If the product solves this somewhere else,
  the fix is to do it the same way. A better idea that breaks consistency is
  a proposal, flagged, not a fix.
- **One problem per finding.** Two problems in one finding get half-fixed.
- **Re-reviews compare.** After fixes, read the last `review.json`; mark each
  finding fixed, still open, or made worse, and look for what the fix broke.

## Output

```
review.json   schema v1 (schema/review.schema.json): verdict, findings, what works
review.md     the same for people: the verdict, then findings by level
```

The verdict is `ready`, `ready after fixes` (no blocking findings left), or
`not ready` (any blocking finding).

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
output's shape is `schema_version` 1. `references/versioning.md` has the
policy.
