# user-settings-licenses — what the page shows

Route `/user-settings/licenses` · measured from `pages/user-settings-licenses.html` (web 1440), `pages/user-settings-licenses.mobile.html` (375), the `as-staff` and `as-individual` states and `empty`.
Labels are verbatim. ‹…› is fixture data by its kind (‹date›, ‹time›, ‹n›, ‹text›; ‹title› a bold one; a number inside a label is ‹n›: "‹n› Users"); ‹map› is the map, which the recorder draws without its API key; `(n)` a count as rendered; `[…]` a placeholder; `=…` a select's or a read-only field's shown value; `{…}` its options, `x (Tag)` an option that carries a tag; `a|b` texts that change from item to item; `‹text›|x` fixture data where some items draw the product's `x` instead; `(sometimes x)` a label only some items draw; `| x` a label other items draw instead; `n×` how many items the compiled page draws; `-x` / `+x` a label gone / added; "— none" a region the file does not draw.

## Web 1440

- **Page title**: Settings
- **Navigation**: User Settings · Agency Settings · Licenses · Preferences · Change Password
- **Repeated cards**: 
  - **UserSettings** — 4× FAL License: · ‹id› · Verified · ‹title› · (sometimes CR Number:) · ‹id› · ‹text› · ‹phone› · ‹email› · ‹text› · Owner · ‹text› · Valid until · ‹date› · (sometimes Share with agency staff) · ‹switch›
- **Buttons and links**: Add FAL license

## Phone 375 — what differs from web

- **Navigation**: — none
- **Buttons and links**: — none
- **Tabs**: User Settings · Agency Settings · Licenses · Preferences · Change Password
- **Primary buttons**: Add FAL license

## As staff — what differs from the owner (web)

- **Navigation**: -Agency Settings
- **Repeated cards**: 
  - **UserSettings** — none
  - **LicenseCard** — 4× FAL License: · ‹id› · Verified · ‹title› · (sometimes CR Number:) · ‹id› · ‹text› · ‹phone› · ‹email› · ‹text› · Owner · ‹text› · Valid until · ‹date›
- **Buttons and links**: +Why is this important? · +User Settings
- **Figures**: Profile Completeness
- **Other product copy shown**: FAL License Verification · Nafath Verification

## As staff — what differs from the owner (375)

- **Tabs**: -Agency Settings
- **Repeated cards**: 
  - **UserSettings** — none
  - **items** — 4× FAL License: · ‹id› · Verified · ‹title› · (sometimes CR Number:) · ‹id› · ‹text› · ‹phone› · ‹email› · ‹text› · Owner · ‹text› · Valid until · ‹date›
- **Figures**: Profile Completeness
- **Buttons and links**: Why is this important? · User Settings
- **Other product copy shown**: FAL License Verification · Nafath Verification

## As individual — what differs from the owner (web)

- **Navigation**: -Agency Settings
- **Repeated cards**: — none
- **Other product copy shown**: FAL License · Verified · Owner · Valid until

## As individual — what differs from the owner (375)

- **Tabs**: -Agency Settings
- **Repeated cards**: — none
- **Other product copy shown**: FAL License · Verified · Owner · Valid until

## Empty (`empty` state, web) — what differs

- **Repeated cards**: — none
- **Buttons and links**: — none
- **Empty block**: No License Added · Add your FAL License for an easier ad posting experience and get a "Verified" badge.
- **Primary buttons**: Add FAL license

## Empty (`empty` state, 375) — what differs

- **Repeated cards**: — none
- **Empty block**: No License Added · Add your FAL License for an easier ad posting experience and get a "Verified" badge.
