# Changelog — design-motion

The skill version and the output's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Motion spec schema: v1

### Added
- Timing from the product's tokens, with defaults only where it has none
  (`references/tokens.md`): duration by what moves, exits faster than
  entrances, easing by direction, capped stagger.
- Recipes in CSS (`references/recipes.md`): dialog, sheet, menu, toast,
  row removal, skeleton to content, press feedback. Transform and opacity
  only.
- Reduced motion per kind of motion (`references/reduced.md`): the
  meaning stays, the movement goes.
- `motion.json` (`schema/motion.schema.json`), `motion.md` and
  `motion.css`.
