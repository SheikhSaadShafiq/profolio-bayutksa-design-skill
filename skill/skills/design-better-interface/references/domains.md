# The five domains

What to look for in each. The context card's tokens are the reference for
"consistent"; a number below is a default only where the card has none:
hit targets 24px on the web, 44pt on iOS, 48dp on Android; large text is
24px, or 18.66px bold; contrast 4.5:1, or 3:1 for large text and icons.

## Accessibility

- Text and icons against their background: 4.5:1 for text, 3:1 for large
  text, icons and control edges.
- Focus visible on every control, and not hidden under a sticky bar.
- Icon-only buttons have a name; images have alternatives.
- Targets at the platform's minimum; nothing important only on hover.
- Colour never the only signal of a status.

## Layout

- Edges line up: headings, content and controls share column edges.
- Gaps are steps of the spacing scale; related things sit closer.
- Elements of one kind are the same size: cards in a row, buttons in a
  bar, avatars in a list.
- Nothing crowds an edge: padding inside a container matches its siblings.
- Long content (a long name, a big number, another language) has room.

## Writing

- One casing convention per kind of text (buttons, headings, labels),
  matching the product's.
- Buttons say what they do; no "OK" or "Submit".
- The product's terms, never synonyms.
- No placeholder text, no lorem, no "TBD" left in.
- Numbers, dates and money in the product's format.

## Typography

- Sizes only from the scale; four or fewer per screen.
- Weights consistent for the same role across screens.
- Line height comfortable for body; tighter for big headings.
- Tabular figures where numbers are compared.
- No widows in short headings; no orphaned single words on a button.

## Visual detail

- Radii: the same component, the same radius; nested corners follow the
  outer radius minus the padding.
- Borders and dividers: one weight and one colour per role.
- Shadows: the product's elevation steps only; no shadow heavier than the
  layer it marks.
- Icons: one size and one stroke per context, optically centred in their
  boxes.
- Colours: only the palette; states (hover, pressed, selected) consistent
  across components.
- Images: crisp at the shown size, cropped with the subject in view, no
  stretched aspect ratios.
- Motion: the same thing moves the same way everywhere, at the product's
  durations; nothing moves without a reason.
