# Changelog — design-better-interface

The skill version and the output's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Polish schema: v1

### Added
- Five domains (`references/domains.md`): accessibility, layout, writing,
  typography and visual detail, measured against the product's tokens.
- Severity high, medium or low. Quick mode keeps the highs.
- `scripts/annotate.mjs`: numbered pins on each screen's own HTML, drawn
  at load so they follow the layout, and the list beside the screen. A
  finding whose element is not found is listed, and says so. `--png`
  saves a picture of it.
- `polish.json` (`schema/polish.schema.json`) and `better-interface.md`.
