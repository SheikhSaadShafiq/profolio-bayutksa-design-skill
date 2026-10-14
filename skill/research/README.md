# Research — before any direction

A design that starts from the product alone comes out ordinary, and one that starts from
browsing comes out unfocused. This is the competitive UX flow method: frame the study by the
design's **gaps**, pick competitors by **experience fit**, collect their **flows** on Mobbin,
check their **rules** on their help pages, **compare** capabilities, and turn it into a
**ranked list of findings**, which the three directions then draw. Trends add what is
current. `qa/board.mjs` turns it into the board a PM reads, and a summary to paste.

Everything goes in `designs/<feature>/research/`: `research.json`, `img/`, and the built
`board.html` and `summary.md`.

## When, and how deep

The size of the change sets the depth (INTAKE.md picks the path):

| the change | depth | gaps | competitors | flows | findings |
|---|---|---|---|---|---|
| a small fix: copy, a bug, a token, a state the product draws | none | — | — | — | — |
| a new section, or a change to a page | `light` | 3–6 | a long list of 6+, **3–4** shortlisted | 3 or more | 4–8 |
| a new page, or a redesign ("make it better") | `full` | 6–10 | a long list of 10+, **5–6** shortlisted, 2+ alternates | one per shortlisted competitor, or more | 8–12 |

A change request after gate 1 is a **round** (below), not a new study.

## Step 1 · Frame it by the gaps (in the intake)

Research only what the design's gaps need: the gap list turns browsing into a checklist.
1. **Gaps**, from the intake: the PRD gap check, the questions, the edge cases, the open
   decisions. Keep the ones a competitor could show (flows and states, not internal policy).
   One line each, coded: `G1` Judge a lead before paying · `G2` What happens when slots run
   out · `G3` After the unlock: contact, follow-up · …
2. **Traits**: the 3–5 things that define this experience, the fit test for competitors.
   "A business pays to reach a person", "access is shared by a capped number", "the value is
   a match to the buyer's own stock".
3. **Goal**: what findings are ranked by ("unlocks per agency per week"), and the fixed
   **constraints** (credits only, KSA law, the product shell).

## Step 2 · Pick competitors by experience fit (in the intake, approved there)

1. **The long list**: candidates from all four groups of `competitors.md`, plus the
   feature's own, found by the wide Mobbin pass (step 3) and the web. A group with nothing
   for this job is recorded with what was searched: `{ "group": "ksa", "none": "Aqar, Wasalt:
   no lead buying" }`.
2. **Score each trait** yes, partly or no, from what you saw, never from memory.
3. **Mobbin coverage**: one quick `search_flows` naming each candidate ("Zillow leads",
   limit 3): strong, partial or none. A product with none needs the web and is slower.
4. **Shortlist** by fit (3–4 light, 5–6 full), keep alternates, and tag each with the gaps
   it can answer.
5. **The PM approves it in the intake reply.** The fit table goes in the first reply with
   the questions (INTAKE.md § 2); the one reply approves it, or swaps one. Record it in
   `approved` and the swap in `decisions`. Never document a competitor the PM hasn't seen
   on the list: a swap after the boards are built costs a board.

## Step 3 · Collect on Mobbin: wide, then deep

Its connector: `search_flows`, `search_screens`, `search_sections`. Use the same
`task_intent` and `output_destination: "code"` on every call of one design. Record every
query in `queries` with its pass and what it gave you (`kept`).

- **Wide, first: short queries naming the thing, 1–3 words**, never a sentence describing a
  layout. `search_screens`, mode `deep` (the default), limit 8: "lead marketplace", "credit
  wallet", "unlock contact", "opportunity card", "job feed", "locked preview". When a word
  belongs to another domain too, add the domain's noun: "match score" returned sports scores,
  "lead inbox" chat inboxes (2026-10-14); "property match" and "sales leads" stay on topic.
  Measured 2026-10-14: a
  sentence describing "a table of leads with filters and an unlock button" returned six
  generic contact tables; "lead marketplace" returned real marketplaces with rich cards. A
  feeling ("urgency"), a quality ("modern") or an abstract idea ("spots left") returns noise:
  use nouns. Keep the best screens as references (`mobbin`), and note new candidates.
- **Deep, second: each shortlisted app by name, one journey per gap**: `search_flows`, limit
  3–5, "[App] + the journey": "Zillow landlord reviews a renter lead and messages them".
  Naming the app keeps a longer query on target (measured 2026-10-14: it returned Zillow's
  own request-info and messages flows). One journey per query; never two.
  - Check the app name on every result: searches return other apps' flows. Keep one only
    if it answers a gap better than your competitor's.
  - Look at every screen: flow names are vague ("Leads", "Sale"). A flow's preview shows
    some of its screens, evenly spaced, while its result lists every screen by position:
    save the candidates (`img/<flow>-<pos>.webp`) and look at each before you caption it.
  - Save each kept image from its `image_url` (`curl -sL -o …`) when the network allows: the
    links expire in 30 days. If full-size images are blocked, use the previews and say so.
- **Mobbin not connected:** say so, set `mobbin_unavailable` to why, and take the
  references and flows from the web (product pages, help centres, design galleries).

## Step 4 · Verify the rules on the live site

Screens show the UI; help centres show the rules behind it: expiry, limits, who sees what,
when something is cancelled. For each flow a rule governs, read the company's **own** help,
support or seller-centre page (never a third-party blog), and record the rule in a sentence
with the page's title, url and the date read. A logged-in flow you can't reach: rely on
Mobbin and say so. Never invent a step or a rule you didn't see.

## Step 5 · Document each flow, the same six parts

1. **Code and title**: `F1` · "Agent claims a lead and calls the buyer", plain words.
2. **Gaps** it answers.
3. **Steps**: 2–5 screens in order, each with its position in the Mobbin flow and a caption
   (under 30 words) of what the user sees and does. Describe; don't judge here. Translate a
   non-English screen and say so; quote short on-screen copy when it carries the idea.
4. **The rule** on the live site, when one governs it (its id), else null.
5. **What they do well**: the design decision that makes it work, in a sentence or two.
6. **Adopt**: a concrete change to a named screen. "Add the slots left to the lead card's
   header" is useful; "improve urgency" is not.

## Step 6 · Compare, then rank the findings

1. **The capability matrix**: one row per capability, a column for Profolio today and one per
   shortlisted competitor: yes, partly, no, or **not-checked** (you didn't see it either way,
   which is not "no"). The board lists where they are ahead, and where Profolio is ahead:
   keep and protect that.
2. **Merge** the flows' adopt notes into findings: one finding per idea, `seen_at` every
   competitor or flow that shows it. Seen at three is stronger than seen at one.
3. **Rank** by impact on the goal, high first:
   - **high** removes a drop-off or a dead end in the main path;
   - **medium** makes it clearer or faster.
4. **Effort**: **S** copy or a state · **M** a new screen or step · **L** a new surface.
5. **Size**, for the directions: `layout` (organised differently), `hero` (what is read
   first changes), `language` (the look changes), `detail`. At least two findings are more
   than a detail: a detail added to the product's screen is still the product's screen.
6. Each finding names its gaps and where it **lands** in the product. 4–8 light, 8–12 full:
   beyond that it stops being a priority list.

## Step 7 · Trends, the board, the summary, the decisions

- **Trends**, at least two from the last 18 months:
  - **ux**: articles on the pattern and the product type, from practitioners (Nielsen Norman
    Group, Smashing, product teams' design blogs);
  - **visual**, at least one: what the best products look like now (Mobbin's newest apps for
    the job, a team's redesign write-up, a showcase). Its takeaway names a visual idea.
- **The board**: `node qa/board.mjs designs/<feature>` writes `board.html` (Start here ·
  Findings · Compare · one section per competitor, its flows step by step · the directions ·
  references · trends · decisions) and `summary.md`, the findings summary for people who
  won't open the board. It checks research.json and exits 1 while anything fails: run it as
  you go. Run it again once flow.json has its directions, publish `board.html` as its own
  artifact, and put its link in flow.json `research.board_url`.
- **The decisions log** (`decisions`): the shortlist and any swap, the rules verified, what
  could not be checked and why.

## The directions draw the findings

The directions are built from the ranked list (SKILL.md → THE FLOW, step 3):
- **A**, existing components only: the high-impact findings of small effort that need no new
  pattern (copy, a state, an order), if any.
- **B**, competitor-led: the convention seen at the most competitors, its layout or its hero.
- **C**, bold: the boldest high-impact findings, a different layout from A.

Each lists the findings it draws in flow.json (`fresh`) and marks the element that draws each
with `data-pf-fresh="<id>"`. B draws at least one, C at least two, and each of B and C at
least one of size layout or hero.

## designs/&lt;feature&gt;/research/research.json

The shape, for a saved-searches feature (a light study; your feature's own content):

```json
{
  "feature": "Saved searches", "made": "2026-10-14", "depth": "light",
  "question": "An agent saves a buyer's search and hears when a matching listing goes live",
  "goal": "buyers contacted within a day of a match", "constraints": ["no SMS"],
  "gaps": [{ "id": "G1", "title": "Save a search from the filters", "from": "PRD 3.1" },
           { "id": "G2", "title": "Hear about a new match", "from": "D5", "evidence": null }],
  "traits": [{ "id": "T1", "title": "a professional saves a search for someone else" }],
  "competitors": [
    { "id": "c1", "name": "Rightmove Plus", "group": "regional", "url": "https://…", "status": "shortlist",
      "fit": { "T1": "yes" }, "mobbin": "partial", "gaps": ["G1", "G2"],
      "why": "agents keep a search per applicant", "does": "matches e-mailed daily" },
    { "id": "c2", "name": "Aqar", "group": "ksa", "url": "https://apps.apple.com/…", "seen": "app-store", "status": "alternate",
      "fit": { "T1": "partly" }, "mobbin": "none", "gaps": ["G2"], "why": "the portal KSA agents use most" },
    { "group": "bayut", "none": "Bayut UAE and dubizzle agent tools: no saved search for agents" }
  ],
  "approved": { "date": "2026-10-14", "by": "Hamza (PM)", "note": "in the intake reply; Aqar kept as alternate" },
  "queries": [
    { "q": "saved search", "pass": "wide", "tool": "screens", "mode": "deep", "kept": ["m1"] },
    { "q": "Linear saved views and notifications", "pass": "deep", "tool": "flows", "kept": ["F1"] }
  ],
  "mobbin": [{ "id": "m1", "app": "Linear", "kind": "screen", "title": "Saved views", "url": "https://mobbin.com/screens/…",
               "image": "img/m1.webp", "borrow": "a view's name and its filter chips on one line", "avoid": "a sidebar of twenty views" }],
  "mobbin_unavailable": null, "web": [],
  "flows": [{ "id": "F1", "competitor": "c1", "title": "Agent saves an applicant's search", "gaps": ["G1"],
              "url": "https://mobbin.com/flows/…", "rule": "R1",
              "steps": [{ "pos": 1, "image": "img/F1-1.webp", "caption": "Filters set, Save search sits beside the result count" },
                        { "pos": 3, "caption": "Name it after the applicant; daily or instant alerts" }],
              "well": "the alert frequency is chosen while saving", "adopt": "Add Save search beside the result count on Listings" }],
  "rules": [{ "id": "R1", "competitor": "c1", "rule": "Alerts stop after 90 days without a login", "title": "Rightmove Plus help: alerts",
              "url": "https://…", "read": "2026-10-14" }],
  "capabilities": [{ "id": "K1", "title": "Save a search", "gaps": ["G1"], "values": { "us": "no", "c1": "yes" } }],
  "trends": [{ "id": "t1", "title": "…", "url": "https://…", "date": "2026-05", "source": "Nielsen Norman Group", "kind": "ux", "takeaway": "…" },
             { "id": "t2", "title": "…", "url": "https://…", "date": "2026-08", "source": "Mobbin", "kind": "visual", "takeaway": "…" }],
  "fresh": [{ "id": "f1", "title": "Each saved search as a card with its new matches as photos", "what": "…",
              "size": "layout", "impact": "high", "effort": "M", "gaps": ["G2"], "seen_at": ["c1", "F1"],
              "lands": "Saved searches page", "refs": ["m1", "t2"] }],
  "decisions": [{ "date": "2026-10-14", "what": "Shortlisted Rightmove Plus, Linear, Zillow", "why": "best fit on T1–T3" }],
  "rounds": []
}
```

`qa/board.mjs` and `qa/prototype.mjs` hold it to everything above (`qa/research.mjs`): the
depth's counts; every gap answered or said to have no evidence; every competitor scored on
every trait, the shortlist approved; wide queries of 1–3 words and deep ones naming their
app; flows of 2–5 positioned, captioned steps; rules with their source and date; a matrix
with no blank; findings ranked high first, each with its impact, effort, gaps, seen-at and
landing; two recent trends, one visual; the decisions log; and the board no older than the
json.

## A change request: a round

After gate 1, "redesign X" or "change Y" is researched again for that part only:
- one or two Mobbin searches (wide, then the app by name);
- a round appended to `rounds`: `{ "asked": "Make the filters lighter", "date": "2026-10-20", "refs": ["m9", "m10"], "options": ["opt.filters"] }`;
- the new references added to `mobbin`.

Draw 2–3 variants as flow.json `options` in the chosen direction, each drawing what its
references show, and rebuild the board and the prototype. The PM flips them live.
