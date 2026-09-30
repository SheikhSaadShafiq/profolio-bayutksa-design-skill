# Design QA — Leads Marketplace (prototype)

Built 2026-09-30T13:22:11.365Z. 26 renders in Playwright Chromium. 0 error(s), 9 warning(s).

| level | check | where | issue |
|---|---|---|---|
| warn | targets | phone · owner, seeker, first-visit, no-results, buy, bought, insufficient, staff-cap, gone, loading, empty, error | “All” is 31 × 24 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | targets | phone · owner, first-visit, no-results, buy, bought, insufficient, staff-cap, gone, loading, empty, error | “Sale” is 34 × 24 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | targets | phone · owner, seeker, first-visit, filtered, no-results, buy, bought, insufficient, staff-cap, gone, loading, empty, error | “Rent” is 36 × 24 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | targets | phone · owner, seeker, first-visit, filtered, no-results, buy, bought, insufficient, staff-cap, gone, loading, empty, error | “Top up” is 44 × 18 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | dead | phone · owner, seeker, first-visit, filtered, no-results, buy, bought, insufficient, staff-cap, gone, loading, empty, error | “button” looks clickable and does nothing — wire it (data-pf-…) or mark it data-pf-inert="why" |
| warn | targets | phone · seeker | “Buy” is 31 × 24 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | targets | phone · first-visit | “Got it” is 36 × 18 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | targets | phone · filtered | “All” is 24 × 24 px — under the build's 32 px on a phone (the platforms ask 44) |
| warn | targets | phone · filtered | “Sale” is 41 × 24 px — under the build's 32 px on a phone (the platforms ask 44) |
