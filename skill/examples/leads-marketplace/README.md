# Worked example — Leads Marketplace, a new page in Profolio 2.0

One whole feature, made the v2 way, from a real PRD. The PM, Hamza Mannan Samad, ran it
through this skill on claude.ai on 30 Sep 2026. His first result had these faults:
- a left-heavy table: My Listings' card row refilled with lead data;
- 10 separate files, with a storyboard added later;
- filters that did nothing, and a dead shell;
- column headers 12 px off their cells;
- a squashed "View in TruLeads";
- a skeleton left in the old layout;
- the handover's rough riyal.

This rebuild is what the flow produces instead. Run `node qa/prototype.mjs examples/leads-marketplace`
from the skill's folder to build it and see the QA pass.

## The brief

Agents buy leads with credits; a bought lead lands in TruLeads.
- **Sources:** owners from Sell with Bayut ("Owner Leads") and seekers from Find My Property
  ("Seeker Leads").
- **Filters:** purpose, city, price, and property type for seekers.
- **Buying:** a buy dialog shows the balance, respecting the staff limit, and says purchases
  aren't refunded.
- **The other outcomes:**
  - not enough credits: top up;
  - over the staff limit;
  - the last spot taken meanwhile: no charge.
- **Visibility:** only for TruLeads users, behind a tenant flag.
- **Design language:** the 2.0 look, which is allowed on a new page and flagged.

## How it was made

| step | file | what it holds |
|---|---|---|
| 1 intake | (the conversation) | gap check, the screens (`lms-leads`, `listings-new`, the credits dialog), P/D questions |
| 2 plan | `flow.json` | 1 screen × web + phone (360), 13 named states in 4 groups, 4 scenario controls (credits, viewer, leads, network), the state matrix for each table, the dialog and the city menu |
| | `state.json` · `data.json` · `actions.json` | the variables · 8 owner and 6 seeker leads, KSA-real, with open / bought / gone rows · buy (with the balance and staff-limit checks), confirm (with the race), retry, clear filters, tabs |
| 2 wireframe | `wf-marketplace.html` · `.mobile.html` | greyscale at the shell's proportions, the new rail item, one field per column, pins 1–5 for the review; wired to the same JSON — `wireframe.html` is built from them |
| 3 hi-fi | `marketplace.html` · `.mobile.html` | `pages/listings-new(.mobile).html` with its shell and containers kept; inside, the kit's 2.0 table, controls, dialogs and sheets, the build's own icons (pf-also names each file); composed by `scripts/examples/leads-marketplace.mjs` in the repo |
| 4 QA | `qa/prototype.md` · `qa/handoff.md` | every state, web and phone, rendered and measured: passes; the handoff with the new copy table, the data each list needs, the actions |
| 5 deliver | `prototype.html` | one file, 3.4 MB. It holds both platforms, every state, and the 24 product pages the rail opens |

## What to copy from it

- **The layout follows the data.** A lead has six comparable fields, so it gets a table with
  one field per column. The contact comes first as the hero, blurred over a fixed placeholder
  until bought.
- **The state matrix is designed, not asked:**
  - first visit;
  - no leads yet;
  - no results, with Clear filters;
  - error, with Try Again;
  - loading, with skeleton rows that follow the table's columns;
  - bought, gone, not enough credits, and over the limit.
- **The shell works without extra wiring.** The rail opens TruLeads and the rest, and
  expands. The bell, avatar and Post a Listing open the product's own compiled popovers.
- **The runtime does the prototype**, so there is no JavaScript of the design's own.
  Filters change the rows; buying deducts the balance and unblurs the row; View in TruLeads
  opens TruLeads.

## Open — [TBC]

- The 2.0 look, extended to a page it was not drawn for: the designer's sign-off on the table,
  the blur, the bought tint and the rail icon (borrowed from Credits & Packages).
- **The API must support:**
  - a placeholder contact until a lead is bought;
  - who bought it, and when;
  - a TruLeads link to the lead's own drawer.
- Arabic for every new string (`qa/handoff.md`); the phone menu drawer is the product's and does
  not list the new item yet; the TruLeads source badge (Owner Lead / Seeker Lead) is not drawn.
