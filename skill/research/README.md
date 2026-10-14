# Research — before any direction

A design that starts from the product alone comes out ordinary. Before the directions, look at
who already does this job well, what the best products' screens actually show (Mobbin), and
what is current (recent articles), and turn it into specific fresh moves the directions draw.
This file is the method; `qa/board.mjs` turns its output into the board a PM reads.

Everything goes in `designs/<feature>/research/`: `research.json`, `img/`, and the built
`board.html`.

## When

- **Every new or changed UI**: a new page, a new section, a redesign, "make this better". It
  runs before the plan and the directions (SKILL.md → THE FLOW, step 2).
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
   - **Where you saw it.** The site itself is best. Many portals block a fetch (403) or sit
     behind a login: then take its App Store page, its help centre, press coverage, Mobbin, or a
     search engine's summary, and say which in `seen` (`app-store`, `help-centre`, `press`,
     `mobbin`, `search-summary`). The board shows it. Never describe what no source showed.
   - **A group with nothing for this job.** Searched and found no one: record it, with what you
     searched, `{ "group": "ksa", "none": "Aqar, Wasalt, PF Saudi: no agency credit wallet" }`.
     It fills the group, and is not one of the six.
3. **Mobbin** (its connector: `search_flows`, `search_screens`, `search_sections`), in two passes.
   A query that describes a layout finds that layout: "a table of leads with filters and an
   unlock button" returns six contact tables, and the design comes out ordinary. Search for the
   **thing**, not the screen you already imagine (measured 2026-10-14).
   - **Wide, first: eight or more queries of 1–3 words**, each naming the job, the object or the
     moment: "lead marketplace", "credit wallet", "unlock contact", "match score",
     "opportunity card", "property card", "leaderboard". `search_screens`, mode
     `deep` (the default: it ranks short queries far better than `standard`), limit 8.
     Platform `web` (`ios` for a phone-only question). A word that names a feeling ("urgency"),
     a quality ("modern") or an abstract idea ("spots left") returns noise: use nouns.
   - **Deep, second: the best apps by name**, 2–6 words: "Mercor explore opportunities",
     "beehiiv boosts marketplace". `search_flows` for a journey (limit 3–5).
   - Use the same `task_intent` and `output_destination: "code"` on every call of one design.
   - Record every query in `queries`, with its pass and the references it gave you (`kept`).
   - Look at every image before you use it. Keep at least six references from at least three
     products, and favour the ones whose **layout or visual idea** is new to the product, not
     only a detail. Record each one's `mobbin_url`, what to borrow, and what to avoid.
   - Save each kept image from its `image_url` to `research/img/<id>.webp` (or .png/.jpg) when
     the network allows (`curl -sL -o …`), so the board shows it: the links expire in 30 days.
     Where it cannot be saved, the board shows the link.
   - **A flow's frames.** `search_flows` previews only some of a flow's screens, evenly spaced,
     while its result lists every screen by position. Which `image_url` is the preview you liked
     is a guess: save the candidates and look at each before keeping one. For a single frame,
     `search_screens` is simpler.
   - **Mobbin not connected:** say so to the user, set `mobbin_unavailable` to why, and take
     six or more references from the web (product pages, help centres, design galleries) into
     `web`, each with the same fields.
4. **Trends**, two kinds, at least two from the last 18 months:
   - **ux**: articles on the pattern and the product type ("B2B analytics dashboard design
     2026", "lead inbox UX"). Prefer practitioners (Nielsen Norman Group, Smashing, product
     teams' design blogs) to listicles.
   - **visual**, at least one: what the best products look like now. Mobbin's newest apps for
     the job, a design team's write-up of a redesign, a showcase (Dribbble, Behance, Awwwards,
     a product's own design blog) for the product type ("real estate dashboard 2026", "SaaS
     marketplace cards"). Its takeaway names a visual idea: card density, a hero number,
     data shown as shapes, a colour used for one meaning only.

   Each: title, url, date (`YYYY-MM`, or `YYYY` when the page gives only the year), source,
   kind, and the one takeaway that applies.
5. **Fresh moves.** At least three specific moves that make this design better than the
   ordinary version, each traced to references, each with its **size**:
   - `layout`: the screen is organised differently. "Leads as a grid of cards, each a small
     page: the requirement as its title, the match score as a ring, the agencies that unlocked
     it as faces";
   - `hero`: what is read first changes. "The match score, large, on the card's edge, before
     the price";
   - `language`: the look changes. "Scarcity in one colour, used for nothing else";
   - `detail`: a small addition. "A count beside each filter".

   At least two moves are layout, hero or language: a detail added to the product's screen is
   still the product's screen. "A modern, clean dashboard" is no move at all.
6. **The plan**, then **the directions** take them (SKILL.md → THE FLOW, step 3):
   - **A**, existing components only, needs none.
   - **B**, competitor-led, draws at least one, and one of its moves is layout or hero.
   - **C**, bold, draws at least two, one of them layout or hero, and never A's layout.

   Each direction declares its `layout` and its `hero` in flow.json (kit/README.md →
   directions).

   Each direction marks the element that draws a move with `data-pf-fresh="<id>"`.
7. **The board.** Run `node qa/board.mjs designs/<feature>` after writing `research.json`, and
   again once flow.json has its directions (the board shows them). Publish
   `research/board.html` as its own artifact, and put its link in flow.json
   `research.board_url`, so the prototype's "Research board" opens it.

## designs/&lt;feature&gt;/research/research.json

An example for a saved-searches feature (the shape only: your feature's own content):

```json
{
  "feature": "Saved searches",
  "question": "An agent saves a buyer's search and hears when a matching listing goes live",
  "made": "2026-10-14",
  "competitors": [
    { "id": "c1", "name": "Rightmove Plus", "group": "regional", "url": "https://www.rightmove.co.uk/…",
      "why": "agents already track buyers' wants here", "does": "a saved search per applicant, matches e-mailed daily" },
    { "id": "c2", "name": "Aqar", "group": "ksa", "url": "https://apps.apple.com/…", "seen": "app-store",
      "why": "the KSA portal agents use most", "does": "saved searches with push alerts, from its store screenshots" },
    { "group": "bayut", "none": "Bayut UAE and dubizzle agent tools: no saved search for agents" }
  ],
  "mobbin": [
    { "id": "m1", "app": "Linear", "kind": "screen", "title": "Saved views", "url": "https://mobbin.com/…", "image": "img/m1.webp",
      "borrow": "a view's name and its filter chips on one line", "avoid": "a sidebar of twenty views: five is plenty here" }
  ],
  "mobbin_unavailable": null,
  "queries": [
    { "q": "saved search", "pass": "wide", "tool": "screens", "mode": "deep", "kept": ["m1"] },
    { "q": "search alerts", "pass": "wide", "tool": "screens", "mode": "deep", "kept": [] },
    { "q": "Linear saved views", "pass": "deep", "tool": "flows", "kept": ["m1"] }
  ],
  "web": [
    { "id": "w1", "app": "Zillow Premier Agent", "kind": "help page", "title": "Saved search alerts", "url": "https://…", "image": "img/w1.png",
      "borrow": "the alert frequency chosen in the save dialog", "avoid": "a separate settings page for it" }
  ],
  "trends": [
    { "id": "t1", "title": "…", "url": "https://…", "date": "2026-05", "source": "Nielsen Norman Group", "kind": "ux", "takeaway": "…" },
    { "id": "t2", "title": "…", "url": "https://…", "date": "2026-08", "source": "Mobbin", "kind": "visual", "takeaway": "…" }
  ],
  "fresh": [
    { "id": "f1", "title": "Each saved search as a card with its new matches as photos", "size": "layout", "what": "…", "refs": ["m1", "c1"] }
  ],
  "rounds": []
}
```

The QA (`qa/prototype.mjs`) holds it to the rules above:
- competitors from every group (or a `none` entry saying what was searched), each with a url
  and, when not the site itself, where it was `seen`;
- eight wide Mobbin queries of 1–3 words, recorded (a longer wide query fails);
- six references from three products, Mobbin's cited by their `mobbin_url`;
- two trends from the last 18 months, one of them visual;
- three fresh moves, each with real references and its size, two of them layout, hero or
  language;
- every move a direction lists drawn on its screens;
- the board no older than the json.

## A change request: a round

After gate 1, "redesign X" or "change Y" is researched again for that part:
- one or two Mobbin searches;
- a round appended to `rounds`: `{ "asked": "Make the filters lighter", "date": "2026-10-20", "refs": ["m9", "m10"], "options": ["opt.filters"] }`;
- the new references added to `mobbin`.

Draw 2–3 variants as flow.json `options` in the chosen direction, each drawing what its
references show, and rebuild the board and the prototype. The PM flips them live.
