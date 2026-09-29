# lms-leads — what the page shows

Route `/lms/leads` · measured from `pages/lms-leads.html` (web 1440), `pages/lms-leads.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: TruLeads
- **Tabs**: All Leads (4) · Bayut Match (0)
- **Table columns**: Lead Details · Last Interaction · Interested In · Next Planned Task · Actions
- **Table cells**: 
  - **Lead Details** — ‹title›|Unnamed Lead · (sometimes Add Name) · ‹email› · ‹phone›
  - **Last Interaction** — Call|WhatsApp · ‹text› · ‹date›
  - **Interested In** — ‹image› · ‹text› · + ‹n› more properties.
  - **Next Planned Task** — ‹title› · ‹date› · ‹time› | Add Task
  - **Actions** — ‹icon button›
- **Repeated cards**: 
  - **LeadsDashboardCard** — 2× Call Insights|Whatsapp Insights · View Trend · Clicked · ‹n› · Received · ‹n› · Answered|Chat Initiated · ‹n› · (sometimes Missed) · ‹n› · Response Rate · ‹%› · (sometimes Avg Duration) · ‹duration› · Avg Resp.Time · ‹duration›
- **Filters**: Search by [Search by Listing ID] =Listing ID · Lead Received [Select Date Range] · Last Interaction [Select Date Range] · Users [Select Users] · Show More · Clear filters · Search
- **Pager**: Rows per page =‹n›
- **Figures**: Total Leads · TruLeads · Bayut Match
- **Buttons and links**: Add New Lead

## Phone 375 — what differs from web

- **Table columns**: — none
- **Table cells**: — none
- **Repeated cards**: 
  - **LeadListingsMobile** — 4× ‹title›|Unnamed Lead · View Detail · Call|WhatsApp · Interested In · ‹image› · ‹text› · Next Planned Task · ‹text› · ‹date› · ‹time› · Email · WhatsApp · Call | Add Name
- **Filters**: — none
- **Headings**: Leads Management

## As staff — what differs from the owner (web)

- **Filters**: -Users [Select Users]

## As individual — what differs from the owner (web)

- **Filters**: -Users [Select Users]

## Empty (`empty` state, web) — what differs

- **Tabs**: -All Leads (4) · +All Leads (0)
- **Table columns**: — none
- **Table cells**: — none
- **Filters**: -Users [Select Users]
- **Pager**: — none
- **Empty block**: No Record Found

## Empty (`empty` state, 375) — what differs

- **Tabs**: -All Leads (4) · +All Leads (0)
- **Repeated cards**: 
  - **LeadListingsMobile** — none
- **Pager**: — none
- **Empty block**: No Record Found
