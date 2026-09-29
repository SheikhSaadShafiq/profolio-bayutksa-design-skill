# Cold test — does the skill work without this conversation?

> This file is the answer key. It lives outside `skill/` so no install carries it: a run
> whose files-read list contains `tests/` or `cold-test.md` fails automatically.

**My own output is not evidence that the skill works.** The session that built this package
had the whole build conversation in context: every decision, every file, every fix. A skill
works only if a session with none of that — just `SKILL.md` and the files it routes to —
behaves the same way. Test it cold.

---

## 1 · Set up a fresh session

**Claude Code (recommended).** Claude Code loads a skill from a folder and reads the rest on
demand, so the package can be installed whole or with only its core.

```bash
# the core only (about 6 MB) — pages and components are fetched by path when needed
git clone --depth 1 --branch claude/theme-refresh --filter=blob:none --sparse \
  https://github.com/SheikhSaadShafiq/profolio-bayutksa-design-skill.git profolio-skill
cd profolio-skill
git sparse-checkout set --no-cone /skill/SKILL.md /skill/registry.json /skill/tokens.md \
  '/skill/product/' '/skill/css/' '/skill/qa/' /skill/examples/worked-example.md /skill/pages/prototype.js
# or the whole package (about 450 MB): git sparse-checkout set skill

mkdir -p ~/.claude/skills && ln -s "$PWD/skill" ~/.claude/skills/profolio-ksa-design
```

Then open a new Claude Code session **in an empty folder** — not this repo, and not a session
that has seen this conversation — and paste one PRD below. On a core install the session
fetches the pages it needs with `python3 qa/fetch.py <page> [<state>…]`.

**claude.ai.** Start a new chat and attach: `SKILL.md`, `registry.json`, `tokens.md`,
`product/flags.md`, `product/roles.md`, `product/routes.md`, `product/copy.md`, and the
`product/copy/rendered/<page>.md` and `product/pages/<page>.md` of the pages the PRD names.
Page files are 0.3–1.5 MB each; attach one only if the session asks for it by path.

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

Every run: reads `registry.json` first; never reads `css/profolio.css` or `product/flags.md`
whole (grep); presents the 13-row table with a proposal and a confidence in every row; asks
only rows it could not fill or filled at low confidence, plus what a row's own text orders (2
when ambiguous, 6 a new empty, 8 Arabic timing, 9 regenerate, 11 another meaning), with
"asked" after the confidence; asks nothing else; at most one question per row, each with a
proposal; says what it assumes for a medium row; produces nothing before the designer replies.

**A · credits**

| # | a correct proposal | confidence |
|---|---|---|
| 1 | A change across existing pages, with a new composition (the request) | medium |
| 2 | Candidates, asked: `post-listing-upgrade` — the draft page ("Almost There!" · Post Listing), state `inline-insufficient-credits` and, for staff, `inline-insufficient-credits-as-staff` (not flow step 09, the posted upsell); `agency-staff` (`modal-set-credits-limit`); the shell's notifications (`listings/popover-notifications`, a drawer at 375; empty: `popover-notifications-empty@web`, `drawer-notifications-empty@375`) | medium; asked (ambiguous) |
| 3 | Staff: the insufficient-credits moment, compiled as staff (`pages/post-listing-upgrade/inline-insufficient-credits-as-staff.html`: Available Credits 1, "Pay 900 for the additional 9 credits at checkout"). Admin: the notifications bell | high |
| 4 | Staff asks; the owner approves. **An individual has no admin** — no prompt (`product/roles.md`). Staff cannot open Set Credits Limit (roles.md: states a role cannot open) | high |
| 5 | `agency-staff`: `IS_CREDIT_CAPPING_ENABLED=true` (Gates: `<AgencyHeader>`, the credit-limit Button, `<SetCreditsLimit>` [set-staff-credit-limit]), its Referenced-in files quoted; any effect the Gates column does not give is [TBC] at medium — never an invented flag or effect | high |
| 6 | `post-listing-upgrade`: `loading`, `empty`, `error`, `message-post-listing`, `message-upgrade-failed`; ask only about pending (R3) and the admin's side; **the PRD is silent on a new empty — asked**; flag-off and no-permission answered | high; the new empty asked |
| 7 | The request (probably a modal composed from existing ones) and a new notification item | medium |
| 8 | New strings are new copy; Arabic now or deferred — asked | medium; Arabic timing asked |
| 9 | If the admin raises the limit in the existing modal: `set-staff-credit-limit` (its rows `set-capping-limit`, part of it), `used_on` `agency-staff`, pasted verbatim; `notification-card` is a shell component (20 page ids, pasted, or "every signed-in page") — asked whether to regenerate | medium; regenerate asked |
| 10 | Web and 375 — proposed | medium |
| 11 | The product's words win: "Set Credits Limit", "Insufficient Credits" | high |
| 12 | Credits: which products (Hot, Signature upgrades; posting), expiry of a raised limit, payment methods (`product/ksa.md`, `PAYMENT_METHODS`) — the open ones asked | low; asked |
| 13 | Not asked (the PRD doesn't touch My Listings), or "current — not My Listings" | high |

**B · leads**

| # | a correct proposal | confidence |
|---|---|---|
| 1 | A change to an existing page | high |
| 2 | `lms-leads`, route `/lms/leads` | high |
| 4 | Staff: own leads only — already shipped (`product/roles.md`); staff and individual have no Users filter (`pages['lms-leads'].labels.staff.filters`) | high |
| 5 | `lms-leads`: `IS_LMS_ENABLED=true (route)`, `LMS_ENABLED.IS_BAYUT_MATCH_ENABLED=true` for the Bayut Match tab — **not** `BAYUT_MATCHING_LEAD` (it gates the badge, and is not in lms-leads' flags) | high |
| 6 | `loading`, `empty`, `error` compiled; the filter's own empty — asked | high; the new empty asked |
| 9 | `lead-listings-table` (web), `lead-listings-mobile` (375), `used_on` `lms-leads` — never "also the Overview, My Listings…" | high |
| 11 | **The table already has Last Interaction and Next Planned Task, and a Last Interaction date filter** (`pages['lms-leads'].labels`); the phone card shows the next task's date and time. "Last contacted" may not mean "Last Interaction" — asked. Relative time ("3 days ago", "a day ago") ships in the notification cards (`copy/rendered/`) | medium; another meaning asked |
| 12 | No | high |
| 13 | Not asked, or "not My Listings" | high |

**C · the new My Listings**

| # | a correct proposal | confidence |
|---|---|---|
| 1 | A change to an existing page, with a new component (the reminder control, the row marker) | medium |
| 2 | `listings-new`: the web Listing Performance drawer (`drawer-listing-performance@web`, its fixes; `drawer-listing-performance-perfect@web` has none) and the phone performance sheet (`sheet-performance@360`, `sheet-improve-quality@360`); the list rows on `pages/listings-new.html` / `.mobile.html` | high |
| 4 | Only the owner is compiled (`registry.pages['listings-new'].roles`); staff and individual [TBC] | medium |
| 5 | None known — `listings-new` carries no flags (the handover is not the product); [TBC], never invented | medium |
| 6 | The drawer's no-fixes state is `drawer-listing-performance-perfect@web`; loading (`skeleton-filtering`, `rank-updating@web`), offline; the reminder's own empty asked | high; the new empty asked |
| 10 | Web 1440 and phone **360** (the new theme's base, not 375) | high |
| 13 | **The new theme** — the performance drawer exists only in `listings-new` (the current `listings` has none); proposed with that reason, or asked | medium; or low, asked |

---

## 4 · What a correct build looks like

- The first text after the designer's reply is the plan, one paragraph, before any file is
  written to `designs/`.
- Designs in `designs/`, each from a compiled file named in `pf-base` (every other file it
  copied from in `pf-also`), `src="../pages/prototype.js"`; one file per state, and the phone
  files when in scope (`.mobile.html`).
- `python3 qa/validate.py designs/<name>*.html` (checks 1–3, the named files only) passes; the
  grader re-runs it.
- No style on new copy and no style the pf-base / pf-also files don't carry; no hex colour.
- New theme (C): the product's header and rail untouched; values added are `var(--pf-ml-…)`;
  an amount uses the build's `svg[data-pf-riyal]`; Geist as the build draws it; 360 phone files.
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
