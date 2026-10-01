# The QA gate

## Policy

Run design-qa before building anything. Read `report.json`. Then:

| report verdict | action |
|---|---|
| `pass` | build |
| `pass_with_warnings` | build; every warning goes into open questions |
| `blocked` | stop; report the blockers; do not build |

A deliverable built on a failed design is worse than no deliverable. It is a
confident, circulated, hard-to-retract record of something broken, and it will
be implemented from.

## Ready to QA

QA itself needs preconditions. Check these before invoking it:

- every screen named in the registry (or the person's states list) for this
  feature exists on disk
- the design system's own validation passes, if it has one
- the report is the hi-fi's: a wireframe's (`scope.profile: wireframe`) is
  refused

The intake comes after the gate: there is no point confirming ten rows for
a design that is about to be sent back.

If any fail, the problem is upstream. Say so and stop rather than QA'ing a
half-built screen set and reporting fifty findings that are all the same fact.

## Schema compatibility

This skill accepts `report.json` with `schema_version: 1`.

If QA emits a schema this skill does not accept, stop. Do not guess at the
shape — a deliverable assembled from a misread report is worse than no
deliverable, for the same reason as above.

## Waivers

Waivers live with QA (`waivers.json`), not here. This skill reads them; it
never grants them. Granting a waiver from inside the deliverable build would
mean the thing being gated controls the gate.

Every waived blocker appears in the deliverable's open-questions section with
its reason, who granted it, and its expiry. A reader should never be able to
open a deliverable and be unaware that something was waived to produce it.

## What QA feeds

Five of the seventeen sections are generated from the report rather than
authored. This is the practical argument for gating first — QA is not
overhead, it is where most of the document comes from.

| report content | section |
|---|---|
| every matrix case, rendered | `state-screens` |
| `section_hint: edge-cases` findings | `edge-cases` |
| `section_hint: accessibility` findings | `accessibility` |
| `checks_run` with status `pass` | `acceptance` |
| warnings, waived blockers, open `[TBC]` | `open-questions` |

`scripts/consume_report.py` does the mapping.

## When QA and the design disagree

QA is right by default. A check that fires on a correct design is a bug in the
check, and it gets fixed in the QA skill with a changelog entry — not worked
around here, and not silenced by lowering a severity.
