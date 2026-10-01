# Finding and gating candidates

## Where to look

| kind | the signal | example |
|---|---|---|
| feedback gap | an action whose result is not visible at once, or is off-screen | Save, and nothing on screen changes |
| state change | something changes value or mode with no transition | a toggle that snaps; a count that jumps |
| spatial jump | something appears or disappears with no sign of where it came from or went | a panel that pops in; a deleted row that vanishes |
| arrival | content that loads after the page | a skeleton replaced by a jump |
| attention | something new the person must notice, outside where they look | a new message badge; an error far from the button |
| continuity | a view that changes but is the same thing | a card that opens into its detail |

## The four gates

Each candidate passes all four, or it is rejected with the gate it failed.

### 1. Frequency

How often does one person see it in a day of real use?

| seen | allowed |
|---|---|
| rarely (onboarding, a first success) | room for a little character |
| sometimes (opening a dialog) | the product's standard motion |
| constantly (typing, scrolling, a tab used all day) | 100ms or less, or none |

### 2. Purpose

What it is for, one of: **feedback** (the press landed), **orientation**
(where it came from or went), **state change** (what changed), **attention**
(look here), **continuity** (it is the same thing), **delight** (only on
rare, non-work moments). No purpose: rejected.

### 3. Speed

It fits the product's durations (the card). A motion **blocks input** when a
person must wait for it before their next action: a button's response, a tab
or page change, a list reordering they are waiting on. That stays under
200ms. A dialog or sheet arriving does not block: it is read, so it takes the
panel durations, 200 to 300ms. A candidate that only works slowly is
rejected.

### 4. Function

It never gets in the way: it does not delay the next action, move text being
read, hide information while it plays, or move enough to make someone
dizzy. A table of numbers never animates its values on every refresh.

## Timing

The product's tokens first. Where it has none, the defaults design-motion
uses: a control's own feedback 100–150ms; small things appearing (a menu, a
tooltip, a toast) 150–200ms; a panel or dialog 200–300ms; what blocks input
under 200ms; leaving at about two thirds of arriving; ease-out to enter,
ease-in to leave, ease-in-out to move. Every value not in the card is marked
`[new]`.

## The kept table

| # | element | trigger | purpose | frequency | recipe (tokens) | reduced motion |
|---|---|---|---|---|---|---|
| 1 | the row's Buy button | press | feedback | sometimes | label → spinner in place, `--motion-fast` | same, no scale |

## The rejected list

| element | idea | failed gate | why |
|---|---|---|---|
| table values | count up on load | function | numbers move while being read |
