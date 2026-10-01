# WCAG 2.2 at level AA, for a design

The criteria a design can pass or fail, in plain words, with their level and
how to check each: **measure** on the render (design-qa's check id, where it has one), or
**judge**. Level A and AA together. Criteria that only concern code (parsing,
for example) are left out.

## Perceivable

| SC | level | the design must | check |
|---|---|---|---|
| 1.1.1 | A | give every meaningful image a text alternative, and mark decorative ones as such | judge |
| 1.2.1–1.2.5 | A, AA (1.2.4, 1.2.5) | caption video, and describe or transcribe audio and video content | judge |
| 1.3.1 | A | show structure in a way code can carry: headings, lists, tables, labelled groups | judge |
| 1.3.2 | A | keep a reading order that makes sense | judge |
| 1.3.3 | A | never rely only on shape, position or sound ("press the round button") | judge |
| 1.3.4 | AA | work in portrait and landscape | measure, `a11y.orientation` |
| 1.3.5 | AA | say what personal-data fields are for (autocomplete) | judge |
| 1.4.1 | A | never use colour as the only signal | judge |
| 1.4.2 | A | let people stop or turn down audio that plays on its own | judge |
| 1.4.3 | AA | give text 4.5:1 contrast, or 3:1 when large | measure, `a11y.contrast.body`, `a11y.contrast.large` |
| 1.4.4 | AA | let text grow to 200% without loss | measure, `a11y.zoom` |
| 1.4.5 | AA | use real text, not pictures of text | judge |
| 1.4.10 | AA | reflow at 320 CSS px wide without scrolling both ways | measure, `brk.render` at 320 |
| 1.4.11 | AA | give controls' edges, focus indicators and meaningful graphics 3:1 | measure, `a11y.contrast.ui` |
| 1.4.12 | AA | survive wider letter, word, line and paragraph spacing | measure, `a11y.spacing` |
| 1.4.13 | AA | let content shown on hover or focus be dismissed, hovered and kept | judge |

## Operable

| SC | level | the design must | check |
|---|---|---|---|
| 2.1.1 | A | do everything by keyboard | judge, and the Tab pass |
| 2.1.2 | A | never trap keyboard focus | judge |
| 2.1.4 | A | let single-key shortcuts be turned off or remapped | judge |
| 2.2.1 | A | let people extend a time limit | judge |
| 2.2.2 | A | let people pause anything that moves, blinks or updates on its own | judge, `mot.infinite` |
| 2.3.1 | A | flash no more than three times a second | judge |
| 2.4.1 | A | let people skip repeated blocks (a skip link, landmarks) | judge |
| 2.4.2 | A | give every page a title that says what it is | judge |
| 2.4.3 | A | keep a focus order that preserves meaning | judge, `a11y.focus` |
| 2.4.4 | A | make each link's purpose clear from its text, or its context | judge |
| 2.4.5 | AA | offer more than one way to reach a page | judge |
| 2.4.6 | AA | write headings and labels that describe | judge |
| 2.4.7 | AA | show where focus is | measure, `a11y.focusring` |
| 2.4.11 | AA | never hide the focused element entirely behind sticky content | measure, `a11y.focusobscured` |
| 2.5.1 | A | give every multi-finger or path gesture a single-pointer way | judge |
| 2.5.2 | A | act on release, not on press, or let it be undone | judge |
| 2.5.3 | A | include the visible label in the accessible name | judge |
| 2.5.4 | A | give motion-triggered actions a control, and a way to turn them off | judge |
| 2.5.7 | AA | give every drag a way that does not need dragging | judge |
| 2.5.8 | AA | make targets at least 24 × 24 CSS px, or spaced so | measure, `a11y.target` (with the spacing exception, on the web minimum) |

## Understandable

| SC | level | the design must | check |
|---|---|---|---|
| 3.1.1 | A | declare the page's language | judge |
| 3.1.2 | AA | mark a passage in another language | judge |
| 3.2.1–3.2.2 | A | not change context on focus, or on input without warning | judge |
| 3.2.3 | AA | keep navigation in the same place and order across pages | judge |
| 3.2.4 | AA | name the same things the same way across pages | judge |
| 3.2.6 | A | keep help (contact, chat) in the same place across pages | judge |
| 3.3.1 | A | identify an error in text | judge |
| 3.3.2 | A | give labels or instructions for input | judge |
| 3.3.3 | AA | suggest how to fix an error, when it is known | judge |
| 3.3.4 | AA | let people check, correct or reverse legal, financial and data submissions | judge |
| 3.3.7 | A | not ask for the same information twice in one process | judge |
| 3.3.8 | AA | let people sign in without a memory or puzzle test (allow paste, password managers) | judge |

## Robust

| SC | level | the design must | check |
|---|---|---|---|
| 4.1.2 | A | give every control a name, a role and its state | judge, annotate |
| 4.1.3 | AA | announce status messages without moving focus (a toast, "3 results") | judge, annotate as a live region |
