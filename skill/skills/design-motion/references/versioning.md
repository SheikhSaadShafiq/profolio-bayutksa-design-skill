# Versioning

Two things carry a version here, and they move independently.

| version | lives in | changes when |
|---|---|---|
| **skill** | `SKILL.md` frontmatter, with a `CHANGELOG.md` entry | this skill's behaviour changes |
| **schema** | the `$id` of each file in `schema/` | an output's shape changes |

Scripts read the skill version from the frontmatter through
`scripts/_version.py`, never from a constant of their own: a constant drifts
the first time someone bumps one and not the other, and then an output claims
a version that never produced it.

Every JSON output records the skill that wrote it:

```json
{ "schema_version": 1, "skill_name": "design-review", "skill_version": "1.0.0" }
```

A Markdown output says the same in its first line, under its title:
`Written by design-review 1.0.0, against design/context.json.`

Consumers pin to the schema version, not to the skill version.

- **patch**: a fix that changes no output shape
- **minor**: new behaviour, or a new optional field in an output
- **major**: an output's shape changes. Every consumer breaks, so it needs a
  migration note in the changelog.

A bump without a changelog entry is indistinguishable from a mistake.
