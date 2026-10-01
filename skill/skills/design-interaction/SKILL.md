---
name: "design-interaction"
description: Specify how every control in a design behaves — its states (default, hover, pressed, focus, selected, disabled, loading, error), the feedback for each action (at once, while it runs, when it is done, when it fails), touch targets and spacing, gestures with a non-gesture way to do the same, keyboard paths, and where focus goes after each action — inside the product's own patterns. Use when designing or reviewing any interactive screen; whenever someone asks what happens on tap, click, hover or swipe, which states a control needs, or how a screen responds while something loads; when a design shows controls but no states; and before handing interactions to engineering. Works for any product and platform, inside its context card.
version: '1.0.0'
---

# Design interaction

Say what every control does, in every state, on every input, and what the
person sees at each moment after they act.

## Why this exists

A static design shows one moment. People live in the others: the half
second after they tap Buy, the button they cannot press yet, the swipe they
did not know was there, the dialog that closed and left focus nowhere. Those
moments decide whether a design feels solid or broken, and engineers fill
in whatever the design leaves out, each one differently.

## What this skill does NOT do

- It does not design the look of a state from scratch: states use the
  product's own (the card's components and tokens). A state the product
  has never drawn is a proposal, marked `[new]`.
- It does not design forms in depth: fields, validation and errors are
  `design-forms`.
- It does not write the motion: durations and easing are `design-motion`.
  It says what moves and why; that skill says how.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML, screenshots, a URL or a Figma frame | yes |
| the actions | what each control does, from the brief or the design | yes |
| the context card | `design/context.json` (`references/context.md`): components, platforms, minimum target | yes, built if missing |

## Run order

1. **Context.** Read the card, or build it. Its platforms decide the input
   (pointer, touch, keyboard, all three) and the minimum target size.
2. **List the controls**, screen by screen: each button, link, field,
   toggle, tab, row, card or gesture someone can act on, and what it does.
3. **States.** For each control, the states it has, from
   `references/states.md`, each drawn the way the product draws it. A
   control that can be unavailable says why when the person meets it.
4. **Feedback.** For each action, the timeline in `references/feedback.md`:
   what changes at once, what shows while it runs, what confirms it, what
   happens if it fails, and whether it can be undone.
5. **Input.** For each control: the target size against the card's
   minimum and the spacing to its neighbours, the keyboard path (Tab,
   Enter, Space, Escape, arrows), and for every gesture a visible way to
   do the same without it (`references/touch.md`).
6. **Focus.** Where focus goes when a dialog opens and closes, after a
   row is removed, after an error, after a page changes.
7. **Emit** `interaction.json`, checked with
   `python3 scripts/validate.py schema/interaction.schema.json interaction.json`,
   and `interaction.md`, then one line in chat: the controls, the states
   specified, and anything `[new]`.

**Words and order.** Run after design-forms and before design-copy. This
skill drafts the words a state needs (a toast, a disabled reason); design-copy
writes the final ones, and each control points at its `copy_slot`.

## Rules

- **Every action answers within a tenth of a second.** Even when the work
  takes longer, something changes at once: the press state, a spinner in
  the button, the row greying out.
- **No dead ends.** A disabled control says why. A failed action says
  what to do. A destructive one can be undone, or asks first.
- **Nothing only on hover.** A touch screen has no hover; whatever hover
  reveals is reachable another way.
- **Nothing only by gesture.** Swipe-to-delete also has a visible delete.
- **One press, one action.** A control that does something different on a
  second press (toggle aside) is a bug waiting to happen; say what a
  double press does.
- **The product's patterns first.** If the product shows loading inside
  its buttons, a new button does too.

## Output

```
interaction.json  schema v1 (schema/interaction.schema.json): per control,
                  its states, feedback timeline, input and focus
interaction.md    the same as a table per screen, for the design and for engineering
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
spec's shape is `schema_version` 1. `references/versioning.md` has the
policy.
