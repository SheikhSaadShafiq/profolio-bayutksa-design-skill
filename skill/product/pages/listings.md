# listings — what the page shows

Route `/listings` · measured from `pages/listings.html` (web 1440), `pages/listings.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: My Listings
- **Tabs**: Active (20) · Draft (1) · Pending (4) · Removed (172) · Ad License Requests (4)
- **Table columns**: Property · Timeline · Performance · Status · Upgrades · Actions
- **Table cells**: 
  - **Property** — ‹image› · ‹%› · (sometimes Off) · ‹n› · ‹riyal› · ‹n› · (sometimes Night) · Signature|Basic|Hot · ‹%› · ‹title› · ‹n› · ‹n› Sq. M. · ‹text› · Bayut ID: · ‹id› · (sometimes Permit No.) · ‹id› | REGA ID: | Booked
  - **Timeline** — Posted on · ‹date› · (sometimes REGA Ad Licence Expiry Date:) · ‹date›
  - **Performance** — Views · ‹n› · Clicks · ‹n› · Leads · ‹n›
  - **Status** — ‹text›|Live|Rejected
  - **Upgrades** — ‹icon button› | Publish Now
  - **Actions** — ‹icon button›
- **Filters**: Listing ID [Enter Listing ID] · REGA Ad License Number [Enter REGA Ad License Number] · Purpose [Select Purpose] · Property Type [Select Property Types] · Show More · Clear filters · Search

## Phone 375 — what differs from web

- **Table columns**: — none
- **Table cells**: — none
- **Filters**: — none
- **Repeated cards**: 
  - **ListingCardContainer** — 10× (sometimes Booked) · ‹image› · ‹n› · ‹riyal› · ‹n› · Signature|Basic|Hot · ‹%› · ‹title› · ‹text› · ‹n› Sq. M. · ‹text› · Bayut ID: · ‹id› · REGA ID:|Permit No. · ‹id› · ‹date› · (sometimes REGA Ad Licence Expiry Date:) · ‹date› · Views · ‹n› · Clicks · ‹n› · Leads · ‹n› · Expiring on|Renewing on · ‹date› · ‹icon button› | Night | Publish Now | Off
- **Headings**: All Listings

## Empty (`empty` state, web) — what differs

- **Tabs**: Active (0) · Draft (0) · Pending (0) · Removed (0) · Ad License Requests (0)
- **Table columns**: — none
- **Table cells**: — none
- **Empty block**: No Record Found · Post Listing

## Empty (`empty` state, 375) — what differs

- **Tabs**: Active (0) · Draft (0) · Pending (0) · Removed (0) · Ad License Requests (0)
- **Repeated cards**: — none
- **Empty block**: No Record Found · Post Listing
