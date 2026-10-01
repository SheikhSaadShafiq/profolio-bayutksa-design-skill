# Check catalogue

Every check has a stable id. Ids are permanent — a retired check keeps its id
and is marked retired, so historical reports stay readable.

Columns: **id** · what it tests · default severity · whether it needs a
rendered page.

---

## cov — coverage

The design exists for every case the registry declares.

| id | test | sev | render |
|---|---|---|---|
| `cov.state` | every state in `registry[page].states` has a rendered block | blocker | no |
| `cov.empty` | an empty state exists, regardless of whether the registry declares one | blocker | no |
| `cov.role` | every role in `registry[page].roles` is represented, or declared identical | warning | no |
| `cov.flag` | every flag gating this surface has both on and off rendered | blocker | no |
| `cov.platform` | every platform in scope has the screen | blocker | no |
| `cov.locale` | every locale in scope has the screen or an explicit deferral | warning | no |

`cov.empty` is separate from `cov.state` on purpose. The empty state is the
single most commonly missing piece of a design, and PRDs almost never mention
it. Failing it independently makes the omission visible rather than folding it
into a generic state count.

---

## tok — tokens

Appearance comes from the token sheet and nowhere else.

| id | test | sev | render |
|---|---|---|---|
| `tok.inline` | zero `style=` attributes in any screen | blocker | no |
| `tok.hex` | no hex or `rgb()` outside the token sheet's `:root` | blocker | no |
| `tok.px` | no px literal in a declaration outside `:root` (media queries excepted — custom properties are not valid there) | warning | no |
| `tok.resolve` | every `var(--x)` referenced is defined | blocker | no |
| `tok.orphan` | every token defined is used somewhere | note | no |
| `tok.provenance` | every token carries `[src]`, `[live]`, `[px]` or `[TBC]` | warning | no |
| `tok.tbc` | count of `[TBC]` tokens still open | note | no |
| `tok.class` | every class used on a screen exists in the token sheet | blocker | no |

`tok.px` is a warning rather than a blocker because media query conditions
genuinely cannot use custom properties. Flag them, expect a small number, and
investigate if the count grows.

---

## cpy — copy

| id | test | sev | render |
|---|---|---|---|
| `cpy.verbatim` | every visible string matches `product/copy.md` exactly, including casing and punctuation | blocker | no |
| `cpy.missing` | every English string has an Arabic counterpart, or an explicit deferral | warning | no |
| `cpy.placeholder` | no lorem, no `TODO`, no `TBC` in user-visible text | blocker | no |
| `cpy.prd_conflict` | strings that differ between the PRD and the shipped product | warning | no |

`cpy.prd_conflict` is a warning, not a blocker, because the shipped string
always wins — but the conflict needs surfacing. The known example: a PRD
saying "Request an Ad License" against a shipped "Get an Ad License". Only a
copy-layer check finds this.

---

## flw — flows

| id | test | sev | render |
|---|---|---|---|
| `flw.node` | every transition names a node id that still exists | blocker | no |
| `flw.reach` | every screen is reachable from the entry screen | blocker | no |
| `flw.back` | every screen has a route back | blocker | no |
| `flw.dismiss` | every modal, drawer and sheet has a dismiss control | blocker | no |
| `flw.orphan` | screens in the registry that no flow references | warning | no |
| `flw.dead` | transitions to screens that do not exist | blocker | no |

---

## par — parity

Only runs when more than one platform is in scope. Platforms are whatever the
registry declares — web, ios, android, tablet, desktop, watch. Nothing here
assumes two, or assumes which two.

| id | test | sev | render |
|---|---|---|---|
| `par.states` | paired screens declare the same state set | warning | no |
| `par.copy` | paired screens show the same strings | warning | no |
| `par.actions` | paired screens offer the same actions | warning | no |
| `par.undeclared` | a screen present on one platform, absent on another, with no entry in `unpaired` | warning | no |

Differences between platforms are normal and often correct — a sheet on touch
is a modal on desktop. The check is not "these must match", it is "an
unexplained difference is a bug until someone says otherwise". Declaring it in
`unpaired` with a reason clears it.

Platform minimums (hit target, safe areas, gesture thresholds) come from
`platforms.json`, not from this skill. A skill that hardcodes 44px has decided
you are building for one OS.

---

## rtl — right to left

Only runs when `ar` is in scope.

| id | test | sev | render |
|---|---|---|---|
| `rtl.physical` | `left`/`right`/`margin-left` etc. where a logical property belongs | blocker | no |
| `rtl.dir` | the screen sets `dir` correctly | blocker | no |
| `rtl.icon` | directional icons (arrows, chevrons) flagged for mirroring review | note | no |
| `rtl.number` | numerals and currency direction | warning | no |

---

## a11y — accessibility

| id | test | sev | render |
|---|---|---|---|
| `a11y.contrast.body` | body text ≥ 4.5:1 | blocker | partial |
| `a11y.contrast.large` | large text ≥ 3:1 | blocker | partial |
| `a11y.contrast.ui` | control borders and icons ≥ 3:1 | warning | partial |
| `a11y.target` | hit area meets the platform's minimum (the box drawn around a field, or the padded cell around a tab, counts as its hit area) | blocker | yes |
| `a11y.gap` | adjacent controls ≥ 8px apart | warning | yes |
| `a11y.label` | every control has an accessible name | blocker | no |
| `a11y.alt` | every image has alt, or is marked decorative | blocker | no |
| `a11y.focus` | focus order follows visual order | warning | yes |
| `a11y.focusring` | focus is visible on every interactive element | blocker | yes |
| `a11y.heading` | heading levels descend without skipping | warning | no |

Contrast is "partial" because it can be computed statically from tokens for
simple cases, but needs rendering wherever a colour sits on an image, a
gradient, or a translucent surface.

---

## ovf — content extremes

Needs rendering. The highest-yield family.

| id | test | sev | render |
|---|---|---|---|
| `ovf.long` | 200-char string does not break layout | blocker | yes |
| `ovf.longest_real` | longest real value from copy fits | blocker | yes |
| `ovf.empty_string` | empty value does not collapse the container | warning | yes |
| `ovf.single_char` | one character does not misalign | note | yes |
| `ovf.zero` | `0` renders correctly where a count is expected | warning | yes |
| `ovf.big_number` | `999,999,999` does not overflow | blocker | yes |
| `ovf.negative` | negative values render | note | yes |
| `ovf.no_image` | missing image does not break the row | warning | yes |
| `ovf.null_date` | null date does not print `Invalid Date` | blocker | yes |
| `ovf.arabic` | Arabic equivalent of the longest string fits | blocker | yes |

Arabic is called out separately because Arabic strings are routinely longer
than their English source and the failure is invisible in an English-only pass.

---

## brk — breakpoints

| id | test | sev | render |
|---|---|---|---|
| `brk.render` | renders without horizontal overflow at each declared width | blocker | yes |
| `brk.canonical` | every breakpoint value used is in the canonical set | warning | no |
| `brk.gap` | no width range falls between two breakpoints unhandled | warning | yes |

`brk.canonical` exists to force a decision. A codebase carrying 991/992,
767/768, 575/576 and 479/480 simultaneously has four off-by-one pairs, and
each one is a one-pixel window where the layout is undefined. The check fails
on any value not in the declared canonical set, which makes the cleanup
unavoidable rather than perpetual.

---

## mot — motion

| id | test | sev | render |
|---|---|---|---|
| `mot.reduced` | `prefers-reduced-motion` disables animation | blocker | yes |
| `mot.budget` | no animation exceeds the declared duration budget | warning | yes |
| `mot.infinite` | no unbounded infinite animation outside loaders | warning | no |

---

## lay — layout

Measured on the render, in the first place a person would see the problem.

| id | test | sev | render |
|---|---|---|---|
| `lay.align` | a column header lines up with its cells, on the edge the column aligns on (> 2px off fails) | blocker | yes |
| `lay.controls` | buttons in one table column share a height (> 4px off fails) | blocker | yes |
| `lay.squashed` | a button is at least 1.6 × its label's size tall, and 24px | blocker | yes |
| `lay.spacing` | a button's label is one flex item, not one per word | blocker | yes |
| `lay.overlap` | no two pieces of visible text overlap, line by line | blocker | yes |
| `lay.clip` | no text is cut by its box without an ellipsis | blocker | yes |
| `lay.rows` | cells of one row share one vertical alignment | warning | yes |

The column's edge comes from its cells' own CSS (`justify-content`, then
`text-align`, RTL-aware), never from text widths, which differ by font.

---

## int — interaction

The render pass clicks every control that opens something (`aria-haspopup`,
`aria-expanded`, `aria-controls`, `details > summary`, `popovertarget`) and
checks what appears. A control that goes to another screen is a link and is
left out; a tab switches a panel and is left out.

| id | test | sev | render |
|---|---|---|---|
| `int.dead` | the control opens something | warning | yes |
| `int.offscreen` | what it opens is at least 95% inside the viewport | blocker | yes |
| `int.clip` | what it opens is not cut by a container that clips it | blocker | yes |
| `int.unstyled` | its text is not in the browser's default serif | blocker | yes |

These exist because a screen can pass every check at load and break the
moment someone opens its menu.

---

## res — resources

| id | test | sev | render |
|---|---|---|---|
| `res.font` | every web font the visible text uses has an @font-face, and loaded | blocker | yes |
| `res.image` | every visible image loaded | blocker | yes |

---

## More render checks

| id | test | sev | render |
|---|---|---|---|
| `cpy.undefined` | no value renders as `undefined`, `NaN`, `null`, `[object Object]` or `Invalid Date` | blocker | yes |
| `a11y.small` | no visible text under 11px | warning | yes |
| `a11y.contrast.ui` | a field shown only by its border has a 3:1 edge (WCAG 1.4.11) | warning | yes |
| `a11y.zoom` | at 200% (half the CSS width) nothing overlaps, clips or scrolls sideways (WCAG 1.4.4) | blocker | yes |
| `a11y.spacing` | with WCAG's text spacing (line 1.5, letters 0.12em, words 0.16em, paragraphs 2em) nothing overlaps or clips (WCAG 1.4.12) | blocker | yes |
| `a11y.orientation` | a phone screen works in landscape (WCAG 1.3.4) | blocker | yes |
| `a11y.focusobscured` | the element with keyboard focus is not entirely hidden behind something drawn over it (WCAG 2.4.11) | blocker | yes |
| `rtl.layout` | with `dir="rtl"`, nothing overlaps, clips or scrolls sideways: the layout mirrors | blocker | yes |
| `qa.waiver` | a waiver that names no node, CSS path or screen is ignored, and reported | warning | no |

`a11y.target` measures against the platform's minimum. On the web minimum
(24px, WCAG 2.5.8) a smaller target still passes under WCAG's spacing
exception: a 24px circle centred on it meets no other target. A native
platform's minimum (44pt, 48dp) has no exception.

The static `a11y.alt`, `a11y.label`, `a11y.heading` and `rtl.dir` read each
screen's markup.

Retired before they ever reported: `a11y.target.mobile` and `a11y.target.web`
(1.0.x listed them as skipped). The check is `a11y.target`, measured against
the platform's own minimum.

---

## Manual checks

In `assets/checklist.md`. These do not automate and pretending otherwise
produces a green report on a bad design:

- Does the empty state say what to do next, or only that there is nothing here?
- Does the error state offer a recovery path?
- Is the loading state honest about what is loading?
- Does visual hierarchy match task priority?
- Is the copy in the product's voice?
- Would a first-time user know where to start?

Recorded against node ids, same output shape as automated findings, so the
gate reads one file.
