# Intake — from a PRD to a plan

Read this when a PRD arrives, before your first reply. Do the steps in order: § 0–3b make
**one reply** (the gap check, both tables, the questions, and for a new or changed UI the
gaps and the competitors to approve). Write no design file until the user has answered. Then
research and build the three directions (or, for a small fix, the wireframe), and stop at
gate 1 until the PM picks (SKILL.md → THE FLOW).

Keep the intake in `designs/<feature>/intake.md`: the gap check, both tables, the questions,
and the answers as they come. The edge cases (§ 3) go there too. It is the design's memory
for later turns and for the next person.

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
- what a row's own text orders you to ask: D2 when the PRD is ambiguous, D4 on every PRD,
  D7 for Arabic timing, D8 for regenerating pages, P8 for another meaning, and P9, the
  competitor shortlist (§ 3b), on every new or changed UI.

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
| P9 | Competitors to study: the shortlist in the fit table (§ 3b). Approve it, or name a swap from the alternates. Asked on every new or changed UI; a small fix has none. | | |
| P8 | Contradictions: for each key noun, the shipped field that covers it (`pages[x].labels`, `copy/rendered/`). Same meaning: the shipped string wins; use it, and list the PRD's word under **PRD deviations** in the handoff. Ask when the PM quoted the words (in quotes, or "the button says …"): they may want the change. Maybe another meaning: ask; a new meaning is new copy. | | |

### Design — for the designer

| # | question | proposed from PRD | confidence |
|---|---|---|---|
| D1 | A new page, a change to an existing page, or a new cross-page component? | | |
| D2 | Which page(s): route and registry id. If the PRD is ambiguous, list the candidates and ask. | | |
| D3 | Entry point: how does the user arrive here? | | |
| D4 | Asked on every PRD. Design language: current Profolio (Figtree, teal) or Profolio 2.0 (Geist, green)? Propose the theme the page has today. 2.0 is compiled for My Listings (`listings-new`); on another page it is allowed and flagged: the shell from a `listings-new` file, the kit's 2.0 patterns, `--pf-ml-*` tokens, every borrowed choice [TBC] for the designer's sign-off (SKILL.md → THEMES). In the same row: reuse existing components only, or kit patterns and new ones allowed? Density: match the page, or a new layout? Illustration and empty-state art: the product's own only? | | |
| D5 | States: for each page in D2, name its compiled loading, empty, error and message-* from `node qa/registry.mjs page X` (or "none"). `empty` is a new account, not the feature's own empty. The feature's own states you work out yourself: the state matrix (§ 3), in flow.json, with proposed copy — shown in the wireframe, never asked. Answer flag-off and no-permission ("not drawn" if so). | | |
| D6 | Any component the catalogue lacks? List what you think is missing. | | |
| D7 | Copy: final or placeholder? Arabic now or deferred? | | |
| D8 | Does it change an existing component? Paste the page ids in its `used_on` verbatim, never a count; a `registry.shell` component reaches every signed-in page. A change to its default string (a label, a placeholder, an empty-state line) reaches every one of those pages too: say so. Ask whether to regenerate them. | | |
| D9 | Responsive: web only, or web and phone (375; 360 in Profolio 2.0)? Whatever is chosen, the prototype carries every state on every platform named — the QA holds it to flow.json. A change to a shared component (D8) reaches its phone pages too: name the platforms that inherit it, even when the PRD says web only. | | |

## 3 · Edge cases and scenarios — work them out, don't ask

Derive them yourself from the PRD and the compiled states. Never ask the designer or the PM
for them. For each requirement, go through:

- counts: zero, one, many, and the maximum;
- text: very long, and Arabic, which runs longer;
- loading: slow, failed, and partial data;
- each role (P5), flag-off (P6) and no permission;
- repeated actions: a double submit, an action already done, two tabs open;
- what follows success: a toast, a redirect, a refresh, the updated count;
- **each field the screen shows**: required or optional, and what shows when the source did not
  send it, e.g. no rooms, no district, no price, or a budget with only a minimum. This is the
  field matrix; put incomplete rows in `data.json`;
- **locked or gated data**: not bought yet, not paid for, a role that may not see it, expired.
  Design the lock state, and prepare 2–3 variants for the user to pick (flow.json `options`);
- **limits and quotas**: a balance, a cap, a maximum count;
- **time**: expiring, expired, stale data. The compiled pages' clock is 1 October 2026 in
  Riyadh (`node qa/registry.mjs clock`), so "this month" holds one day: design a partial period
  on purpose (month to date, against the same days last month, labelled so), and date the rows
  in `data.json` around that clock;
- **someone else acting**: taken, changed or deleted meanwhile;
- **one idea that would make it better than asked**: optional, flagged as such, never in the way.

Each case that changes the screen becomes a named state in flow.json, or "not drawn → ‹compiled
file›". Every other case goes in the handoff notes.

Then the **state matrix** (flow.json `matrix`): one row per region that shows data — a table, a
list, a dropdown's options, a counter, a dialog's content. For each, name the state for:
- **default**;
- **loading**: skeleton rows built from the region's own row;
- **empty**: nothing yet, and when it comes;
- **error**: what failed, and how to retry;
- **no-results**: when it filters or searches, with a way out;
- **first-use**: when the feature is new to the user.

A kind that cannot happen gets `"not drawn: <why>"`. Design these even when the PRD is silent:
the PRD's silence is not an answer, and the QA fails a list without them.

## 3b · Gaps and competitors — in the same reply

For a new or changed UI, the first reply also carries the frame of the research
(`research/README.md`, steps 1–2), so the PM approves the competitors with their answers and
no board is built on a competitor they would swap.

1. **The depth**, from D1 and the PRD:
   - a new page, or a redesign ("make it better"): **full** — 6–10 gaps, 5–6 competitors;
   - a new section, or a change to a page: **light** — 3–6 gaps, 3–4 competitors;
   - a small fix: none, and no § 3b.
2. **The gaps**, `G1`…, one line each, from § 0's gap check, § 2's open rows and § 3's edge
   cases: the flows and states a competitor could show.
3. **The traits** (3–5) that define the experience, and the **goal** findings will be ranked by.
4. **The fit table**: a long list from all four groups of `research/competitors.md` plus the
   feature's own (10+ full, 6+ light), each trait scored yes, partly or no, Mobbin coverage
   from one quick `search_flows` naming it ("Zillow leads", limit 3), and the gaps it could
   answer. Mark the shortlist and the alternates. Send it as a table, under P9.

The PM's reply approves it, or swaps one: record it in research.json `approved`, and the swap
in `decisions`.

## 4 · The research, the plan and three directions — gate 1

**Which path.** A new or changed UI takes the research path below, **full** for a new page or
a redesign, **light** for a new section or a change to a page (§ 3b). A small fix (copy, a
bug, a token, one state the product already draws) takes the short one at the end.

Once the user has answered:
1. **Research** (`research/README.md`, steps 3–7), into `designs/<feature>/research/` (the
   only design folder written before the plan), on the approved shortlist:
   - Mobbin wide (1–3 word queries naming the thing), then deep: each shortlisted app by
     name, one journey per gap, documented as flows of 2–5 captioned steps;
   - the rules behind those flows, read on each company's own help pages, dated;
   - the capability matrix: Profolio today against each competitor, "not-checked" where unseen;
   - trends from the last 18 months, one of them visual;
   - the findings, merged and ranked by impact on the goal, with effort, gaps, where seen,
     where they land, and their size (two or more change the layout, the hero or the look);
   - the decisions log.

   Write `designs/<feature>/research/research.json` and run `node qa/board.mjs designs/<feature>`.
2. **The plan**: ONE prose paragraph, no bullets and no table, sent before any tool call that
   writes the rest of `designs/<feature>/`. It covers:
   - the layout the data calls for, e.g. "one field per column, the contact first";
   - where the entry point sits;
   - what each state shows;
   - the top findings it draws on and where each was seen, by name, and what each direction bets on:
     its layout and its hero (A a table, B a list beside its detail, C cards led by the score…).
3. Write `designs/<feature>/flow.json`: screens, states, controls, the matrix, and
   `directions` A (existing), B (competitor-led), C (bold), each with its title, summary and
   fresh moves. Write `state.json`, `data.json` and `actions.json`: realistic KSA rows and
   every action, shared by all three directions (kit/README.md).
   Rebuild the board now (`node qa/board.mjs designs/<feature>`): it shows the directions, and
   publish it as its own artifact. Its link goes in flow.json `research.board_url`.
4. Build each direction completely, every screen and state, on the platforms D9 names, in `A/`,
   `B/`, `C/` (SKILL.md → HOW A HI-FI IS MADE; start each screen with `qa/compose.mjs start`):
   - draw every variant of each open decision (the lock state, the hero), switchable in the
     player (flow.json `options`);
   - B and C mark their fresh moves (`data-pf-fresh`).
5. Critique each direction (design-review), then run
   `node qa/prototype.mjs designs/<feature> --shots` until it exits 0. Send the prototype and
   the board with:
   - the plan;
   - what each direction bets on, its references, and its trade-off;
   - the edge-case list and the state matrix;
   - the one or two questions still open.
6. **Stop.** The PM picks a direction or mixes them ("A's table with C's summary"). Set
   flow.json `chosen`. Skip this gate only when the user says "skip".

**The short path, for a small fix.** No research, no directions. Send the plan paragraph,
write flow.json and the JSON, copy `context.json` to `designs/<feature>/design/context.json`,
and run design-copy for any new words (and design-accessibility when it changes contrast, focus
or a control). Then wireframe the changed area with `kit/wireframe.css`:
- the product shell's proportions;
- real copy;
- the same attributes the hi-fi will use;
- numbered pins for what to look at.

Run `node qa/prototype.mjs designs/<feature> --wireframe`, send `wireframe.html` with the plan,
and stop until the user says go.

Then finish the chosen direction (or, on the short path, build the hi-fi), following SKILL.md → HOW A HI-FI IS MADE and THE FLOW, step 4.
