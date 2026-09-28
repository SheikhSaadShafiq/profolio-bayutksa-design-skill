# Profolio KSA — design system

The design system and product knowledge base for **Bayut Profolio KSA**, the agent and
seller portal at profolio.bayut.sa, packaged as a Claude skill.

**Start at `deliverables/design-system.html`.** Every page, state and component in it is
compiled from the product's own render — nothing is redrawn — and each one carries the score
it got against the product it came from.

| Path | What |
|---|---|
| `SKILL.md` | The router for the agent. Small on purpose. |
| `deliverables/design-system.html` | **The design system.** Foundations (measured from the stylesheet), atoms, molecules, organisms, templates, then every compiled page and state, and the product knowledge that goes with them. |
| `deliverables/components/` | One page per component: live variants, markup, the exact CSS, forced interaction states, anatomy, usage, source file, copy. |
| `deliverables/<page>.html`, `deliverables/states/` | The eleven pages and every reachable state, compiled from the product, pixel-identical at 1440. A clickable prototype: triggers link to their states. |
| `deliverables/profolio.css`, `tokens.css` | The one stylesheet (the product's own CSS, renamed) and the named tokens. |
| `deliverables/profolio-ksa.html` | Everything above in one self-contained file. |
| `kb/` | **The knowledge base.** Product (KSA rules, screens, flags, copy by area), a page per route, and the working guide. Generated from the product's source. |
| `harness/` | Boots the product itself and drives it on a fixture account: `capture.mjs` (every route), `explore.mjs` (every state a page can reach), `freeze.js` (serialise a render with its CSS and provenance). `fixtures/` holds the invented account, held to the real API's shape. |
| `scripts/compile.mjs` | Pages and states from the product's render. |
| `scripts/ds/` | The design system from the compiled pages: `stylesheet`, `tokens`, `kb-links`, `collect`, `catalogue`. |
| `data/` | Machine inputs and scores: `live/` (the product, harness and real-account geometry), `ours/` (the compiled files, re-rendered), `qa/` (every score), `api-shapes.json` (the real API's keys and types, no values). |
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
compiles every page and state, builds the design system, packs the single file and runs
`npm run check`. Each stage can be run alone — see `package.json`.

To compare against a real, signed-in account: run `npm run receive-real`, sign in to the
local product on 3000, and post captures from the page (see the header of
`scripts/receive-real.mjs`). Captures carry geometry only; `scripts/leaks.mjs` refuses anything
else.
