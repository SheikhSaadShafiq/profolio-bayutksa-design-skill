# My Listings — the new theme

Profolio 2.0 starts with My Listings. Its redesign is **not live yet** (due about mid-October
2026). What is compiled here is the designer's handover — the build embedded in the spec —
lifted out at its own size and held to it pixel for pixel (≤0.5%): the design, not yet the
product. At launch the product is compiled again and compared.

## When to use it

- **Only My Listings** (`/listings`) has a new theme. Every other page stays the current theme.
  The handover draws My Listings with its own header and rail (green Post Listing, Geist, a dot
  badge); whether the product's shell changes with it is [TBC] — the rail's active item keeps
  the current teal.
- The intake asks which theme when a PRD touches My Listings (SKILL.md, row 12).
- A page that has not been redesigned (dashboard, leads, reports …) is never drawn in the new
  theme — there are no new tokens for it.

## Its rules

- **Tokens**: `tokens.md` → *My Listings — new theme*; as CSS, `css/new-theme/tokens.css`
  (`--pf-ml-*`). They are My Listings' tokens only and replace no current token.
- **Primary is the green**: a ramp −1…11 around `#28B16D` (8). The current theme's teal primary
  and `colorPrimaryActive` are gone from My Listings; the green was `secondaryColor`.
- **Teal stays in the rank and Quality Score explainers** — the How to Earn Quality Score drawer
  (web) and sheet (phone), the rank and quality cards (`tint.teal050`). It also shows on the
  rail's active item, the TruCheck glyph, the trend's selected metric pill, and the onboarding
  tour's hero card (a `#F2FAFA` → `#F0FAF5` gradient).
- **Geist is the UI face, on My Listings only.** Figtree draws the web page title, the empty
  states, the modals and most sheet and drawer titles; the phone's page title is Lato (the app
  face) and the Listing Performance drawer and sheet titles are Geist — [TBC]. Arabic is not in
  the handover.
- **Markup**: the handover's build writes its styles inline. A block copied from a
  `listings-new` file keeps them; a value you add is a `--pf-ml-*` token, or [TBC].
- **Web 1440 × 900 and phone 360 × 800** (the designer's base, not the product's 375). The phone
  files carry the designer's device frame — its 9:41 status bar — which is not the product.

## Where the handover disagrees with itself or the product — [TBC] with the designer

- `elevation.sheet`: 0 -8px 32px rgba(0,0,0,0.16) → not painted as declared — at that offset the build paints rgba(23, 26, 31, 0.18) 0px -8px 40px 0px on Listing Performance bottom sheet, Delete listing sheet, Filters sheet, Filter value sheet, Request Services sheet, Listing actions sheet, Date range sheet, Share sheet, Sort sheet, TruCheck sheet
- `elevation.card`: 0 1px 2px rgba(0,0,0,0.04) → not painted as declared — at that offset the build paints rgba(0, 0, 0, 0.25) 0px 1px 3px 0px on More Filters drawer, Filters sheet; rgba(0, 0, 0, 0.08) 0px 1px 2px 0px on Listing Performance drawer; rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.1) 0px 1px 2px -1px on Request Services modal; rgba(23, 26, 31, 0.24) 0px 1px 3px 0px on screen; rgba(23, 26, 31, 0.26) 0px 1px 4px 0px on Filters sheet
- `elevation.toast`: 0 14px 34px rgba(0,0,0,0.22) → painted nowhere in the compiled states
- `type.price`: Geist 17/22 · 700 → the phone draws it as Geist 16/normal · 700 ×123 (screen, Listing Performance bottom sheet; "1,500,000")
- `type.subtype`: Geist 12/16 · 600 · #249F62 → the phone draws it as Geist 11/normal · 600 · #10603A ×176 (screen, Listing Performance bottom sheet; "Apartment for Sale"); Geist 12/normal · 600 · #249F62 ×3 (Delete listing sheet, TruCheck sheet; "Apartment for Sale")
- `type.location`: Geist 12/16 · 400 · #707070 → the phone draws it as Geist 12/normal · 400 · #626262 ×153 (screen, Listing Performance bottom sheet; "Al Hazm, West Riyadh"); Geist 12/normal · 400 · #222222 ×27 (screen; "Al Malqa, North Riyadh"); Geist 12/normal · 400 · #707070 ×3 (Delete listing sheet, TruCheck sheet; "Al Hazm, West Riyadh")
- `type.stat`: Geist 14/18 · 700 → the phone draws it as Geist 12/normal · 700 ×126 (screen; "1,288"); Geist 16/normal · 700 ×8 (Listing Performance bottom sheet; "4,180")
- `type.label`: Geist 11/14 · 500 · #9D9D9D → the phone draws it as Geist 11/normal · 300 · #4F4F4F ×450 (screen; "Views"); Geist 11/normal · 400 · #626262 ×54 (Listing Performance bottom sheet; "Views")
- `type.sheetTitle`: Figtree 18/24 · 700 → the phone draws it as Geist 18/normal · 700 ×18 (Listing Performance bottom sheet; "Listing Performance"); Figtree 17/normal · 700 ×11 (Delete listing sheet, Filters sheet, Request Services sheet; "Delete this listing?"); Figtree 17/24 · 700 ×2 (How to Earn Quality Score sheet; "How to Earn Quality Score?")
- `radius.sheet`: 20px (top corners) → 16px on Delete listing sheet, Filter value sheet, Listing actions sheet, Date range sheet, Share sheet, Sort sheet, TruCheck sheet; 20px on How to Earn Quality Score sheet, Listing Performance bottom sheet, Filters sheet, Request Services sheet
- `target.iconButton`: 44px (target.min 44px) → the phone's icon buttons are 32x32 (screen), 40x40 (screen), 24x24 (How to Earn Quality Score sheet)
- `color.surface.scrim`: rgba(0,0,0,0.42) → not painted — the build's 42% layer is #171A1F 42% (3 uses)
- `color.surface.page`: #F3F4F5 → the phone page is #F6F7FB (the screen, 65 states)
- `type.family.mono`: JetBrains Mono → not painted
- `currency`: the product writes the riyal as its icon glyph, never "SAR" → "SAR" as text in Listing Performance drawer (web), More Filters drawer (web), Change ownership modal (web), Delete listing modal (web), TruCheck modal (web), Request Services modal (web), My Listings page (web), Delete listing sheet (phone), Filters sheet (phone), Request Services sheet (phone), TruCheck sheet (phone) — e.g. "…ompetitive price of SAR 225,000, this propert…", "SAR 0", "SAR 10,000,000+", "SAR"
- The closed drawers are parked beside the web frame and still cast their shadow into it: a grey
  band down the right edge of every web screen but the one where the open More Filters drawer
  covers that edge. It is in the build (so in every compiled file);
  it is not in the spec — do not draw it.
- 03 · F's element table gives the Listing Performance drawer a width of 680; the build draws it
  780 (as 02b's "the 780px drawer" says). 680 is the How to Earn Quality Score drawer (G).
- Mark as Booked (03 · J, and the phone's sheet) is specified but drawn by neither build: its chip
  and its row-menu item change nothing on screen. Not compiled — [TBC] until the designer builds it.
- The phone's Ad License Requests tab draws an empty body (no request rows, none of its own
  filters). Not compiled — [TBC]; the web's is `tab-ad-license-requests`.
- The phone's Amenities picker chip opens the listing's second fix, which on that listing is the
  interior-images fix, so the picker never shows; `sheet-amenities` opens the amenities fix
  (the third) with the picker, as the build does on the listings where it is second.
- 02c and the phone spec call No active listings "the only state that offers the explainer"; the
  web build also offers See how scores work on No drafts, Nothing waiting for approval and No
  removed listings, and the phone build on No drafts.
- 03's cards B–D describe the tabs as 2, 3 and 4 rows; the build lists 6, 7 and 12 (the
  `tab-*-full` states show every row).
- 02c's nine case chips on the web only tint a row; each case's drawer is its own state
  (`drawer-case-*`). On the phone the chips pin that case first in the list (`case-*`); each
  case's performance sheet is its own state (`sheet-case-*`).

## States — web, 1440 × 900 (`-full`: the whole screen, grown until nothing scrolls)

| state | what it shows | file |
|---|---|---|
| — | My Listings, Active tab — the nine seeded cases | `pages/listings-new.html` |
| `empty-active` | Empty: no active listings yet — Post a Listing, See how scores work | `pages/listings-new/empty-active.html` |
| `empty-draft` | Empty: no drafts saved | `pages/listings-new/empty-draft.html` |
| `empty-filter` | Empty: no listings match these filters — the only action that clears the filters | `pages/listings-new/empty-filter.html` |
| `empty-pending` | Empty: nothing waiting for approval | `pages/listings-new/empty-pending.html` |
| `empty-removed` | Empty: no removed listings | `pages/listings-new/empty-removed.html` |
| `full` | My Listings, Active tab — the whole list: the nine cases, one row each | `pages/listings-new/full.html` |
| `non-package` | Not a package user — the package upsell banner | `pages/listings-new/non-package.html` |
| `non-package-empty` | Not a package user, and no listings | `pages/listings-new/non-package-empty.html` |
| `offline` | Error: no internet — suppresses the rows and any empty state | `pages/listings-new/offline.html` |
| `skeleton-filtering` | Filtering skeleton — replaces the row list for 1.8s, "Filtering 65 listings..." (02c’s Filtering skeleton chip shows the sort skeleton instead) | `pages/listings-new/skeleton-filtering.html` |
| `tab-draft` | Draft tab — six drafts (Listing incomplete, Ready to publish, Not enough credits … the first three in frame) | `pages/listings-new/tab-draft.html` |
| `tab-draft-full` | Draft tab — every draft | `pages/listings-new/tab-draft-full.html` |
| `tab-pending` | Pending tab — seven listings waiting: in review, changes in review, a license or a payment (the first three in frame) | `pages/listings-new/tab-pending.html` |
| `tab-pending-full` | Pending tab — every listing waiting | `pages/listings-new/tab-pending-full.html` |
| `tab-removed` | Removed tab — twelve removed listings: rejected, expired, sold, removed by Bayut … (the first three in frame) | `pages/listings-new/tab-removed.html` |
| `tab-removed-full` | Removed tab — every removed listing | `pages/listings-new/tab-removed-full.html` |
| `tour-2` | Onboarding tour, spotlight 1 / 4 — Performance and improvements | `pages/listings-new/tour-2.html` |
| `tour-3` | Onboarding tour, spotlight 2 / 4 — Split the list by performance | `pages/listings-new/tour-3.html` |
| `tour-4` | Onboarding tour, spotlight 3 / 4 — Sort by what matters | `pages/listings-new/tour-4.html` |
| `tour-5` | Onboarding tour, spotlight 4 / 4 — See how the score works | `pages/listings-new/tour-5.html` |
| `drawer-amenities` | Add Amenities picker, over the Listing Performance drawer | `pages/listings-new/drawer-amenities.html` |
| `drawer-case-all-bad` | Listing Performance drawer — case: all bad | `pages/listings-new/drawer-case-all-bad.html` |
| `drawer-case-all-bad-full` | Listing Performance drawer, whole — case: all bad | `pages/listings-new/drawer-case-all-bad-full.html` |
| `drawer-case-daily-rental` | Listing Performance drawer — case: daily rental | `pages/listings-new/drawer-case-daily-rental.html` |
| `drawer-case-daily-rental-full` | Listing Performance drawer, whole — case: daily rental | `pages/listings-new/drawer-case-daily-rental-full.html` |
| `drawer-case-everything-unfinished` | Listing Performance drawer — case: everything unfinished | `pages/listings-new/drawer-case-everything-unfinished.html` |
| `drawer-case-everything-unfinished-full` | Listing Performance drawer, whole — case: everything unfinished | `pages/listings-new/drawer-case-everything-unfinished-full.html` |
| `drawer-case-happy-full` | Listing Performance drawer, whole — case: happy | `pages/listings-new/drawer-case-happy-full.html` |
| `drawer-case-just-posted` | Listing Performance drawer — case: just posted | `pages/listings-new/drawer-case-just-posted.html` |
| `drawer-case-just-posted-full` | Listing Performance drawer, whole — case: just posted | `pages/listings-new/drawer-case-just-posted-full.html` |
| `drawer-case-low-impression-high-conversion` | Listing Performance drawer — case: low impression, high conversion | `pages/listings-new/drawer-case-low-impression-high-conversion.html` |
| `drawer-case-low-impression-high-conversion-full` | Listing Performance drawer, whole — case: low impression, high conversion | `pages/listings-new/drawer-case-low-impression-high-conversion-full.html` |
| `drawer-case-off-plan` | Listing Performance drawer — case: off-plan initial sale | `pages/listings-new/drawer-case-off-plan.html` |
| `drawer-case-off-plan-full` | Listing Performance drawer, whole — case: off-plan initial sale | `pages/listings-new/drawer-case-off-plan-full.html` |
| `drawer-case-rank-pending` | Listing Performance drawer — case: rank pending | `pages/listings-new/drawer-case-rank-pending.html` |
| `drawer-case-rank-pending-full` | Listing Performance drawer, whole — case: rank pending | `pages/listings-new/drawer-case-rank-pending-full.html` |
| `drawer-listing-performance` | Listing Performance drawer, 780px, over the Active tab — a listing that needs fixes | `pages/listings-new/drawer-listing-performance.html` |
| `drawer-listing-performance-full` | Listing Performance drawer — the whole drawer, every section | `pages/listings-new/drawer-listing-performance-full.html` |
| `drawer-listing-performance-perfect` | Listing Performance drawer — a perfect score, no fix list | `pages/listings-new/drawer-listing-performance-perfect.html` |
| `drawer-menu-range` | The Listing Performance drawer's date range menu | `pages/listings-new/drawer-menu-range.html` |
| `drawer-more-filters` | More Filters drawer, 450px, over the Active tab | `pages/listings-new/drawer-more-filters.html` |
| `drawer-quality-score` | How to Earn Quality Score drawer, 680px — the second layer, over the Listing Performance drawer | `pages/listings-new/drawer-quality-score.html` |
| `drawer-quality-score-full` | How to Earn Quality Score drawer — the whole explainer | `pages/listings-new/drawer-quality-score-full.html` |
| `drawer-rank-updating` | Rank updating inside the Listing Performance drawer | `pages/listings-new/drawer-rank-updating.html` |
| `drawer-trend-drop` | Listing Performance drawer — the trend with a sudden drop | `pages/listings-new/drawer-trend-drop.html` |
| `drawer-trend-recover` | Listing Performance drawer — the trend down, then back up | `pages/listings-new/drawer-trend-recover.html` |
| `drawer-trend-spike` | Listing Performance drawer — the trend with a one-day spike | `pages/listings-new/drawer-trend-spike.html` |
| `menu-row` | A row's ⋮ menu | `pages/listings-new/menu-row.html` |
| `menu-sort` | The sort menu | `pages/listings-new/menu-sort.html` |
| `modal-change-ownership` | Change ownership | `pages/listings-new/modal-change-ownership.html` |
| `modal-delete` | Delete listing — the reasons | `pages/listings-new/modal-delete.html` |
| `modal-request-services` | Request Services modal, 520px — Drone, Photography, Videography | `pages/listings-new/modal-request-services.html` |
| `modal-share` | Share Listing modal, 520px — Copy Bayut Link | `pages/listings-new/modal-share.html` |
| `modal-share-panel` | Share Listing modal, as the state panel opens it | `pages/listings-new/modal-share-panel.html` |
| `modal-trucheck` | TruCheck verification | `pages/listings-new/modal-trucheck.html` |
| `rank-updating` | Rank updating — the rank tile while the new position is fetched (1.8s, then the new rank) | `pages/listings-new/rank-updating.html` |
| `skeleton-sorting` | Sorting and filtering skeleton — replaces the row list | `pages/listings-new/skeleton-sorting.html` |
| `sorting` | While a sort is applied — the rows give way to the skeleton, "Sorting 65 listings..." | `pages/listings-new/sorting.html` |
| `tab-ad-license-requests` | Ad License Requests tab — five statuses, its own filter bar | `pages/listings-new/tab-ad-license-requests.html` |
| `tab-ad-license-requests-full` | Ad License Requests tab — every request | `pages/listings-new/tab-ad-license-requests-full.html` |
| `tour-1` | Onboarding tour, the intro card — My Listings has a new look | `pages/listings-new/tour-1.html` |

## States — phone, 360 × 800

| state | what it shows | file |
|---|---|---|
| — | My Listings, Active tab — as an agent lands on it | `pages/listings-new.mobile.html` |
| `case-all-bad` | The list with one case pinned first: all bad | `pages/listings-new/case-all-bad.mobile.html` |
| `case-daily-rental` | The list with one case pinned first: daily rental | `pages/listings-new/case-daily-rental.mobile.html` |
| `case-everything-unfinished` | The list with one case pinned first: everything unfinished | `pages/listings-new/case-everything-unfinished.mobile.html` |
| `case-happy` | The list with one case pinned first: happy | `pages/listings-new/case-happy.mobile.html` |
| `case-just-posted` | The list with one case pinned first: just posted | `pages/listings-new/case-just-posted.mobile.html` |
| `case-low-impression-high-conversion` | The list with one case pinned first: low impression, high conversion | `pages/listings-new/case-low-impression-high-conversion.mobile.html` |
| `case-off-plan` | The list with one case pinned first: off-plan initial sale | `pages/listings-new/case-off-plan.mobile.html` |
| `case-rank-pending` | The list with one case pinned first: rank pending | `pages/listings-new/case-rank-pending.mobile.html` |
| `empty-active` | Empty: no active listings yet — Post a Listing, See how scores work | `pages/listings-new/empty-active.mobile.html` |
| `empty-draft` | Empty: no drafts saved | `pages/listings-new/empty-draft.mobile.html` |
| `empty-filter` | Empty: no listings match these filters | `pages/listings-new/empty-filter.mobile.html` |
| `empty-pending` | Empty: nothing waiting for approval | `pages/listings-new/empty-pending.mobile.html` |
| `empty-removed` | Empty: no removed listings | `pages/listings-new/empty-removed.mobile.html` |
| `full` | My Listings, Active tab — the whole list, every case | `pages/listings-new/full.mobile.html` |
| `non-package` | Not a package user — the package upsell | `pages/listings-new/non-package.mobile.html` |
| `non-package-empty` | Not a package user, and no listings | `pages/listings-new/non-package-empty.mobile.html` |
| `offline` | Error: no internet connection | `pages/listings-new/offline.mobile.html` |
| `sheet-amenities` | Add Amenities picker, open in the quality block | `pages/listings-new/sheet-amenities.mobile.html` |
| `sheet-amenities-full` | Add Amenities picker, open in the quality block — the whole sheet | `pages/listings-new/sheet-amenities-full.mobile.html` |
| `sheet-case-daily-rental` | Performance sheet — case: daily rental | `pages/listings-new/sheet-case-daily-rental.mobile.html` |
| `sheet-case-everything-unfinished` | Performance sheet — case: everything unfinished | `pages/listings-new/sheet-case-everything-unfinished.mobile.html` |
| `sheet-case-happy` | Performance sheet — case: happy | `pages/listings-new/sheet-case-happy.mobile.html` |
| `sheet-case-just-posted` | Performance sheet — case: just posted | `pages/listings-new/sheet-case-just-posted.mobile.html` |
| `sheet-case-low-impression-high-conversion` | Performance sheet — case: low impression, high conversion | `pages/listings-new/sheet-case-low-impression-high-conversion.mobile.html` |
| `sheet-case-off-plan` | Performance sheet — case: off-plan initial sale | `pages/listings-new/sheet-case-off-plan.mobile.html` |
| `sheet-delete` | Delete listing — the reasons | `pages/listings-new/sheet-delete.mobile.html` |
| `sheet-filters` | Filter sheet | `pages/listings-new/sheet-filters.mobile.html` |
| `sheet-filters-full` | Filter sheet — the whole sheet, down to the price and area ranges | `pages/listings-new/sheet-filters-full.mobile.html` |
| `sheet-improve-quality` | Improve Quality — the all-bad listing’s sheet, its first fix expanded (the fix list is below the fold) | `pages/listings-new/sheet-improve-quality.mobile.html` |
| `sheet-improve-quality-full` | Improve Quality — the all-bad listing’s whole sheet, down to its fix list | `pages/listings-new/sheet-improve-quality-full.mobile.html` |
| `sheet-location-no-match` | Location search — no match | `pages/listings-new/sheet-location-no-match.mobile.html` |
| `sheet-location-search` | Location search | `pages/listings-new/sheet-location-search.mobile.html` |
| `sheet-performance` | Listing Performance bottom sheet | `pages/listings-new/sheet-performance.mobile.html` |
| `sheet-performance-full` | Listing Performance bottom sheet — the whole sheet | `pages/listings-new/sheet-performance-full.mobile.html` |
| `sheet-quality-score` | How to Earn Quality Score sheet | `pages/listings-new/sheet-quality-score.mobile.html` |
| `sheet-quality-score-full` | How to Earn Quality Score sheet — the whole explainer | `pages/listings-new/sheet-quality-score-full.mobile.html` |
| `sheet-range` | The performance sheet's date range | `pages/listings-new/sheet-range.mobile.html` |
| `sheet-request-services` | Request Services sheet | `pages/listings-new/sheet-request-services.mobile.html` |
| `sheet-row-menu` | A card's row menu — a bottom sheet, not a popover | `pages/listings-new/sheet-row-menu.mobile.html` |
| `sheet-services-requested` | Services requested | `pages/listings-new/sheet-services-requested.mobile.html` |
| `sheet-share` | Share sheet — Copy Bayut Link | `pages/listings-new/sheet-share.mobile.html` |
| `sheet-sort` | Sort sheet | `pages/listings-new/sheet-sort.mobile.html` |
| `sheet-trend-drop` | Performance sheet — the trend with a sudden drop | `pages/listings-new/sheet-trend-drop.mobile.html` |
| `sheet-trend-no-data` | Performance sheet — no trend data yet | `pages/listings-new/sheet-trend-no-data.mobile.html` |
| `sheet-trend-recover` | Performance sheet — the trend down, then back up | `pages/listings-new/sheet-trend-recover.mobile.html` |
| `sheet-trend-spike` | Performance sheet — the trend with a one-day spike | `pages/listings-new/sheet-trend-spike.mobile.html` |
| `sheet-trucheck` | TruCheck — the first card, not yet verified | `pages/listings-new/sheet-trucheck.mobile.html` |
| `sheet-trucheck-rejected` | TruCheck — a request that was rejected | `pages/listings-new/sheet-trucheck-rejected.mobile.html` |
| `skeleton-filtering` | Filtering skeleton — replaces the card list for 1.8s, "Filtering 65 listings..." (02’s Filtering skeleton chip shows the sort skeleton instead) | `pages/listings-new/skeleton-filtering.mobile.html` |
| `tab-draft` | Draft tab — completion | `pages/listings-new/tab-draft.mobile.html` |
| `tab-draft-full` | Draft tab — every draft | `pages/listings-new/tab-draft-full.mobile.html` |
| `tab-pending` | Pending tab — waiting | `pages/listings-new/tab-pending.mobile.html` |
| `tab-pending-full` | Pending tab — every listing waiting | `pages/listings-new/tab-pending-full.mobile.html` |
| `tab-removed` | Removed tab — recovery | `pages/listings-new/tab-removed.mobile.html` |
| `tab-removed-full` | Removed tab — every removed listing | `pages/listings-new/tab-removed-full.mobile.html` |
| `tour` | Onboarding tour, the intro card — My Listings has a new look | `pages/listings-new/tour.mobile.html` |
| `tour-2` | Onboarding tour, spotlight 1 / 4 — Performance and improvements | `pages/listings-new/tour-2.mobile.html` |
| `tour-3` | Onboarding tour, spotlight 2 / 4 — Filter and sort from one bar | `pages/listings-new/tour-3.mobile.html` |
| `tour-4` | Onboarding tour, spotlight 3 / 4 — Sort by what matters | `pages/listings-new/tour-4.mobile.html` |
| `tour-5` | Onboarding tour, spotlight 4 / 4 — See how the score works | `pages/listings-new/tour-5.mobile.html` |
| `tour-no-listings` | Onboarding tour with no listings, the intro card — My Listings has a new look | `pages/listings-new/tour-no-listings.mobile.html` |
| `tour-no-listings-2` | Onboarding tour with no listings, spotlight 1 / 3 — Filter and sort from one bar | `pages/listings-new/tour-no-listings-2.mobile.html` |
| `tour-no-listings-3` | Onboarding tour with no listings, a full card — Post your first listing | `pages/listings-new/tour-no-listings-3.mobile.html` |
| `tour-no-listings-4` | Onboarding tour with no listings, a full card — See how the score works | `pages/listings-new/tour-no-listings-4.mobile.html` |

Reached two ways, kept once: mobile case-high-impression-low-leads = mobile page; mobile sheet-case-all-bad = mobile sheet-improve-quality; mobile sheet-case-high-impression-low-leads = mobile sheet-performance; mobile sheet-case-rank-pending = mobile sheet-trend-no-data; web drawer-case-happy = web drawer-listing-performance-perfect; web drawer-case-high-impression-low-leads = web drawer-listing-performance; web drawer-case-high-impression-low-leads-full = web drawer-listing-performance-full; web drawer-listing-performance-default = web drawer-listing-performance; web drawer-more-filters-panel = web drawer-more-filters; web drawer-quality-score-panel = web drawer-quality-score; web drawer-trend-no-data = web drawer-case-rank-pending; web modal-request-services-panel = web modal-request-services; web tab-ad-license-requests-panel = web tab-ad-license-requests; web tab-draft-panel = web tab-draft; web tab-pending-panel = web tab-pending; web tab-removed-panel = web tab-removed.

## The spec, in the designer's words

`web-spec.md` (1440) and `phone-spec.md` (360): summary, screens with their element tables and
rules, interaction and motion, assets, edge cases, acceptance criteria, gestures, accessibility,
performance budget, platform notes, open questions.
