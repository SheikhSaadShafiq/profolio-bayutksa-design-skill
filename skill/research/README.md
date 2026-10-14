# Research — before any direction

A design that starts from the product alone comes out ordinary. Before the directions, look at
who already does this job well, what the best products' screens actually show (Mobbin), and
what is current (recent articles), and turn it into specific fresh moves the directions draw.
This file is the method; `qa/board.mjs` turns its output into the board a PM reads.

## When

- **Every new or changed UI**: a new page, a new section, a redesign, "make this better". It
  runs before the directions (SKILL.md → THE FLOW, step 2).
- **Every change request after gate 1** ("redesign the filters", "change the header"): again,
  for that part only (a round, below).
- **Not** for a small fix: copy, a bug, a token value, one state the product already draws.

## The steps

1. **The job, in one line**: who, what they are trying to do, what makes it hard. Split it into
   the screens and the journeys it needs.
2. **Competitors.** From `competitors.md`, take the ones that do this job, and add the
   feature-specific ones you find. The plan names **at least one per group** (ksa, regional,
   saas, bayut), six or more in all. For each, say why it matters for this feature, and what
   it does for this job, only from what you saw or opened.
3. **Mobbin** (its connector: `search_flows`, `search_screens`, `search_sections`):
   - `search_flows` for each multi-step journey (limit 3–5), `search_screens` for each key
     screen (limit 6–8, mode `standard`). Platform `web` (`ios` for a phone-only question).
   - One screen or journey per query, in plain words. Name a competitor to see its version
     ("Stripe billing balance with top-up", "HubSpot lead record activity timeline"). No style
     words, no negations.
   - Use the same `task_intent` and `output_destination: "code"` on every call of one design.
   - Look at every image before you use it. Keep at least six references from at least three
     products. Record each one's `mobbin_url`, what to borrow, and what to avoid.
   - Save each kept image from its `image_url` to `research/img/<id>.webp` (or .png/.jpg) when
     the network allows (`curl -sL -o …`), so the board shows it: the links expire in 30 days.
     Where it cannot be saved, the board shows the link.
   - **Mobbin not connected:** say so to the user, set `mobbin_unavailable` to why, and take
     six or more references from the web (product pages, help centres, design galleries) into
     `web`.
4. **Trends.** Search the web for articles from the last 12–18 months on the pattern and the
   product type ("B2B analytics dashboard design 2026", "lead inbox UX"). Keep at least two:
   title, url, date, source, and the one takeaway that applies. Prefer practitioners (Nielsen
   Norman Group, Smashing, Mobbin, product teams' design blogs) to listicles.
5. **Fresh moves.** At least three specific moves that make this design better than the
   ordinary version, each traced to references. "The report opens on one line saying what
   changed this week, the biggest change linked" is a move. "A modern, clean dashboard" is not.
6. **The directions** take them (SKILL.md → THE FLOW, step 3):
   - **A**, existing components only, needs none.
   - **B**, competitor-led, draws at least one.
   - **C**, bold, draws at least two.

   Each direction marks the element that draws a move with `data-pf-fresh="<id>"`.
7. **The board.** Write `research/research.json`, then `node qa/board.mjs designs/<feature>`.
   Publish `research/board.html` as its own artifact. Put its link in flow.json
   `research.board_url`, so the prototype's "Research board" opens it.

## research/research.json

```json
{
  "feature": "Agency Report",
  "question": "An agency owner sees which agents bring leads and spend credits, and acts on it",
  "made": "2026-10-14",
  "competitors": [
    { "id": "c1", "name": "Property Finder PF Expert (UAE)", "group": "regional", "url": "https://www.propertyfinder.ae/partnerhub/pf-expert/",
      "why": "the closest agency dashboard in the region", "does": "performance analytics beside listings and leads, upgrade suggestions by credits" }
  ],
  "mobbin": [
    { "id": "m1", "app": "Stripe", "kind": "screen", "title": "Balance overview", "url": "https://mobbin.com/…", "image": "img/m1.webp",
      "borrow": "the period comparison sits beside each number", "avoid": "seven tabs of reports: one is enough here" }
  ],
  "mobbin_unavailable": null,
  "web": [],
  "trends": [
    { "id": "t1", "title": "…", "url": "https://…", "date": "2026-05", "source": "Nielsen Norman Group", "takeaway": "…" }
  ],
  "fresh": [
    { "id": "f1", "title": "A one-line summary above the table", "what": "…", "refs": ["m1", "t1"] }
  ],
  "rounds": []
}
```

The QA (`qa/prototype.mjs`) holds it to the rules above:
- competitors from every group;
- six references from three products, Mobbin's cited by their `mobbin_url`;
- two trends, with dates;
- three fresh moves, each with real references;
- every move a direction lists drawn on its screens;
- the board no older than the json.

## A change request: a round

After gate 1, "redesign X" or "change Y" is researched again for that part:
- one or two Mobbin searches;
- a round appended to `rounds`: `{ "asked": "Make the filters lighter", "date": "2026-10-20", "refs": ["m9", "m10"], "options": ["opt.filters"] }`;
- the new references added to `mobbin`.

Draw 2–3 variants as flow.json `options` in the chosen direction, each drawing what its
references show, and rebuild the board and the prototype. The PM flips them live.
