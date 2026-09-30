# The kit — wireframes, patterns, the prototype runtime and the Design QA

Read this before you write a wireframe or a hi-fi screen. `examples/leads-marketplace/` is
one whole feature built this way; copy its shape.

| file | what it is |
|---|---|
| `runtime.js` | makes a screen behave, by `data-pf-*` attributes and three JSON blocks |
| `kit.css` | the pattern kit: layouts the product does not draw yet, and the 2.0 controls as classes (`pfk-*`) |
| `wireframe.css` | low fidelity at the shell's true proportions (`wf-*`) |
| `qa.js` | the Design QA, measured inside a rendered screen |
| `player.js`, `player.css` | the page around a prototype: states, web ↔ phone, scenario controls, notes |
| `riyal.svg` | the official riyal sign, from the product's icon font (`scripts/kit/riyal.py`) |

## A design's folder

```
designs/<feature>/
  flow.json                   the plan: screens, states, scenario controls, the state matrix
  state.json data.json actions.json   the variables, the rows, the named actions — shared by every screen
  wf-<screen>.html            the wireframe, web     (+ wf-<screen>.mobile.html)
  <screen>.html               the hi-fi, web         (+ <screen>.mobile.html)
  wireframe.html              built: node qa/prototype.mjs designs/<feature> --wireframe
  prototype.html              built: node qa/prototype.mjs designs/<feature>
  qa/                         built: prototype.md (the QA report), handoff.md, shots/ (--shots)
```

A screen links its stylesheets two folders up (`../../css/…`, `../../kit/kit.css`) and pulls the
shared JSON in:

```html
<script type="application/json" id="pf-state" data-src="state.json"></script>
<script type="application/json" id="pf-data" data-src="data.json"></script>
<script type="application/json" id="pf-actions" data-src="actions.json"></script>
```

## flow.json

```json
{
  "name": "leads-marketplace", "title": "Leads Marketplace",
  "theme": "Profolio 2.0, extended to a new page — [TBC] designer sign-off",
  "platforms": ["web", "phone"], "start": "owner", "pages": "all",
  "screens": [{ "id": "marketplace", "title": "Leads Marketplace", "route": "/leads-marketplace",
                "web": "marketplace.html", "phone": "marketplace.mobile.html", "size": { "phone": [360, 800] },
                "wireframe": { "web": "wf-marketplace.html", "phone": "wf-marketplace.mobile.html" } }],
  "controls": [{ "key": "balance", "label": "Credits", "options": [[72880, "72,880"], [28, "28 (low)"]] }],
  "states": [{ "id": "owner", "group": "Browse", "title": "Owner Leads", "set": { "tab": "owner" },
               "notes": "What this state shows and why", "try": ["Buy the first lead"] },
             { "id": "bought", "group": "Buy", "set": { "lead": "O1", "price": 40 }, "do": ["confirm"] }],
  "matrix": [{ "region": "Owner leads table", "list": "owner",
               "kinds": { "default": "owner", "loading": "loading", "empty": "empty", "error": "error",
                          "no-results": "no-results", "first-use": "first-visit" } }]
}
```

- **states** are named scenarios. `set` gives variables, and `do` runs actions from the start with
  no waiting. The player lists them, and the QA renders every one on every platform.
- **controls** are the scenario switches in the player: balance, role, network, data. A state
  keeps a control's value unless it sets that key itself.
- **matrix** is the state matrix, one row per region that shows data: a table, a list, a
  dropdown's options, a counter. Every row needs `default`, `loading`, `empty` and `error`,
  plus `no-results` when the list filters or searches. Each one names a state, or says
  `"not drawn: <why>"`. Work these out even when the PRD is silent: the QA fails without them.
- **pages**: the compiled product pages the rail opens. `"all"` gives the whole product,
  `"none"`, or a list of page ids. A wireframe bundles none by default.
- **size**: a screen's own viewport. The 2.0 phone is 360 × 800; the default is 1440 × 900
  and 375 × 812.

## The runtime

**Variables.** `pf-state` holds the first values. Keys may have dots: `filter.city`. The runtime
adds `count.<list>` and `total.<list>`: the rows shown after filtering, and all of them.
`overlay` and `menu` are the open dialog and the open menu.

**Expressions** (`data-pf-show`, `data-pf-class`, `if`): `tab=owner`, `balance<@price`,
`filter.city`, `!filter.city`, `a && (b || c)`. A bare word on the left is a variable; on the
right it is text. `@key` is a variable anywhere. `$.field` is the row's field inside a list.

**Values** (`data-pf-set`, `set` in actions): `x=1; y='two words'; z=@other; w=$.id; t={@balance-@price}`.
The braces do + − × ÷.

| binding | does |
|---|---|
| `data-pf-show="expr"` | shows the element when true (it restores the element's own `display`) |
| `data-pf-text="key"` · `data-pf-fmt="n"` · `data-pf-default="…"` | its text is the value (n: 72,880) |
| `data-pf-class="cls: expr; cls2: expr"` | toggles classes — a control's selected look |
| `data-pf-attr="aria-selected: expr"` | toggles an attribute |
| `data-pf-value="key"` | an input's value, both ways |
| `data-pf-overlay="id"` | shown while `overlay=id` (a dialog, a sheet) |
| `data-pf-menu-panel="id"` | shown while `menu=id` (a dropdown); a click outside closes it |
| `data-pf-list="rows"` + a `<template>` child | one copy of the template per row. Also: `data-pf-filter="purpose=@filter.purpose; price>=@min; types~@filter.type"` (a clause with an empty value is off; `~` contains), `data-pf-search="q: name city"`, `data-pf-sort="@sort"` (a field, `-field` descending), `data-pf-count="key"` (a second list of the same rows keeps its own count) |
| `data-pf-skeleton="rows"` · `data-pf-rows="6"` | skeleton rows built from that list's own row, so they follow its columns |

| action (on click) | does |
|---|---|
| `data-pf-set="k=v; …"` · `data-pf-toggle="k"` | sets variables |
| `data-pf-open="id"` · `data-pf-close` · `data-pf-menu="id"` | opens a dialog, closes it, toggles a menu |
| `data-pf-scrim` | on a backdrop: a click on it (not on what sits on it) closes |
| `data-pf-do="name"` | runs `pf-actions[name]` |
| `data-pf-go="state"` | jumps to a flow.json state; `data-pf-go="…/x.html"` opens a compiled state (the shell's) |
| `data-pf-page="screen-id or /route"` | another screen of the prototype, or a bundled product page |
| `data-pf-toast="id or text"` | a `<template data-pf-toast="id">`, or plain text |
| `data-pf-href="https://…"` | says where it would go, outside the prototype |
| `data-pf-busy="600"` | the button loads for that long before its action |
| `data-pf-inert="why"` | not interactive, on purpose — the QA accepts it |

**Actions** are lists of steps in `actions.json`:
`{"set": {…}}`, `{"wait": 900}`, `{"open": "buy"}`, `{"close": true}`, `{"toast": "bought"}`,
`{"if": "balance<@price", "then": […], "else": […]}`, `{"do": "other"}`, `{"go": "state"}`,
`{"page": "/lms/leads"}`, `{"update": "owner", "where": "$.id=@lead", "with": {"status": "bought"}}`,
`{"remove": "owner", "where": "…"}`, `{"add": "owner", "item": {…}, "at": "start"}`.

**The shell is the product's, and works by itself.** Copy the compiled page's shell and leave it
as it is:
- the rail opens the other pages, and it expands on hover;
- the header's bell, avatar, Post a Listing and help open their compiled states over your screen,
  through the `data-pf-go` the compiled page already carries;
- Download App and Go to Bayut.sa say where they go.
A control the QA still calls dead gets `data-pf-go` (a compiled state), `data-pf-toast`, or
`data-pf-inert`.

## The patterns (kit.css)

Use a pattern for anything the product does not draw. Use the product's own component for what
it does draw: copy it from `registry.components[x].file`. Every value is a token or measured from
a compiled 2.0 screen. A pattern needs no `style` attribute.
- **One exception:** a table's columns, `style="--pfk-cols: minmax(0, 1.3fr) … 216px"`.
  `qa/validate.py` allows it.

| pattern | classes |
|---|---|
| data table: the header and every row share one grid, so a header sits over its column | `pfk-table` (`--pfk-cols`) › `pfk-thead` › `pfk-th` (`--end`) · `pfk-tr` (`--good`, `--muted`) › `pfk-td` (`--end`) |
| cell content | `pfk-stack` (`--md`), `pfk-inline`, `pfk-label`, `pfk-value` (`--strong`, `--hero`), `pfk-meta`, `pfk-truncate`, `pfk-icon`, `pfk-teaser` (a blurred placeholder — never real data) |
| amount | `<span class="pfk-amount"><i class="pfk-riyal" aria-label="SAR"></i><span>2,450,000</span></span>` |
| pill | `pfk-pill` `--good` `--info` `--neutral` `--warn` `--bad` |
| button | `pfk-btn` (40 px, green), `--secondary`, `--soft`, `--link`, `--block`; its label is ONE element: `<button class="pfk-btn">{icon}<span>Buy for <span data-pf-text="$.credits"></span> Credits</span></button>` |
| 2.0 controls | `pfk-seg` › `pfk-seg__opt` (`--on`) · `pfk-select` (`--set`) + `pfk-anchor` + `pfk-menu` › `pfk-menu__item` (`--on`) · `pfk-chips` › `pfk-chip` · `pfk-clear` · `pfk-outline` · `pfk-tabs` › `pfk-tab` (`--on`) › `pfk-tab__count` |
| dialog | `pfk-mask` (`data-pf-overlay`, `data-pf-scrim`) › `pfk-dialog` › `__head` `__title` `__close` · `__body` · `__foot` · `__note`; `pfk-summary`, `pfk-kv`, `pfk-callout` (`--warn`) |
| empty · no results · error · first use | `pfk-empty` › `__art` (`--grey` for offline) with the build's own art, `__title`, `__text`, `__actions` |
| phone (2.0, 360) | `pfk-strip` · `pfk-seg--sm` · `pfk-fchip` (`--set`) · `pfk-tabs--sm` · `pfk-list` › `pfk-lead` (`--good`, `--muted`) · `pfk-mask--sheet` › `pfk-sheet` › `__handle` `__title` · `pfk-bar` |
| runtime pieces | `pfk-toasts` › `pfk-toast` · `pfk-skel` · `pfk-busy` |

**The empty-state recipe.** Pick the art by meaning, from the build's own:
- nothing yet → `empty-active` art;
- no filter results → `empty-filter` art;
- failed to load → `offline` art.

Then:
- a title that says what happened, in the product's voice;
- one line that says what to do;
- one action that exists, such as Clear filters, Try Again or Refresh.

Never promise a feature the page does not have, like "turn on notifications" with no switch.

## Wireframes (wireframe.css)

Use grey boxes, real copy and the real data, at the shell's proportions: `wf-shell` › `wf-rail`
(`wf-rail-item`, `--on`, `--new`) · `wf-header` · `wf-main`. On a phone: `wf-phone` ›
`wf-phone-header` · `wf-phone-main`. Use blocks, controls, `wf-table` (the same `--pfk-cols` as
the hi-fi), `wf-empty`, `wf-mask` › `wf-modal`, `wf-sheet`, `wf-menu`, and annotations as
`wf-pin` numbers with a `wf-legend`. The wireframe has the same states, data and actions as the
hi-fi, so what is agreed there carries over.

## Building and the QA

```
node qa/prototype.mjs designs/<feature> --wireframe     # the wireframe, for the plan's approval
node qa/prototype.mjs designs/<feature> --shots         # the hi-fi prototype, QA, screenshots to look at
```

It writes one file and checks:
- **static**: flow.json, coverage, the matrix, empty states, actions, overlays, pages, the riyal,
  that every `var()` is defined, and `qa/validate.py`;
- **visual**: every state on every platform, measured by `qa.js`. Errors must be fixed:
  - `align`: a header off its column;
  - `controls`: buttons of different heights in one column, or a squashed button;
  - `overlap`, `clip`, `fonts`, `images`, `overflow`, `vars`;
  - `dead`: a clickable thing that does nothing;
  - `skeleton`: not the table's columns;
  - `spacing`: a label split into flex items;
  - `currency`;
  - `runtime`.
  `rows`, `targets` and `small` are warnings.

An issue the compiled source page has too is the product's own; it is listed and not counted.

- **Exit 0:** QA passed.
- **Exit 1:** fix and run again. The prototype says "not ready to share" until it passes.
- **Exit 3:** no browser here. `qa/browser.mjs` tries Playwright, Puppeteer, a system Chrome,
  then npm's `@sparticuz/chromium` on Linux. Deliver it saying the visual QA did not run, and ask
  for the QA button in the prototype to be pressed.

With `--shots`, look at the PNGs in `qa/shots/` before delivering. Numbers don't catch everything
a designer's eye does: one hero per row, a calm hierarchy, nothing competing.

## Gotchas

- **The 2.0 build writes its styles inline.** A control's selected look is another style
  attribute, so use the kit's modifier class (`pfk-tab--on`) and toggle it with `data-pf-class`.
- **Mark new copy on an unstyled element.** A compiled element with a `style` must not carry
  `data-pf-new-copy`: wrap the new words in `<span data-pf-new-copy>`.
- **Keep compiled containers.** Replace their children, not the element: its style is its source's.
- **A second list of the same rows needs its own count.** A dialog's one-row summary takes
  `data-pf-count="dialog"`, or it overwrites the table's `count.owner`.
- **A list inside a menu or a dialog** that is always full says so in the matrix:
  `"empty": "not drawn: the 13 regions always exist"`.
- **In a copied phone page**, controls the build never wired (the 2.0 phone's bell) get a
  `data-pf-go` to the compiled state: `states/listings--drawer-notifications-mark-all-as.html`.
