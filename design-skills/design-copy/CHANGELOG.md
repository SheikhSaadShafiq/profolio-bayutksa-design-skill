# Changelog — design-copy

The skill version and the deck's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Copy deck schema: v1

### Added
- Reuse first: the product's own strings are searched by meaning before
  any new copy is written. A match is used verbatim, with its source.
- Patterns per kind of slot (`references/patterns.md`): button, heading,
  label, help, empty state, error, confirmation, toast, tooltip, numbers.
- Every language the product ships. New strings are written natively, and
  marked for a native speaker's review.
- Fit: each string is checked against the room its slot has, in every
  language.
- `copy.json` (`schema/copy.schema.json`) and `copy.md`. Each slot is
  reused, new or a proposal, and carries the reviews it needs.
