---
name: "design-motion"
description: Specify the motion in a design in the product's own style — what moves and why, durations and easing from its tokens, choreography (order, stagger, direction), how things enter and leave, what changes under reduced motion — and write the CSS (or platform code) that builds it. Use when a design has dialogs, sheets, menus, toasts, tabs, lists that change, loading that resolves, or state changes that should move; whenever someone asks for animation, transitions, micro-interactions, easing or timing; and when motion feels slow, jumpy, floaty or excessive. Takes its candidates from design-animation-opportunities when that has run. Works for any product and platform, inside its context card.
version: '1.0.0'
---

# Design motion

Move only what helps, at the product's speed, and let anyone turn it down.

## Why this exists

Motion explains change: where a sheet came from, what a list just lost,
that a press landed. Done badly it is the opposite: everything at 400ms
waiting for nothing, a bounce in a product that never bounces, a spinner
replaced by a jump. The product's tokens usually already say how fast it
moves. This skill applies them consistently, and gives engineering code
rather than adjectives.

## What this skill does NOT do

- It does not decide that something should move. Each motion has a
  purpose (feedback, orientation, state change, attention, continuity, or
  delight on a rare moment that is not work) or it is cut.
  `design-animation-opportunities` finds and gates the candidates.
- It does not invent a motion style. Durations and curves come from the
  card's `tokens.motion`; one the product lacks is `[new]`.
- It does not animate for decoration on screens people use to work.

## Inputs

| input | where it comes from | required |
|---|---|---|
| what changes | the design's states and transitions, or design-animation-opportunities' table | yes |
| the context card | `design/context.json` (`references/context.md`): `tokens.motion`, platforms | yes, built if missing |

## Run order

1. **Context.** Read the card's durations and easings. What the card lacks
   comes from the defaults in `references/tokens.md`, or is derived from the
   one duration it has (an exit at two thirds of it); either way it is
   recorded as `assumed` in the card and marked `[new]` in the spec.
2. **For each change**: the elements that move, the property (transform
   and opacity first: they do not shift layout), the purpose, the trigger.
3. **Timing** from `references/tokens.md`: a duration from the product's
   scale by size and distance; entering slower than leaving; easing by
   direction (out to enter, in to leave, in-out to move).
4. **Choreography**: what moves first, the stagger between items (small,
   and capped so a long list does not crawl), the direction (from where the
   thing came, back to where it goes).
5. **Reduced motion** (`references/reduced.md`): for each motion, what
   replaces it when `prefers-reduced-motion: reduce` is set.
6. **Code.** Write `motion.css` from `references/recipes.md`, using the
   product's own custom properties, or the platform's equivalent (SwiftUI,
   Compose) when the product is native.
7. **Emit** `motion.json`, checked with
   `python3 scripts/validate.py schema/motion.schema.json motion.json`, then
   `motion.md` and `motion.css`. Open the CSS in a browser on a real screen,
   with reduced motion on and off, before handing it over. One line in chat:
   the motions, their durations, and anything `[new]`.

## Rules

- **Fast by default.** Most interface motion is 100 to 300ms. What a
  person waits on before acting again (a button's response, a tab or page
  change) stays under 200ms; a dialog or sheet arriving is read, not
  waited on, and takes 200 to 300ms.
- **Exits are faster than entrances**, about two thirds of the time.
- **Transform and opacity**, never width, height, top or left: those move
  the layout and stutter.
- **Interruptible.** A motion can be reversed or cut short by the next
  input; nothing waits for an animation to finish before responding.
- **Reduced motion keeps the meaning.** A slide becomes a fade or an
  instant change; the feedback stays.
- **The same thing moves the same way everywhere.** Every sheet enters the
  same way; every toast leaves the same way.

## Output

```
motion.json  schema v1 (schema/motion.schema.json): each motion's trigger,
             purpose, elements, property, duration, easing, order, reduced
motion.md    the same as a table, with the reasons
motion.css   the code, using the product's tokens
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
output's shape is `schema_version` 1. `references/versioning.md` has the
policy.
