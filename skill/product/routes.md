# Routes

Every compiled screen: its route, whether it needs a signed-in account, its files and its states. `registry.json` has the same, with aliases, components, flags and roles.

| page | route | title | access | web | 375 | states |
| --- | --- | --- | --- | --- | --- | --- |
| dashboard | `/dashboard` | Overview | signed in | `pages/dashboard.html` | `pages/dashboard.mobile.html` | 72 |
| listings | `/listings` | My Listings | signed in | `pages/listings.html` | `pages/listings.mobile.html` | 99 |
| credits-usage | `/credits-usage` | Credits Usage | signed in | `pages/credits-usage.html` | `pages/credits-usage.mobile.html` | 22 |
| ad-license | `/ad-license` | Get a New Ad License | signed in | `pages/ad-license.html` | `pages/ad-license.mobile.html` | 29 |
| lms-leads | `/lms/leads` | TruLeads | signed in | `pages/lms-leads.html` | `pages/lms-leads.mobile.html` | 101 |
| reports-summary | `/reports/summary` | Reports · Summary | signed in | `pages/reports-summary.html` | `pages/reports-summary.mobile.html` | 29 |
| reports-listing-report | `/reports/listing-report` | Reports · Listing Report | signed in | `pages/reports-listing-report.html` | `pages/reports-listing-report.mobile.html` | 25 |
| reports-leads-reports | `/reports/leads-reports` | Reports · Leads | signed in | `pages/reports-leads-reports.html` | `pages/reports-leads-reports.mobile.html` | 35 |
| user-settings-user-profile | `/user-settings/user-profile` | User Settings | signed in | `pages/user-settings-user-profile.html` | `pages/user-settings-user-profile.mobile.html` | 34 |
| user-settings-agency-profile | `/user-settings/agency-profile` | Agency Settings | signed in | `pages/user-settings-agency-profile.html` | `pages/user-settings-agency-profile.mobile.html` | 24 |
| user-settings-change-password | `/user-settings/change-password` | Change Password | signed in | `pages/user-settings-change-password.html` | `pages/user-settings-change-password.mobile.html` | 24 |
| agency-staff | `/agency-staff` | Agency Staff | signed in | `pages/agency-staff.html` | `pages/agency-staff.mobile.html` | 44 |
| agent-performance | `/agent-performance` | Agent Performance | signed in | `pages/agent-performance.html` | `pages/agent-performance.mobile.html` | 35 |
| packages | `/packages` | Credits & Packages | signed in | `pages/packages.html` | `pages/packages.mobile.html` | 25 |
| post-listing | `/post-listing` | Post a Listing | signed in | `pages/post-listing.html` | `pages/post-listing.mobile.html` | 27 |
| user-settings-licenses | `/user-settings/licenses` | Licenses | signed in | `pages/user-settings-licenses.html` | `pages/user-settings-licenses.mobile.html` | 23 |
| post-listing-edit | `/post-listing/88240117` | Post a Listing · the form | signed in | `pages/post-listing-edit.html` | `pages/post-listing-edit.mobile.html` | 56 |
| post-listing-upgrade | `/post-listing/88241126/upgrade` | Post a Listing · upgrade | signed in | `pages/post-listing-upgrade.html` | `pages/post-listing-upgrade.mobile.html` | 22 |
| post-ad | `/post-ad/88241127` | Magic Post Ad | public | `pages/post-ad.html` | `pages/post-ad.mobile.html` | 16 |
| checkout | `/checkout?cart_id=4410231` | Checkout | signed in | `pages/checkout.html` | `pages/checkout.mobile.html` | 30 |
| process-payment | `/content/process-payment` | Processing payment | public | `pages/process-payment.html` | `pages/process-payment.mobile.html` | 2 |
| invite | `/invite?token=b6f1e2c4-7a39-4d85-9e0f-3c2a8d71f5b4` | Agency Invitation | public | `pages/invite.html` | `pages/invite.mobile.html` | 4 |
| maintenance | `/maintenance` | Maintenance | public | `pages/maintenance.html` | `pages/maintenance.mobile.html` | 0 |
| user-settings-preferences | `/user-settings/preferences` | Preferences | signed in | `pages/user-settings-preferences.html` | `pages/user-settings-preferences.mobile.html` | 24 |

## Flows

Numbered steps across pages; each step is a state file. On a page, → and ← walk the flow and its primary button goes on.

**top-up** — 1 `credits-usage/flow-top-up-01-choose-amount` → 2 `checkout/flow-top-up-02-checkout` → 3 `process-payment/flow-top-up-03-processing` → 4 `checkout/flow-top-up-04-success` → 5 `packages/flow-top-up-05-failure`

**ad-license** — 1 `ad-license/flow-ad-license-01-property-information` → 2 `ad-license/flow-ad-license-02-property-location` → 3 `ad-license/flow-ad-license-03-contact-information` → 4 `checkout/flow-ad-license-04-review-and-pay` → 5 `checkout/flow-ad-license-05-success` → 6 `packages/flow-ad-license-06-failure`

**buy-package** — 1 `packages/flow-buy-package-01-choose-package` → 2 `checkout/flow-buy-package-02-checkout` → 3 `process-payment/flow-buy-package-03-processing` → 4 `checkout/flow-buy-package-04-success` → 5 `packages/flow-buy-package-05-failure`

**post-listing** — 1 `post-listing/flow-post-listing-01-license-number` → 2 `post-listing/flow-post-listing-02-otp` → 3 `post-listing-edit/flow-post-listing-03-details` → 4 `post-listing-edit/flow-post-listing-04-images` → 5 `post-listing-edit/flow-post-listing-05-specs` → 6 `post-listing-edit/flow-post-listing-06-amenities` → 7 `post-listing-edit/flow-post-listing-07-description` → 8 `post-listing-edit/flow-post-listing-08-review` → 9 `post-listing-upgrade/flow-post-listing-09-posted` → 10 `post-listing-upgrade/flow-post-listing-10-upgrade`
