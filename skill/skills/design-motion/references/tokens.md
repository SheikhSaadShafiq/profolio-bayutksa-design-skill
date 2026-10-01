# Timing

The card's `tokens.motion` wins. These defaults fill only what it lacks, and
are marked `assumed` when used.

## Duration, by what moves

| motion | duration |
|---|---|
| a control's own feedback: press, toggle, check | 100–150ms |
| small things appearing: a tooltip, a menu, a toast | 150–200ms |
| a panel or a dialog | 200–300ms |
| a full-screen change, a sheet across a phone | 300–400ms |
| what blocks input: a person waits on it before acting again (a button's response, a tab or page change) | under 200ms, or none |

Larger and farther moves take longer; small and near moves take less. Map
each row to the nearest of the product's named durations.

## Enter and leave

Leaving takes about two thirds of entering: a dialog in at 250ms, out at
170ms. People wait for things to arrive, not to go.

## Easing

| direction | curve | why |
|---|---|---|
| entering | ease-out (decelerate) | it arrives fast and settles |
| leaving | ease-in (accelerate) | it starts slow and is gone |
| moving on screen | ease-in-out (standard) | it starts and stops naturally |
| a loop (a spinner) | linear | it never starts or stops |

Use the product's named curves for each. A spring or an overshoot only where
the product already uses one.

## Stagger

When several items enter together, each starts 20–40ms after the one before,
capped at about 6 items: the rest enter with the sixth. A list of 40 never
takes a second and a half to appear.
