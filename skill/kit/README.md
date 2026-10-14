# The kit — wireframes, patterns, the prototype runtime and the Design QA

Read this before you write a wireframe or a hi-fi screen. `examples/leads-marketplace/` is
one whole feature built this way; copy its shape.

| file | what it is |
|---|---|
| `runtime.js` | makes a screen behave, by `data-pf-*` attributes and three JSON blocks |
| `layer.js` | shows a compiled product state (the expanded rail, a popover, a drawer) over any screen, in its own layer |
| `kit.css` | the pattern kit: layouts the product does not draw yet, and the 2.0 controls as classes (`pfk-*`) |
| `wireframe.css` | low fidelity at the shell's true proportions (`wf-*`) |
| `qa.js` | the Design QA, measured inside a rendered screen |
| `player.js`, `player.css` | the page around a prototype: states, web ↔ phone, scenario controls, notes |
| `riyal.svg` | the official riyal sign, from the product's icon font (`scripts/kit/riyal.py`) |

## A design's folder

```
designs/<feature>/
  intake.md                   the intake: the gap check, the questions and answers, the edge cases (INTAKE.md)
  design/context.json         copied from the skill's context.json, for the design-* skills
  flow.json                   the plan: screens, states, scenario controls, the state matrix, the directions
  state.json data.json actions.json   the variables, the rows, the named actions — shared by every screen and direction
  research/research.json      the research: competitors, Mobbin, trends, fresh moves (research/README.md)
  research/img/<id>.webp      the Mobbin images kept, embedded in the board
  research/board.html         built: node qa/board.mjs designs/<feature> — rebuild it once flow.json
                              has its directions, then publish it as its own artifact
  A/ B/ C/                    the three directions: <screen>.html (+ .mobile.html) each; B and C may have new.css
  wf-<screen>.html            the wireframe, small fixes only (+ wf-<screen>.mobile.html)
  <screen>.html               the hi-fi of a design with no directions (a small fix)
  wireframe.html              built: node qa/prototype.mjs designs/<feature> --wireframe
  prototype.html              built: node qa/prototype.mjs designs/<feature>
  qa/                         built: prototype.md (the QA report), handoff.md, shots/ (--shots)
```

A screen in `A/`, `B/` or `C/` sits one folder deeper: its links go three folders up
(`../../../css/…`, `../../../kit/kit.css`) and its JSON two (`data-src="../data.json"`).
`qa/compose.mjs` (below) gets all of this right; start every screen with it.

## Composing a screen (qa/compose.mjs)

Never hand-copy a compiled file: the links, the metas and the JSON blocks are easy to get
wrong, and the QA then fails on what is not your design.

```
node qa/compose.mjs start pages/leads.html designs/<feature>/B/leads.html --direction B
node qa/compose.mjs find  pages/leads.html ".pf-table"                  # what the selector matches, with line numbers
node qa/compose.mjs block pages/agency-staff.html ".pf-card" --nth 1 \
  | node qa/compose.mjs insert designs/<feature>/B/leads.html ".pf-filters" - --after
node qa/compose.mjs also    designs/<feature>/B/leads.html pages/agency-staff.html
node qa/compose.mjs replace designs/<feature>/B/leads.html ".pf-page-content" - < new-body.html
```

- **start** copies the compiled file and fixes it for where it goes: the links (two or three
  folders up), `pf-base` set to the file you named, scripts dropped, `tokens.css` and `kit.css`
  linked, the JSON blocks beside flow.json pulled in, and for B and C `new.css` linked (made
  with its header if missing). `--empty "<selector>"` empties a container to fill.
- **block** prints a compiled block's markup (or writes it with `--out`); **replace** and
  **insert** (`--before`, `--after`, `--prepend`, `--append`) put markup from a file, or `-` for
  stdin, into a screen; **also** names a file a block came from in `pf-also`.
- Selectors: a tag, `.class`, `#id`, `[attr]`, `[attr="v"]` (also `*=`, `^=`, `$=`), and
  descendants (`.pf-card .pf-title`). `--nth N` picks a match by the index `find` prints (from 0).

## Directions

Gate 1 shows two or three complete designs of one flow, every screen and state, web and
phone, switched in the player and all QA'd:

```json
"directions": [
  { "id": "A", "kind": "existing",   "title": "The product as it is", "label": "Existing", "layout": "table",
    "hero": "the search's name", "summary": "…", "fresh": [] },
  { "id": "B", "kind": "competitor", "title": "Linear-style views",   "label": "Competitor-led", "layout": "list-detail",
    "hero": "the open search's new matches", "summary": "…", "fresh": ["f1"] },
  { "id": "C", "kind": "bold",       "title": "Matches first",        "label": "Bold", "layout": "cards",
    "hero": "the new matches, as photos", "summary": "…", "fresh": ["f2", "f3"] }
],
"screens": [{ "id": "saved", "title": "Saved searches", "route": "/saved-searches",
  "directions": { "A": { "web": "A/saved.html", "phone": "A/saved.mobile.html" },
                  "B": { "web": "B/saved.html", "phone": "B/saved.mobile.html" },
                  "C": { "web": "C/saved.html", "phone": "C/saved.mobile.html" } } }],
"research": { "board_url": "https://claude.ai/…" }
```

- **Three ideas, not three skins.** Each direction declares its **layout** (`table`, `list`,
  `cards`, `list-detail`, `feed`, `board`, `dashboard`, `map`, `wizard`) and its **hero**, the
  one thing read first. Bold never takes A's layout; competitor-led changes A's layout or its
  hero. The QA also measures it: on the web, at the first state, the main list of each
  direction is held against A's (how many per row, how wide, how tall). The same list with a
  band or a rail added around it is the same layout (`alike`: an error for C, a warning for B).
  The 2026-10-14 test failed this way: three directions, one table.
- **existing (A)**: the product's components and kit patterns only, in its tokens. No stylesheet of
  its own: the QA fails a direction A that links one, or that uses a visual element.
- **competitor (B)**: new patterns, the strongest convention in the references (their layout,
  not only a detail), with the kit's visual elements and `B/new.css` on `pfx-*` classes, in the
  product's colours and type only. The QA fails a colour or a font
  written in it: use `var(--pf-…)` / `var(--pfk-…)` from tokens.md.
- **bold (C)**: a new layout, new patterns and a new visual language in `C/new.css`: a type
  scale with a real hero size, colour given one meaning each, the visual elements restyled
  through its tokens. Four colours on A's table is not bold. Each new colour or face is
  declared once as a token with its reason, and used through `var()`:
  `--pfx-ink: #0b3d2e; /* [new] a deeper green for the insight band */`. The QA lists every new
  token in the handoff and on the board, for the designer's sign-off.
- A direction's CSS styles only its own `pfx-*` classes, never a product class (`.pf-card`):
  wrap a product component in a `pfx-` container instead.
- **fresh**: the research's fresh moves the direction draws (B at least one, C at least two),
  each marked on the element that draws it: `data-pf-fresh="f2"`. B and C each draw at least
  one move of size `layout` or `hero`. The QA fails a listed move that no screen marks.
- **chosen**: after gate 1, `"chosen": "B"`. The prototype then holds that direction alone, and
  the gate-2 QA covers it. The others stay in the folder.
- **research.board_url**: the published board's link, opened by the player's "Research board".
  Without it, the player links `research/board.html`, beside the prototype.
- **One set of states and data for all three.** Where a direction draws a step another way (a
  dialog in A, a menu in B), the state sets both keys, `"set": {"overlay": "status", "menu":
  "status"}`, and each direction's markup answers to its own. Never fork the data.

A screen at the design's root (a small fix) links its stylesheets two folders up
(`../../css/…`, `../../kit/kit.css`); one in `A/`, `B/` or `C/`, three. Both pull the shared
JSON in (`data-src="../data.json"` from a direction's folder):

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

- **states** are named scenarios. `set` gives variables first, then `do` runs actions with no
  waiting, so an action sees what `set` gave (`"set": {"lead": "O1"}, "do": ["buy"]`). The
  player lists them, and the QA renders every one on every platform.
- **data.json** is keyed by list: `{"owner": [...]}`. A list that changes with the `data`
  control is keyed by dataset too: `{"owner": {"many": [...], "none": []}}`. `data=none` then
  shows `none`; a dataset a list lacks shows it empty; no `data` shows `many` (else the first).
- **controls** are the scenario switches in the player: balance, role, network, data. A state
  keeps a control's value unless it sets that key itself.
- **matrix** is the state matrix, one row per region that shows data: a table, a list, a
  dropdown's options, a counter. Every row needs `default`, `loading`, `empty` and `error`,
  plus `no-results` when the list filters or searches. Each one names a state, or says
  `"not drawn: <why>"`, or `"compiled: <file>"` for a region the design leaves as the product
  draws it. Work these out even when the PRD is silent: the QA fails without them.
  - `count`: the `data-pf-count` key the region's counter uses, when it is not the list's name.
  - `row`: the row the extremes change (from 0), when the first is not typical: a row whose
    status hides the field, say. Fields a `$.field=` condition reads are never changed.
- **pages**: the compiled product pages the rail opens. `"all"` gives the whole product,
  `"none"`, or a list of page ids. A wireframe bundles none by default.
- **size**: a screen's own viewport. The 2.0 phone is 360 × 800; the default is 1440 × 900
  and 375 × 812.
- **options**: the open design decisions, each with 2–3 variants the user flips live in the
  player at the wireframe gate. For example, how a locked contact looks:
  `{"key": "opt.lock", "title": "Locked contact", "question": "…", "variants": [["blur", "A · …"], ["mask", "B · …"], ["avatar", "C · …"]]}`.
  - The markup shows each variant by `data-pf-show="opt.lock=mask"`.
  - `state.json` sets the default.
  - Once the user picks, write `"chosen": "mask"`. The hi-fi may keep all variants until then.
  - `state`: the state that shows the option (a dialog's). Without it, the QA renders every
    variant in each state that sets the key, else in the first state.
- **shell.rail**: the rail as the design changes it, applied wherever the product's rail
  draws: the design's own rail, the other pages', the expanded rail, an open group and the
  phone's menu. **The only way to change the rail**: never edit its markup, never draw one.
  - A top-level item, after a neighbour:
    `{"add": [{"key": "leads-marketplace", "label": "Leads Marketplace", "after": "leads", "icon": "prop-shop", "page": "marketplace"}], "selected": "leads-marketplace"}`.
    The icon is another item's (`prop-shop` is Credits & Packages); `page` is where it goes.
  - An item inside a group: `under` names the group, `after` a child (else it goes last):
    `{"key": "agency-report", "label": "Agency Report", "under": "reports", "after": "leads-reports", "page": "agency-report", "tag": "NEW"}`.
    Reports is the product's one group: `summary`, `listing-reports`, `leads-reports`. A child
    shows only where the group is open: the expanded rail's Reports opens it on a click
    (`rail-expanded-reports`), the phone's menu likewise (`mobile-menu-reports`). The collapsed
    rail shows the group's icon alone, as the product does.
  - `tag: "NEW"`: the product's own NEW chip (`.pf-new-chip`, red, from the Post a Listing menu),
    6 px after the label. Any other badge is new design: [TBC].
  - `selected`: the item drawn selected. A selected child selects its group in the expanded
    rail; the collapsed rail then selects nothing, as the product does on a report page.
  - Keys are the product's (`node qa/registry.mjs shell`, or the `data-menu-id` ends in a
    compiled page); they are matched whole.

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
| `data-pf-text="key"` · `data-pf-fmt="n"` · `data-pf-default="…"` | its text is the value (`n`: 72,880 · `money`: 1,250.00 · `upper`) |
| `data-pf-class="cls: expr; cls2: expr"` | toggles classes — a control's selected look |
| `data-pf-attr="aria-selected: expr"` | toggles an attribute |
| `data-pf-value="key"` | an input's value, both ways |
| `data-pf-overlay="id"` | shown while `overlay=id` (a dialog, a sheet) |
| `data-pf-menu-panel="id"` | shown while `menu=id` (a dropdown); a click outside closes it |
| `data-pf-list="rows"` + a `<template>` child | one copy of the template per row. Also: `data-pf-filter="purpose=@filter.purpose; price>=@min; types~@filter.type"` (a clause with an empty value is off; `~` contains), `data-pf-search="q: name city"`, `data-pf-sort="@sort"` (a field, `-field` descending), `data-pf-count="key"` (a second list of the same rows keeps its own count) |
| `data-pf-skeleton="rows"` · `data-pf-rows="6"` | skeleton rows built from that list's own row, so they follow its columns. `data-pf-skeleton-from=".sel"` names the list when it is not the nearest |
| `data-pf-count="key"` | on a list: the count it writes (`count.<key>`); a second list of the same rows needs its own |

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
| `data-pf-standin="what"` | a placeholder for a step the product hands on (`"Checkout.com card form"`, `"a phone call"`): listed in the handoff under Stand-ins, [TBC] |

**A menu on every row**, inside the row's template so it opens beside it. The trigger sets the
row and toggles the menu; the panel shows only in that row:

```html
<button data-pf-set="row=$.id" data-pf-menu="row-menu">…</button>
<div data-pf-show="row=$.id"><div class="pfk-menu" data-pf-menu-panel="row-menu">…</div></div>
```

Its items act on `@row` (`"where": "$.id=@row"`). The sweep clicks the first row's trigger, as a
person would, so no QA-only fallback is needed.

**An antd modal or drawer copied from a compiled state**: put `data-pf-overlay="<id>"` on its
root (`.ant-modal-root`, `.ant-drawer`), not on the dialog inside, so the mask hides with it.

**A step the product hands on** (a payment form, a call, an e-mail app): draw what the user
sees before it, then a stand-in with `data-pf-standin` that does what the step would end in
(`data-pf-do="paid"`). Never draw the third party's own form.

**Actions** are lists of steps in `actions.json`:
`{"set": {…}}`, `{"wait": 900}`, `{"open": "buy"}`, `{"close": true}`, `{"toast": "bought"}`,
`{"if": "balance<@price", "then": […], "else": […]}`, `{"do": "other"}`, `{"go": "state"}`,
`{"page": "/lms/leads"}`, `{"update": "owner", "where": "$.id=@lead", "with": {"status": "bought"}}`,
`{"remove": "owner", "where": "…"}`, `{"add": "owner", "item": {…}, "at": "start"}`.

**The shell is the product's, and works by itself.** Copy the compiled page's shell and leave it
as it is:
- **the rail** opens the other pages. As in the product, it is click-toggled
  (`PUSH_CONTENT_ON_SIDEBAR_EXPAND`): a click on the collapsed rail or its edge button expands
  it and pushes the page aside, the page beside it stays usable, a click on Reports opens and
  closes the group, and only the ‹ button collapses it. Hover does nothing;
- **the header's bell, avatar, Post a Listing and help** open their compiled states over your
  screen, through the `data-pf-go` the compiled page already carries. On a phone, the menu and
  the drawers do the same;
- **Download App and Go to Bayut.sa** say where they go.

A compiled state opens in its own layer (`kit/layer.js`): a transparent frame over the screen,
with the state's own stylesheet, showing only the state's top layer. It therefore looks exactly
as the product draws it on any page, 2.0 or current, and nothing of it enters your DOM.

A control the QA still calls dead gets `data-pf-go` (a compiled state), `data-pf-toast`, or
`data-pf-inert`. The 2.0 phone page never wired its bell and avatar, so give them
`data-pf-go="states/listings--drawer-notifications-mark-all-as.html"` and
`states/listings--drawer-profile-information-faisal-al-harbi.html`.

## The patterns (kit.css)

Use a pattern for anything the product does not draw. Use the product's own component for what
it does draw: copy it from `registry.components[x].file`. Every value is a token or measured from
a compiled 2.0 screen. A pattern needs no `style` attribute.

**The kit's controls are 2.0's** (green, Geist): `pfk-btn`, `pfk-seg`, `pfk-select`, `pfk-chips`,
`pfk-tabs`, `pfk-pill`. On a page in the **current theme** (every page but My Listings), use the
product's own controls instead: `node qa/registry.mjs component button` (also `select`, `tabs`,
`tag`, `modal`) gives the file whose markup to copy, with `qa/compose.mjs block`. Take from the
kit only what has no product equivalent: `pfk-table`, `pfk-stack`, `pfk-empty`, `pfk-skel`,
`pfk-toasts`, `pfk-missing`, `pfk-lock`. On a current page their `--pf-ml-*` values fall back to
the page's own font and neutral greys. A 2.0 control on a current
page mixes the two themes: [TBC], for the designer.
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
| locked content | `pfk-lock` (with the product's lock icon), `pfk-masked`, `pfk-avatar` › `pfk-avatar__lock` |
| missing value | `pfk-missing` (a value the source did not share) |
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

**Missing data: every field says what it shows when the source didn't send it.** A lead
without rooms, a district or a price is normal, not an error. For each field a screen shows, the
plan decides one of:
- a fallback: `data-pf-default="Not shared"`, greyed with `pfk-missing`;
- hide it and close the gap: `data-pf-show="$.district"`;
- a sentence that works with whatever exists: "From 900,000" when there is only a minimum,
  "3 Beds" when there are no baths.
Say what is missing where the layout can't: "Rooms not shared" on a card; "Not shared" under
a column header. `data.json` carries incomplete rows so the prototype shows them, and the QA
empties, lengthens and translates the first row of every list to be sure: a blank value, or
"undefined", "null" or "NaN", fails.

**Locked content: design the lock, and offer options.** Something the user may not see yet
needs a state of its own: the contact of an unbought lead, a premium number, a field their role
cannot see. Offer 2–3 variants as flow.json `options`, e.g.:
- A: blurred, with `pfk-lock` "Unlocks after purchase";
- B: masked (`pfk-masked`: "M••• A•••••", "+966 55 ••• ••37") with an inline "Unlock for 40 credits";
- C: an initials avatar with the lock (`pfk-avatar` + `pfk-avatar__lock`).
The lock icon is the product's (`atoms/icon.html` → `#icon-lock-bages`; name the file in pf-also).
The real value never reaches the page before it is unlocked: the data carries a placeholder,
a masked value or initials, and the handoff says the API must too.

## Visual elements (kit.css, v2.4) — for B and C

What turns a list into a design. Each is a 2.0 token pattern, QA-clean as it is; C restyles
them through its `--pfx-*` tokens. Direction A may not use them.

| element | classes | for |
|---|---|---|
| card grid | `pfk-grid` (`--pfk-min: 280px`) | items as cards, as many per row as fit |
| list beside detail | `pfk-split` › … · `pfk-split__side` (`--pfk-side: 380px`, sticky) | browse on the left, the open item on the right |
| rich card | `pfk-tile` (`--on`, `--muted`) › `__head` (`__media` + title stack) · `__title` · `__meta` · `__figure` · `__body` · `__foot` | an item as a small page: what it is, the one figure, its actions |
| stat tiles | `pfk-stats` › `pfk-stat` (`--on`; a `<button>` to filter) › `__value` · `__label` · `pfk-delta--up` / `--down` | the numbers that matter now, each a way in |
| avatar stack | `pfk-avatars` › `pfk-avatar` × n · `pfk-avatars__more` | who else is here: agencies that unlocked, agents on a lead |
| score ring | `pfk-ring` (`style="--pfk-value: 72"`, `--lg`) › `pfk-ring__value` | a match or quality score, read at a glance |
| meter · bar | `pfk-meter` › `pfk-meter__seg` (`--on`, `--warn`) · `pfk-bar` (`--pfk-value`) | slots taken, a quota, progress |
| thumbnails | `pfk-thumbs` › `<img>` · `pfk-thumbs__more` | the listings behind a number, shown |
| icon chips | `pfk-ichips` › `pfk-ichip` (`--good`, `--warn`) with the product's icon | facts with their icon: beds, purpose, slots left |
| insight band | `pfk-band` (`--warn`) › icon · `pfk-band__text` · an action | one sentence on what matters now |
| sparkline | `<svg class="pfk-spark" viewBox="0 0 80 24"><polyline points="…"/></svg>` | a trend beside a number |
| steps | `pfk-steps` › `li` › `pfk-steps__dot` (`--done`) | what happens next |

`--pfk-value`, `--pfk-min` and `--pfk-side` are the only style attributes `qa/validate.py`
allows on them. Icons and art are the product's own (`atoms/icon.html`, design-illustration).

**The worked example is about wiring, not looks.** `examples/leads-marketplace/` shows how the
runtime, the states and the QA fit together. Its table is one layout among many: never start a
direction B or C from it.

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
  - `unstyled`: a button, select or input in the browser's default style (an outset or inset
    border): its stylesheet is missing, as in a control copied without it or written by hand;
  - `targets` (phone): a control under 24 px is an error, under 32 px a warning; a link inside
    a sentence is exempt;
  - `alike`: a direction's main list drawn as A's (above, directions);
  - `rail`: on the web, the rail is not 60 px when the screen opens (it ships collapsed), or
    has items its compiled page does not (or lost some), or is missing where the pf-base
    draws it. A hand-built navigation fails here;
  - `runtime`.
  `rows` and `small` are warnings.

Then the **sweep**, from each screen's first state:
- **every interaction**: each shell control, the expanded rail among them; each group a `shell.rail` item
  goes `under`, opened (its item must show, and no label in the rail may be cut off); every `data-pf-menu` and
  `data-pf-open`. Each result is checked (`shell`: it opens something visible, on the screen,
  styled, and an expanded rail pushes the page aside; `clip`: a menu or sheet is not cut off),
  and the whole screen is measured again;
- **the data at its extremes**: the first row of every list in the matrix emptied, lengthened,
  in Arabic and at zero;
- **every option variant**.

The badge and the report say what was covered: "13 states × 2 platforms · 15 interactions ·
8 extreme-data · 6 option renders". Never call a prototype checked beyond that.

An issue the compiled source page has too is the product's own; it is listed and not counted.

- **Exit 0:** QA passed.
- **Exit 1:** fix and run again. The prototype says "not ready to share" until it passes.
- **Exit 3:** no browser here. `qa/browser.mjs` tries Playwright, Puppeteer, a system Chrome,
  then npm's `@sparticuz/chromium` on Linux. Deliver it saying the visual QA did not run, and ask
  for the QA button in the prototype to be pressed.

With `--shots`, look at the PNGs in `qa/shots/` before delivering: the states, and the
interactions (`<state>.i<n>-<kind>`), extremes (`.x-<kind>`) and options (`.o-…`). Numbers don't catch everything
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
