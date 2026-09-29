# Profolio KSA design system — maintaining it

**The skill is `skill/`** — install `skill/` (its `SKILL.md` is the router). This file is for
whoever regenerates it: what the generator repo holds and how each part is made. It was the
skill's router before the package existed; its file table still describes `kb/`, `deliverables/`
and the tools that build `skill/` (`npm run package`, after `npm run ds`).


You give a designer the existing design, tokens and product knowledge for **Bayut Profolio
KSA**, then help them design on top of it. You do not design unsupervised — see *How you
work* below.

Profolio is the **agent- and seller-facing** portal: dashboard, listing management, credits,
settings. Its users are agency owners, agency staff and individual sellers.

## Your files

Load what the task needs. Never load more. Everything is HTML under `kb/` — content-only
pages with one linked stylesheet, so a page costs about what its prose weighs.

| File | When |
|---|---|
| `kb/product/ksa.html` | Always. The rules that make KSA different. |
| `kb/screens/index.html` | **Always, when a PRD names a feature.** The design knowledge base: every compiled screen and every state of it — web and responsive — in words: what it is for, how each state is reached, what it shows, which components it adds, and the file to open. |
| `node scripts/design-find.mjs "<words>"` | **To find the design a PRD needs.** Give it the PRD's own words ("mark a daily rental as booked", "staff can't see agency settings"); it returns the matching screens, states and components, best first, with their web and responsive files. Searches `data/design-kb.json`. |
| `kb/screens/<page>.html` | The screen you are designing: every state, grouped by kind, with its trigger, its controls and its files. |
| `kb/pages/_shell.html` | The nav in order and why the shell is what it is. Its starting markup predates the compiled pages and fails `design-lint` — start a design from a compiled page instead (below). |
| `node scripts/design-brief.mjs <prd.md>` | **First, for every PRD.** Per requirement: the compiled screens and states that match (web and 375 files, with a confidence), what the design must cover (roles, both layouts, loading/empty/error, form and flow states), the shipped copy in English and Arabic, the flags involved — and the gaps, named. |
| `node scripts/design-lint.mjs <design.html> --pair <design-375.html>` | **Last, on every artboard, before you show it.** The pre-flight below, automated: classes, colours, icons, copy, currency, shell measurements and nav, type, the 375 pair, disabled dimming. |
| `deliverables/responsive.html` | **Making a screen responsive.** The rules the product follows from web to phone, counted from both layouts: which overlays become drawers, which components change size, what only one layout has. |
| `kb/product/screens.html` | To find which screen the request is about. |
| `kb/pages/<route>.html` | The one screen you are working on. 30 of 31 routes have one. |
| `kb/design/components.html` | To find a component by design name. |
| `kb/design/components/<id>.html` | Only the components this screen uses. 179 entries — canvas-documented ones carry prose, feature ones carry measured CSS from their own source. |
| `kb/design/foundations.html` | Where the design-system index's *Foundations* (measured from what the compiled pages paint) and this page disagree, the index wins. **All** colour, typography, spacing, radius, elevation, iconography, breakpoints and z-index. Complete — read to the bottom before calling anything undocumented. |
| `kb/product/copy.html` | To find which copy page covers your area. |
| `kb/product/copy/<area>.html` | **The real shipped strings**, English beside Arabic. Load the area you are designing. |
| `kb/product/flags.html` | When a surface may be switched off or altered. |
| `kb/pages/<route>.board.html` | **The screen as an artboard** — real shell chrome with content blocked out from the layout skeleton. Open it in a browser; start from it rather than a blank page. |
| `data/live/<route>.png` | **The product rendered by the harness at 1440×900**, from a fixture account. Check it exists before you rely on it — a route without one has only the artboard. Where it exists it is the visual truth for layout; the values in it are invented. |
| `kb/design/scales.html` | Before you write a spacing or size value. The only steps the product can express with a class — anything else has to be a literal. |
| `kb/design/colours.html` | When a colour depends on state: the completion ring, the plan badge, the platform accent. These are runtime lookups, not theme tokens, so foundations will not have them. |
| `kb/design/listing-table.html` | Any listings table. Columns in order, every disposition's Tag colour, and which upgrade or action is enabled for which state. |
| `kb/design/fonts.html` | Before you specify a weight. Only 300/400/700 ship; 500 and 600 are synthesised. |
| `kb/design/antd-tokens.html` | When a value looks like an antd default and you want the global token scale. |
| `kb/design/antd-css.html` | When a value looks like an antd default and you want what the component actually paints — Badge is 20px, not `controlHeightXS`. This wins over the token scale. |
| `deliverables/design-system.html` | **Start here for anything visual.** Foundations (every colour, type style, space, radius, shadow and curve the product actually paints with, named from its theme and antd's), then every component as an atom, molecule, organism or template, then every page and state. All of it cut out of the product's own render — nothing redrawn. |
| `deliverables/components/<slug>.html` | **One component**: each variant live — **web** and **responsive** in separate sections, the responsive ones in a frame as wide as the phone — the markup to copy, the exact `profolio.css` rules it uses, its hover/focus/active states, what it is made of, where it is used, the product file that defines it, and its copy in `kb/`. Each variant carries a badge saying whether the cut-out matches the product, and a **spec sheet** — size, padding, gap, radius, border, fill, shadow, type, text and icon colour, measured from its render, each with its token name where one exists. An interactive family (buttons, inputs, selects, pickers, checkboxes, radios, switches) also has a **state table**: every state it can be in — default, hover, focus, active, disabled, error, checked … — and whether the product was seen in it, it was forced, or it follows from the product's own CSS. |
| `deliverables/<page>.html` | **The 24 pages, compiled from the product** (`scripts/compile.mjs`) — pixel-identical to the running product at 1440 on the fixture account. A clickable prototype: every trigger that opens a state is a link to it, the rail and menus go to the other pages, and **M** opens the same screen in the other layout (web ↔ responsive). Start a redesign from the page, not from a blank canvas. |
| `deliverables/states/<page>--<state>.html` | **Every state** the harness can reach: modals, drawers, popovers, tooltips, dropdowns, pickers, tabs, tours — and one level down, what a modal or drawer leads to (`--<parent>__<child>`). **Forms**: errors, filled, saved and failed (`--form-<form>-<state>`, `--saved-*`, `--message-*`). **Data**, on every signed-in page: `--loading`, `--empty`, `--error`. **Flows** as numbered steps (`--flow-<flow>-<nn>-<step>`: post a listing, ad licence, buy a package, top up credits) — ← and → walk a flow, and its primary button goes to the next step. The **account variants**: `--as-staff` (an agency staff user: 9 rail items, no agency settings, own leads only), `--as-individual` (an individual seller, no agency), `--profile-incomplete`, `--modal-non-saudi`. Escape, ✕, Cancel or the mask go back to where the state was opened from. |
| `deliverables/mobile/<page>.html`, `deliverables/mobile/states/…` | **The responsive layout** — the same pages and states as the product draws them for a phone (375 wide, chosen by the device's user agent, not the window width): a header with a menu button and the page title, the rail as a drawer it opens, listings as cards instead of a table, on the dashboard an app-install banner, and some segmented controls as selects. Open them at phone width. |
| `deliverables/design-qa.html` | **Before you call anything pixel-perfect.** Every page, state and component held to the product's render, to the live product on two real accounts, and to its code (copy, sources). Names what is off, and by how much. |
| `deliverables/profolio.css` | The stylesheet every web page and component uses — the product's own CSS, `ant-*` renamed `pf-*`, styled-components named after the JSX the product wrote. `deliverables/profolio.mobile.css` is the responsive layout's: the same rules in the order a phone's pages paint them. Generated; never edit either by hand. |
| `deliverables/tokens.css` | The named tokens as custom properties (`--pf-primary`, `--pf-color-text`…). Cite these names in a spec, never raw hex. |
| `deliverables/profolio-ksa.html` (+ `-2`…`-4`, `-responsive`, `-responsive-2`, `-components`) | Everything above as seven self-contained files, each under 50 MB (`scripts/combine.mjs` splits by packed size, whole pages per part) — for handing over, not for reading into context. |
| `deliverables/sprite.svg` | **The product's real icons**, each named as the codebase names it. Reference one with `<use href="#pf-SideMenuDashboard">`. Never draw a glyph yourself. |
| `kb/guide/recipe.html` | **Building a whole page?** Follow it — the order exists because each step cost real rework when skipped. |

**Before you open a path, check it exists.** Two entries above are conditional:
`data/live/` holds only routes the harness has rendered, and `kb/product/flows/` is empty
until someone writes one. If a file you expected is not there, say so in your proposal
rather than inventing what it would have said.

**Never read `canvas/`.** Those three `.dc.html` files are the human browsing surface —
about 92,000 tokens between them. Everything in them that you need is already in
`kb/design/components/`. Reading one costs more than sixteen correct tasks.

## How you work

Two steps, always in this order.

**1 — Propose, then stop.** Run `node scripts/design-brief.mjs <prd.md>` on the PRD and build the
proposal from it: shell variant, route, roles, flags, components, states — web and 375. Put its
gaps to the designer as questions; never fill a gap silently. Show the proposal and wait. Do not
produce artboards on the same turn as the proposal.

**2 — Produce, once approved.** Start from a compiled page — `deliverables/<page>.html`, or the
state nearest to what you design; for a new screen, the page cut at `div.pf-div` (the shell and an
empty content area) — and compose documented components on it. Cite token names, never raw hex.
Mark data (names, listing titles) with `data-pf-data` and copy the PRD needs but the product does
not ship with `data-pf-new-copy`. Design the 375 layout too (`deliverables/responsive.html`).

**3 — Lint, then show.** Run `node scripts/design-lint.mjs <design.html> --pair <design-375.html>`
on every artboard. Fix every ✗; answer every ! with a fix or a sentence saying why it stands.
New copy it reports goes to the designer for sign-off in English and Arabic.

## Pre-flight — run this before you output a single artboard

Nine checks. Each one has been failed in a real session; `scripts/design-lint.mjs` runs all of
them — this is what it checks, and why.

1. **Nav.** Count your sidebar items against the table in `kb/pages/_shell.html`. Labels must match
   character for character — **TruLeads**, not "Leads"; **Credits & Packages**, not "Packages".
   Do not invent an entry; there is no top-level "Licenses".
2. **Shell.** The sider **ships collapsed at 60px** — `withAdminLayout.js` opens with
   `useState(true)`, so an icon rail is the default state and 220px is what you get on hover.
   The header is **60px**, not the 74px in `theme['layout-header-height']`: `renderHeader()`
   overrides it inline and inline wins. Content starts at 85px (`sidebarOffset + 25`). If you
   typed a round number you guessed — go back and read `kb/pages/_shell.html`.
3. **Classified pill.** A bordered link out to the classified site, min-width 148.71px. Not a
   solid primary button, and not "Post a Listing".
4. **Type.** **Figtree** with Droid Arabic Kufi, base 14px / line-height 1.571 — it is in
   `kb/design/fonts.html`. This check said *Lato* and told you never to say Figtree; that was
   wrong and it painted every artboard in the wrong typeface. The antd token at
   `theme/index.js:306` is `Figtree, Droid Arabic Kufi, sans-serif`, `useAppInit.js` fetches
   Figtree from Google Fonts, and **1,698 of the 1,708 elements** in the product's own render
   compute it. Lato is downloaded but paints nothing outside the lite experience.
   Figtree is **variable 300–900**, so 500 and 600 are real weights — ask for them freely.
   It is **upright**. The Google URL the product uses asks for the italic axis too, and our own
   font pipeline shipped the italic faces under a `normal` declaration for a while — every
   artboard was slanted. If your type looks oblique, that is the bug, not the typeface.
5. **Copy.** Every label, button, empty state and error in your design must come from
   `kb/product/copy/<area>.html`. **Never invent a string.** If the word you need is not there, name the
   file you checked and ask — invented copy is how "Post a Listing" ended up on the classified
   pill and why every label in that session was a guess.
6. **Screenshot.** If the template's `shot` field names a file, open it and compare. If it says
   not captured, say so in your output — do not imply your design matches the live screen.
7. **Content.** Did you invent a widget or card the page template does not list? If the
   template has a layout skeleton, your structure must match it. If you needed something that
   is not there, say so — do not draw it silently.
8. **Icons.** Every glyph comes from `deliverables/sprite.svg`, by the name the codebase uses
   (`SideMenuDashboard`, `IconForSale`, `MdPhone`). **Never draw one.** If the icon you need is
   not in the sprite, name the one you looked for and ask — a hand-drawn glyph is the single
   most visible way a design stops looking like the product.
9. **States.** A screen is not one picture. Before you design a flow, open the page in
   `deliverables/<page>.html` and click through it: every trigger that opens a modal, drawer,
   popover or tab is a link to `deliverables/states/<page>--<state>.html`, compiled from the
   running product. `kb/screens/<page>.html` lists them all with how each is reached; a PRD's
   feature is found with `scripts/design-find.mjs`. Design the **responsive** state too
   (`deliverables/mobile/…`), the page's **loading, empty and error** (`--loading`, `--empty`,
   `--error`), every **form** state the product has for the same kind of form (`--form-*`,
   `--saved-*`, `--message-*`), and the **staff** and **individual** variants (`--as-staff`,
   `--as-individual`) when the PRD touches roles. Two rules hold for your work
   too: **a disabled control is dimmed to 0.54** (`utils.less:142`, it is global), and **a failed
   list query shows the same “No Record Found” empty state as an empty one** — Profolio has no
   separate error card for a table.

If a check fails, fix it before producing. If the information genuinely is not in
`kb/`, say which file you looked in and stop — a guess that looks confident is worse
than a gap that is named.

## Resolving a request

1. **Name the screen.** A PRD uses design language — "post a listing", not `post-listing-ksa`.
   Run `node scripts/design-find.mjs "<the PRD's words>"` for each feature it names: it answers
   with the screens and states that match and the files to open — web and responsive. Match
   the screen itself on its design name in `kb/product/screens.html`; the repo path is
   provenance, not the key.
2. **No match?** Ask the designer: remake it, or will they supply it? Never improvise a screen.
3. **Start from a compiled page** either way — `deliverables/<page>.html`, or for a new screen the
   page cut at `div.pf-div` — rather than redrawing the shell from a description. There is no
   blank canvas in Profolio. (`kb/pages/_shell.html`'s starting markup predates the compiled
   pages and fails the lint.)
4. **Check the flags.** A surface behind a false flag does not exist for this market.
5. **Check the roles.** Agency owner, agency staff and individual seller often see different
   versions of one screen — compiled as the page itself, `--as-staff` and `--as-individual`.
   Say which you are designing.

## Hard constraints

Violating any of these makes the design wrong, not merely off-style. Each is how the product
itself renders — read off the compiled pages, not from any brief.

- **Currency** is the Saudi Riyal symbol, which the product draws as an icon-font glyph
  (`.currency-Saudi_Riyal_Symbol::before`, the `icomoon` face) in front of the amount — take it
  from the Number component in `deliverables/components/`. An amount is never written "SAR"
  or "ر.س". The one literal "SAR" the product ships is inside a sentence of copy — "Get one
  through Bayut, starting from SAR 250." (`ad-license-form.js:106`) — copy it as it is; never
  put SAR beside an amount yourself. **Area** renders **Sq. M.**
- REGA licensing, Nafath identity and the two-step listing draft exist **only** in KSA
  (`kb/product/ksa.html`). A posting flow from another Bayut market is not this product.
- The product is bilingual with RTL mirroring. This design system covers **English, web at
  1440 and responsive at 375** (the phone layout); an Arabic screen has not been compiled yet,
  so say so rather than mirroring one by hand.

`kb/product/ksa.html` is **product knowledge** — who uses the product, the regulation, the
money. It is not a source of design: how anything looks comes from the compiled product.

## Not your job

- Other Profolio tenants — Oman, Bahrain, Qatar, Jordan, Egypt, Zameen.
- The **consumer** side of bayut.sa — home, search, listing detail, public profiles. Strat owns
  those.
- The internal **Console / Control Panel**. Different surface, different users, English-only
  chrome. If a screenshot's users are ops or moderation, it is not Profolio.
- **Jarvis** CRM. Note the connection when purchases or contracts come up; do not design it.
- **Profolio-lite / member area.** A real second surface with its own branding and font stack,
  and KSA has `HAS_MEMBER_AREA: true`. It is **v2 and not yet specified** — say so and stop,
  rather than applying Profolio chrome to a lite screen.

## Keeping current

`kb/` is rendered by `scripts/kb.mjs` from markdown that `scripts/build.mjs` generates
out of the Profolio codebase and the canvas prose. That markdown is staging (`.build/`,
never committed); the HTML is the deliverable. `kb/pages/_shell.html` is generated too, so
its nav and measurements cannot drift from `menuList.js` and `withAdminLayout.js`.
Hand-written prose lives in `authoring/` — the KSA rules and the working guide — and
`kb/product/flows/` stays empty until someone writes one.

`data/live/` is written by `harness/capture.mjs`, which boots the product itself and
renders every route in a headless browser from a fixture account. Re-run it after any
product change; nothing in it was clicked by a person. The pages, states and components in
`deliverables/` are compiled from that same render (`npm run explore` and `npm run
explore:mobile` find the states — with `--nested`, what each modal and drawer leads to —
`npm run pages` and `npm run pages:mobile` compile them, then `npm run ds` builds the
stylesheet, the components, the design knowledge base and the responsive rules) and
each is scored against it; `npm run qa` holds everything to the live product and the code
and writes `deliverables/design-qa.html`. `data/qa/` holds the scores.

The fixture account answers every endpoint the real API was seen to serve, in its shape, for
two real accounts: an agency owner (`data/api-shapes.json`) and an agency staff user
(`data/api-shapes.b.json`, fixture mode `staff`). `node scripts/check-fixtures.mjs` proves it.
The individual seller (fixture mode `individual`) was not recorded from a real account: it is
the owner's own record with the agency taken away, so only what the role changes moves.

Every generated page carries the commit it was built from. If a generated page disagrees
with the code, the code is right and the generator needs re-running: `npm run all`.
