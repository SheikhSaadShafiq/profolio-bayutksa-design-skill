# Changelog — design-forms

The skill version and the spec's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Form spec schema: v1

### Added
- Fields traced to a need. Order and grouping, and one column unless the
  fields belong together.
- Each field (`references/fields.md`): the input chosen by the value,
  autocomplete, defaults, required or optional, and its edge values
  (empty, longest, another script, pasted).
- Validation (`references/validation.md`): rules run when the person
  leaves a field, and an error clears as soon as it is fixed. Errors say
  what to do, next to the field. On submit, focus moves to the first
  problem. Nothing is ever lost.
- Submission: while it runs, success, failure, drafts, and multi-step
  progress.
- `form.json` (`schema/form.schema.json`) and `form.md`.
