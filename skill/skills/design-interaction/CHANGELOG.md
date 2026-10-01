# Changelog — design-interaction

The skill version and the spec's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Interaction spec schema: v1

### Added
- States per kind of control (`references/states.md`). Disabled is a last
  resort, and its reason is always visible. A control loads in place.
- The feedback timeline per action (`references/feedback.md`): instant,
  running, long, done, failed, undo. Also when to be optimistic, and
  when to confirm instead of offering undo.
- Touch, pointer and keyboard (`references/touch.md`): target minimums
  from the context card, a visible alternative for every gesture, nothing
  only on hover, the keyboard path, and where focus goes.
- `interaction.json` (`schema/interaction.schema.json`) and
  `interaction.md`.
