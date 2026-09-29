# dashboard — what the page shows

Route `/dashboard` · measured from `pages/dashboard.html` (web 1440), `pages/dashboard.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: Overview
- **Tabs**: 
  1. Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n› ‹%›
  2. All · For Sale · For Rent · Daily Rentals
- **Table columns**: Property · Timeline · Performance · Status · Upgrades · Actions
- **Table cells**: 
  - **Property** — ‹image› · ‹%› · (sometimes Off) · ‹n› · ‹riyal› · ‹n› · (sometimes Night) · Signature|Basic|Hot · ‹%› · ‹title› · ‹n› · ‹n› Sq. M. · ‹text› · Bayut ID: · ‹id› · (sometimes Permit No.) · ‹id› | REGA ID: | Booked
  - **Timeline** — Posted on · ‹date› · (sometimes REGA Ad Licence Expiry Date:) · ‹date›
  - **Performance** — Views · ‹n› · Clicks · ‹n› · Leads · ‹n›
  - **Status** — ‹text›|Live|Rejected
  - **Upgrades** — ‹icon button› | Publish Now
  - **Actions** — ‹icon button›
- **Fields**: =Last 30 Days · {All | Basic | Hot | Signature}
- **Headings**: Listings · Credits Balance · Performance
- **Figures**: Active · For Sale · To Rent · Daily Rentals · Signature · Hot · Basic · Available Credits · Used · Total · Calls · WhatsApp · SMS · Emails
- **Buttons and links**: View All Listings · Top-Up your Credits · Credits Usage
- **Other product copy shown**: Current Plan · Recent Listings

## Phone 375 — what differs from web

- **Tabs**: Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n› ‹%›
- **Table columns**: — none
- **Table cells**: — none
- **Fields**: +=All
- **Figures**: -Calls · -WhatsApp · -SMS · -Emails
- **Repeated cards**: 
  - **Dashboard** — 10× (sometimes Booked) · ‹image› · ‹n› · ‹riyal› · ‹n› · Signature|Basic|Hot · ‹%› · ‹title› · ‹text› · ‹n› Sq. M. · ‹text› · Bayut ID: · ‹id› · REGA ID:|Permit No. · ‹id› · ‹date› · (sometimes REGA Ad Licence Expiry Date:) · ‹date› · Views · ‹n› · Clicks · ‹n› · Leads · ‹n› · Expiring on|Renewing on · ‹date› · ‹icon button› | Night | Publish Now | Off

## As staff — what differs from the owner (web)

- **Tabs**: 
  1. Views ‹n› ‹%› · Clicks ‹n› ‹%› · Leads ‹n›
  2. All · For Sale · For Rent · Daily Rentals
- **Buttons and links**: +Why is this important?
- **Other product copy shown**: +Your profile is incomplete
- **Primary buttons**: Complete your Profile

## As staff — what differs from the owner (375)

- **Tabs**: -Leads ‹n› ‹%› · +Leads ‹n›
- **Buttons and links**: +Why is this important?
- **Other product copy shown**: +Your profile is incomplete
- **Primary buttons**: Complete your Profile

## Empty (`empty` state, web) — what differs

- **Tabs**: 
  1. Views ‹n› · Clicks ‹n› · Leads ‹n›
  2. All · For Sale · For Rent · Daily Rentals
- **Table columns**: — none
- **Table cells**: — none
- **Fields**: -{All | Basic | Hot | Signature}
- **Empty block**: View In-Depth Insights · See the number of views, clicks and leads that your listing has received. · No Active Listings · Your active listings will appear here · Post Listing

## Empty (`empty` state, 375) — what differs

- **Tabs**: Views ‹n› · Clicks ‹n› · Leads ‹n›
- **Repeated cards**: — none
- **Fields**: -{All | Basic | Hot | Signature}
- **Empty block**: View In-Depth Insights · See the number of views, clicks and leads that your listing has received. · No Active Listings · Your active listings will appear here · Post Listing
