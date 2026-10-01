# Versioning

Five things carry a version, and they move independently on purpose. Coupling
them would mean a patch to one forces a bump to all, and then nobody bumps
anything.

| version | lives in | changes when | who reads it |
|---|---|---|---|
| **skill version** | `SKILL.md` frontmatter | this skill's behaviour changes | humans, and every script via `_version.py` |
| **deliverable version** | `--version`, stamped into the document | the document is reissued | reviewers, sign-off |
| **report schema** | owned by design-qa | the report's shape changes | this skill, via `ACCEPTED_SCHEMA` |
| **ledger version** | `ids.json` | the node ledger's shape changes | `assign_ids.py` |
| **sections schema** | `schema/sections.json` | the section set changes | this skill |

## Single source of truth

Scripts read the skill version from `SKILL.md` frontmatter through
`scripts/_version.py`. No script carries its own constant.

A hardcoded constant drifts the first time someone bumps the frontmatter and
forgets the script, and then a document claims it was built by a version that
never built it. That is worse than having no version at all, because it is
confidently wrong.

## Compatibility

Each skill declares what it accepts rather than assuming:

- `consume_report.py` accepts report schema `{1}`. A report at schema 2 stops
  the build instead of being misread. A deliverable assembled from a misread
  report is a confident record of the wrong thing.
- `assign_ids.py` refuses a ledger newer than it understands. Letting an older
  script rewrite a newer ledger would corrupt every id in it, and ids are the
  one thing here that must never break.
- A ledger older than current is migrated forward and the migration is logged.

## What is stamped where

The bundled document carries its own provenance, so a file found on a shared
drive two years from now is self-describing:

```html
<meta name="deliverable-feature" content="…">
<meta name="deliverable-version" content="3">
<meta name="deliverable-built"   content="2026-09-29T…">
<meta name="built-by"            content="design-deliverables 1.0.0">
<meta name="qa-schema-accepted"  content="1">
```

The build manifest additionally records the ledger version, the QA schema the
report came from, and a content hash.

## Ledger history

`ids.json` keeps the last 50 assignment runs: when, which screen, which skill
version, how many nodes, how many new, how many retired.

This is what makes a version diff possible. Because ids are stable, "what
changed between v2 and v3" is answerable — nodes added, nodes retired, nodes
whose fingerprint changed — and that diff is what a reviewer opening v3
actually wants, rather than re-reading the whole document.

## Bumping

- **patch** — a fix that changes no output shape
- **minor** — a new section, a new check consumed, a new field in the manifest
- **major** — the accepted report schema changes, the ledger shape changes, or
  the section id set changes

Every bump gets a `CHANGELOG.md` entry naming the schemas it accepts. A bump
with no changelog entry is indistinguishable from a mistake.
