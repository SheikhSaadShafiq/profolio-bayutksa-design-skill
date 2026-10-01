# Changelog — design-accessibility

The skill version and the output's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Accessibility schema: v1

### Added
- WCAG 2.2 at level AA, for a design (`references/wcag22.md`). Each
  criterion is marked measured on the render (citing design-qa's check
  id) or judged.
- Fixes in the product's own tokens and components, ranked by what blocks
  a person entirely.
- Annotations for engineering (`references/annotations.md`): landmarks,
  the heading outline, the focus order, name, role and state, focus
  management, live regions, alternatives.
- `a11y.json` (`schema/a11y.schema.json`) and `a11y.md`. They never claim
  conformance, and they name the testing with assistive technology that
  comes next.
