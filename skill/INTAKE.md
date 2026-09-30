# Intake — from a PRD to a plan

Read this when a PRD arrives, before your first reply. Do the steps in order. Produce no
design until the designer has answered and you have sent the plan.

## 0 · PRD gap check

Before any question, show what the PRD gives and what it lacks, one line per section:

| section | in the PRD? | note |
|---|---|---|
| problem and goal | yes / partly / no | |
| users and roles | | |
| requirements, numbered | | |
| success metric | | |
| scope — in, later, out | | |
| release and rollout | | |
| states — empty, error, loading | | |
| copy — final? Arabic? | | |
| design language | | |
| dependencies — APIs, data | | |

A section that is missing or vague becomes a question below — for the PM when it is about the
product, for the designer when it is about the design.

## 1 · Find the screens

- `node qa/find.mjs "<the PRD's own words>"` searches the design knowledge base (`kb/design-kb.json`):
  every screen's purpose and copy, and every state's trigger, title, controls and strings. It
  prints the pages and states that match, best first, with their files.
- Also match `registry.pages[x].aliases`, and check `pages[x].labels` for what a page already shows.
- The `.skill` carries no pages: fetch what you will open, `python3 qa/fetch.py <page> [<state>…] [--375]`
  (`find.mjs` prints the command and the file's GitHub link). Never ask the user for a link or a file.
- Never guess a page from its name alone. Quote the files you matched.

## 2 · The questions

Fill every row with a proposed answer and a confidence: high, medium or low. Present both
tables. Then ask only:

- a row you could not fill, or filled at low confidence;
- what a row's own text orders you to ask: D2 when the PRD is ambiguous, D4 on every PRD, D5
  for a new empty state, D7 for Arabic timing, D8 for regenerating
  pages, and P8 for another meaning.

Write "asked" after the confidence ("high; regenerate asked"). Ask nothing else: a medium row
states what you will assume. Never ask what SKILL.md already decides — shipped copy wins, and
the design is English (Arabic RTL is not compiled). D4 is the exception: ask it on every PRD,
with the theme SKILL.md gives the page as your proposed answer.

At most one question per row. Each question names its row and carries your proposed answer,
so a yes is enough. Group the questions under **For the PM** and **For the designer**. The one
reply confirms every row you didn't ask: don't ask it again.

### Product — for the PM

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| P1 | Goal and success metric: the problem, for whom, and the number that should move (with today's value if known). | | |
| P2 | User stories and acceptance: each requirement as "as a ‹role›, I can …", with the acceptance criteria the design must meet. | | |
| P3 | Scope: what ships now (MVP), what comes later, and what is explicitly out. | | |
| P4 | Release: the date; the rollout (a flag, an A/B test, a share of accounts); whether the APIs exist yet. | | |
| P5 | Roles: which of owner, staff and individual see it, and does it differ by role? (`product/roles.md`) | | |
| P6 | Flags: each with the page whose `pages[x].flags` (or `shell.flags`) carries it. Grep its row in `product/flags.md` and quote its Referenced-in files. An effect its Gates column does not give is [TBC], at most medium; a condition `(ORed with X)` needs both. | | |
| P7 | Credits, packages or tiers: the products and tiers affected, expiry, and payment methods (`product/ksa.md`, `PAYMENT_METHODS`). | | |
| P8 | Contradictions: for each key noun, the shipped field that covers it (`pages[x].labels`, `copy/rendered/`). Same meaning: the shipped string wins, so flag it. Maybe another meaning: ask; a new meaning is new copy. | | |

### Design — for the designer

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| D1 | A new page, a change to an existing page, or a new cross-page component? | | |
| D2 | Which page(s): route and registry id. If the PRD is ambiguous, list the candidates and ask. | | |
| D3 | Entry point: how does the user arrive here? | | |
| D4 | Asked on every PRD. Design language: current Profolio (Figtree, teal) or Profolio 2.0 (Geist, green)? Propose the theme SKILL.md gives the page. 2.0 exists only for My Listings (`listings-new`). On another page there are no 2.0 tokens: flag it, ask, and keep it [TBC]. In the same row: reuse existing components only, or new ones allowed? Density: match the page, or a new layout? Illustration and empty-state art: the product's own only? | | |
| D5 | States: for each page in D2, name its compiled loading, empty, error and message-* from `pages[x].states` (or "none"). `empty` is a new account, not the feature's own empty. Ask only about states with no compiled file, and always about a new empty state the PRD is silent on. Answer flag-off and no-permission ("not drawn" if so). | | |
| D6 | Any component the catalogue lacks? List what you think is missing. | | |
| D7 | Copy: final or placeholder? Arabic now or deferred? | | |
| D8 | Does it change an existing component? Paste the page ids in its `used_on` verbatim, never a count; a `registry.shell` component reaches every signed-in page. Ask whether to regenerate them. | | |
| D9 | Responsive: web only, or web and phone (375; 360 in Profolio 2.0)? | | |

## 3 · Edge cases and scenarios — work them out, don't ask

Derive them yourself from the PRD and the compiled states. Never ask the designer or the PM
for them. For each requirement, go through:

- counts: zero, one, many, and the maximum;
- text: very long, and Arabic, which runs longer;
- loading: slow, failed, and partial data;
- each role (P5), flag-off (P6) and no permission;
- repeated actions: a double submit, an action already done, two tabs open;
- what follows success: a toast, a redirect, a refresh, the updated count.

Each case that changes the screen becomes a state: a design file, or "not drawn → ‹compiled
file›". Every other case goes in the handoff notes. Show the list with the plan.

## 4 · The plan

After the reply, the first text of your next turn is the plan: ONE prose paragraph, no bullets
and no table, sent before any tool call that writes to `designs/`. Put the edge-case list
under it. Then build, following SKILL.md → HOW A DESIGN IS MADE.
