---
name: "design-qa"
description: Test a product's screens — wireframes and hi-fi alike — against every case that matters (states, roles, flags, platforms, locales, breakpoints), render each one, open what opens, push content to its extremes, and emit a machine-readable pass/fail report. Use whenever screens, pages or components have been built or changed and someone needs to know whether they hold up; whenever a user mentions design QA, checking states, empty states, edge cases, accessibility, contrast, RTL, responsive checks, or asks "is this design ready"; before a wireframe or a hi-fi design is shown or handed over; and ALWAYS before a design deliverable is produced, because the deliverable consumes this report. Works on any product's HTML, with or without a design-system registry, inside the product's own context (design-context).
version: 1.1.0
---

# Design QA

Test rendered design HTML against a case matrix. Produce `report.json`
(machine contract, schema v1) and `report.html` (for humans).

It runs at both gates of a design: on the wireframe before the structure is
agreed (`--profile wireframe`), and on the hi-fi before it is delivered.

This skill is a **gate**, not a report generator. Its output decides whether
downstream work proceeds. Treat a blocker as a stop, not a note.

## Why this exists

Design work fails in predictable places, and almost none of them are visible
in a happy-path mockup: the empty state was never drawn, the long Arabic
string wraps into the button, the table header colour is 2.8:1 on white, the
flag-off variant renders a blank card. Each of those is cheap to catch by rule
and expensive to catch in production. That is the whole job here.

## What this skill does NOT do

- It does not fix anything. It reports. Fixing is the design system skill's job.
- It does not change tokens, CSS, or markup. If a check fails, the design is
  wrong, not the check.
- It does not know what a deliverable is. Never read the deliverables skill.
  The contract between them is `report.json` and nothing else.

## Inputs

| input | where it comes from | required |
|---|---|---|
| screen HTML files | whoever made the design | yes |
| the context card | `design/context.json` (`references/context.md`) | yes, built if missing |
| `registry.json` | a design-system skill | no: without it, the coverage and parity checks are skipped and the case matrix comes from the person |
| `tokens.css` (or equivalent token sheet) | the design-system skill, or the card's `tokens.file` | no: the `tok` checks need it |
| `product/copy.md`, `product/flags.md`, `product/roles.md` | the design system skill | for copy/flag/role checks |
| `waivers.json` | this skill's own output dir, if it exists | no |
| `platforms.json` | `schema/platforms.json`, or the project's own override | yes |

If `registry.json` is missing, do not guess the state list. Ask the person
which screens and states the design covers, write them to `states.json`
(`{"pages": {"orders": {"states": ["default", "loading", "empty", "error"]}}}`)
and pass `--states states.json` to both `matrix.py` and `run.py`. Without
it, the coverage checks are skipped, and the report carries a warning that
the empty state was not checked.

Platforms are whatever the registry and `platforms.json` declare — web, iOS,
Android, tablet, desktop, watch, or anything else. Nothing in this skill
assumes a platform set, and per-platform minimums (hit target, safe area,
breakpoints, whether gestures exist) come from config. If a project needs a
platform that is not in `platforms.json`, add it there rather than here.

## Run order

0. **Context.** Read the card, or build it (`references/context.md`). Its
   platforms, widths, hit-target minimum and motion durations set what the
   render pass measures against.
1. **Scope.** Read `registry.json` if there is one. Identify what is being
   QA'd — one component, one page, a feature, or everything. If ambiguous,
   ask.
2. **Build the matrix.** Run `scripts/matrix.py`. Read `references/matrix.md`
   for the classification rules. Show the matrix to the user before running
   checks — it is the scope, and it is cheaper to correct now.
3. **Render.** `node scripts/render.mjs --screens <folder> --out qa/report`
   (add `--profile wireframe` for a wireframe, `--shots` for a picture of
   every render, `--also-widths 320` for WCAG's reflow width, `--rtl` to
   check the layout mirrored when the card has no right-to-left locale).
   Platforms come from the card, or `--platforms web,phone`: `phone` is a
   web product on a phone (WCAG's 24px minimum); a native app names `ios`
   or `android`. For each screen on each platform it measures the layout,
   accessibility, resources and motion; renders every breakpoint; Tabs through
   for visible focus; puts content extremes into the first data row of every
   repeated structure; and clicks every control that opens something. It
   installs a headless browser once when there is none (`scripts/browser.mjs`),
   and exits 3 if it cannot.
4. **Run the checks.** `python3 scripts/run.py --root . --screens <folder>
   --rendered-dir qa/report --out qa/report [--states states.json]`. It runs
   the static checks, folds in the render pass (its profile included), and
   writes `report.json` and `report.html`. Every check in the catalogue
   appears in the report: run, failed, or skipped with the reason. Read
   `references/checks.md` for what each check does and why.
5. **Run manual checks.** `assets/checklist.md`, recorded against node ids
   as a JSON list of findings, folded in with `run.py --manual manual.json`.
   Do not skip these because they are slower — they catch the failures that
   rules cannot express.
6. **Apply waivers.** `waivers.json` in the output folder (or `--waivers`).
   A waiver names its check and the node, CSS path or screen it covers; one
   that names only a check is ignored and reported, because it would clear
   every finding of that check. A waived blocker stays in the
   report, marked waived, with its reason.
7. **Emit.** `report.json` against `schema/report.schema.json`, plus
   `report.html`.
8. **State the verdict in one line**: PASS, PASS WITH WARNINGS, or BLOCKED,
   followed by the blocker count and what was checked (`render_coverage`,
   e.g. "6 screen renders on web + ios · 18 widths · 9 interactions · 30
   extreme-data renders"). Never call a design checked beyond that line.

## Wireframe and hi-fi

| profile | when | leaves out |
|---|---|---|
| `wireframe` | before the structure is agreed | tokens, verbatim copy, contrast, fonts, motion: a wireframe leaves visual design open |
| `hifi` (default) | before the design is shown as final or handed over | nothing |

Everything else runs at both: coverage, flows, layout (`lay`), what opens
(`int`), content extremes (`ovf`), breakpoints, hit targets.

## Ask before running when

Ask only what you cannot derive. Propose an answer for each and mark your
confidence — a question whose answer is sitting in `registry.json` reads as
broken.

1. Scope — which component, page or feature? (derivable if the user named one)
2. Platforms in scope — web, mobile, or both?
3. Locales — English only, or Arabic too? Arabic changes the RTL and overflow
   checks substantially.
4. Which roles and flags actually change this design? `registry.json` lists
   which exist; only the user knows which ones the current work touches.
5. Is a headless browser available? Several checks need rendered output. If
   not, say plainly which checks are being skipped and that the report is
   partial — never silently degrade to static-only and call it a pass.
6. Severity policy — default is in `references/severity.md`. Ask only if the
   user signals they want something different.

## The case matrix

```
states × roles × flags × platforms × locales × breakpoints
```

This multiplies out past what anyone will review, so cases are classified,
not enumerated. Four classes, defined in `references/matrix.md`:

- **required** — every declared state × platform, at default role and locale.
  This is the floor. Empty state is required, always, even when the PRD never
  mentioned it.
- **required-if-differs** — a role or flag combination becomes required when
  `registry.json` says it changes the surface. Derived, not guessed.
- **sampled** — the long tail. One deterministic representative per family,
  so the same case is sampled on every run and results stay comparable.
- **excluded** — impossible combinations, each with a stated reason.

Show the matrix before running. If a case the user cares about landed in
`sampled`, they promote it and you rerun.

## Check catalogue

Full detail in `references/checks.md`. The families:

| id prefix | family | needs render |
|---|---|---|
| `cov` | coverage — declared states/roles/flags actually rendered | no |
| `tok` | tokens — no orphan hex/rgb/px, every token resolves | no |
| `cpy` | copy — verbatim against product copy, EN + AR present | no |
| `flw` | flows — transitions resolve, no dead ends, modals dismissible | no |
| `par` | parity — cross-platform pairs agree or declare the difference | no |
| `rtl` | RTL — logical properties, no hardcoded left/right | no |
| `a11y` | contrast, hit targets, focus order, labels | partial |
| `ovf` | overflow — content extremes injected and rendered | yes |
| `brk` | breakpoints — renders at each declared width | yes |
| `mot` | motion — reduced-motion honoured, within duration budget | yes |
| `lay` | layout — headers on their columns, even and unsquashed controls, no overlapping or clipped text | yes |
| `int` | interaction — every menu, dialog, sheet and popover opens, in view, unclipped, styled | yes |
| `res` | resources — every font and image the screen uses loads | yes |

Static checks run anywhere. Render checks need a headless browser against
local `file://` paths — no login, no network, no live app. `scripts/render.mjs`
takes Playwright, Puppeteer or a Chrome on the machine, and installs one into a
shared cache when there is none.

## Content extremes

`ovf` is the highest-yield family and the one people skip. The render pass
takes the first data row of every repeated structure (table rows, list items,
cards) and, one extreme at a time, injects and renders:

- empty string
- one character
- 200 characters, no spaces
- the longest real value from `product/copy.md`
- the Arabic equivalent, if locale includes `ar`
- `0`, `999,999,999`, a negative
- a missing image, a null date

Most layout bugs live here. None of them appear in a screenshot of a happy
path.

## Severity

Three levels. Policy in `references/severity.md`.

- **blocker** — missing required state, unresolvable flow reference, orphan
  colour value, body-text contrast under AA. Downstream work stops.
- **warning** — sampled-case failure, undeclared parity mismatch, motion over
  budget. Proceeds, but carried forward as an open item.
- **note** — observations. Informational only.

A blocker can be waived, never silently. A waiver needs node id, check id,
reason, who, date, and expiry, and it appears in the report marked as waived.
Changing a check's severity to make a report pass is not an option — if a
check is wrong, fix the check and say so in the changelog.

## Report contract

`report.json` is the only thing downstream consumers read. It is versioned:
`"schema_version": 1`. Do not add fields without bumping the schema and the
skill's minor version. Full shape in `schema/report.schema.json`.

Every finding carries a node id where one exists, so a consumer can point at
the exact element. If the screens have no node ids yet, findings carry a CSS
path instead and the report sets `"ids_available": false`.

## Output

Always both files, plus a one-line verdict in chat. Do not paste the full
report into the conversation — it is long and the HTML is the readable form.
Summarise: verdict, blocker count, warning count, and the three findings most
worth looking at first.

## Versioning

Three independent versions: this skill (frontmatter + `CHANGELOG.md`), the
report schema (`schema/report.schema.json`), and the platform config schema.
Scripts read the skill version from the frontmatter via `scripts/_version.py`
rather than carrying their own constant, so a bump can never leave a report
claiming a version that did not produce it.

Consumers pin to the report schema, not to this skill. Full rules and the
bump policy: `references/versioning.md`.
