# Changelog — design-deliverables

Three versions move independently: this skill, each deliverable document, and
the QA report schema this skill consumes. Keeping them separate is what lets
any one of them move without breaking the others.

## [1.1.0] — 2026-10-01
Report schema accepted: v1

### Added
- `scripts/assemble.py`: builds the deliverable's `index.html` from the
  section set, design-qa's fragments, the sections the session writes, and
  the screens (each in its own frame, with the redline inspector and the
  node ledger inside). It also takes a prototype, design-interaction's
  `interaction.json`, design-motion's `motion.json`, and the context card's
  tokens and platforms. A section with no source is listed as not
  applicable, with the reason.
- The context step (`references/context.md`). A registry is optional: the
  screens, the card and the person's answers stand in.

### Changed
- The gate refuses a wireframe's QA report: a hand-over is built on the
  hi-fi's.
- `references/gate.md`: the design system's validation only if it has one,
  and the intake comes after the gate.

### Fixed
- `assign_ids.py --annotate` marked every start tag in order, so `<html>`,
  `<head>` and `<body>` took the controls' ids. It now marks exactly the
  nodes that got ids, at their start tags' positions.
- A node's text no longer picks up the text that follows it, such as the
  next row's. Void elements (`img`, `input`) no longer corrupt the
  structural path.
- Inserting a row no longer renumbers the rows below it. Matching now runs
  in passes, sure to least sure: same content first, then same path. The
  fingerprint carries the row the node sits in, so ten identical "View"
  buttons are ten different nodes.
- `_version.py` strips the frontmatter's quotes.

## [1.0.1] — 2026-09-29
Accepts QA report schema: v1 · Node ledger version: 1 · Sections schema: v1

### Changed
- Scripts read the skill version from `SKILL.md` frontmatter via
  `scripts/_version.py` instead of hardcoded constants.
- `assign_ids.py` refuses a ledger newer than it understands rather than
  rewriting it with older rules, which would corrupt every id in it.
- Bundled documents are stamped with builder skill, builder version and
  accepted QA schema, so a file found later is self-describing.
- The build manifest records ledger version, QA report schema and a content
  hash.

### Added
- `ids.json` keeps a 50-entry assignment history — when, which screen, which
  skill version, nodes added and retired. This is what makes a
  version-to-version diff possible.
- `references/versioning.md`.

## [1.0.0] — 2026-09-29
Accepts QA report schema: v1 · Node ledger version: 1

### Added
- Single-file output as a hard rule. `scripts/bundle.py` inlines CSS, JS,
  fonts, images, Lottie, the node ledger and the QA report, then fails the
  build if any remote reference survives.
- Stable numeric node ids, Figma-shaped `{screen}:{node}`, with a committed
  ledger and five-step matching so inserting a row does not renumber
  everything below it (`scripts/assign_ids.py`).
- Seventeen-section registry with stable string ids and computed display
  numbers (`schema/sections.json`).
- QA gate: build refuses on unwaived blockers (`references/gate.md`).
- Report consumption: five sections generate from `report.json` rather than
  being authored (`scripts/consume_report.py`).
- Intake table that proposes from the PRD and asks only about gaps.
- Generic prototype model — flows keyed on node ids, feature as a parameter.

### Known gaps
- The redline panel works but has only been checked against hand-written
  fixtures, not a real bundled deliverable.
- `assign_ids.py --annotate` writes ids in document order; it has not been
  tested against deeply nested SVG sprite sheets.
- No deliverable-to-deliverable diff yet. The ledger makes it possible —
  nodes added, retired, fingerprint changed — but nothing generates it.
- Font subsetting is documented in `references/bundling.md` but not automated.
