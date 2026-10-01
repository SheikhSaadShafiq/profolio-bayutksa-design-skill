---
name: "design-deliverables"
description: Produce a design deliverable — a single self-contained HTML document with every asset inlined, covering summary, interactive prototype, screens with redlines and numeric node ids, rules, motion, gestures, edge cases, assets, tokens, accessibility, acceptance criteria and open questions. Use this whenever a design is finished and needs handing to engineering, review or sign-off; whenever a user mentions a design deliverable, design handoff, redlines, design spec, prototype document, or asks for "the deliverable" or "something to send to the devs"; and whenever screens exist and someone asks what to give the implementing team. Runs design QA first as a gate and refuses to build on unresolved blockers. Platform-agnostic: works for web, iOS, Android, tablet, desktop, watch or anything else, and never assumes a specific screen set, product or design system.
version: 1.1.0
---

# Design Deliverables

Turn finished screens into one self-contained HTML document that an engineer
can implement from without asking a follow-up question.

## The one hard output rule

**Every deliverable is a single HTML file with every asset inlined.** Fonts as
base64 woff2, images as data URIs, Lottie as inline JSON, CSS and JS in
`<style>` and `<script>`. No network requests, no sibling files, no CDN.

The reason is that these documents get emailed, dropped in Slack, opened on a
plane, and opened two years later. A deliverable that renders differently
depending on whether a font server is reachable is not a record of anything.

Sources live split in git. `scripts/bundle.py` produces the single file as a
build artifact. Never hand-maintain the bundled file — edit sources, rebuild.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the screens | the design's HTML | yes |
| design-qa's `report.json` | the hi-fi's QA (a wireframe's is refused) | yes |
| the context card | `design/context.json` (`references/context.md`): tokens, platforms | yes, built if missing |
| a registry | a design-system skill | no: the screens and the person's answers stand in |
| `interaction.json`, `motion.json`, a prototype | design-interaction, design-motion, the design | no: each feeds its section |

## Run order

1. **Context.** Read the card, or build it.
2. **Gate.** Read `references/gate.md`. Read design-qa's `report.json` (run
   design-qa first if there is none). If it is a wireframe's, or there are
   unwaived blockers, stop and report them. Do not build a deliverable on a
   design that failed QA: the document would be a confident record of
   something broken.
3. **Intake.** Ask the questions below. Propose answers from the PRD, the
   card and the QA report first; ask only about what you could not fill.
4. **Ids.** Run `scripts/assign_ids.py --screen <screen> --name <screen>
   --ledger ids.json --write --annotate <annotated screen>` for each screen. Every component, text node, icon and
   control gets a stable numeric id. Read `references/ids.md` before touching
   the ledger — the stability rules are the whole point.
5. **Sections.** Determine which of the section set applies
   (`schema/sections.json`). Build only those. Say plainly which do not apply
   and why, rather than padding the document.
6. **Consume QA.** `scripts/consume_report.py` turns `report.json` into
   fragments for state screens, edge cases, accessibility, acceptance and open
   questions. Five sections come from QA — that is the argument for gating first.
7. **Write** what only the session can: the summary, the rules, gestures,
   assets, performance, as `sections/<section id>.html` (or `.md`), from the
   brief, the intake and the design. Nothing is written to fill a shape.
8. **Assemble.** `scripts/assemble.py --feature <id> --version <n> --screens
   <annotated screens> --report report.json --fragments <dir> --written
   sections/ --context design/context.json --ids ids.json [--prototype …]
   [--interaction interaction.json] [--motion motion.json] --out src/`. Each
   screen sits in its own frame, so its CSS cannot reach the document's,
   with the redline inspector (`assets/redline-panel.js`, R) inside it. The
   tokens section lists only the tokens the screens use, with the card's
   values. A section with no source is listed as not applicable, with why.
9. **Bundle.** `scripts/bundle.py --src src/ --out <file> --feature <id>
   --version <n> --ids ids.json --qa-report report.json`. One file out.
10. **Version.** Bump the deliverable version, write the changelog entry inside
   the document, and diff against the previous version.

## Intake questions

Fill from the PRD and the QA report before asking. Present as a table with
your proposed answer and confidence; ask only about gaps. Asking something the
PRD already answers reads as broken.

| # | question |
|---|---|
| 1 | Feature name and deliverable id — new deliverable or a new version of an existing one? |
| 2 | Platforms — which ones, and one document or one per platform? Web, iOS, Android, tablet, desktop, watch, any combination. |
| 3 | Audience — implementing engineer, reviewing designer, or approving stakeholder? This changes the summary and whether redlines lead or appendix. |
| 4 | Scope — which screens and states? Derive from the design system registry and confirm. |
| 5 | Locales — English only, or Arabic too? |
| 6 | Which sections apply? Propose from the content; confirm the exclusions. |
| 7 | Is there motion or Lottie? If so, the motion and dotLottie sections activate. |
| 8 | Are assets final, or placeholder? |
| 9 | Who signs off, and what does sign-off mean here? |
| 10 | Any QA warnings to carry into open questions, or resolve first? |

If the user gives a PRD and says "just build it", still show the filled table
before building. Confirming ten rows costs one message; rebuilding a
seventeen-section document costs an afternoon.

## Sections

Canonical set in `schema/sections.json`, with stable string ids. Display
numbers are computed at render time from which sections apply — do not hardcode
them, or adding a section forces a lettered insert and section numbers stop
being stable references across deliverables.

| id | title | always |
|---|---|---|
| `summary` | Summary | yes |
| `prototype` | Interactive prototype | when flows exist |
| `button-states` | Button states | when interactive components present |
| `state-screens` | State screens | yes |
| `screens-redlines` | Screens, states and redlines | yes |
| `rules` | Rules | yes |
| `motion` | Interaction and motion | when motion specified |
| `dotlottie` | dotLottie | when a lottie asset exists |
| `gestures` | Gestures and behaviours | when a touch platform is in scope |
| `edge-cases` | Edge cases and error states | yes |
| `assets` | Assets | when assets exist |
| `tokens` | Tokens | yes |
| `accessibility` | Accessibility | yes |
| `performance` | Performance budget | when a budget is declared |
| `acceptance` | Acceptance criteria | yes |
| `platform-notes` | Platform notes | when more than one platform |
| `open-questions` | Open questions | yes |

`button-states`, `state-screens` and `edge-cases` are the same concept at three
scopes — component, screen, failure. Reviewers read them differently so they
stay separate sections, but all three generate from one source: the states
declared in the registry plus the QA findings. Authoring them independently
guarantees drift.

Detail on what each section needs: `references/sections.md`.

## Node ids

Figma-shaped: `{screen}:{node}` → `3:147`. Screen number from the registry,
node number monotonic within that screen.

The requirement is **stability**, not uniqueness. If ids are assigned by DOM
order at build time, inserting one row renumbers everything below it and every
redline reference in every ticket silently points at the wrong element — worse
than no ids at all.

So ids live in a committed ledger (`ids.json`), matched on regeneration by
role, structural path and content fingerprint. Assigned once, never reused, a
deleted node retires rather than freeing its number. Full rules in
`references/ids.md`.

Ids are also what flows and redlines both reference, so a prototype hotspot
survives a re-layout and QA findings can point at an exact element.

## Interactive prototype

Generic, per feature, in `prototype/flows.json`. Transitions key on node ids,
not CSS selectors. The runner needs: forward navigation, back, reset to entry,
a state picker per screen, deep-link (`?screen=…&state=…`) so a reviewer can
send someone straight to the thing they are commenting on, and a
hotspot-reveal toggle.

Never write flows specific to one feature into this skill. The feature is a
parameter.

## Versioning

Three independent version numbers. Keeping them separate is what lets any one
of them move without breaking the others.

- **Skill version** — frontmatter plus `CHANGELOG.md`. Semver.
- **Deliverable version** — per document, per feature. Shown in the document
  header, recorded in the manifest, and carrying a changelog section inside the
  document itself. A reviewer opening v4 needs to know what changed since v3
  without opening v3.
- **Report schema version** — owned by the QA skill. This skill declares which
  schema versions it accepts (currently `1`). If QA emits a schema this skill
  does not accept, stop rather than guessing at the shape.

The node ledger carries its own `ledger_version`, and `schema/sections.json`
carries a section schema version — five in total, all independent.

Scripts read the skill version from the frontmatter via `scripts/_version.py`;
none carries its own constant. `consume_report.py` refuses a report schema it
does not accept, and `assign_ids.py` refuses a ledger newer than it
understands rather than corrupting every id in it.

Every bundled document is stamped with its feature, version, build time,
builder skill and version, and the QA schema it was built against, so a file
found on a shared drive two years from now is self-describing.

Full rules and the bump policy: `references/versioning.md`.

## What this skill must not do

- Never change tokens, CSS or screen markup. If the design is wrong, that is
  the design system skill's job. A deliverable that quietly fixes something
  documents a screen that does not exist.
- Never restate the full token set. The tokens section is a filtered view of
  the tokens this deliverable actually consumes, each pointing back at the
  design system. A copy will disagree within a month.
- Never produce a section by inventing content to fill the shape. A section
  that does not apply is marked not applicable, with a reason.
- Never hand-edit a bundled file.

## Output

The single HTML file, plus a one-line summary: feature, version, sections
included, sections excluded, open question count, and file size against budget.
Do not paste the document contents into chat.
