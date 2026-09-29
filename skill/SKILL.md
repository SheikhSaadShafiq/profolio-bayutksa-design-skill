---
name: profolio-ksa-design
description: "Design system for Bayut Profolio KSA — the agent and seller portal at profolio.bayut.sa — compiled from the product's own render. Use when designing, changing or reviewing any Profolio KSA screen, component or flow: turning a PRD into screens, checking a design against the system, finding which tokens, components, flags or copy a surface uses. Triggers: 'design this screen for Profolio', 'add X to Profolio KSA', 'what does the listings page use', 'is there a component for Y'. KSA tenant only — not Oman, Bahrain, Qatar, Jordan, Egypt or Zameen, and not the consumer side of bayut.sa."
---

# Profolio KSA — design

Every page, state and component here is the running product's own render, pixel-identical
at 1440 (web) and 375 (phone). You compose from it. You never redraw it.

## LOAD ORDER

1. `registry.json` — always, first. Every component (level, file, classes, variants, states,
   tokens, used_on, used_in_states, part_of, anatomy, source) and every page (route, file,
   aliases, atoms / molecules / organisms — what it draws —, flags, roles, states, labels —
   what it shows —, source), the shell, the flows, the fixture's clock, the utility classes.
2. `tokens.md` — before any styling decision.
3. Only the files the task names — `registry.pages[x].file`, `registry.components[x].file`.

- `examples/` holds the worked example — read it when you reach HOW A DESIGN IS MADE, not before.
- Never read `css/profolio.css` whole — grep it for one selector. `product/flags.md` too: grep a row.
- Never read more than 3 component files in one task.
- A page file is the product's whole DOM: grep it for the part you need.

**A file the registry names is not here?** The package is public. A core install (`SKILL.md`,
`registry.json`, `tokens.md`, `product/`, `css/`, `qa/`, `examples/worked-example.md`,
`pages/prototype.js`) fetches what a task needs, links intact:
`python3 qa/fetch.py <page> [<state>…] [--375] [--roles] [--dry-run]` (or `--flow`, `--component`).
A state id ending `@web` is only `pages/<page>/<state>.html`, `@375` (`@360` in the new theme)
only `<state>.mobile.html`, the suffix dropped from the file name; any other has both.

## ROUTING — by the question asked

| asked | go to |
|---|---|
| colour · size · spacing · radius · shadow | `tokens.md` — complete (a `--x` inside `.y` row is a component's own reset) |
| "what does X look like" | `registry.json` → `components[X].file` or `pages[X].file` (match `aliases`) |
| what a page already shows — columns, filters, tabs, card fields | `pages[X].labels` (‹…› is data; `375`, `staff`, `individual` only what differs) → `product/pages/<X>.md` |
| "change page X" | `registry.pages[X].file` → copy it into `designs/`, change the copy |
| "new page" | the nearest page in the registry (aliases, atoms / molecules / organisms) → copy into `designs/`, recompose |
| which flag or role gates this | `pages[X].flags`, `shell.flags` → grep `product/flags.md`; `product/roles.md` |
| what does it say | `product/copy.md` → `copy/<area>.md` (translations), `copy/rendered/<page>.md` (what each screen draws) |
| which route, screen, flow | `product/routes.md`, `registry.flows` (each step's heading and primary button) |
| how a component overflows, opens, errors · where it shows only in a state | `components[X].states` → `product/usage.md` |
| dates, "n days ago", day boundaries | `registry.clock`, `product/roles.md` (the fixture's clock) |
| REGA, Nafath, FAL, credits | `product/ksa.md` |
| an icon | `atoms/icon.html` — by the name the product uses |
| My Listings in the **new theme** (Profolio 2.0) | `product/listings-new/README.md` first, then `registry.pages['listings-new']`, `tokens.md` → *My Listings — new theme* |

## LOCKED

`css/` is locked. `profolio.css` and `profolio.mobile.css` are the product's compiled CSS;
`tokens.css` is its named values. Never change a token value. Never add a rule to make
something fit. A visual mismatch is a wrong or missing component, never a wrong token.

`pages/`, `atoms/`, `molecules/`, `organisms/` are compiled references — the product as
shipped, marked `pf-compiled` / `pf-component`. Never edit one. Copy it into `designs/`.

## NEVER

- invent a token — a value is in `tokens.md`, or it is [TBC]
- add CSS to make something fit
- paraphrase product copy — nor call a string new, or absent from the product, before
  grepping `product/copy/rendered/`; quote a render-only string with its file
- write a `style` attribute on an element you create or retype (use a utility: `fz-12`,
  `mb-8` …; a block copied from a compiled file keeps its own), or a hex or rgb colour
- use a class absent from `registry.json`
- guess a value instead of marking it [TBC]
- call a behaviour absent before grepping `pages/` for the component's classes
  (`grep -l ping-right pages/*.mobile.html`); name the files searched in the [TBC]
- state a flag's effect its Gates column (`product/flags.md`) does not give
- read the whole stylesheet
- design a page without its empty state — nor without its loading and error states
- draw an icon
- write an amount with "SAR" or "ر.س": in the current theme the riyal is the icon-font glyph
  (`.currency-Saudi_Riyal_Symbol`) before the number; area is "Sq. M." (new theme: THEMES)
- design for another Bayut market, or for the consumer side of bayut.sa

## THE PRODUCT, IN SIX FACTS

- **Type**: Figtree (variable 300–900, upright), Droid Arabic Kufi for Arabic — antd's
  `fontFamily`. Body text 14px / 22px. (The new My Listings adds Geist — THEMES.)
- **Web shell**: header 60px; the rail ships collapsed at 60px (220px on hover); content
  starts at 85px. `registry.shell` lists what it draws; it is on every signed-in page.
- **Phone**: the product picks its phone layout by device, not width — a header with a menu
  button, the rail as a drawer, cards instead of tables, many modals and popovers as drawers.
- **Disabled** controls are dimmed to 0.54. **Errors** are each page's own: take
  `pages/<page>/error.html` as the answer, never assume one. Five pages draw the empty-state
  error ("Error" or "Error!", "Something went wrong, please try again", Retry); credits-usage
  and licenses draw the message and Retry only; the Overview's cards put "No Record Found" over
  it; My Listings on a phone shows "No Record Found" with Post Listing. Nine pages draw no
  error block. The reports, the Overview and My Listings (web) also show a raw message
  ("[object Object]", "Cannot convert…") — the product's words there are [TBC].
- **Roles**: owner, staff and individual see different versions of one screen —
  `as-staff.html`, `as-individual.html`, `<state>-as-staff.html`. Every other state is the
  owner's, bar `pages[x].state_roles`; `product/roles.md` says what each role cannot reach.
- **Scope**: English, web 1440 and phone 375. Arabic RTL is not compiled — say so rather
  than mirroring a screen by hand. The fixture's "today" is `registry.clock.day`; times of day
  are shown in the browser's zone (`registry.clock.shown_in`, not Riyadh; the `TIMEZONE`
  constant is read nowhere) — any day-based rule names its timezone.

## THEMES — current, and the new My Listings

Every page is the **current** theme. **My Listings alone** has a **new** theme (Profolio 2.0,
not live yet): `pages/listings-new*.html`, compiled from the designer's handover — the
design, not yet the product. Its tokens are My Listings' only (`--pf-ml-*`, green primary,
Geist UI face) and follow the build; teal stays in the rank and Quality Score explainers.
The shell stays the product's: every new-theme screen draws the current header, and the web
screens its rail — design inside them, never restyle them. The riyal is the build's glyph,
`svg[data-pf-riyal]`, copied from a `listings-new` file before the number, height max(7px, 0.6 ×
the amount's font-size) — never "SAR", never the icon-font class (it does not load there). Never draw another page in the new theme. Its
pages are static screens, one file per state (no `prototype.js`); a value you add there is
`var(--pf-ml-…)` from `css/new-theme/tokens.css`, which they link. States marked `pf-derived`
(Mark as Booked) are composed, not drawn by the build — say so.
Read `product/listings-new/README.md` before designing in it.

## INTAKE GATE — mandatory, before producing anything

Read the PRD. Fill in every row you can, with a proposed answer and a confidence: high,
medium or low. Present the table. Then ask only:
- a row you could not fill, or filled at low confidence;
- what a row's own text orders you to ask — row 2 when the PRD is ambiguous, row 6's new
  empty state, row 8's Arabic timing, row 9's regenerate, row 11's other meaning.
Write "asked" after the confidence ("high; regenerate asked"). Ask nothing else; a medium
row states what you will assume. Never ask what this file already decides: shipped copy
wins, the design is English (Arabic RTL is not compiled). At most one question per row,
naming its row and carrying your proposed answer, so the designer can reply yes.
The designer's one reply confirms every row you didn't ask: don't re-ask it. After it, the
first text of your next turn — before any tool call that writes to `designs/` — is the plan,
as ONE prose paragraph (no bullets, no table). Then build.

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| 1 | New page, change to an existing page, or a new cross-page component? | | |
| 2 | If a change: which page(s)? Route + registry id. If the PRD is ambiguous, list the candidates and ask. | | |
| 3 | Entry point — how does the user arrive here? | | |
| 4 | Which roles see this — owner, staff, individual? Does it differ by role? | | |
| 5 | Which tenant flags gate it? Each with the page whose `pages[x].flags` (or `shell.flags`) carries it; grep its row in `product/flags.md`, quote its Referenced-in files. An effect its Gates column does not give is [TBC], at most medium; a condition `(ORed with X)` needs both. | | |
| 6 | States: for each page in row 2, name its compiled loading, empty, error and message-* from `pages[x].states` (or "none"); `empty` is a new account, not the feature's empty. Ask only about states with no compiled file — always about a new empty state the PRD is silent on. Answer flag-off and no-permission ("not drawn" if so). | | |
| 7 | Any component the catalogue lacks? List what you think is missing. | | |
| 8 | Is the copy final or placeholder? Arabic now or deferred? | | |
| 9 | Does it change an existing component? Paste the page ids in its `used_on` verbatim — never a count; a `registry.shell` component reaches every signed-in page. Ask whether to regenerate them. | | |
| 10 | Responsive scope — web only, or web and 375? | | |
| 11 | Anything in the PRD contradicting the shipped product? For each key noun, the shipped field that covers it (`pages[x].labels`, `copy/rendered/`). Same meaning: the shipped string wins, flag it. Maybe another meaning: ask; a new meaning is new copy. | | |
| 12 | Touches credits, packages or tiers? The products and tiers affected, expiry, payment methods (`product/ksa.md`, `PAYMENT_METHODS`). | | |
| 13 | Only if the PRD touches My Listings: the current theme, or the new one (`listings-new`)? | | |

## HOW A DESIGN IS MADE

1. Copy the file you start from into `designs/<name>.html` (same depth as `pages/`, so its
   `../css/` links hold). Replace its `pf-compiled` meta with
   `<meta name="pf-base" content="pages/<page>.html">` — the exact file you copied, a state
   file included (`pages/agency-staff/modal-set-credits-limit.html`) — and name every other
   compiled file a block comes from in `<meta name="pf-also" content="a, b">`. Point the
   script at `src="../pages/prototype.js"`; it resolves the copied links from pf-base. A state
   file sits one folder deeper (`pages/<page>/<state>.html`): its `../../css/` becomes `../css/`.
   `examples/worked-example.md` is one whole trace, PRD to output contract.
2. Compose with the registry's classes and the component files' own markup (each variant
   has its HTML). Mark new copy `data-pf-new-copy`. Fixture values copied unchanged stay
   unmarked; only values you change or make up get `data-pf-data`, each listed under [TBC].
   An `as-<role>` page combined with a state compiled for another role goes under [TBC],
   naming both files. The tab ink bar and nav list (`registry.runtime_geometry`) keep antd's
   inline left, width and transform: select another tab, move the ink bar under it —
   measured with `qa/measure.mjs`, in px or % — never strip it.
3. One file per state the intake lists — `designs/<name>--<state>.html` — and a
   `.mobile.html` per state when 375 is in scope, started from the 375 twin of the file its
   web design started from (`pages/<page>.mobile.html`, `pages/<page>/<state>.mobile.html`).
   A state with no visual change is listed "not drawn → <compiled file>" and gets no file.
4. Run `python3 qa/validate.py designs/<name>*.html` from `skill/`. It checks only the files
   you name (checks 1–3), and all must pass: no style your pf-base and pf-also files don't
   carry (bar that re-measured geometry), none on new copy, no colour the product never uses, no class the registry lacks.
   In the new theme a value you add is a `--pf-ml-*` token.
5. Hold it to the live product: serve `skill/` (`python3 -m http.server`) and open
   `qa/overlay.html?page=designs/<name>.html` beside a screenshot of the same screen. Every
   measured number in a reply quotes `node qa/measure.mjs <file> "<selector>"` output.

## OUTPUT CONTRACT — every deliverable ends with

- **The plan** — the paragraph you sent before building, unchanged.
- **Components used** — registry ids, by level.
- **Components added, and why** — each one, with the gap it fills.
- **Layout differences** — per state, what the 375 file has or lacks against web.
- **PRD deviations** — each requirement or string drawn differently from the PRD, and why.
- **Every [TBC]** — each value, string or icon you could not source, and where you looked.
- **Pages affected** — the page ids in the `used_on` of every component you changed,
  verbatim, and the state files `product/usage.md` names; grep `pages/` for the component's
  source file before calling a page without it (a few compiled instances lack their marker).
- **How to QA against live** — the route (`pages[x].route`, the pattern — never
  `fixture_url`), the account (owner, staff or individual), the state, and the overlay command.
  A flag-off state: name the build (constant flipped) or the compiled reference, never an
  account — flags are compile-time constants.

## THE PROTOTYPE

The compiled pages of the current theme are clickable: a trigger opens its state; Escape, ✕, Cancel or the mask
go back; → and ← walk a flow and its primary button goes on; the rail goes to the other
pages; **M** switches between web and 375. A design in `designs/`, served over http (step 5),
works the same way.
