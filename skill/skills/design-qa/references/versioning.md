# Versioning

Three things carry a version here, and they move independently on purpose.
Coupling them would mean a patch to one forces a bump to all, and then nobody
bumps anything.

| version | lives in | changes when | who reads it |
|---|---|---|---|
| **skill version** | `SKILL.md` frontmatter | this skill's behaviour changes | humans, and `run.py` via `_version.py` |
| **report schema** | `schema/report.schema.json` | the report's shape changes | every downstream consumer |
| **platforms schema** | `schema/platforms.json` | the platform config shape changes | `run.py` |

## Single source of truth

Scripts read the skill version from `SKILL.md` frontmatter through
`scripts/_version.py`. No script carries its own constant.

A hardcoded constant drifts the first time someone bumps the frontmatter and
forgets the script, and then a document claims it was built by a version that
never built it. That is worse than having no version at all, because it is
confidently wrong.

## The report schema is the contract

Consumers pin to `schema_version`, never to this skill's version. That is what
lets the checks be rewritten entirely without touching anything downstream.

Every report records both, so a consumer can tell which skill produced it:

```json
{ "schema_version": 1, "qa_skill_name": "design-qa", "qa_skill_version": "1.0.0" }
```

Adding a field is a minor schema bump. Removing one, or changing what one
means, is major — and a major bump breaks every consumer, so it needs a
deliberate migration rather than a quiet edit.

## Check ids are permanent

A retired check keeps its id and is marked retired. Reusing an id would make
historical reports mean something different than they did when they were
written, and the whole point of a machine-readable report is that it stays
comparable over time.

## Bumping

- **patch** — a fix that changes no output shape
- **minor** — a new section, a new check consumed, a new field in the manifest
- **major** — the accepted report schema changes, the ledger shape changes, or
  the section id set changes

Every bump gets a `CHANGELOG.md` entry naming the schemas it accepts. A bump
with no changelog entry is indistinguishable from a mistake.
