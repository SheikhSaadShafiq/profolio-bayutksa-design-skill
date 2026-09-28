# The design system — atoms, molecules, organisms — and the kit that cuts it

The deliverable is one self-contained HTML file, and the way it gets used is
that somebody carves components out of it. Until now that meant: find a class in
an 852KB page, find its rules somewhere in a 180KB stylesheet, then chase every
`var(--x)` back through a 770-line `:root` by hand. 119 `pf-` classes in the
pages, 179 component docs in `kb/design/components/`, and nothing mapping one to
the other.

`npm run components` does the carving. For every section of
`deliverables/components.html` — the only authority on which classes belong to
which component, and the one `check.mjs` already holds every page to — it writes
a standalone page carrying that component and nothing else:

- every rule in `profolio.css` whose selector names one of its classes, in
  source order, with the provenance comment above each one intact
- every custom property those rules reach **transitively**, resolved against
  `:root` and emitted in `:root`'s own order, so the grouping its comments
  establish survives
- the eleven classless base rules — the reset and the element defaults
- the `@media` rules that apply to it, still inside their query
- the `@keyframes` it animates with
- the sprite symbols its states `<use>`, and no others
- its own states, with their labels, and the source citation and open questions
  the catalogue records for it

The page chrome is in a `<style data-chrome>` block and `x-` classes, both
marked: delete them and what is left is the component.

**38 of 39 sections** come out. The one skipped is `prototype layer`, which
documents `data-open` / `data-panel` / `data-state-set` — attributes, not
classes, with nothing in the stylesheet to cut.

## Why there is a checker, and what it caught

Deciding which rules a component needs by looking at which selectors name its
classes is a guess dressed as a rule. It is wrong in exactly one way that
matters: a component can be styled by a selector that never mentions its class.
Cut on class names alone and the component looks right in the catalogue and
falls apart on its own.

So `npm run qa-components` renders both — the same specimen in
`components.html` and in `components/<id>.html` — walks them in document order,
and compares every element's box and twenty-one computed properties. It went
**12 → 38 of 38 identical**, and every step was a real defect:

| what the checker said | what was actually wrong |
|---|---|
| an icon measured **300×150** instead of 20×20 | `:root` puts eight tokens on one line — `--sp-0:0px;  --sp-2:2px;  --sp-8:8px; …` — and a line-wise parse kept only the first of each. `width:var(--sp-20)` resolved to nothing, so the SVG fell back to its intrinsic size. |
| a tag rendered white-on-transparent | selectors were **truncated**: the rule's start was derived from the *trimmed* selector's length, so `.pf-tag[data-tone="hot"]      {` lost as many leading characters as it had trailing spaces and shipped as `g[data-tone="hot"]`, matching nothing. |
| every card lost its **border** | the `max-width:991px` rules were emitted twice — once inside their `@media` and once in the unconditional cascade, so the mobile `border:0` applied at every width. |
| fifteen sections produced **no file at all** | the specimen reader was a lazy regex. Ten sections write `class="cat-item cat-fill"`, which a pattern demanding the closing quote never matched; five more contain a `<section class="pf-card">`, which ended the section match early. |
| one component came out **2.8MB** | the comment back-up was `/\/\*[\s\S]*?\*\/\s*$/` over the whole prefix. Its lazy middle backtracked across every comment in the file until one could reach the end, so a single "rule" arrived carrying tens of kilobytes of unrelated stylesheet. A scan cannot run away; a backtracking match can. |
| six components measured **narrower** than the catalogue | the extracted stage has to reproduce `.cat-stage` exactly, and did not: the wrong column width, a missing `cat-fill`, a dropped `data-wide` (the tag was rebuilt from the class attribute alone), a plain label where the catalogue letter-spaces an uppercase one, and a `.cat-stage .pf-spin` staging rule nobody had carried. |
| `spin` reported **eleven** differences | not a defect at all. `.pf-spin-dot` is a 27px square on a 1.2s linear rotate, and `getBoundingClientRect` returns the *rotated* box — 38 at 45°, 27 at 0. The two pages were caught at different moments of the same animation. Both sides now have motion frozen before measuring. |

The comparison is only fair while `.x-stage` matches `.cat-stage`. If that stops
being true the checker reports every component as broken — which is the right
failure, because it means the two pages are no longer showing the same thing.

## What it cannot cut, and why that matters

`data/components.json` records **228 `pf-` classes that no catalogue section
demonstrates** — `pf-agency*`, `pf-avatar-pct`, `pf-donut`, `pf-timeline`,
`pf-wsection`, the whole settings and reports vocabulary. They are defined in
the stylesheet and used by the nine pages built in the last two passes, and
none of them were ever added to `components.html`.

That is the real limit of this kit: it can only cut out what the catalogue
demonstrates, and the catalogue covers 287 of the 515 classes the stylesheet
defines. Cataloguing those 228 is what turns the other nine pages' vocabulary
into liftable components — and `check.mjs` already enforces the rule that makes
it safe to do, since a page may only use classes the catalogue defines.

## Known, and inherited

These files carry across whatever is still wrong in the pages they were cut
from. Two things are known wrong right now and are not this kit's to fix:
`deliverables/dashboard.html` draws 120 upgrade circles the product does not
draw at all, and four page bodies (Reports ×3, LMS Leads) sit at 41–48% of the
product's node count. A component lifted out of either is lifted out of
something that does not match the product yet.


## The design system itself

`deliverables/design-system.html` is the one document: 792KB, self-contained,
no network. Three tiers, every component showing its states live, what it is
made of, where it is used, and the exact CSS to lift.

**The tiers are not derived — they are yours.** `canvas/` holds three files,
Atoms, Molecules and Organisms, and their section headings are this system's
own classification:

| tier | n | components |
|---|---|---|
| Atoms | 12 | button · tag · status · avatar · badge · ring · spin · tile · seg · divider · tooltip · header-action |
| Molecules | 12 | stat · inline · metric · meter · plan · chip · switcher · listing · date · pager · action · applied |
| Organisms | 13 | layout · header · rail · card · alert · chart · table · tabs · filter · modal · drawer · popover · empty |
| Not in the canvas | 1 | feedback |

The join from canvas section to component is written down in
`scripts/extract-components.mjs`, each entry citing the heading it came from,
because the canvas names no classes and nothing can infer it.

**Deriving the tiers was tried first, twice, and rejected both times.** Nesting
depth — a component is an atom if it contains no other component, a molecule if
it contains atoms, an organism if it contains molecules — reads well and gives
the wrong answer. Measured off the catalogue specimens it files `drawer` and
`pager` as atoms. Measured off the eleven real page DOMs it does worse: the
sidebar, the modal, the drawer and the popover all come out atoms, because a
page capture records the default state and an overlay's interior is not in it.
The depth is still recorded, per component, as the "made of" line — it is good
evidence and a bad classifier.

Two places where our component is **coarser than its canvas section**, recorded
rather than smoothed over: `filter` owns the text input, the select and the
label that the canvas lists as three separate atoms, and `tabs` owns the card
its tab strip sits in. Both are the honest reading of a catalogue that grew
page by page.

`qa-components.mjs` holds the design system to the same standard as the
per-component files — **38 of 38 render identically to the catalogue** — with
one allowance it has to make: the page has a sidebar, so its column is narrower
and a component told to fill it correctly fills less, and text inside it wraps.
Where the two columns differ the check compares the computed styles rather than
the geometry, which is where a missing rule shows up whatever the width.
