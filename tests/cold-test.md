# Cold test — does the skill work without this conversation?

> This file is the answer key. It lives outside `skill/` so no install carries it: a run
> whose files-read list contains `tests/` or `cold-test.md` fails automatically.

**My own output is not evidence that the skill works.** The session that built this package
had the whole build conversation in context: every decision, every file, every fix. A skill
works only if a session with none of that — just `SKILL.md` and the files it routes to —
behaves the same way. Test it cold.

---

## 1 · Set up a fresh session

**Claude Code (recommended).** Build the `.skill` file (README → Build a release) and install
it: it carries the instructions, registry, tokens and both knowledge bases, and fetches pages and
`css/` from GitHub by path, at its own tag. If `~/.claude/skills/profolio-ksa-design` is a link
to this repo, remove the link first.

```bash
mkdir -p ~/.claude/skills && unzip -o dist/profolio-ksa-design.skill -d ~/.claude/skills/
```

Then open a new Claude Code session **in an empty folder** — not this repo, and not a session
that has seen this conversation — and paste one PRD below. The session fetches what it needs
with `python3 qa/fetch.py --css` and `python3 qa/fetch.py <page> [<state>…]`.

**claude.ai.** Upload the same `.skill` file under Settings → Capabilities → Skills, with code
execution on (the default network setting, "package managers only", is enough), and start a new
chat. Also try it once in Claude Design.

---

## 2 · The PRDs

**A · credits**

> **Ask your admin for credits**
>
> **Problem.** An agency staff user who runs out of credits cannot upgrade or post a
> listing. Today they message their agency admin outside Profolio and wait.
>
> - **R1** When a staff user tries something that needs more credits than they have, give
>   them a way to ask their agency admin for credits, with the missing amount filled in.
> - **R2** The admin is notified, and can raise that user's credit limit from the
>   notification.
> - **R3** The staff user sees the request as pending until the admin acts.

**B · leads**

> **Follow up faster in TruLeads**
>
> **Problem.** Leads go cold because agents lose track of who they have not called back.
>
> - **R1** In TruLeads, show on each lead when it was last contacted ("Last contacted 3 days ago").
> - **R2** A quick filter shows only the leads not contacted for 7 days or more.
> - **R3** A staff user sees only their own leads; the agency owner sees everyone's.

**C · the new My Listings**

> **Remind me to fix it**
>
> **Problem.** Agents open a listing's performance view, see what would raise its Quality
> Score, close it — and forget.
>
> - **R1** In My Listings, on each fix the listing's performance view suggests, let the agent
>   set a reminder ("Remind me tomorrow").
> - **R2** A listing with a reminder due shows a small marker on its row.
> - **R3** The agent can cancel a reminder from the same place.

---

## 3 · What a correct intake looks like

Every run: reads `registry.json` first, then `INTAKE.md`; fetches, never guesses, a file the `.skill` lacks; never reads `css/profolio.css` or
`product/flags.md` whole (grep); shows the PRD gap check (§ 0); finds the screens with
`node qa/find.mjs` (§ 1); presents the product table (P1–P8) and the design table (D1–D9) with
a proposal and a confidence in every row; asks only rows it could not fill or filled at low
confidence, plus what a row's own text orders (D2 when ambiguous, D4 2.0 off My Listings, D5 a
new empty, D7 Arabic timing, D8 regenerate, P8 another meaning), with "asked" after the
confidence, grouped **For the PM** and **For the designer**; asks nothing else; at most one
question per row, each with a proposal; says what it assumes for a medium row; lists the edge
cases and scenarios itself and never asks for them (§ 3); produces nothing before the reply.

In every PRD below: **P1** (the metric), **P3** (scope) and **P4** (release) are not in the
PRD — P1 and P4 asked (low), P3 proposed or asked; **P2** restated as user stories with the
PRD's requirements as acceptance criteria (high); **D4** design language answered — current
Profolio for A and B, and for C the new theme (Profolio 2.0), which exists only for My
Listings.

**A · credits**

| # | a correct proposal | confidence |
|---|---|---|
| D1 | A change across existing pages, with a new composition (the request) | medium |
| D2 | Candidates, asked: `post-listing-upgrade` — the draft page ("Almost There!" · Post Listing), state `inline-insufficient-credits` and, for staff, `inline-insufficient-credits-as-staff` (not flow step 09, the posted upsell); `agency-staff` (`modal-set-credits-limit`); the shell's notifications (`listings/popover-notifications`, a drawer at 375; empty: `popover-notifications-empty@web`, `drawer-notifications-empty@375`) | medium; asked (ambiguous) |
| D3 | Staff: the insufficient-credits moment, compiled as staff (`pages/post-listing-upgrade/inline-insufficient-credits-as-staff.html`: Available Credits 1, "Pay 900 for the additional 9 credits at checkout"). Admin: the notifications bell | high |
| P5 | Staff asks; the owner approves. **An individual has no admin** — no prompt (`product/roles.md`). Staff cannot open Set Credits Limit (roles.md: states a role cannot open) | high |
| P6 | `agency-staff`: `IS_CREDIT_CAPPING_ENABLED=true` (Gates: `<AgencyHeader>`, the credit-limit Button, `<SetCreditsLimit>` [set-staff-credit-limit]), its Referenced-in files quoted; any effect the Gates column does not give is [TBC] at medium — never an invented flag or effect | high |
| D5 | `post-listing-upgrade`: `loading`, `empty`, `error`, `message-post-listing`, `message-upgrade-failed`; ask only about pending (R3) and the admin's side; **the PRD is silent on a new empty — asked**; flag-off and no-permission answered | high; the new empty asked |
| D6 | The request (probably a modal composed from existing ones) and a new notification item | medium |
| D7 | New strings are new copy; Arabic now or deferred — asked | medium; Arabic timing asked |
| D8 | If the admin raises the limit in the existing modal: `set-staff-credit-limit` (its rows `set-capping-limit`, part of it), `used_on` `agency-staff`, pasted verbatim; `notification-card` is a shell component (20 page ids, pasted, or "every signed-in page") — asked whether to regenerate | medium; regenerate asked |
| D9 | Web and 375 — proposed | medium |
| P8 | The product's words win: "Set Credits Limit", "Insufficient Credits" | high |
| P7 | Credits: which products (Hot, Signature upgrades; posting), expiry of a raised limit, payment methods (`product/ksa.md`, `PAYMENT_METHODS`) — the open ones asked | low; asked |
| D4 | Current Profolio — the pages are not My Listings, and 2.0 exists only there; existing components, the pages' own density, no illustration | high |

**B · leads**

| # | a correct proposal | confidence |
|---|---|---|
| D1 | A change to an existing page | high |
| D2 | `lms-leads`, route `/lms/leads` | high |
| P5 | Staff: own leads only — already shipped (`product/roles.md`); staff and individual have no Users filter (`pages['lms-leads'].labels.staff.filters`) | high |
| P6 | `lms-leads`: `IS_LMS_ENABLED=true (route)`, `LMS_ENABLED.IS_BAYUT_MATCH_ENABLED=true` for the Bayut Match tab — **not** `BAYUT_MATCHING_LEAD` (it gates the badge, and is not in lms-leads' flags) | high |
| D5 | `loading`, `empty`, `error` compiled; the filter's own empty — asked | high; the new empty asked |
| D8 | `lead-listings-table` (web), `lead-listings-mobile` (375), `used_on` `lms-leads` — never "also the Overview, My Listings…" | high |
| P8 | **The table already has Last Interaction and Next Planned Task, and a Last Interaction date filter** (`pages['lms-leads'].labels`); the phone card shows the next task's date and time. "Last contacted" may not mean "Last Interaction" — asked. Relative time ("3 days ago", "a day ago") ships in the notification cards (`copy/rendered/`) | medium; another meaning asked |
| P7 | No | high |
| D4 | Current Profolio — the pages are not My Listings, and 2.0 exists only there; existing components, the pages' own density, no illustration | high |

**C · the new My Listings**

| # | a correct proposal | confidence |
|---|---|---|
| D1 | A change to an existing page, with a new component (the reminder control, the row marker) | medium |
| D2 | `listings-new`: the web Listing Performance drawer (`drawer-listing-performance@web`, its fixes; `drawer-listing-performance-perfect@web` has none) and the phone performance sheet (`sheet-performance@360`, `sheet-improve-quality@360`); the list rows on `pages/listings-new.html` / `.mobile.html` | high |
| P5 | Only the owner is compiled (`registry.pages['listings-new'].roles`); staff and individual [TBC] | medium |
| P6 | None known — `listings-new` carries no flags (the handover is not the product); [TBC], never invented | medium |
| D5 | The drawer's no-fixes state is `drawer-listing-performance-perfect@web`; loading (`skeleton-filtering`, `rank-updating@web`), offline; the reminder's own empty asked | high; the new empty asked |
| D9 | Web 1440 and phone **360** (the new theme's base, not 375) | high |
| D4 | **The new theme** — the performance drawer exists only in `listings-new` (the current `listings` has none); proposed with that reason, or asked | medium; or low, asked |

---

## 4 · What a correct build looks like

- The first text after the designer's reply is the plan, one paragraph, before any file is
  written to `designs/`.
- Designs in `designs/`, each from a compiled file named in `pf-base` (every other file it
  copied from in `pf-also`), the kit linked, links two folders up (`designs/<feature>/`); one
  screen per page (states are flow.json scenarios), and the phone file when in scope.
- `node qa/prototype.mjs designs/<feature>` exits 0: it runs `qa/validate.py` checks 1–3 and the
  visual QA on every state. The grader re-runs it.
- No style on new copy and no style the pf-base / pf-also files don't carry; no hex colour.
- New theme (C): the product's header and rail untouched; values added are `var(--pf-ml-…)`;
  an amount uses the official riyal (`pfk-riyal`, `svg[data-pf-riyal]`, `kit/riyal.svg`); Geist as the build draws it; 360 phone files.
- Ends with the output contract: the plan, components used, components added and why,
  layout differences, PRD deviations, every [TBC], pages affected (page ids verbatim), how to
  QA against live (the route pattern, never `fixture_url`; a flag-off state against a build
  with the constant flipped, never an account).
- Every measured number quotes `node qa/measure.mjs` output.

**It fails if it:** produces a design before the confirmation; invents a token, a colour, a
flag, a flag's effect or a string; calls shipped copy new without grepping
`copy/rendered/`; writes a style on new copy, or one its pf-base and pf-also files don't
carry, or a hex colour; skips the empty state; offers the prompt to an individual broker;
asks for a live account with a flag turned off; gives "pages affected" as a count; quotes a
measurement no `qa/measure.mjs` command reproduces; restyles the shell or draws "SAR" in the
new theme; or calls the result pixel-perfect without the overlay.

## 5 · v2 acceptance — the Leads Marketplace brief

The v2 skill is accepted when a fresh session gets the brief from the Leads Marketplace session
(`examples/leads-marketplace/README.md` → the brief; in full: the session report's § 2) and
produces, on claude.ai and in Claude Code:

1. **A plan and a wireframe first.** Before any hi-fi, it sends:
   - the plan paragraph;
   - flow.json with the state matrix;
   - `wireframe.html`, built with `--wireframe`, clickable, at the shell's proportions.

   It then waits for go.
2. **Empty states nobody asked for.**
   - First visit, no leads yet, no results with Clear filters, error with Try again, and
     loading, for each list.
   - The art matches the meaning, and nothing promises a feature that isn't there.
3. **The Design QA before delivery.** `node qa/prototype.mjs` passes. With no browser, the
   agent says the QA did not run.
   - No header is off its column, no button is squashed or uneven, no text is clipped or
     overlapping.
   - The skeleton follows the columns.
4. **The official riyal**, never SAR and never the handover's sketch.
5. **One prototype**, `prototype.html`, published as an artifact where possible. Never loose
   files.
6. **Everything works:**
   - filters, sort and tabs change the rows;
   - buying deducts credits and unblurs the row;
   - the rail opens the other pages, and the bell, avatar and Post a Listing open;
   - every flow.json state is reachable by using the page.

The automatic half of this runs in CI (`npm run test:kit`): the QA catches each defect of the
first session, and the worked example works and passes.
