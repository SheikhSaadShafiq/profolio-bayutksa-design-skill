# Hierarchy

## Roles

| role | used for | typical step |
|---|---|---|
| display | one message on a banner, hero or empty state | the scale's largest, or a flagged display size |
| title | the page's name | the largest product step |
| heading | sections and cards | one or two steps below the title |
| body | sentences and descriptions | the base size |
| label | fields, table headers, buttons, tabs | the base, or one step down |
| caption | help, timestamps, meta | one step below body |
| numeral | values people compare: prices, counts, stats | as its role, tabular figures |

Map each role to a step of the card's `tokens.type.scale`. Two roles can
share a step and differ by weight.

## Reading

- **Line length**: 45 to 75 characters for body on web; shorter on phones
  is fine.
- **Line height**: about 1.4 to 1.6 × the size for body; tighter (1.1 to
  1.3) for large headings.
- **Paragraph spacing**: more than the line height, so paragraphs read as
  units.
- **Alignment**: start-aligned (left in LTR, right in RTL). Centre only
  short display text. Never justify interface text.
- **Weight**: two or three weights per screen at most.

## Scripts

When the product ships a second script, each needs its own face, and the
pairing is checked side by side:

- **Arabic beside Latin**: Arabic letterforms read smaller at the same
  size, and need more line height (they have tall ascenders and deep
  descenders). Match optical size, not the number. Never letter-space
  Arabic, never set it in italic, and never break a word across lines.
- **Direction**: an RTL screen mirrors its layout: start is right. Numbers,
  Latin names and URLs inside Arabic text keep their own direction.
- **Digits**: use the digits the product uses in that locale (Western or
  Arabic-Indic), the same everywhere on the screen.
- **Length**: a label can run longer in another language. Give it room,
  or a shorter form, before it wraps.

## Truncation and wrapping

| text | when it is too long |
|---|---|
| a name or title in a list | one line, an ellipsis, the full text on hover and in its detail view |
| a description | clamp to two or three lines, with a way to read it all |
| a button | never truncate: shorten the copy |
| a price, status or number | never truncate: make room |
| a table cell | wrap, unless the column is a name that truncates |
