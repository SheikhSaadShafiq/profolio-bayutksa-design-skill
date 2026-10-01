# Reduced motion

When a person sets `prefers-reduced-motion: reduce` (iOS: Reduce Motion;
Android: Remove animations), motion that moves things across the screen is
replaced. The meaning stays.

| motion | under reduced motion |
|---|---|
| a slide, a zoom, a parallax | a fade of 100ms or less, or an instant change |
| a sheet or dialog entering | it appears, with a short fade |
| a list reordering | the new order appears |
| press feedback (a scale) | a colour change instead |
| a loader that spins | it may keep turning: it carries meaning |
| autoplaying video, background movement | paused, with a play control |
| decorative motion | none |

Never remove feedback itself: a pressed state, a toast, a progress bar still
appear. Only their movement goes.
