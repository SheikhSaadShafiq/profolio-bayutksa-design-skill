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
# the core only (about 4 MB) — pages and components are fetched by path when needed
git clone --depth 1 --branch claude/skill-package --filter=blob:none --sparse \
  https://github.com/SheikhSaadShafiq/profolio-bayutksa-design-skill.git profolio-skill
cd profolio-skill
git sparse-checkout set --no-cone /skill/SKILL.md /skill/registry.json /skill/tokens.md \
  '/skill/product/' '/skill/css/' '/skill/qa/' /skill/examples/worked-example.md /skill/pages/prototype.js
# or the whole package (about 450 MB): git sparse-checkout set skill

mkdir -p ~/.claude/skills && ln -s "$PWD/skill" ~/.claude/skills/profolio-ksa-design
```

Then open a new Claude Code session **in an empty folder** — not this repo, and not a session
that has seen this conversation — and paste the PRD below.

**claude.ai.** Start a new chat and attach: `SKILL.md`, `registry.json`, `tokens.md`,
`product/flags.md`, `product/roles.md`, `product/routes.md`, `product/copy.md`,
`product/copy/page-agancy-staff.md` (the product spells it so), `product/copy/set-credit-limit.md`, `product/copy/tenant-upgrade-listing.md`. Page files
are 0.3–1.5 MB each; attach one only if the session asks for it by path.

---

## 2 · Paste this PRD

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

---

## 3 · What a correct intake looks like

The session should read `registry.json` first, present this table **before producing
anything**, and ask only about the rows it could not fill.

| # | question | a correct proposal | confidence |
|---|---|---|---|
| 1 | new / change / cross-page | A change across existing pages, likely with a new composition (the request) | medium |
| 2 | which pages | Candidates, and a question about which: `post-listing-upgrade` (state `inline-insufficient-credits`), the listing upgrades on `listings`, `agency-staff` (`modal-set-credits-limit`), and the shell's notifications (`popover-notifications-mark-all-as`, a drawer at 375) | medium — asked |
| 3 | entry point | Staff: the insufficient-credits moment on the upgrade page. Admin: the notifications bell | high |
| 4 | roles | Staff asks; the owner approves. **An individual has no admin** — they must not get the prompt (`product/roles.md`) | high |
| 5 | flags | Named from `product/flags.md`, e.g. `IS_CREDIT_CAPPING_ENABLED=true` (the credit limit), `ALLOW_CREDITS_TOPTUP=true` — never an invented flag | high |
| 6 | states | Loading, error, pending (R3), the admin's side; **the PRD is silent on empty — asked** | asked |
| 7 | missing components | The request (probably a modal composed from existing ones) and a new notification item | medium |
| 8 | copy | All new strings flagged as new copy; Arabic now or deferred — asked | asked |
| 9 | existing component changed | If the admin raises the limit in the existing Set Credits Limit modal (`set-staff-credit-limit`; its rows are `set-capping-limit`), the pages it is on are listed by id and the session asks whether to regenerate. The modal's own `used_on` is empty in the registry (a known defect), so a correct session takes `agency-staff` from `set-capping-limit.used_on` and says so | medium |
| 10 | responsive | Web and 375 — proposed | medium |
| 11 | contradictions | The product's own words win: "Set Credits Limit", "Insufficient Credits" | high |

**It passes if it:**
- reads `registry.json` before anything else, and never reads `css/profolio.css` whole;
- fills the table with real registry ids, routes, state names and flags — every one of them
  findable in the package;
- asks about the empty state because the PRD is silent on it;
- asks only the rows it could not fill, waits, then restates the plan in one paragraph;
- builds in `designs/` from a compiled page with `pf-base`, runs
  `python3 qa/validate.py designs/<name>*.html` (checks 1–3, only the named files), and every
  check passes;
- ends with the output contract: components used, components added and why, every [TBC],
  pages affected via `used_on`, how to QA against live.

**It fails if it:** produces a design before the confirmation; invents a token, a colour, a
flag or a string; writes an inline style or a hex colour; skips the empty state; offers the
prompt to an individual broker; or calls the result pixel-perfect without the overlay.
