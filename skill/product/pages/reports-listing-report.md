# reports-listing-report — what the page shows

Route `/reports/listing-report` · measured from `pages/reports-listing-report.html` (web 1440), `pages/reports-listing-report.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: Listing Report
- **Tabs**: Listing Performance · Listing By Date
- **Table columns**: Property · Posted On · Views · Clicks · All Leads · Whatsapp · Calls · SMS · Emails
- **Table cells**: 
  - **Property** — ‹image› · ‹riyal› · ‹n› · ‹%› · ‹title› · ‹n› · ‹n› Sq. M. · ‹text› · Bayut ID: · ‹id› · (sometimes REGA ID:) · ‹id› | Permit No.
  - **Posted On** — ‹date›
  - **Views** — ‹n›
  - **Clicks** — ‹n›
  - **All Leads** — ‹n›
  - **Whatsapp** — ‹n›
  - **Calls** — ‹n›
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%›
- **Headings**: Listings · Breakdown By Location
- **Figures**: Active · For Sale · To Rent · Daily Rentals · Signature · Hot · Basic

## Phone 375 — what differs from web

- **Table columns**: — none
- **Table cells**: — none
- **Repeated cards**: 
  - **CardListingPerformance** — 10× ‹image› · ‹riyal› · ‹n› · ‹text› · ‹n› Sq. M. · Date · ‹date› · Views · ‹n› · Clicks · ‹n› · Total Leads · ‹n› · Calls · ‹n› · WhatsApp · ‹n› · SMS · ‹n› · Email · ‹n›

## As staff — what differs from the owner (web)

- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text›|Others · ‹n› · ‹%›

## As staff — what differs from the owner (375)

- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text›|Others · ‹n› · ‹%›

## Empty (`empty` state, web) — what differs

- **Table columns**: — none
- **Table cells**: — none
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · Not enough data
- **Empty block**: No Record Found

## Empty (`empty` state, 375) — what differs

- **Repeated cards**: 
  - **CardListingPerformance** — none
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · Not enough data
