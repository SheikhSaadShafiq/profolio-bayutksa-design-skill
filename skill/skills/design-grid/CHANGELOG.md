# Changelog — design-grid

The skill version and the output's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Grid schema: v1

### Added
- The grid measured from the product's own renders
  (`references/measure.md`): content column, margins, gutters, columns,
  spacing scale and base unit, at each platform width. Values are written
  back to the context card.
- A proposed grid only where the product has none, flagged `[new]`.
- The placement of each new screen's blocks per width, and what reflows
  between breakpoints.
- `grid-overlay.css` (`references/overlay.md`) to check alignment by eye.
- `grid.json` (`schema/grid.schema.json`) and `grid.md`.
