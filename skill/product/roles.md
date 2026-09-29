# Roles

Three kinds of signed-in account see Profolio KSA, and a screen can differ for each. Every signed-in page is compiled three times: as the **agency owner** (the page itself), as an **agency staff** user (`<state>` `as-staff`) and as an **individual** broker (`as-individual`).

| role | who | how it is compiled | what changes |
|---|---|---|---|
| owner | the agency's admin | the fixture account | — the default |
| staff | a user inside an agency, not its admin | fixture mode `staff`, recorded from a real staff account | 9 rail items (no Agency Settings); own leads only; a restricted Agency Staff page; Agency Settings redirects to User Settings; titanium package; profile 50% |
| individual | a broker with no agency | fixture mode `individual`: the owner's record with the agency taken away (not recorded) | no Agency Staff, no Agency Settings; the broker's own FAL licence; no agency selector on the dashboard; the leaderboard instead of the team table; "Individual" on User Settings; Convert to Agency |
| public | not signed in | — | invite, maintenance, the payment return and the magic post-ad link have no shell and no account |

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
| invite | public | — | — |
| maintenance | public | — | — |
| user-settings-preferences | ✓ | ✓ | ✓ |

A ✓ is a compiled file: `pages/<page>/as-staff.html`, `as-individual.html` (and `.mobile.html`).
