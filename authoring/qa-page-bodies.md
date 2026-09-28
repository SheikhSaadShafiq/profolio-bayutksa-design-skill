# QA — the page bodies, and the number that was measuring nothing

Nine pages were reported here at 77–96% while being, in the user's words, "not
10% similar to live". Both statements were true, and the gap between them is
the finding.

## What the old number measured

`scripts/qa-design.mjs` scores **regions**, and a region is a **bounding box**
plus an allow-list of computed styles. Two pages that are both "a card on the
left, a card on the right" at the same sizes, with the same card radius, border
and shadow, score in the high eighties — whatever is inside them.

So this passed:

| page | what the product shows | what this system showed |
|---|---|---|
| Credits Usage | a 300px ring, a three-up Available/Used/Total strip, a five-row legend, and a timeline of dated property cards | a four-column stat grid and an empty table with a pager |
| Reports Summary | a purpose segmented control, a date-range field, three metric tabs with deltas, a channel strip, product pills and a 30-point line chart | two grey rectangles captioned "Chart" |
| Ad License | a 1035-wide wizard: a Back pill, an H2, three sections each a title column beside stepped fields with choice pills | a two-column form of six invented fields |
| Agency Settings | an in-card agency header, a phone field with a country box, an Agency Description textarea | an invented "Commercial Registration Number", no header, no textarea |

None of that is a styling mistake. It is **content that was written rather than
measured** — the failure the repo's own plan names as its spine, applied to the
one layer no check was looking at.

## The check that would have caught it

`scripts/qa-body.mjs`. It is `qa-overlays.mjs` one level up: it walks the
content region on both sides and compares what the body is **made of**.

```
node scripts/qa-body.mjs               every page that has both captures
node scripts/qa-body.mjs credits       only pages matching "credits"
```

| signal | what it catches |
|---|---|
| **cards** | a whole card missing, at a 400px floor so a chip is not counted as one |
| **charts** | a real `<svg>`/`<canvas>`, so a grey rectangle scores zero — the empty-state illustration and nested `<svg>` are excluded |
| **empty states** | ours empty where the product has data: a fixture answered with nothing |
| **parts** | buttons, links, fields and icons, under the conventions below |
| **nodes** | how much is in there at all — context on every line, a fault below 50% |

**Conventions it is taught, because they are deliberate and not defects:**

- a navigation is `<a href="not-built.html">` here and a Button in the product
- a select trigger is `<button class="pf-select">` here and a div wrapping an
  input in antd
- a segmented control, a product pill, a wizard choice and a metric tab are all
  antd `Radio`/`Tabs` — real `<input>`s — and `<button role="radio|tab">` here

**What the node ratio does NOT mean.** antd wraps generously and draws its
charts with a library; a hand-written page reproduces the same design with
fewer nodes and one `<svg>`. Reports Summary sits at 57% with every card, chart
and control matching. The ratio is context; the counts are the gate.

## Where the content comes from now

`scripts/outline.mjs` prints a capture's content region as a readable tree —
every box, its size, its position and the styles that decide whether it is a
card, a pill, a field or a divider:

```
node scripts/outline.mjs live/credits-usage --depth 12
```

Each page was rebuilt from three sources, in this order:

1. **the capture** (`data/live/<route>.capture.json`) for geometry
2. **the product's own field definitions** — `profileFields.js`,
   `agencySettingsFields.js`, `create-ad-license.js` — for labels, types and
   which controls are disabled
3. **the render** (`data/live/<route>.png`) for order and state

Source (2) is what caught the inverse of the usual error: Agency Settings
carried a **Commercial Registration Number** field unconditionally, when
`agencySettingsFields.js:28` gates it on `typeofBuisness === 'Agency Broker'`.
The account is not one, so the product does not draw it — an
instance-promoted-to-default, arrived at from the other direction.

## Still open

- **The range calendar is fabricated.** Both of its months share one invented
  day grid. The two new date fields on LMS Leads and Leads & Reach are
  therefore `data-noop` rather than wired to it: spreading a known-wrong
  component across three pages is worse than one honest gap.
- **Ad License is one card against the product's four**, and its choice groups
  count 24 controls against 6 — the product's capture of that page is shallower
  than the form it renders, so the tail of the wizard is unverified.
- **Listings and Dashboard** predate this check and carry their own gaps:
  Listings 35 links against 2, Dashboard 12 unmatched fields.
- **The illustration's own drawing instructions.** `svg.js` paints two of
  EmptyListing's shapes through `mask-type` and `mix-blend-mode` and three more
  through `style={{ fill: tenantTheme[…] }}`. The icon extractor dropped all of
  them and the art rendered near-black where the product's is nearly white; it
  now resolves the product's theme and keeps those two presentation styles.
  `scripts/check.mjs`'s no-inline-style rule exempts inlined `<svg>` for that
  reason and no other.

## A second way a reference lies: it is older than the fixture

The nine pages above were rebuilt against captures that were seven days stale,
and the staleness was doing three separate kinds of damage at once. None of it
was visible as a failing page — it was visible as a failing *region*, which is
the last place anyone looks for a bad reference.

**It blamed the pages for the reference's fault.** The notification bell is
gated on a user setting, not a route (`header-components.js:53-57`, defaulted
to `'disabled'` in `transformers/user.js:14`). The fixture enabled it partway
through 21 Sep. Eight routes were captured before that and four hold no
`ant-badge` anywhere — no bell in the header at all. `qa-design.mjs` duly
reported `shell.header` at **8.5% FAIL** on every one of them, and **0 shell
failures** on the two routes captured a day later. The header is the same
component on every route, so a per-route disagreement about it can only be the
reference. All eleven pages now read `shell ok`.

**It flattered the numbers.** Two of those captures were stubs: the product's
Listing Report body held **189** nodes and Leads & Reach **153**. Our pages
were scored against them at **210%** and **123%** — coverage over 100%, which
should have been read as "the reference is empty", not as a pass. Against the
current captures (821 and 450 nodes) the same, byte-identical HTML reads 48%
and 42%. Nothing about our pages changed; every node count on our side is
unchanged. Only the thing they were being compared to.

**It hid a route that had been broken for a week.** `/user-settings/user-
profile` had been crashing since the fixture reshape on 22 Sep, and its
reference capture predated the break, so nothing ever compared against a
working render. Three unguarded reads of one field:

| # | what the product does | where |
|---|---|---|
| 1 | reads `values.profile_image.sizes.thumbnail`, no optional chaining | `common/transformers/user.js:35` |
| 2 | converts `profile_image` to an array **only if that url is truthy** | `common/transformers/user.js:76` |
| 3 | reads `profile_image?.[0].gallerythumb` — the chain stops at `[0]` | `user-settings/profile.js:157` |

An empty-string thumbnail satisfies 1 and fails 3: `profile_image` stays the
raw `{sizes}` object, `[0]` is undefined, and the page dies on "Cannot read
properties of undefined (reading 'gallerythumb')" — then again in
`<ImageUpload>`, where `images?.map` is not a function. Serving a real picture
fixes 3 and breaks the shell instead, drawing an `<img>` in that one page's
header and a glyph in the other ten. The fixture is now an **array carrying the
`sizes` the mapper wants**, holding one record whose url is null: read 1 finds
`sizes.thumbnail`, read 2 leaves the array alone, read 3 finds `[0]` and a null
url, and antd's Avatar draws its own fallback — a solid `#9D9D9D` circle, on
all eleven headers.

The route went from 309 nodes (the `/user-settings` redirect shape, which
`check-captures.mjs` already flagged as a twin) to **397**, rendering its real
form for the first time. Everything the head had been built from was therefore
guesswork, and the measurements disagreed:

| | built from the redirect | measured from the render |
|---|---|---|
| avatar | 56×56 at x=461 | **58×58 ring at x=501**, 54 avatar inside it |
| completion | a 28×14 orange pill | **40×14, `#28B16D` green** |
| name | 20/**700** | 20/**600**, `#272B41` |
| role tags | 24 tall, radius 10, grey `#EFF0F3` | **26 tall, radius 24**, `#E1F2F0` / `#E7F3FF` |
| content inset | one 40px card pad | **two** — the body pads 40 and `.ant-card-meta` pads 40 again |

`settings.avatar` fell from **80%** of pixels differing to under 4%.

### The gate

`scripts/check-captures.mjs` now measures each capture's header — buttons and
`ant-badge-count` inside `ant-layout-header` — and names every capture that
disagrees with the **newest** one, with its date. Newest, not commonest: the
first cut took a majority vote and named the ten current captures stale,
because fourteen routes nobody had re-run outvoted them. The fixture only moves
forward, so the most recent render is the one that agrees with it.

`scripts/derive-layout.mjs` also gained a `shell.badge` region. It immediately
earned itself: the badge's horizontal place is not a fixed inset but
`w/2 - 14`, because antd centres the sup on the button's end edge and then
applies `offset={[-14,0]}`. We had a flat `-11px`, measured once against a
two-digit count, and it stayed behind when the count became `99+` and the badge
went 30 → 37 wide. The product put it at x=1328; we put it at 1334. A constant
cannot follow a width. It is now `inset-inline-end:14px` with
`translateX(50%)`, and both sides read `1328,2 37×20`.

## Still open, after this pass

- **The dashboard draws controls the product no longer does.** Its reference
  was seven days stale too, and under the current fixture the product's
  dashboard table renders **10 buttons over 10 rows** where the old capture had
  **120**. `deliverables/dashboard.html` was built from the 120. Cards, tabs and
  row counts all still agree, so this is a per-row column question, not a
  broken page — but the body now reads 129%, and 129% means the same thing
  210% did.
- **`npm run pages` only built Listings.** A change to `shell.mjs` reached one
  page out of eleven, and `npm run all` inherited that. It now runs all four
  generators. Anything measured between those two facts is suspect.
- `user-settings-licenses` and `user-settings-preferences` now read as twins of
  `change-password`. `shapeOf` only walks six levels deep, so three empty
  settings shells collide. The dedupe also now prefers the more specific route
  as the real one — `/user-settings` is the alias of
  `/user-settings/user-profile`, not the reverse.
