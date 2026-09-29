# Worked example — ad licences expiring soon, on the Overview

One complete trace, as the skill is meant to run: a PRD, the intake (`INTAKE.md`: the gap
check, the screens, the product and design questions, the edge cases), the confirmation, the
pages produced, and the output contract. The six designs it produced are in `designs/` (a full install; the core
install does not carry them) and pass `qa/validate.py`.

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

## 2 · Intake — proposed from the PRD (`INTAKE.md`)

Read first: `registry.json`, `INTAKE.md`; grep `product/flags.md` for `SHOW_REGA_LICENSE_EXPIRY`
and `AD_LICENSE_CREATION_ENABLED`; then `product/roles.md`, `product/pages/dashboard.md`,
`product/copy/rendered/dashboard.md`, `product/copy/table.md`, `product/copy/tenant-listing.md`,
`product/copy/page-ad-license.md`.

**0 · PRD gap check**

| section | in the PRD? | note |
|---|---|---|
| problem and goal | yes | Problem and Goal paragraphs |
| users and roles | partly | owner and staff (R4); individual not named → P5 |
| requirements, numbered | yes | R1–R6 |
| success metric | no | → P1 |
| scope — in, later, out | partly | the card only; nothing said about later → P3 |
| release and rollout | no | → P4 |
| states — empty, error, loading | no | → D5 |
| copy — final? Arabic? | no | the card's title is not given → D7 |
| design language | no | the Overview is current Profolio → D4 |
| dependencies — APIs, data | partly | the expiry date is on the listing (`ad_license_expiry_date`); a "soonest first" query is not named → P4 |

**1 · The screens** — `node qa/find.mjs "licence expiry listings overview"` ranks
`dashboard` (the Overview, `pages/dashboard.html`) first and `listings` second; the Overview's
own states are `loading`, `empty` and `error`, and My Listings' rows are its table and phone cards.

**2 · The questions**

*Product — for the PM*

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| P1 | Goal and success metric | Goal as written. Metric: fewer listings going offline on licence expiry (share renewed before expiry) — not in the PRD. | low — asked |
| P2 | User stories and acceptance | "As an owner, I see the agency's listings expiring within 30 days, soonest first, at most three, and can get a new licence from the row"; staff: their own (R4). Acceptance: R1–R6 as written. | high |
| P3 | Scope | Now: the card (R1–R6). Later: nothing named. Out: renewing inside the card (R2 opens the product's flow). | medium |
| P4 | Release | Not in the PRD: date, rollout and whether the listings API can return "expiring within 30 days, soonest first". | low — asked |
| P5 | Roles | Owner: the agency's listings. Staff: their own (R4). **Individual: not in the PRD** — `product/roles.md` says an individual has no agency, so their own listings. | low — asked |
| P6 | Flags | `SHOW_REGA_LICENSE_EXPIRY=true` — in `pages.dashboard.flags` (R6). Referenced in `src/components/table/table-components/expiry-renewal.js:70`, `src/tenant/bayut/components/listing/listingCard.js:397`; its Gates column: `SHOW_REGA_LICENSE_EXPIRY && !!ad_license_expiry_date` renders the expiry. `AD_LICENSE_CREATION_ENABLED=true` is read by no file (flags.md: Referenced in —), so its effect on R2 is [TBC]. | high; R2's flag medium |
| P7 | Credits, packages, tiers | No — the card spends nothing; "Get a New Ad License" opens the product's own flow. | high |
| P8 | Contradictions | Nouns already shipped: the Overview's listing cards show "REGA Ad Licence Expiry Date:" per listing (`pages.dashboard.labels`), and My Listings draws the expiry in its Timeline cell. R2 says "request a new ad licence"; the product's label is **"Get a New Ad License"** — the same meaning, so shipped copy wins. The product writes *Licence* in one and *License* in the other: each is kept as shipped. | high |

*Design — for the designer*

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| D1 | New page, change, or new cross-page component? | **Change** to an existing page: a new card on the Overview. | high |
| D2 | Which page(s)? | `pages.dashboard` — `/dashboard`, "Overview" (its `aliases`). | high |
| D3 | Entry point | The rail's Overview; the dashboard is where sign-in lands. | high |
| D4 | Design language | Current Profolio — the Overview has no 2.0; its rows are the current My Listings'. Existing components only; the density of the Overview's own cards; no illustration. | high |
| D5 | States | `pages.dashboard.states`: `loading` (the Overview's skeleton), `error` (its card error — No Record Found, *Something went wrong*, Retry), `empty` (a new account: zero counts — not the card's empty). Flag-off: the card is not drawn. No-permission: none — every signed-in role has an Overview. **The card's own empty: the PRD is silent.** | high; the card's empty asked |
| D6 | Missing components | None. The card is the Overview's Listings card (`antd-card`); the rows are My Listings' own (`antd-table` on the web, `listing-card-container` on a phone); the action is a link `antd-button`. | medium |
| D7 | Copy | Shipped: "REGA Ad Licence Expiry Date" (تاريخ انتهاء ترخيص الإعلان من الهيئة العامة للعقار), "Get a New Ad License" (إصدار ترخيص جديد), "View All Listings". **New: the card's title.** | low — asked |
| D8 | Changes an existing component? | No — a composition. No `used_on` page changes. | high |
| D9 | Responsive | Web and 375 (R5). | high |

**Asked — each with my proposal:**

*For the PM*
1. *P1.* The metric: I propose "the share of listings renewed before their licence expires". Yes?
2. *P4.* Release: can the listings API return active listings expiring within 30 days, soonest first? I propose the card waits for it, behind the product's normal release.
3. *P5.* An individual broker has no agency. I propose they see their own expiring listings, like staff — yes?

*For the designer*
4. *D5.* When nothing expires in 30 days, I propose the card is not drawn (the Overview has no plain empty block of its own — its empty data shows zero counts). Or should it show an empty state?
5. *D7.* The title is new copy: "Ad licences expiring soon" — final? I propose Arabic deferred.

P3, P6 (R2's flag) and D6 are medium and not asked: I assume nothing more is in scope, that `AD_LICENSE_CREATION_ENABLED` does not hide the action, and that no component is missing.

**3 · Edge cases and scenarios** — worked out, not asked:
- none expiring → the card is not drawn (D5); one or two → the card holds only those rows;
  more than three → the three soonest, "View All Listings" for the rest;
- an expiry today, or already past while the listing is still active → [TBC] (R1 says "within 30 days");
- a long title or community name → the table cell's own truncation, as My Listings draws it;
- slow load → the Overview's skeleton; a failed request → its card error with Retry;
- staff and individual → their own listings (P5); `SHOW_REGA_LICENSE_EXPIRY` off → no card;
- "Get a New Ad License" on a listing that already has a request in progress → [TBC], handoff.

---

## 3 · Confirmation

> *PM:* 1. Yes, that metric. 2. The API is being extended; design now, ship when it lands.
> 3. Yes — individuals see their own.
> *Designer:* 4. Don't draw the card. An empty "nothing is expiring" card is noise on the
> Overview. 5. The English is final. Arabic deferred — we'll send it to translation.

**The plan** — the first text after the confirmation, before any file is written. A new card on the Overview, under the Listings and Credits row (under
the credits widget on a phone), built from the Overview's own Listings card and titled "Ad
licences expiring soon" (new copy; Arabic [TBC]). It lists at most three active listings
whose REGA ad licence expires within 30 days, soonest first, drawn exactly as My Listings
draws them — the table's Property and Timeline cells on the web, the listing card on a phone
— each with a "Get a New Ad License" action; its header keeps "View All Listings". Owner:
the agency's listings; staff and individuals: their own. It is not drawn when nothing
expires, nor when `SHOW_REGA_LICENSE_EXPIRY` is off. Loading and error are the Overview's
own. Web and 375, in current Profolio. It ships when the listings API can return the expiring
listings; success is the share of listings renewed before expiry.

---

## 4 · Build

Each design starts from a compiled page, copied into `designs/` (the same depth as
`pages/`, so its `../css/` links hold):

- `<meta name="pf-compiled">` becomes `<meta name="pf-base" content="pages/dashboard.html">`, and
  `<meta name="pf-also">` names the other files blocks came from (`pages/listings.html` for the
  rows, `pages/dashboard/error.html` for the error, `pages/dashboard.html` for a loading card);
  `src="prototype.js"` becomes `src="../pages/prototype.js"`, which resolves the copied links
  from pf-base.
- A state starts from its state file — `pages/dashboard/loading.html` sits one folder
  deeper, so its `../../css/` becomes `../css/` too.

Then the card is composed from markup the product already draws:

| part | taken from | what changed |
|---|---|---|
| the card and its header | `pages/dashboard.html` — the Listings card (`antd-card`), its "View All Listings" `antd-button` | the title text, marked `data-pf-new-copy` |
| the rows, web | `pages/listings.html` — the `antd-table`, first three rows, columns Property and Timeline kept | none: the fixture's listings, copied unchanged, stay unmarked (step 2) |
| the rows, 375 | `pages/listings.mobile.html` — the phone's listing cards (`listing-card-container`) | none: copied unchanged, unmarked |
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

**Validate** — `python3 qa/validate.py designs/example-expiring-licences*.html` (the named
designs only, checks 1–3):

```
  ok   1 no style value outside the copied sources — 6 design(s), each against its own pf-base and pf-also
  ok   2 no hex or rgb in a design outside css/ — 6 design(s) checked
  ok   3 every class on a page is in registry.json — 1781 classes known

  3 of 3 checks pass
```

---

## 5 · Output contract

**The plan** — as sent before building (§ 3), unchanged.

**Components used**
- organisms — `antd-card` (the card), `antd-table` (the web rows), `listing-card-container`
  (the phone rows)
- molecules — `listing-detail-compact` (the Property cell), `product-tag` (Basic, Hot),
  `listing-stats` (views, clicks, leads on a phone), `empty-state-block` (the error)
- atoms — `antd-button` ("View All Listings", "Get a New Ad License"), `antd-tag` (the
  purpose), `antd-skeleton` (loading), `icon`

**Components added, and why** — none. The card is a composition of the Overview's Listings
card and My Listings' own rows; no new class, no new CSS.

**Layout differences**, per state:
- the list — web: the rows are My Listings' table cells (Property, Timeline) in the card;
  375: the phone's listing cards, and the card sits under the credits widget (R5). Both keep
  "View All Listings" in the card's header.
- loading — web: the Overview's card skeleton in the card's place; 375: the phone skeleton,
  under the credits widget. Nothing else differs.
- error — web: the Overview's card error block (No Record Found, Retry) in the card; 375: the
  same block in the phone card. Nothing else differs.

**PRD deviations** — R2's "request a new ad licence" is drawn as the shipped "Get a New Ad
License". None other.

**Every [TBC]**
- The title's Arabic — deferred to translation (designer, D7).
- Which listings count as "expiring" when a licence has already expired but the listing is
  still active: the PRD says "within 30 days" — the rows shown are the fixture's own
  listings, copied unchanged and unmarked, ordered as the fixture returns them, not by expiry.
- Where "Get a New Ad License" leads for a listing that already has a licence request in
  progress (My Listings' Ad License Requests tab) — not in the PRD.
- Whether `AD_LICENSE_CREATION_ENABLED` changes R2's action — no file reads it (flags.md).

**Edge cases and scenarios** — each as listed in § 2.3: none expiring → not drawn; fewer than
three → only those rows; more → the three soonest; long text → the cell's truncation; loading
→ `designs/example-expiring-licences--loading*.html`; error →
`designs/example-expiring-licences--error*.html`; roles and flag-off → as the plan says;
expired-but-active and a request in progress → [TBC].

**Pages affected (`used_on`)** — `dashboard`. No existing component changed, so no other
page needs regenerating.

**How to QA against live**
- Route `/dashboard`, three accounts: the owner (the agency's listings), a staff user
  (`pages/dashboard/as-staff.html` — their own), an individual (`as-individual.html` — their own).
- States: the list, loading, error; nothing expiring (no card). `SHOW_REGA_LICENSE_EXPIRY`
  off (no card) cannot be seen on any account — flags are compile-time constants: compare
  against a local build with the constant flipped, or the compiled reference.
- Beside the build, from `skill/`: `python3 -m http.server`, then
  `qa/overlay.html?page=designs/example-expiring-licences.html` with a screenshot of the
  built Overview at 1440 — and the `.mobile.html` at 375.

**Handoff notes** — for the developers:
- *the list* — `antd-card` holding My Listings' rows (`antd-table` Property and Timeline cells
  on the web, `listing-card-container` at 375) and `antd-button` "Get a New Ad License"; copy:
  "Ad licences expiring soon" (new, Arabic deferred), "REGA Ad Licence Expiry Date", "Get a New
  Ad License", "View All Listings" (shipped, with their Arabic); flag `SHOW_REGA_LICENSE_EXPIRY`;
  data: active listings with `ad_license_expiry_date` within 30 days, soonest first, at most
  three, scoped to the account's role — a query the API does not offer yet (P4).
- *loading* — the Overview's card skeleton; *error* — its card error block with Retry.
- *open* — expired-but-active listings; a licence request already in progress;
  `AD_LICENSE_CREATION_ENABLED` (read by no file).
