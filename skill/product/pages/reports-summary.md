# reports-summary — what the page shows

Route `/reports/summary` · measured from `pages/reports-summary.html` (web 1440), `pages/reports-summary.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: Summary
- **Tabs**: 
  1. Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n› ‹%›
  2. All · For Sale · For Rent · Daily Rentals
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%›
- **Fields**: =Last 30 Days · {All | Basic | Hot | Signature}
- **Headings**: Listings · Breakdown By Location · Performance
- **Figures**: Active · For Sale · To Rent · Daily Rentals · Signature · Hot · Basic · Calls · WhatsApp · SMS · Emails

## Phone 375 — what differs from web

- **Tabs**: Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n› ‹%›
- **Fields**: +=All
- **Figures**: Active · For Sale · To Rent · Daily Rentals · Signature · Hot · Basic

## As staff — what differs from the owner (web)

- **Tabs**: 
  1. Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n›
  2. All · For Sale · For Rent · Daily Rentals
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text›|Others · ‹n› · ‹%›

## As staff — what differs from the owner (375)

- **Tabs**: -Leads ‹n› ‹%› · +Leads ‹n›
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text› · ‹n› · ‹%› · ‹text›|Others · ‹n› · ‹%›

## Empty (`empty` state, web) — what differs

- **Tabs**: 
  1. Views ‹n› · Clicks ‹n› · Leads ‹n›
  2. All · For Sale · For Rent · Daily Rentals
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · Not enough data
- **Fields**: -{All | Basic | Hot | Signature}
- **Empty block**: View In-Depth Insights · See the number of views, clicks and leads that your listing has received.

## Empty (`empty` state, 375) — what differs

- **Tabs**: Views ‹n› · Clicks ‹n› · Leads ‹n›
- **Repeated cards**: 
  - **BreakdownByAreaWidget** — 2× ‹n› · For Sale|To Rent · ‹image› · Not enough data
- **Fields**: -{All | Basic | Hot | Signature}
- **Empty block**: View In-Depth Insights · See the number of views, clicks and leads that your listing has received.
