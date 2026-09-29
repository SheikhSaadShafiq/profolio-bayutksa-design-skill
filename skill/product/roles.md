# Roles

Three kinds of signed-in account see Profolio KSA, and a screen can differ for each. Each signed-in page's **default render** is compiled three times: as the **agency owner** (the page itself), as an **agency staff** user (state `as-staff`) and as an **individual** broker (`as-individual`). Its other states are compiled as the owner, but for the role variants listed below and the three states compiled for another account (*States compiled for another account*).

**A state's role is in its name.** `as-staff` and `<state>-as-staff` are the staff account; `as-individual` and `<state>-as-individual` the individual one. **Every state not named as-staff / as-individual / *-as-staff / *-as-individual is the owner fixture** — loading, empty, error, every message-*, modal-*, drawer-* and inline-* included — **except the three states compiled for another account**, listed below and in `registry.pages[x].state_roles` (state → account). `registry.pages[x].roles` lists the roles a page's default render is compiled for. An `as-<role>` page combined with a state compiled for another role is not compiled: list the combination under [TBC], naming both files.

| role | who | how it is compiled | what changes |
|---|---|---|---|
| owner | the agency's admin | the fixture account | — the default; credits 72,880 available of 75,000 (2,120 used) · Platinum Plus |
| staff | a user inside an agency, not its admin | fixture mode `staff`, recorded from a real staff account | 9 rail items (no Agency Staff); own leads only; no Agency Staff or Agency Settings page (below); no agency selector (`dashboard`, `lms-leads`: below); profile 50%; credits 3,750 available of 5,000 (1,250 used) · Titanium |
| individual | a broker with no agency | fixture mode `individual`: the owner's record with the agency taken away (not recorded) | 9 rail items (no Agency Staff); no Agency Staff or Agency Settings page; the broker's own FAL licence; no agency selector (`dashboard`, `lms-leads`: below); the leaderboard instead of the team table; "Individual" on User Settings; Convert to Agency; the owner's credits (72,880) |
| public | not signed in | — | maintenance, the payment return and the magic post-ad link have no shell and no account. The agency invitation (`/invite`) is not public: it opens inside the shell, for any signed-in account (compiled as the owner) |

Two states are a fourth account, the **member area** — a user with no package (`users/current` `is_package_user: false`, fixture mode `member`): `listings/drawer-credit-info` and `listings/member-area`.

Role variants of a state compiled so far: `dashboard/drawer-credits-balance-as-individual`, `dashboard/drawer-credits-balance-as-staff`, `dashboard/drawer-top-up-your-credits-as-individual@375`, `dashboard/drawer-top-up-your-credits-as-staff@375`, `dashboard/modal-top-up-your-credits-as-individual@web`, `dashboard/modal-top-up-your-credits-as-staff@web`, `credits-usage/drawer-top-up-your-credits-as-individual@375`, `credits-usage/drawer-top-up-your-credits-as-staff@375`, `credits-usage/modal-top-up-your-credits-as-individual@web`, `credits-usage/modal-top-up-your-credits-as-staff@web`, `post-listing-upgrade/inline-insufficient-credits-as-individual`, `post-listing-upgrade/inline-insufficient-credits-as-staff`.

## States compiled for another account

These carry no role in their name, yet the harness compiled them with another account signed in (the step's fixture `mode`, `harness/interactions/<page>.mjs` → `data/design-kb.json`). Read them as that account's, not the owner's:

| state | account | fixture mode | layout |
| --- | --- | --- | --- |
| `listings/drawer-credit-info` | member | `member` | web |
| `listings/member-area` | member | `member` | web, 375 |
| `user-settings-user-profile/modal-convert-to-agency` | individual | `individual` | web, 375 |

The member area is its own account: the owner, staff and individual accounts are package users and never get it. A state the owner or another role cannot open is in *States a role cannot open*.

## Pages a role has no route to

The role's render has no such page — the product does not give it the route (`appRoutes.js`; `routes.md` → *Who the product gives each route to*) — so none of the page's owner states exists for that role:

- `user-settings-agency-profile` — as staff and as individual, it shows User Settings (`user-settings-user-profile`) (only when `user && user.is_agency_admin && user.is_package_user`).
- `agency-staff` — as staff and as individual, the content is empty (only when `user && !!user.is_agency_admin && user.is_package_user && user.agency && user.permissions[PERMISSIONS_TYPE.STAFF]`).

## Pages a role gets as another component

The route is one, the component is not: `appRoutes.js` gives the page's route to a different component by who is signed in, and the role's render shows it. None of the owner's own content states is what the role sees there — the role's own loading, empty, error and messages are not compiled: say so under [TBC].

- `user-settings-licenses` — as staff and as individual, LicensesPage; the owner's is AgencyLicensesPage (`appRoutes.js` :27, :40).

## States a role cannot open

The control that opens them is on one account's render of the page and not on the role's own render of it, same page and layout: the owner's page for the owner's states (the control that links to the state, else the explorer's trigger — looked for on `as-staff` / `as-individual`); that account's render for a state compiled for another account. A hand-written state with no control of its own, on a page the role gets as another component, goes with that component:

| state | opened by | not drawn for | layout |
| --- | --- | --- | --- |
| `agency-staff/modal-set-credits-limit` | “Set Credits Limit” | staff, individual | web, 375 |
| `agency-staff/modal-set-credits-limit__inline-set-max-credits` | “Set Credits Limit” | staff, individual | web, 375 |
| `agency-staff/modal-invite-user` | “Invite User” | staff, individual | web |
| `agency-staff/modal-invite-user__inline-confirm` | “Invite User” | staff, individual | web |
| `agent-performance/dropdown-filter-by-badges` | “Filter by Badges” | staff, individual | web, 375 |
| `dashboard/dropdown-najd-horizon-real-estate` | “Najd Horizon Real Estate” | staff, individual | web, 375 |
| `lms-leads/dropdown-najd-horizon-real-estate` | “Najd Horizon Real Estate” | staff, individual | web, 375 |
| `lms-leads/dropdown-select-users` | “Select Users” | staff, individual | web |
| `packages/modal-get-titanium` | “Get Titanium” | staff | web |
| `user-settings-licenses/modal-information-share-license-with` | “Share with agency staff” | staff, individual | web |
| `user-settings-licenses/modal-share-license-by-enabling` | “Share with agency staff” | staff, individual | web |
| `user-settings-licenses/modal-share-license-by-enabling__message-share` | “Share with agency staff” | staff, individual | web |
| `agency-staff/drawer-invite-user` | “Invite User” | staff, individual | 375 |
| `agency-staff/drawer-invite-user__inline-confirm` | “Invite User” | staff, individual | 375 |
| `packages/drawer-get-titanium` | “Get Titanium” | staff | 375 |
| `user-settings-licenses/drawer-information-share-license-with` | “Share with agency staff” | staff, individual | 375 |
| `user-settings-licenses/drawer-share-license-by-enabling` | “Share with agency staff” | staff, individual | 375 |
| `user-settings-licenses/drawer-share-license-by-enabling__message-share` | “Share with agency staff” | staff, individual | 375 |
| `user-settings-user-profile/modal-convert-to-agency` | “Convert to Agency” (on `user-settings-user-profile/as-individual`) | owner, staff | web, 375 |
| `user-settings-licenses/message-share-license-failed` | — hand-written; the page is LicensesPage for them | staff, individual | web, 375 |
| `user-settings-licenses/message-share-license-saved` | — hand-written; the page is LicensesPage for them | staff, individual | web, 375 |

## States that show the owner's credits

The owner has 72,880 available of 75,000 (2,120 used) · Platinum Plus; the staff account 3,750 available of 5,000 (1,250 used) · Titanium; the individual the owner's own. These owner states' own modal or drawer shows an owner figure; as staff it would be the staff account's — compiled only where a variant is marked (+ -as-staff):

- `dashboard` (72,880): `drawer-31__drawer-refresh`, `drawer-33__drawer-refresh`, `drawer-34__drawer-refresh`, `drawer-43__drawer-refresh`, `drawer-46__drawer-refresh`, `drawer-50__drawer-refresh`, `drawer-54__drawer-refresh`, `drawer-request-signature-upgrade-the`, `tooltip-mark-signature`
- `listings` (72,880): `drawer-31__drawer-refresh`, `drawer-33__drawer-refresh`, `drawer-34__drawer-refresh`, `drawer-43__drawer-refresh`, `drawer-46__drawer-refresh`, `drawer-50__drawer-refresh`, `drawer-54__drawer-refresh`, `drawer-request-signature-upgrade-the`, `modal-request-signature-upgrade-the`, `upgrade-hot`, `upgrade-photography`, `upgrade-refresh`, `upgrade-signature`
- `agency-staff` (75,000): `form-credits-limit-errors`, `form-credits-limit-filled`, `message-credits-limit-failed`, `modal-set-credits-limit`, `modal-set-credits-limit__inline-set-max-credits`
- `post-listing-upgrade/inline-insufficient-credits` (+ -as-staff, -as-individual) — fixture mode `lf-low-credits`: “Insufficient Credits. Pay 900 for the additional 9 credits at checkout”, beside Available Credits 1. It is a state of the draft upgrade page (“Almost There!” · Post Listing), not of the posted one (`registry.flows['post-listing']` step 9).

The other credits states — `dashboard/drawer-credits-balance` (+ -as-staff, -as-individual), `dashboard/drawer-top-up-your-credits` (+ -as-staff, -as-individual), `dashboard/modal-top-up-your-credits` (+ -as-staff, -as-individual), `listings/drawer-credit-info`, `credits-usage/drawer-top-up-your-credits` (+ -as-staff, -as-individual), `credits-usage/modal-top-up-your-credits` (+ -as-staff, -as-individual), `packages/drawer-what-are-credits`, `packages/form-credit-top-up-priced`, `user-settings-preferences/drawer-smart-credits-utilization-maximize`, `user-settings-preferences/modal-smart-credits`, `user-settings-preferences/modal-smart-credits-utilization-maximize`, `user-settings-preferences/saved-smart-credit` — open no modal or drawer with an owner figure (explainers, top-up forms) — though the page behind them may show the owner's balance.

Whether a staff or individual user sees any other owner state the same way is not compiled: say so under [TBC].

## The fixture's clock

The fixture is recorded on **2026-09-29** — 08:58–21:34 Asia/Riyadh (05:58–18:34 UTC), each of the 1221 compiled files at its own moment. Its dates are computed from that moment (`harness/fixtures.mjs` `day()`: UTC midnight, n days back), so "today" on every compiled page is 2026-09-29, and a relative date — "an hour ago", "3 days ago", Last 7 Days, a posted-on date — is relative to it. A time of day is shown in Asia/Karachi (UTC+5), the zone the pages were compiled in, not Riyadh: a lead task the fixture sets at 12:30 Riyadh shows "2:30 pm". Never quote a fixture time as Riyadh time.

## By page

| page | owner | staff | individual |
| --- | --- | --- | --- |
| dashboard | ✓ | ✓ | ✓ |
| listings | ✓ | ✓ | ✓ |
| credits-usage | ✓ | ✓ | ✓ |
| ad-license | ✓ | ✓ | ✓ |
| lms-leads | ✓ | ✓ | ✓ |
| reports-summary | ✓ | ✓ | ✓ |
| reports-listing-report | ✓ | ✓ | ✓ |
| reports-leads-reports | ✓ | ✓ | ✓ |
| user-settings-user-profile | ✓ | ✓ | ✓ |
| user-settings-agency-profile | ✓ | ✓ | ✓ |
| user-settings-change-password | ✓ | ✓ | ✓ |
| agency-staff | ✓ | ✓ | ✓ |
| agent-performance | ✓ | ✓ | ✓ |
| packages | ✓ | ✓ | ✓ |
| post-listing | ✓ | ✓ | ✓ |
| user-settings-licenses | ✓ | ✓ | ✓ |
| post-listing-edit | ✓ | ✓ | ✓ |
| post-listing-upgrade | ✓ | ✓ | ✓ |
| post-ad | public | — | — |
| checkout | ✓ | ✓ | ✓ |
| process-payment | public | — | — |
| invite | ✓ | — | — |
| maintenance | public | — | — |
| user-settings-preferences | ✓ | ✓ | ✓ |

A ✓ is a compiled file: `pages/<page>/as-staff.html`, `as-individual.html` (and `.mobile.html`).
