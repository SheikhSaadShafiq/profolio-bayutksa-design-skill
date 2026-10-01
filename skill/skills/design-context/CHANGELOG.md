# Changelog — design-context

The skill version and the card's schema version move independently. Consumers
pin to the schema version.

## [1.0.0] — 2026-10-01
Context card schema: v1

### Added
- The context card, `design/context.json` (`schema/context.schema.json`):
  product, sources with hashes, platforms, locales, tokens (colour, type,
  spacing, radius, shadow, motion, breakpoints), grid, components, voice,
  assets, accessibility target, rules and gaps. Every value carries its
  provenance: measured, derived or assumed.
- `scripts/scan.py`: reads named values from CSS custom properties, token
  JSON, Tailwind, iOS colour sets and Android resources, and the most-used
  literals, into a draft card. A token sheet wins over a compiled stylesheet.
  `--merge` fills only what an existing card lacks.
- `references/sources.md`: how to read each kind of source, best first.
- `references/context.md`: the context step every design-* skill shares.
