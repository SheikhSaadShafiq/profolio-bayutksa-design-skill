# Applying the Human Interface Guidelines

In this skill's own words. For the full guidance on any topic, read Apple's
Human Interface Guidelines at developer.apple.com/design/human-interface-guidelines.

## Navigation

| need | iPhone | iPad |
|---|---|---|
| a few top-level areas (up to about five) | a tab bar at the bottom, always visible | a tab bar, or a sidebar for more areas |
| going deeper into one area | a navigation stack: a title, back at the top leading edge | the same, in the content column |
| a focused task (compose, edit, filter) | a sheet; a full-screen cover only when it needs all the attention | a sheet, often at a form size |
| a few actions on one thing | a context menu, or an action sheet | a context menu, or a popover |
| choosing among a few views of the same content | a segmented control | the same |
| search | a search field in the navigation bar | the same, or in the sidebar |

Never add a custom back control: the system's back button and edge swipe
are the way back. A tab bar never holds actions; actions go in the toolbar
or navigation bar.

In a right-to-left language the whole interface mirrors: back moves to the
top right, the swipe comes from the right edge, directional icons flip.
Numbers, media controls and clocks do not.

## Modality

- A sheet is for something the person can finish or cancel. It says what it
  is for, and has a clear way to finish (Done, Save) and to leave (Cancel,
  or swiping down).
- Ask before throwing away changes when a sheet is swiped away.
- An alert is for something important that needs a decision now: a short
  title, one or two sentences, and buttons that name the actions.

## Type

- Map the product's roles onto the system text styles: large title, title
  1 to 3, headline, body, callout, subheadline, footnote, caption 1 and 2.
- Use the product's typeface if it has one, registered to scale with
  Dynamic Type; otherwise San Francisco.
- Test at the largest accessibility sizes: layouts reflow (stack instead of
  side by side), nothing truncates that matters.

## Colour

- Map the product's palette onto semantic roles: label, secondary label,
  tertiary label, system background, secondary background, grouped
  background, separator, and the tint (the product's accent).
- Give every colour a dark-mode value, and check contrast in both.
- Never use colour alone for state.

## Layout

- Respect safe areas (the notch, the Dynamic Island, the home indicator)
  and the keyboard.
- Use the system's layout margins and readable content width for text.
- Design for every size class: compact width (iPhone portrait) and regular
  width (iPad, large iPhone landscape).

## Controls and icons

- Prefer native controls: lists (inset grouped for settings), switches,
  steppers, pickers, date pickers, segmented controls, menus.
- SF Symbols for system concepts, in the weight that matches the adjacent
  text, at the same scale.
- Touch targets at least 44 × 44 points, even when the visible control is
  smaller.

## Feedback

- Haptics for meaningful moments: a success, a warning, a selection
  change. Never decoration.
- Pull to refresh where content updates from a server.
- Swipe actions on list rows for frequent actions, each also available
  another way.

## Checklist

- [ ] One clear navigation model; back and dismiss behave like the system's.
- [ ] Native controls, tinted with the product's accent.
- [ ] Every text style scales with Dynamic Type; checked at the largest size.
- [ ] Semantic colours with dark-mode values; contrast passes in both.
- [ ] Safe areas, the keyboard and every size class handled.
- [ ] Targets at least 44 × 44 points.
- [ ] SF Symbols for system concepts; the product's icons for its own.
- [ ] VoiceOver: every element named, in a sensible order; custom
      controls expose their role and state.
- [ ] Reduce Motion and Reduce Transparency respected.
- [ ] The product's voice in every label; system words (Done, Cancel,
      Share) where the system has them.
- [ ] Right to left: the layout and back mirror; directional SF Symbols
      flip; numbers do not.
- [ ] Checked against Apple's guidelines for the OS version in scope.

## Apple Watch

- One glance, one task: the most important information first, actions few
  and large.
- Scroll with the Digital Crown; avoid anything that needs precise taps.
- Keep sessions short: a few seconds, not minutes.

## A web app on iPhone

- Use the safe-area insets (`env(safe-area-inset-*)`, with
  `viewport-fit=cover`) so nothing sits under the notch or the home
  indicator.
- Inputs at 16px or larger, so the browser does not zoom on focus.
- Nothing that needs hover; targets 44 × 44 points.
- The system font stack (`-apple-system`, `system-ui`) where the product
  has no typeface of its own.
