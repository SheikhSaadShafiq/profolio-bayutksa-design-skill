# Changelog — design-typography

The skill version and the output's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Type spec schema: v1

### Added
- Roles (display, title, heading, body, label, caption, numeral), each
  mapped to a step of the product's scale. At most four sizes per screen.
- Reading: line length, line height, paragraph spacing, alignment and
  weight (`references/hierarchy.md`).
- A second script: faces, optical size, line height, direction and digits
  per locale, with every label checked at its longest.
- Truncation and wrapping by kind of text.
- Display type for banners, promos, heroes and explorations
  (`references/display.md`). New sizes continue the scale's ratio and are
  flagged `[new]`.
- `type.json` (`schema/type.schema.json`) and `type.md`.
