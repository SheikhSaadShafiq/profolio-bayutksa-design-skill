---
name: profolio-ksa-design
description: "Design system for Bayut Profolio KSA — the agent and seller portal at profolio.bayut.sa — compiled from the product's own render. Use when designing, changing or reviewing any Profolio KSA screen, component or flow: turning a PRD into screens, checking a design against the system, finding which tokens, components, flags or copy a surface uses. Triggers: 'design this screen for Profolio', 'add X to Profolio KSA', 'what does the listings page use', 'is there a component for Y'. KSA tenant only — not Oman, Bahrain, Qatar, Jordan, Egypt or Zameen, and not the consumer side of bayut.sa."
---

# Profolio KSA — design

Every page, state and component here is the running product's own render, pixel-identical
at 1440 (web) and 375 (phone). You compose from it. You never redraw it.

## LOAD ORDER

1. `registry.json` — always, first. Every component (level, file, classes, variants, states,
   tokens, used_on, source) and every page (route, file, aliases, components, flags, roles,
   states, source), the flows, the utility classes.
2. `tokens.md` — before any styling decision.
3. Only the files the task names — `registry.pages[x].file`, `registry.components[x].file`.

- Never read `css/profolio.css` whole — grep it for one selector.
- Never read more than 3 component files in one task.
- A page file is the product's whole DOM: grep it for the part you need.

**A file the registry names is not here?** The package is public. Installed with only its
core (`SKILL.md`, `registry.json`, `tokens.md`, `product/`, `css/`, `qa/`), fetch a page or
component by its registry path, from this folder, so its relative links hold:

    curl -sL --create-dirs -o <path> https://raw.githubusercontent.com/SheikhSaadShafiq/profolio-bayutksa-design-skill/refs/heads/claude/skill-package/skill/<path>

## ROUTING — by the question asked

| asked | go to |
|---|---|
| colour · size · spacing · radius · shadow | `tokens.md` — complete |
| "what does X look like" | `registry.json` → `components[X].file` or `pages[X].file` (match `aliases`) |
| "change page X" | `registry.pages[X].file` → copy it into `designs/`, change the copy |
| "new page" | the nearest page in the registry (aliases, components) → copy into `designs/`, recompose |
| which flag or role gates this | `product/flags.md`, `product/roles.md`, `pages[X].flags` / `.roles` |
| what does it say | `product/copy.md` → `product/copy/<area>.md` — verbatim, English and Arabic |
| which route, screen, flow | `product/routes.md`, `registry.flows` |
| REGA, Nafath, FAL, credits | `product/ksa.md` |
| an icon | `atoms/icon.html` — by the name the product uses |

## LOCKED

`css/` is locked. `profolio.css` and `profolio.mobile.css` are the product's compiled CSS;
`tokens.css` is its named values. Never change a token value. Never add a rule to make
something fit. A visual mismatch is a wrong or missing component, never a wrong token.

`pages/`, `atoms/`, `molecules/`, `organisms/` are compiled references — the product as
shipped, marked `pf-compiled` / `pf-component`. Never edit one. Copy it into `designs/`.

## NEVER

- invent a token — a value is in `tokens.md`, or it is [TBC]
- add CSS to make something fit
- paraphrase product copy
- write an inline `style` attribute, or a hex or rgb colour, in a design
- use a class absent from `registry.json`
- guess a value instead of marking it [TBC]
- read the whole stylesheet
- design a page without its empty state — nor without its loading and error states
- draw an icon
- write an amount with "SAR" or "ر.س": the riyal is the icon-font glyph
  (`.currency-Saudi_Riyal_Symbol`) before the number; area is "Sq. M."
- design for another Bayut market, or for the consumer side of bayut.sa

## THE PRODUCT, IN SIX FACTS

- **Type**: Figtree (variable 300–900, upright), Droid Arabic Kufi for Arabic — antd's
  `fontFamily`. Body text 14px / 22px.
- **Web shell**: header 60px; the rail ships collapsed at 60px (220px on hover); content
  starts at 85px.
- **Phone**: the product picks its phone layout by device, not width — a header with a menu
  button, the rail as a drawer, cards instead of tables, many modals and popovers as drawers.
- **Disabled** controls are dimmed to 0.54. A failed list query shows the same
  "No Record Found" as an empty one — there is no separate error card for a table.
- **Roles**: owner, staff and individual see different versions of one screen —
  `pages/<page>/as-staff.html`, `as-individual.html`.
- **Scope**: English, web 1440 and phone 375. Arabic RTL is not compiled — say so rather
  than mirroring a screen by hand.

## INTAKE GATE — mandatory, before producing anything

Read the PRD. Fill in what you can. Present the table with your proposed answers and a
confidence for each. Ask ONLY about the rows you could not fill. Wait for confirmation,
restate the plan in one paragraph, then build.

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| 1 | New page, change to an existing page, or a new cross-page component? | | |
| 2 | If a change: which page(s)? Route + registry id. If the PRD is ambiguous, list the candidates and ask. | | |
| 3 | Entry point — how does the user arrive here? | | |
| 4 | Which roles see this — owner, staff, individual? Does it differ by role? | | |
| 5 | Which tenant flags gate it? Name them from `product/flags.md`. | | |
| 6 | Which states must be designed — loading, empty, error, flag-off, no-permission? If the PRD is silent on the empty state, always ask. | | |
| 7 | Any component the catalogue lacks? List what you think is missing. | | |
| 8 | Is the copy final or placeholder? Arabic now or deferred? | | |
| 9 | Does it change an existing component? List every page in its `used_on` and ask whether to regenerate them. | | |
| 10 | Responsive scope — web only, or web and 375? | | |
| 11 | Anything in the PRD contradicting the shipped product? Shipped copy always wins; flag the conflict. | | |

## HOW A DESIGN IS MADE

1. Copy the page you start from into `designs/<name>.html` (same depth as `pages/`, so its
   `../css/` links hold). Replace its `pf-compiled` meta with
   `<meta name="pf-base" content="pages/<page>.html">`, and point `src="prototype.js"` and
   its `data-pf-go="<page>/…"` links at `../pages/` so the design stays clickable. A state
   file sits one folder deeper (`pages/<page>/<state>.html`): its `../../css/` becomes `../css/`.
   `examples/worked-example.md` is one whole trace, PRD to output contract.
2. Compose with the registry's classes and the component files' own markup (each variant
   has its HTML). Mark new copy `data-pf-new-copy`, invented data `data-pf-data`.
3. One file per state the intake lists — `designs/<name>--<state>.html` — and a
   `.mobile.html` per state when 375 is in scope, started from `pages/<page>.mobile.html`.
4. Run `python3 qa/validate.py designs/<name>*.html` from `skill/`. Every check must pass:
   no style attribute or colour beyond the base page's, no class the registry lacks.
5. Hold it to the live product: serve `skill/` (`python3 -m http.server`) and open
   `qa/overlay.html?page=designs/<name>.html` beside a screenshot of the same screen.

## OUTPUT CONTRACT — every deliverable ends with

- **Components used** — registry ids, by level.
- **Components added, and why** — each one, with the gap it fills.
- **Every [TBC]** — each value, string or icon you could not source, and where you looked.
- **Pages affected** — through the `used_on` of every component you changed.
- **How to QA against live** — the route, the account (owner, staff or individual), the
  state, and the overlay command.

## THE PROTOTYPE

The compiled pages are clickable: a trigger opens its state; Escape, ✕, Cancel or the mask
go back; → and ← walk a flow and its primary button goes on; the rail goes to the other
pages; **M** switches between web and 375.
