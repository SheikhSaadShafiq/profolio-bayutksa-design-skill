# reports-leads-reports — what the page shows

Route `/reports/leads-reports` · measured from `pages/reports-leads-reports.html` (web 1440), `pages/reports-leads-reports.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: Leads & Reach Report
- **Tabs**: 
  1. Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n› ‹%›
  2. All · For Sale · For Rent · Daily Rentals
- **Table columns**: Date · Calls · Emails · SMS · WhatsApp · Total Leads
- **Table cells**: 
  - **Date** — ‹date›
- **Filters**: Listed Date [Select Date Range] · Purpose [Select Purpose] · Clear filters · Search
- **Fields**: =Last 30 Days · {All | Basic | Hot | Signature}
- **Headings**: Performance · Traffic and Leads by date
- **Figures**: Calls · WhatsApp · SMS · Emails

## Phone 375 — what differs from web

- **Tabs**: Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n› ‹%›
- **Table columns**: — none
- **Table cells**: — none
- **Filters**: — none
- **Fields**: +=All
- **Figures**: — none
- **Repeated cards**: 
  - **LeadsReports** — 10× Date · ‹date› · Views · ‹n› · Clicks · ‹n› · Total Leads · ‹n› · Calls · ‹n› · WhatsApp · ‹n› · SMS · ‹n› · Email · ‹n›

## As staff — what differs from the owner (web)

- **Tabs**: 
  1. Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n›
  2. All · For Sale · For Rent · Daily Rentals

## As staff — what differs from the owner (375)

- **Tabs**: -Leads ‹n› ‹%› · +Leads ‹n›

## Empty (`empty` state, web) — what differs

- **Tabs**: 
  1. Views ‹n› · Clicks ‹n› · Leads ‹n›
  2. All · For Sale · For Rent · Daily Rentals
- **Fields**: -{All | Basic | Hot | Signature}
- **Empty block**: View In-Depth Insights · See the number of views, clicks and leads that your listing has received.

## Empty (`empty` state, 375) — what differs

- **Tabs**: Views ‹n› · Clicks ‹n› · Leads ‹n›
- **Fields**: -{All | Basic | Hot | Signature}
- **Empty block**: View In-Depth Insights · See the number of views, clicks and leads that your listing has received.
