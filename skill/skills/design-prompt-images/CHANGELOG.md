# Changelog — design-prompt-images

## [1.0.0] — 2026-10-01

### Added
- One art-direction style block per set, reused word for word in every
  prompt, filled from the product's context card: market, audience and
  palette.
- One prompt per slot (`references/prompts.md`): subject, setting,
  composition with clear space for the design's text, the slot's aspect
  ratio, then the style block. Edits say what changes and what stays.
- Generation when an image tool is connected. Every result is looked at,
  and anything off-brief is regenerated. Generated images are named and
  marked as generated.
- No text in images. Nothing presents a real person, brand or place as
  something it is not.
