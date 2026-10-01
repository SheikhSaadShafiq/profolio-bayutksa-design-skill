# States, by kind of control

The states each kind needs. "Same as …" means the product may draw them
alike; it still has to say so.

| control | states |
|---|---|
| button | default, hover, pressed, focus, disabled (with the reason nearby), loading (label kept or replaced, width kept), success (when it confirms in place) |
| link | default, hover, pressed, focus, visited only where it helps the task |
| icon button | as a button, plus its accessible name and a tooltip on pointer devices |
| text field | empty, placeholder, focus, filled, disabled, read-only, error (with the message), success only where it helps |
| select / dropdown | closed, open, an option hovered and focused, selected, disabled, no options, loading options |
| checkbox / radio / switch | off, on, mixed (checkbox), focus, disabled, error |
| tab | default, hover, selected, focus, disabled, with a count when it has one |
| row / card that opens | default, hover, pressed, focus, selected, disabled, being removed |
| menu item | default, hover, focus, disabled, destructive, with a check when it is a choice |
| toggle that changes data | off, on, saving, failed (back to the old value, with a message) |
| drag handle | rest, grabbed, moving, over a valid drop, over an invalid drop, dropped |
| list | loading, empty (first use), empty (no results), error, partial (some failed), many (paging or scrolling), one |

## Disabled is a last resort

A disabled control hides why it cannot be used. Prefer:

- keep it enabled, and explain on press ("Add a phone number first");
- or show the reason next to it, all the time.

When it must be disabled, its reason is visible without hovering.

## Loading in place

A control that starts work keeps its size and position while it works, so
nothing jumps. Its label stays, with a spinner beside it, so a screen reader
and a person both still know what is happening. Pressing it again while it loads does nothing, and says nothing.
