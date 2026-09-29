# Profolio KSA — design system

The design system and product knowledge base for **Bayut Profolio KSA**, the agent and
seller portal at profolio.bayut.sa, packaged as a Claude skill.

**Start at `deliverables/design-system.html`.** Every page, state and component in it is
compiled from the product's own render — nothing is redrawn — and each one carries the score
it got against the product it came from.

| Path | What |
|---|---|
| `SKILL.md` | The router for the agent. Small on purpose. |
| `deliverables/design-system.html` | **The design system.** Foundations (what the compiled pages paint: the two typefaces, colour ramps, the type scale, the corners), atoms, molecules, organisms, templates, then every compiled page and state, and the product knowledge that goes with them. |
| `deliverables/components/` | One page per component: live variants, markup, the exact CSS, forced interaction states, anatomy, usage, source file, copy — a spec sheet per variant (measured, with token names), and for buttons, inputs, selects, pickers, checkboxes, radios and switches a table of every state. |
| `deliverables/<page>.html`, `deliverables/states/` | The 24 pages and every reachable state, compiled from the product, pixel-identical at 1440: overlays and what they lead to (`--<parent>__<child>`), form states, loading / empty / error on every signed-in page, four flows as numbered steps (`--flow-<flow>-<nn>-<step>`), and the account variants (`--as-staff`, `--as-individual`, `--profile-incomplete`, `--modal-non-saudi`). A clickable prototype: triggers link to their states, Escape / ✕ / Cancel go back, ← → walk a flow, the rail and menus go to the other pages, and **M** switches between web and responsive. |
| `deliverables/mobile/` | The **responsive layout**: the same pages and states as the product draws them for a phone, at 375. |
| `deliverables/responsive.html` | **The responsive rules**, counted from both layouts: how the product picks its phone layout, which overlays become drawers, which components change size, what only one layout has — screen by screen. |
| `deliverables/design-qa.html` | **Design QA**: every page, state and component against the product's render, the live product on two real accounts, and the product's code. |
| `deliverables/profolio.css`, `profolio.mobile.css`, `tokens.css` | One stylesheet per layout (the product's own CSS, renamed) and the named tokens. |
| `deliverables/profolio-ksa.html`, `-responsive.html`, `-components.html` | Everything above as three self-contained files (web pages and states; the responsive layout; the components), each under 50 MB, each opening on the index; a link into another opens it at that page. |
| `kb/` | **The knowledge base.** Product (KSA rules, screens, flags, copy by area), a page per route, and the working guide. Generated from the product's source. |
| `kb/screens/`, `data/design-kb.json` | **The design knowledge base**: every compiled screen and state, web and responsive — what it is for, how each state is reached, what it shows, the components it adds, the file to open. `node scripts/design-find.mjs "<words from a PRD>"` searches it. |
| `scripts/design-brief.mjs`, `scripts/design-lint.mjs` | **PRD → design brief**: per requirement, the screens and states to start from, what the design must cover and the gaps (`npm run brief -- <prd.md>`). **Design lint**: an artboard held to the system — classes, colours, icons, copy, currency, shell, type, the 375 pair, disabled dimming (`npm run lint -- <design.html>`). |
| `harness/` | Boots the product itself and drives it on a fixture account: `capture.mjs` (every route), `explore.mjs` (every state a page can reach), `freeze.js` (serialise a render with its CSS and provenance). `fixtures/` holds the invented account, held to the real API's shape. |
| `scripts/compile.mjs` | Pages and states from the product's render. |
| `scripts/ds/` | The design system from the compiled pages: `prototype`, `stylesheet`, `tokens`, `kb-links`, `collect`, `catalogue` (web and responsive variants, specs, state tables), `design-kb`, `responsive`. |
| `scripts/design-qa.mjs`, `scripts/qa-fidelity.mjs` | Design QA: pixels, the live product (`--real`, `--account b`, `--mobile`), copy and sources. |
| `data/` | Machine inputs and scores: `live/` (the product, harness and real-account geometry), `ours/` (the compiled files, re-rendered), `qa/` (every score), `states/` (every state the explorer found, web and `mobile/`), `api-shapes.json` and `api-shapes.b.json` (two real accounts' API keys and types, no values). |
| `authoring/` | The only hand-written prose: the KSA rules and the working guide. Rendered into `kb/`. |

## Running it

The product (`profolio-reactjs`) must sit beside this repo — `../profolio-reactjs` — installed
and runnable with `yarn start`. The harness starts its own dev server on **port 3100** with the
fixture environment passed in; a normal `yarn start` on 3000 can keep running beside it.

```bash
npm install
npx playwright install chromium
npm run all
```

`npm run all` regenerates the knowledge base from the product source, captures every route,
compiles every page and state for the web and the responsive layout, builds the design system
and the design knowledge base, packs the three self-contained files, runs the Design QA and `npm run check`.
Each stage can be run alone — see `package.json`. To find states again after a product
change: `npm run explore` and `npm run explore:mobile`, then each again with `-- --nested` for what the modals and drawers lead to.

To compare against a real, signed-in account: run `npm run receive-real`, sign in to the
local product on 3000, and post captures from the page (see the header of
`scripts/receive-real.mjs` and `tools/profolio-capture/recorder.js`, which also records the
API's shapes). Captures carry geometry only; `scripts/leaks.mjs` refuses anything else. A
second account is kept apart (`?account=b`), and `npm run delta b` reports what it shows that
the first does not.
