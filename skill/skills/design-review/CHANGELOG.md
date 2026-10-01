# Changelog — design-review

The skill version and the review's schema version move independently.
Consumers pin to the schema version.

## [1.0.0] — 2026-10-01
Review schema: v1

### Added
- Three modes: `structure` for wireframes, `craft` for hi-fi, and `quick`
  for blocking findings only.
- Findings ranked blocking, important or polish. Each one is pinned to an
  element, with what is there, why it matters, and a fix in the product's
  own tokens and components. Polish is capped at ten.
- `references/rubric.md`: the questions per dimension. Defaults apply only
  where the context card has no value, and they are named when used.
- `review.json` (`schema/review.schema.json`) and `review.md`. Re-reviews
  mark each earlier finding as fixed, still open or made worse.
