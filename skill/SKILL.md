---
name: profolio-ksa-design
description: "Design system for Bayut Profolio KSA — the agent and seller portal at profolio.bayut.sa — compiled from the product's own render. Use when designing, changing or reviewing any Profolio KSA screen, component or flow: turning a PRD into a plan, a clickable wireframe and a Design-QA'd hi-fi prototype, checking a design against the system, finding which tokens, components, flags or copy a surface uses. Triggers: 'design this screen for Profolio', 'add X to Profolio KSA', 'make a prototype of…', 'what does the listings page use', 'is there a component for Y'. KSA tenant only — not Oman, Bahrain, Qatar, Jordan, Egypt or Zameen, and not the consumer side of bayut.sa."
---

# Profolio KSA — design

Every page, state and component here is the running product's own render, pixel-identical
at 1440 (web) and 375 (phone). You compose from it; you never redraw it. What you deliver is
**one working prototype**, never a set of loose files. First you agree its structure with the
user in a wireframe. Then the Design QA passes it.

## THE FLOW — two gates you do not skip

1. **Intake**: `INTAKE.md`, before your first reply. Run the gap check, find the screens, ask
   the questions, and work out the edge cases yourself.
2. **Plan + wireframe (gate 1).** Write the plan into `designs/<feature>/`:
   - `flow.json`: the screens, every named state, the scenario controls, and the **state
     matrix**. Every region that shows data gets its loading, empty, error and no-results
     state, even when the PRD is silent.
   - `state.json`, `data.json`, `actions.json`: realistic KSA sample rows, incomplete ones
     included, and every action.
   - **the field matrix**: what every field shows when the source didn't send it ("Not shared",
     hidden, "From 900,000"). **Locked or gated data** (not bought, not paid, a role that may
     not see it) gets a lock state, with 2–3 variants the user picks (flow.json `options`).
   - a greyscale wireframe of each screen, web and phone, wired to them (`kit/wireframe.css`).
   Run `node qa/prototype.mjs designs/<feature> --wireframe` and send it with the plan paragraph.
   **Stop. No hi-fi file until the user says go.** A small change gets a small wireframe of the
   changed area. The gate is skipped only when the user says "skip".
3. **Hi-fi.** Take the compiled page and keep its shell and containers. Compose inside them
   from the product's components and the pattern kit (`kit/kit.css`), with the same flow.json
   and JSON. The wireframe's columns and states carry over unchanged.
4. **Design QA (gate 2).** Run `node qa/prototype.mjs designs/<feature> --shots` until it
   exits 0. It renders and measures, web and phone:
   - every state;
   - every interaction: the rail, the header's controls, every menu and sheet;
   - the data at its extremes: empty, long, Arabic, zero;
   - every option variant.
   Look at `qa/shots/` yourself before delivering, interactions and extremes included. Report
   the coverage it prints, never more. Exit 3 means no browser was available: say so when you
   deliver, and ask for the QA button in the prototype to be pressed.
5. **Deliver** `designs/<feature>/prototype.html`, published as an artifact wherever you can,
   with `qa/handoff.md` completed (OUTPUT CONTRACT). Every control in it works:
   - filters, tabs, sort and search change the sample rows;
   - dialogs, sheets, toasts and busy buttons behave;
   - the rail opens the product's other pages;
   - the header's bell, avatar and Post a Listing open;
   - the scenario controls switch balance, role, network and data.

`kit/README.md` has everything the runtime, the patterns, the wireframe and the QA do.
`examples/leads-marketplace/` is one whole feature built this way (README there).

## LOAD ORDER

1. **Never read `registry.json` whole** (310 KB). Read slices:
   - `node qa/registry.mjs pages`: every page, one line each;
   - `node qa/registry.mjs page <id|route|alias>`: its files, roles, flags, states, labels
     and components;
   - `node qa/registry.mjs component <id|class>`, `uses <id>`, `class <name>`,
     `utilities <prefix>`, `shell`, `flows`, `clock`, `themes`.
2. `INTAKE.md` when a PRD arrives, before your first reply. `kit/README.md` before the
   wireframe. `tokens.md` before a styling decision: grep it for the property, never read it
   whole.
3. Then only the files the task names: `pages[x].file`, `components[x].file`.

- Never read `css/profolio.css` whole: grep it for one selector. The same goes for
  `product/flags.md`: grep a row.
- Never read more than 3 component files in one task.
- A page file is the product's whole DOM: grep it for the part you need.

**Where the files are.** Everything this skill uses sits in its own folder, next to this
SKILL.md, not in the user's project. Find that folder first and run every command from it.
- In Claude Code it is `~/.claude/skills/profolio-ksa-design/`.
- Elsewhere: `find / -name INTAKE.md -path '*profolio-ksa-design*' 2>/dev/null`.

The `.skill` carries:
- the instructions, `registry.json` and `tokens.md`;
- the knowledge bases: `kb/` (design) and `product/` (product);
- `qa/`, `kit/` and the examples.

**A file the registry names is not here?** The stylesheets and every page are in the skill's
public GitHub repo, at the version this skill was built with (`registry.source`). Never ask the
user for a link, a repo or a file. Fetch them, with their links intact:
- `python3 qa/fetch.py --css` once, before grepping `css/`;
- then `python3 qa/fetch.py <page> [<state>…] [--375] [--roles] [--dry-run]`
  (or `--flow`, `--component`).
- `qa/prototype.mjs` fetches what a prototype opens by itself.

fetch.py tries `raw.githubusercontent.com`, then `github.com` through git, which claude.ai
allows by default. If the skill folder is read-only (claude.ai), work on a copy; fetch.py
prints the command. If GitHub is not reachable, fetch.py prints the one setting to turn on:
tell the user, and run the intake meanwhile, since it needs no page.

A state's id says which files it has:
- a state id ending `@web` has only `pages/<page>/<state>.html`;
- one ending `@375` (`@360` in the new theme) has only `<state>.mobile.html`;
- the suffix is dropped from the file name;
- any other id has both.

## ROUTING — by the question asked

| asked | go to |
|---|---|
| colour · size · spacing · radius · shadow | `tokens.md` — complete (a `--x` inside `.y` row is a component's own reset) |
| which screens and states a PRD needs | `node qa/find.mjs "<PRD words>"` — the design knowledge base, best first |
| "what does X look like" | `node qa/registry.mjs component X` / `page X` → its file |
| what a page already shows — columns, filters, tabs, card fields | `node qa/registry.mjs page X` (labels: ‹…› is data) → `product/pages/<X>.md` |
| "change page X" | its compiled file → copy into `designs/<feature>/`, change the copy |
| "new page" | the nearest compiled page for its shell (registry aliases, organisms) + the pattern kit for what the product lacks |
| a layout the product does not draw (a data table in 2.0, a lead card, an empty block) | `kit/README.md` → the patterns |
| which flag or role gates this | `page X` → flags, `shell` → flags → grep `product/flags.md`; `product/roles.md` |
| what does it say | `product/copy.md` → `copy/<area>.md` (translations), `copy/rendered/<page>.md` (what each screen draws) |
| which route, screen, flow | `product/routes.md`, `node qa/registry.mjs flows` |
| how a component overflows, opens, errors · where it shows only in a state | `component X` → states → `product/usage.md` |
| dates, "n days ago", day boundaries | `node qa/registry.mjs clock`, `product/roles.md` (the fixture's clock) |
| REGA, Nafath, FAL, credits | `product/ksa.md` |
| an icon | `atoms/icon.html` by the name the product uses, or a compiled screen's own svg (copy it, name its file in pf-also) |
| My Listings in the **new theme** (Profolio 2.0) | `product/listings-new/README.md` first, then `page listings-new`, `tokens.md` → *My Listings — new theme* |

## LOCKED

`css/` is locked:
- `profolio.css` and `profolio.mobile.css` are the product's compiled CSS;
- `tokens.css` is its named values;
- never change a token value, and never add a rule to make something fit. A visual mismatch
  is a wrong or missing component, never a wrong token.

`pages/`, `atoms/`, `molecules/`, `organisms/` are compiled references: the product as shipped,
marked `pf-compiled` / `pf-component`. Never edit one; copy it into `designs/`.

`kit/` is the only place a new layout's CSS lives. Every value there is a token or measured
from a compiled screen. A layout the kit lacks is a gap to name in the handoff; never style it
inline.

## NEVER

- deliver separate state files as the design: the deliverable is the prototype
- write a hi-fi file before the user said go on the wireframe (unless they said "skip")
- deliver while `node qa/prototype.mjs` reports errors, or without saying that the visual QA did not run
- leave a control that does nothing: wire it (`data-pf-*`), or mark it `data-pf-inert="why"`
- write prototype JavaScript of your own, or match clicks by their text: the runtime does both
- leave a field without what it shows when the data lacks it: a blank, "undefined" or "null" fails
- design locked or gated content without a lock state, or settle how it looks without offering
  the user 2–3 options at the wireframe gate
- call a prototype checked beyond the coverage the QA printed
- design a list, table or dropdown without its loading, empty, error and (when it filters)
  no-results states, even when the PRD is silent, nor promise in an empty state a feature the
  page does not have
- reuse another page's row anatomy for different data. Choose the layout by the data:
  - many comparable fields → a table with one field per column;
  - media-led → cards;
  - one hero per row;
  - one vertical alignment per row.
- invent a token: a value is in `tokens.md`, or it is [TBC]
- add CSS to make something fit, or write a `style` attribute on an element you create or
  retype. Use a utility (`fz-12`, `mb-8`…) or a kit class; a block copied from a compiled file
  keeps its own. The one exception is `--pfk-cols`.
- put `data-pf-new-copy` on an element that carries a style: wrap the new words in `<span data-pf-new-copy>`
- paraphrase product copy, or call a string new or absent from the product before grepping
  `product/copy/rendered/`. Quote a render-only string with its file.
- use a class absent from `registry.json` and the kit
- guess a value instead of marking it [TBC]
- call a behaviour absent before grepping `pages/` for the component's classes
  (`grep -l ping-right pages/*.mobile.html`); name the files searched in the [TBC]
- state a flag's effect its Gates column (`product/flags.md`) does not give
- read the whole stylesheet, or the whole registry
- draw an icon
- write an amount with "SAR", "ر.س" or U+20C1. In the current theme the riyal is the
  icon-font glyph (`.currency-Saudi_Riyal_Symbol`) before the number. Everywhere the icon
  font does not load (2.0, the kit, a wireframe), it is `<i class="pfk-riyal" aria-label="SAR"></i>`
  or `kit/riyal.svg`, the same official sign. Area is "Sq. M.".
- design for another Bayut market, or for the consumer side of bayut.sa

## THE PRODUCT, IN SIX FACTS

- **Type**: Figtree (variable 300–900, upright), Droid Arabic Kufi for Arabic — antd's
  `fontFamily`. Body text 14px / 22px. (The new My Listings adds Geist — THEMES.)
- **Web shell**: header 60px; the rail ships collapsed at 60px (220px on hover); content
  starts at 85px. `node qa/registry.mjs shell` lists what it draws; it is on every signed-in page.
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

## THEMES — current, and Profolio 2.0

Every page is the **current** theme. **My Listings** alone is compiled in the **new** theme,
Profolio 2.0: `pages/listings-new*.html`, compiled from the designer's handover. It is not
live yet: it is the design, not yet the product. Its tokens are My Listings' own
(`--pf-ml-*`, green primary, Geist UI face) and follow the build; teal stays in the rank and
Quality Score explainers.
- **The shell stays the product's.** Every 2.0 screen draws the current header, and the web
  screens draw its rail. Design inside them; never restyle them.
- **2.0 on another page is allowed, flagged** (the owner's decision, 2026-09-30).
  - Start from a `listings-new` file for the shell.
  - Compose with the kit's 2.0 patterns, whose values are measured from the build, and with
    `--pf-ml-*` tokens only.
  - Say in flow.json's `theme` and in the handoff that the extension needs the designer's
    sign-off, and list every borrowed choice under [TBC].
- **Markup:** a value you add to a 2.0 page is a kit class or a `var(--pf-ml-…)`. The build
  writes its styles inline, so a control's selected look is a kit modifier class toggled by
  the runtime.
- **The phone** is 360 × 800 in 2.0 (flow.json `size`).
- States marked `pf-derived` (Mark as Booked) are composed, not drawn by the build: say so.
- **The riyal** is the official sign (`svg[data-pf-riyal]`, `kit/riyal.svg`), before the
  number. Its height is max(7px, 0.6 × the amount's font-size). Never "SAR", never the
  icon-font class (it does not load there).

Read `product/listings-new/README.md` before designing in it.

## INTAKE — mandatory, before producing anything

A PRD arrives: read `INTAKE.md` and follow it before your first reply.
- **0 · the PRD gap check.**
- **1 · the screens it needs**: `node qa/find.mjs "<PRD words>"`.
- **2 · the questions**: product (P1–P8, for the PM) and design (D1–D9, for the designer).
  Each carries a proposed answer and a confidence; ask only what INTAKE.md allows.
- **3 · the edge cases and scenarios**: work them out yourself; never ask.
- **4 · after the one reply**: the plan as ONE paragraph, flow.json with the state matrix,
  and the wireframe. Then wait for go.

## HOW A HI-FI IS MADE

1. **Copy the compiled file you start from** into `designs/<feature>/<screen>.html`.
   - Fix its links two folders up (`../../css/…`) and add `../../kit/kit.css`.
   - Replace its `pf-compiled` meta with `<meta name="pf-base" content="pages/<page>.html">`:
     the exact file you copied, a state file included.
   - Name every other compiled file a block or an svg comes from in
     `<meta name="pf-also" content="a, b">`.
   - Drop its scripts; the prototype runs `kit/runtime.js`.
   - Do the phone the same way, from the 375 twin (`pages/<page>.mobile.html`; 360 in 2.0).
2. **Keep the shell and the page's containers**, whose styles are their source's. Replace
   what they hold.
   - For what the product draws, use the registry's classes and the component files' own
     markup (each variant has its HTML).
   - For what it does not, use the kit's patterns.
   - Mark new copy `data-pf-new-copy` on an unstyled element.
   - Fixture values copied unchanged stay unmarked. Only values you change or make up get
     `data-pf-data`, each listed under [TBC].
   - An `as-<role>` page combined with a state compiled for another role goes under [TBC],
     naming both files.
   - The tab ink bar and nav list (`registry.runtime_geometry`) keep antd's inline left,
     width and transform. When you select another tab, move the ink bar under it, measured
     with `qa/measure.mjs` in px or %. Never strip it.
3. **Wire it.** Bind the rows to `data.json` (`data-pf-list` + a `<template>`).
   - Every control acts (`data-pf-set`, `-do`, `-open`, `-menu`, `-page`, `-go`).
   - Every state of flow.json is reachable by using the page, not only from the player's list.
   - A new rail item under its neighbour gets `data-pf-page` to its screen.
4. **Run `node qa/prototype.mjs designs/<feature> --shots`.** It runs `qa/validate.py`
   checks 1–3 too:
   - no style your pf-base and pf-also files don't carry (bar re-measured geometry and
     `--pfk-cols`);
   - none on new copy;
   - no colour the product never uses;
   - no class the registry and the kit lack.

   Fix every error, look at the shots, and run it again.
5. **Hold it to the live product** when a question is about pixels.
   - Serve the skill folder (`python3 -m http.server`) and open
     `qa/overlay.html?page=designs/<feature>/<screen>.html` beside a screenshot of the same
     screen.
   - Every measured number in a reply quotes `node qa/measure.mjs <file> "<selector>"`
     output.

## OUTPUT CONTRACT — what you deliver

1. **The prototype**: `designs/<feature>/prototype.html`, one file, QA passed (or, if the QA
   could not run, said so). Publish it as an artifact where the surface can.
2. **`designs/<feature>/qa/handoff.md`**, written by the build: the screens and their sources,
   the states, the state matrix, the new copy (EN, AR [TBC]), the data each list needs, the
   actions and the QA result. Complete it:
   - **The plan**: the paragraph you sent, unchanged.
   - **Components used and added**: registry ids by level; kit patterns; each gap with the need
     it fills.
   - **PRD deviations**: each requirement or string drawn differently, and why.
   - **Every [TBC]**: each value, string, icon or borrowed 2.0 choice you could not source,
     and where you looked.
   - **Pages affected**: the page ids in the `used_on` of every component you changed,
     verbatim (`node qa/registry.mjs uses <id>`).
   - **For the developers, per state**: the APIs and data it needs, the flags that gate it
     (a flag-off state names the build or the compiled reference, never an account), the
     route (`pages[x].route` pattern, never `fixture_url`) and the account to QA it with
     against live.
3. **In your reply**: the prototype first, then two or three lines on what changed since the
   wireframe, and every open question.
