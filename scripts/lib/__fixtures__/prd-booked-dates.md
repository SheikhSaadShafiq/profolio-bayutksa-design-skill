# PRD — Booked dates for daily rentals

Owner: Product · Status: Draft · Market: Profolio KSA (tenant bayut)

## Background

Daily-rental hosts keep their availability outside Profolio — in WhatsApp groups and spreadsheets — so bayut.sa shows listings as free on nights that are taken, and hosts get leads they cannot serve. Profolio already lets an agency owner mark a daily-rental listing as booked, but agency staff, who run most daily rentals day to day, have no view of booked dates anywhere else.

## Goals

- Keep booked dates for daily rentals current from inside Profolio.
- Fewer leads on nights that are already booked.

## Users

- Agency staff (agents) who manage daily-rental listings — primary.
- Agency owners (admins), who assign credits to their staff.
- Individual sellers who host their own daily rentals.

## User stories

1. As an agency staff member, I want to mark a daily-rental listing as booked from the listings page, so that customers do not contact me for nights that are taken.
2. As an agency staff member, I want to see booked dates on the dashboard, so that I know which of my rentals are free this week.
3. As an agency staff member without credits, I want a prompt to ask my admin for credits, so that I am not stuck when an action costs credits.
4. As an agency owner, I want to be notified when a staff member asks for credits, so that I can set their credit limit.

## Requirements

### R1 — Mark as booked from My Listings

- The Actions column of a daily-rental listing offers Mark as Booked.
- The user picks one or more date ranges; each range can be removed before saving.
- Saving shows a success message; a failed save keeps the dialog open with an error.
- A booked listing shows the Booked chip, with the booked-until date on hover.

### R2 — Booked dates on the dashboard

- The dashboard shows a Booked dates card with the next booked ranges of each daily-rental listing.
- While loading, the card shows a skeleton; with no bookings it shows an empty state; if the request fails it shows an error.
- On a phone the card stacks under the credits widget.

### R3 — Staff without credits

- When a staff user without credits starts an action that costs credits, show a prompt that says they have no credits, with a button to ask their admin.
- Asking sends a notification to the agency owner, who can open Agency Staff and set the user's credit limit.

## Acceptance criteria

- Given a daily-rental listing, when an agency staff user clicks Mark as Booked and saves a date range, then the listing shows the Booked chip.
- Given two overlapping date ranges, when the user saves, then an error says the ranges overlap.
- Given a staff user with 0 credits, when they try to upgrade a listing, then they see the ask-your-admin prompt.

## Non-functional

- Web at 1440 and the phone layout at 375.
- English and Arabic.

## Analytics

- `booked_dates_saved` when a range is saved
- `credits_request_sent` when a staff user asks their admin

## Out of scope

- Syncing bookings with Bayut Stays.
- Pricing per night.

## Open questions

- Should individual sellers see the same dashboard card?
