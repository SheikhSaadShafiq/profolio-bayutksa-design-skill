---
name: "design-animation-opportunities"
description: Find where motion would genuinely help an interface — gaps in feedback, state changes that happen without explanation, spatial jumps, content arriving or leaving — and reject what would not, passing every candidate through four gates (how often it is seen, what it is for, whether it fits the speed budget, whether it gets in the way) into a ranked table, each kept candidate with its motion recipe in the product's tokens and each rejected one with its reason. Use when someone asks what could animate here, wants a screen to feel more responsive, smoother or more alive, or is about to add motion to a design; and before design-motion specifies anything. Works for any product and platform, inside its context card.
version: '1.0.0'
---

# Animation opportunities

Find the few places where motion makes an interface clearer, and say no to
the rest.

## Why this exists

Motion is usually added where it is easy, not where it helps: a fade on
every card, a bounce on a button used forty times a day. The places that
need it are quieter: the moment after Save when nothing changes, the row
that vanishes with no trace, the panel that appears from nowhere. A short,
gated list beats a screen that moves everywhere.

## What this skill does NOT do

- It does not write the motion code. It hands the kept candidates, with
  their recipes, to `design-motion`.
- It does not keep a candidate that fails a gate because it would look
  nice. Delight is a purpose only where nobody is trying to get work done.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML, screenshots, a URL or a Figma frame, with its states | yes |
| the context card | `design/context.json` (`references/context.md`): `tokens.motion` | yes, built if missing |

## Run order

1. **Context.** Read the card's motion tokens: they set the speed budget
   and the recipes.
2. **Scan for candidates**, with `references/gates.md` § Where to look:
   feedback gaps, state changes, spatial jumps, arrivals and departures,
   attention a person needs to notice.
3. **Gate each one** with the four gates in `references/gates.md`:
   frequency, purpose, speed, function. A candidate that fails any gate is
   rejected, with the gate and the reason.
4. **Recipe** for each kept one: the element, trigger, property, duration
   and easing (the product's tokens; the timing rules are in
   `references/gates.md` § Timing), and the reduced-motion version.
5. **Rank** the kept ones: feedback gaps first, then orientation, then
   state changes, then continuity, then attention, then delight.
6. **Emit** `opportunities.md`: the kept table, the rejected list with
   reasons, and a verdict (how much motion this screen needs, possibly
   none). One line in chat, and the hand-over to design-motion.

## Rules

- **No purpose, no motion.** Every kept candidate names what it is for.
- **Frequent means faster, or nothing.** Something seen fifty times a day
  gets 100ms, or no motion at all.
- **Never slow the work.** Nothing animates between a person and the next
  thing they want to do, longer than the speed budget.
- **Dense information stays still.** Numbers, tables and text being read
  do not move under the reader.
- **"No motion needed" is a valid result**, and the right one more often
  than not.

## Output

```
opportunities.md   kept (ranked, with recipes), rejected (with the gate
                   and reason), and the verdict
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry.
`references/versioning.md` has the policy.
