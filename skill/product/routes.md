# Routes

Every compiled screen: its **route** — the product's own pattern, from `src/tenant/common/routes/appRoutes.js` @ c354183 (KSA adds none) — the URL the fixture was recorded at, whether it needs a signed-in account, its files and its states. `registry.json` has the same (`route`, `fixture_url`), with aliases, components, flags and roles.

Quote the **route** (`/post-listing/:id/upgrade`) in a design and a QA note, never the fixture URL: its ids and tokens are the invented account's. A `:placeholder` after `?` is a query key the page reads.

| page | route | fixture URL | title | access | web | 375 | states |
| --- | --- | --- | --- | --- | --- | --- | --- |
| dashboard | `/dashboard` | = | Overview | signed in | `pages/dashboard.html` | `pages/dashboard.mobile.html` | 78 |
| listings | `/listings` | = | My Listings | signed in | `pages/listings.html` | `pages/listings.mobile.html` | 101 |
| credits-usage | `/credits-usage` | = | Credits Usage | signed in | `pages/credits-usage.html` | `pages/credits-usage.mobile.html` | 26 |
| ad-license | `/ad-license` | = | Get a New Ad License | signed in | `pages/ad-license.html` | `pages/ad-license.mobile.html` | 29 |
| lms-leads | `/lms/leads` | = | TruLeads | signed in | `pages/lms-leads.html` | `pages/lms-leads.mobile.html` | 101 |
| reports-summary | `/reports/summary` | = | Reports · Summary | signed in | `pages/reports-summary.html` | `pages/reports-summary.mobile.html` | 29 |
| reports-listing-report | `/reports/listing-report` | = | Reports · Listing Report | signed in | `pages/reports-listing-report.html` | `pages/reports-listing-report.mobile.html` | 25 |
| reports-leads-reports | `/reports/leads-reports` | = | Reports · Leads | signed in | `pages/reports-leads-reports.html` | `pages/reports-leads-reports.mobile.html` | 35 |
| user-settings-user-profile | `/user-settings/user-profile` | = | User Settings | signed in | `pages/user-settings-user-profile.html` | `pages/user-settings-user-profile.mobile.html` | 34 |
| user-settings-agency-profile | `/user-settings/agency-profile` | = | Agency Settings | signed in | `pages/user-settings-agency-profile.html` | `pages/user-settings-agency-profile.mobile.html` | 24 |
| user-settings-change-password | `/user-settings/change-password` | = | Change Password | signed in | `pages/user-settings-change-password.html` | `pages/user-settings-change-password.mobile.html` | 24 |
| agency-staff | `/agency-staff` | = | Agency Staff | signed in | `pages/agency-staff.html` | `pages/agency-staff.mobile.html` | 44 |
| agent-performance | `/agent-performance` | = | Agent Performance | signed in | `pages/agent-performance.html` | `pages/agent-performance.mobile.html` | 35 |
| packages | `/packages` | = | Credits & Packages | signed in | `pages/packages.html` | `pages/packages.mobile.html` | 25 |
| post-listing | `/post-listing` | = | Post a Listing | signed in | `pages/post-listing.html` | `pages/post-listing.mobile.html` | 27 |
| user-settings-licenses | `/user-settings/licenses` | = | Licenses | signed in | `pages/user-settings-licenses.html` | `pages/user-settings-licenses.mobile.html` | 23 |
| post-listing-edit | `/post-listing/:id` | `/post-listing/88240117` | Post a Listing · the form | signed in | `pages/post-listing-edit.html` | `pages/post-listing-edit.mobile.html` | 56 |
| post-listing-upgrade | `/post-listing/:id/upgrade` | `/post-listing/88241126/upgrade` | Post a Listing · upgrade | signed in | `pages/post-listing-upgrade.html` | `pages/post-listing-upgrade.mobile.html` | 24 |
| post-ad | `/post-ad/:id` | `/post-ad/88241127` | Magic Post Ad | public | `pages/post-ad.html` | `pages/post-ad.mobile.html` | 16 |
| checkout | `/checkout?cart_id=:cart_id` | `/checkout?cart_id=4410231` | Checkout | signed in | `pages/checkout.html` | `pages/checkout.mobile.html` | 30 |
| process-payment | `/content/process-payment` | = | Processing payment | public | `pages/process-payment.html` | `pages/process-payment.mobile.html` | 2 |
| invite | `/invite?token=:token` | `/invite?token=b6f1e2c4-7a39-4d85-9e0f-3c2a8d71f5b4` | Agency Invitation | signed in | `pages/invite.html` | `pages/invite.mobile.html` | 4 |
| maintenance | `/maintenance` | = | Maintenance | public | `pages/maintenance.html` | `pages/maintenance.mobile.html` | 0 |
| user-settings-preferences | `/user-settings/preferences` | = | Preferences | signed in | `pages/user-settings-preferences.html` | `pages/user-settings-preferences.mobile.html` | 24 |

## Who the product gives each route to

As `appRoutes.js` writes it: the conditions a route's object sits behind, and what `app(…, asArray)` filters the list on — `home.js` routes only that list, so a route a user fails renders nothing. A page not listed has none: any signed-in user, the member area's too (the public pages need no account).

| page | route | appRoutes.js | only when |
| --- | --- | --- | --- |
| dashboard | `/dashboard` | :87 | `user.is_package_user` |
| credits-usage | `/credits-usage` | :111 | `user.is_package_user` |
| lms-leads | `/lms/leads` | :191 | `user?.is_lms_enabled && tenantConstants.IS_LMS_ENABLED && !tenantConstants.HIDE_REPORTS` |
| reports-summary | `/reports/summary` | :146 | `!tenantConstants.HIDE_REPORTS` · `user.is_package_user` |
| reports-listing-report | `/reports/listing-report` | :151 | `!tenantConstants.HIDE_REPORTS` · `user.is_package_user` |
| reports-leads-reports | `/reports/leads-reports` | :156 | `!tenantConstants.HIDE_REPORTS` · `user.is_package_user` |
| user-settings-agency-profile | `/user-settings/agency-profile` | :15 | `user && user.is_agency_admin && user.is_package_user` |
| agency-staff | `/agency-staff` | :117 | `user && !!user.is_agency_admin` · `user.is_package_user` · `user.agency` · `user.permissions[PERMISSIONS_TYPE.STAFF]` |
| agent-performance | `/agent-performance` | :203 | `tenantConstants.AGENT_PERFORMANCE_ENABLED` |
| packages | `/packages` | :165 | `user && user.isCurrencyUser` |
| user-settings-licenses | `/user-settings/licenses` | :27 :40 | `!tenantConstants.HIDE_LICENSES && user && !user.is_agency_admin && user.is_package_user` · → LicensesPage; or `!tenantConstants.HIDE_LICENSES && user && user.is_agency_admin && user.is_package_user` · → AgencyLicensesPage |
| post-ad | `/post-ad/:id` | :263 | `tenantConstants?.ALLOW_MAGIC_POST_AD` |
| user-settings-preferences | `/user-settings/preferences` | :53 | `!tenantConstants.HIDE_PREFERENCES && user && user.is_package_user` |

## Flows

Numbered steps across pages; each step is a state file (`pages/<page>/<state>.html`), shown by its own heading and first primary button (`registry.flows`: `{id, heading, primary, toast?, base?}`; `base` is what the page file itself shows when a step drawn in place is not it). On a page, → and ← walk the flow and its primary button goes on.

**top-up**

1. `credits-usage/flow-top-up-01-choose-amount` — “Credit Top-Up” · Get Top-up
2. `checkout/flow-top-up-02-checkout` — “Payment Method”
3. `process-payment/flow-top-up-03-processing` — no heading
4. `checkout/flow-top-up-04-success` — “Credits Purchased” · Go to Dashboard
5. `packages/flow-top-up-05-failure` — “Get a Package According to Your Business Needs” · Get Titanium · toast “Payment failed due to an error.”

**ad-license**

1. `ad-license/flow-ad-license-01-property-information` — “Get a New Ad License” · Continue
2. `ad-license/flow-ad-license-02-property-location` — “Get a New Ad License” · Continue
3. `ad-license/flow-ad-license-03-contact-information` — “Get a New Ad License” · Continue
4. `checkout/flow-ad-license-04-review-and-pay` — “Payment Method” · toast “Ad License request submitted successfully!”
5. `checkout/flow-ad-license-05-success` — “Your request has been submitted successfully” · Go to Ad License Requests
6. `packages/flow-ad-license-06-failure` — “Get a Package According to Your Business Needs” · Get Titanium · toast “Payment failed due to an error.”

**buy-package**

1. `packages/flow-buy-package-01-choose-package` — “Upgrade to Titanium” · Upgrade
2. `checkout/flow-buy-package-02-checkout` — no heading
3. `process-payment/flow-buy-package-03-processing` — no heading
4. `checkout/flow-buy-package-04-success` — “Credits Purchased” · Go to Dashboard
5. `packages/flow-buy-package-05-failure` — “Get a Package According to Your Business Needs” · Get Titanium · toast “Payment failed due to an error.”

**post-listing**

1. `post-listing/flow-post-listing-01-license-number` — “Enter Ad License Number” · Continue
2. `post-listing/flow-post-listing-02-otp` — “OTP Verification” · Verify
3. `post-listing-edit/flow-post-listing-03-details` — no heading · Post Listing
4. `post-listing-edit/flow-post-listing-04-images` — no heading · Post Listing
5. `post-listing-edit/flow-post-listing-05-specs` — no heading · Post Listing
6. `post-listing-edit/flow-post-listing-06-amenities` — “Features and Amenities” · Add Amenities
7. `post-listing-edit/flow-post-listing-07-description` — no heading · Post Listing
8. `post-listing-edit/flow-post-listing-08-review` — no heading · Post Listing
9. `post-listing-upgrade/flow-post-listing-09-posted` — “Your Listing has been Posted Successfully!” · Upgrade (disabled) — not `pages/post-listing-upgrade.html`, which is “Almost There!” · Post Listing: that page's other states are drawn on it
10. `post-listing-upgrade/flow-post-listing-10-upgrade` — “Your Listing has been Posted Successfully!” · Upgrade — not `pages/post-listing-upgrade.html`, which is “Almost There!” · Post Listing: that page's other states are drawn on it
