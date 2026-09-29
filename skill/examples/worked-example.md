# Worked example — ad licences expiring soon, on the Overview

One complete trace, as the skill is meant to run: a PRD, the intake table filled from it,
the questions only the designer can answer, the confirmation, the pages produced, and the
output contract. The six designs it produced are in `designs/` and pass `qa/validate.py`.

---

## 1 · The PRD

> **Ad licences expiring soon**
>
> **Problem.** A listing goes offline the day its REGA ad licence expires. Agents find out
> afterwards — from a drop in leads, or a support call — because the expiry date is only
> shown inside My Listings.
>
> **Goal.** Show, on the Overview, the listings whose licence expires within 30 days, soonest
> first, so an agent can act before the listing drops.
>
> - **R1** On the Overview, a card lists the active listings whose REGA ad licence expires
>   within 30 days, soonest first, at most three: the listing as My Listings shows it, and its
>   REGA ad licence expiry date.
> - **R2** Each row has an action to request a new ad licence for that listing.
> - **R3** "View all" opens My Listings.
> - **R4** An agency staff user sees only their own listings; the agency owner sees the
>   agency's.
> - **R5** On a phone, the card sits under the credits widget.
> - **R6** Only where the market shows licence expiry.

---

## 2 · Intake — proposed from the PRD

Read first: `registry.json`, then `product/flags.md`, `product/roles.md`,
`product/copy/table.md`, `product/copy/tenant-listing.md`, `product/copy/page-ad-license.md`.

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| 1 | New page, change, or new cross-page component? | **Change** to an existing page: a new card on the Overview. | high |
| 2 | Which page(s)? | `pages.dashboard` — `/dashboard`, "Overview" (its `aliases`). | high |
| 3 | Entry point | The rail's Overview; the dashboard is where sign-in lands. | high |
| 4 | Roles | Owner: the agency's listings. Staff: their own (R4). **Individual: not in the PRD** — `product/roles.md` says an individual has no agency, so their own listings. | medium — asked |
| 5 | Flags | `SHOW_REGA_LICENSE_EXPIRY=true` (R6; it gates `expiry-renewal.js`, the expiry the card shows). `AD_LICENSE_CREATION_ENABLED=true` (R2's flow). Neither is in `pages.dashboard.flags` today — the card brings them. | high |
| 6 | States | Loading: the Overview's own skeleton (`pages/dashboard/loading.html`). Error: the Overview's own card error — No Record Found, *Something went wrong*, Retry (`pages/dashboard/error.html`). Flag-off: the card is not drawn. No-permission: none — every signed-in role has an Overview. **Empty: the PRD is silent.** | high; empty asked |
| 7 | Missing components | None. The card is the Overview's Listings card (`antd-card`); the rows are My Listings' own (`antd-table` on the web, `listing-card-container` on a phone); the action is a link `antd-button`. | medium |
| 8 | Copy | Shipped: "REGA Ad Licence Expiry Date" (تاريخ انتهاء ترخيص الإعلان من الهيئة العامة للعقار), "Get a New Ad License" (إصدار ترخيص جديد), "View All Listings". **New: the card's title.** | low — asked |
| 9 | Changes an existing component? | No — a composition. No `used_on` page changes. | high |
| 10 | Responsive | Web and 375 (R5). | high |
| 11 | Contradicts the product? | R2 says "request a new ad licence"; the product's label is **"Get a New Ad License"** — shipped copy wins. The product writes *Licence* in "REGA Ad Licence Expiry Date" and *License* in "Get a New Ad License": each is kept as shipped. | high |

**Asked — only the rows I could not fill:**

1. *Row 4.* An individual broker has no agency. Do they see their own expiring listings, like staff?
2. *Row 6.* When nothing expires in 30 days, should the card show an empty state, or not be drawn at all? The Overview has no plain empty block of its own — its empty data shows zero counts.
3. *Row 8.* The title is new copy. "Ad licences expiring soon" — final? Arabic now, or deferred?

---

## 3 · Confirmation

> 1. Yes — individuals see their own.
> 2. Don't draw the card. An empty "nothing is expiring" card is noise on the Overview.
> 3. The English is final. Arabic deferred — we'll send it to translation.

**The plan, restated.** A new card on the Overview, under the Listings and Credits row (under
the credits widget on a phone), built from the Overview's own Listings card and titled "Ad
licences expiring soon" (new copy; Arabic [TBC]). It lists at most three active listings
whose REGA ad licence expires within 30 days, soonest first, drawn exactly as My Listings
draws them — the table's Property and Timeline cells on the web, the listing card on a phone
— each with a "Get a New Ad License" action; its header keeps "View All Listings". Owner:
the agency's listings; staff and individuals: their own. It is not drawn when nothing
expires, nor when `SHOW_REGA_LICENSE_EXPIRY` is off. Loading and error are the Overview's
own. Web and 375.

---

## 4 · Build

Each design starts from a compiled page, copied into `designs/` (the same depth as
`pages/`, so its `../css/` links hold):

- `<meta name="pf-compiled">` becomes `<meta name="pf-base" content="pages/dashboard.html">`;
  `src="prototype.js"` and the `data-pf-go` links point at `../pages/`.
- A state starts from its state file — `pages/dashboard/loading.html` sits one folder
  deeper, so its `../../css/` becomes `../css/` too.

Then the card is composed from markup the product already draws:

| part | taken from | what changed |
|---|---|---|
| the card and its header | `pages/dashboard.html` — the Listings card (`antd-card`), its "View All Listings" `antd-button` | the title text, marked `data-pf-new-copy` |
| the rows, web | `pages/listings.html` — the `antd-table`, first three rows, columns Property and Timeline kept | each row marked `data-pf-data` (fixture listings) |
| the rows, 375 | `pages/listings.mobile.html` — the phone's listing cards (`listing-card-container`) | marked `data-pf-data` |
| the action | the header's own link button | its label: "Get a New Ad License" (shipped) |
| loading | `pages/dashboard/loading.html` — the Listings card's skeleton (`antd-skeleton`) | — |
| error | `pages/dashboard/error.html` — the card error (`empty-state-block`) | — |

The card goes in as a new widgets row after `c-listing-credits` on the web; on a phone,
where the widgets stack in one column, after the column's credits widget.

Produced — six files, each a state the intake lists, in both layouts:

| state | web | 375 |
|---|---|---|
| the list | `designs/example-expiring-licences.html` | `designs/example-expiring-licences.mobile.html` |
| loading | `designs/example-expiring-licences--loading.html` | `designs/example-expiring-licences--loading.mobile.html` |
| error | `designs/example-expiring-licences--error.html` | `designs/example-expiring-licences--error.mobile.html` |
| empty | not drawn — the Overview as it is: `pages/dashboard.html` | `pages/dashboard.mobile.html` |
| flag off | not drawn — the same | the same |

**Validate** — `python3 qa/validate.py designs/example-expiring-licences*.html`:

```
  ok   1 no style attribute in a design — 6 design(s) checked
  ok   2 no hex or rgb in a design outside css/ — 6 design(s) checked
  ok   3 every class on a page is in registry.json — 1741 classes known
  ok   4 every registry entry has its file — 266 components, 24 pages
  ok   5 every listed state has its file — 1155 state files
  ok   6 every component class is in css/ — 1644 classes defined by the two stylesheets

  6 of 6 checks pass
```

---

## 5 · Output contract

**Components used**
- organisms — `antd-card` (the card), `antd-table` (the web rows), `listing-card-container`
  (the phone rows)
- molecules — `listing-detail-compact` (the Property cell), `product-tag` (Basic, Hot),
  `listing-stats` (views, clicks, leads on a phone), `empty-state-block` (the error)
- atoms — `antd-button` ("View All Listings", "Get a New Ad License"), `antd-tag` (the
  purpose), `antd-skeleton` (loading), `icon`

**Components added, and why** — none. The card is a composition of the Overview's Listings
card and My Listings' own rows; no new class, no new CSS.

**Every [TBC]**
- The title's Arabic — deferred to translation (designer, row 8).
- Which listings count as "expiring" when a licence has already expired but the listing is
  still active: the PRD says "within 30 days" — the rows shown are fixture data
  (`data-pf-data`), ordered as the product's fixture returns them, not by expiry.
- Where "Get a New Ad License" leads for a listing that already has a licence request in
  progress (My Listings' Ad License Requests tab) — not in the PRD.

**Pages affected (`used_on`)** — only `dashboard`. No existing component changed, so no
other page needs regenerating.

**How to QA against live**
- Route `/dashboard`, three accounts: the owner (the agency's listings), a staff user
  (`pages/dashboard/as-staff.html` — their own), an individual (`as-individual.html` — their own).
- States: the list, loading, error; nothing expiring (no card); `SHOW_REGA_LICENSE_EXPIRY`
  off (no card).
- Beside the build, from `skill/`: `python3 -m http.server`, then
  `qa/overlay.html?page=designs/example-expiring-licences.html` with a screenshot of the
  built Overview at 1440 — and the `.mobile.html` at 375.
