# Touch, pointer and keyboard

## Targets

The card's `platforms[].min_target` is the minimum. Without one:

| platform | minimum | source |
|---|---|---|
| web, pointer | 24 × 24 px, or 24 px spacing around a smaller one | WCAG 2.2, 2.5.8 |
| web on a touch phone | 24 × 24 px is the minimum (WCAG); 44 × 44 px is the comfortable size, used wherever the layout allows | WCAG 2.2, 2.5.8 |
| iOS | 44 × 44 pt | Apple Human Interface Guidelines |
| Android | 48 × 48 dp | Material Design |

The target can be larger than what is drawn: padding counts. Two targets
closer than 8px apart get pressed by mistake.

## Gestures

Every gesture has a visible alternative that does the same thing:

| gesture | alternative |
|---|---|
| swipe a row | a button or a menu on the row |
| long press | a visible "more" button |
| drag to reorder | move up and down in a menu, or handles with keyboard support |
| pinch to zoom | zoom buttons |
| pull to refresh | a refresh button, or refresh on return |

Edge swipes belong to the system on phones (back, notifications, home);
never put a control's gesture there.

## Pointer

Hover can preview and reveal, never be the only way. Whatever appears on
hover (an action, a tooltip with information) is reachable by touch and by
keyboard too.

## Keyboard

| key | does |
|---|---|
| Tab / Shift+Tab | moves between controls, in reading order |
| Enter | activates a button or link; submits a form from a field |
| Space | activates a button; toggles a checkbox or switch |
| Escape | closes the dialog, menu or popover, and returns focus to what opened it |
| arrows | move within a group: tabs, radio buttons, menu items, a grid |

Focus is always visible, never hidden behind a sticky header or under a
sheet.

## Right to left

In a right-to-left layout the arrow keys follow the reading direction in a
horizontal group (the right arrow moves to the previous tab), menus open
aligned to the start edge (the right), and a swipe that means "back" comes
from the right edge. Vertical movement does not change.
