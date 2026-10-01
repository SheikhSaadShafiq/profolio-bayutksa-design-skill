---
name: "design-accessibility"
description: Make a design accessible to WCAG 2.2 AA, or the product's own stated target — contrast, text size and reflow, focus order and visibility, keyboard paths, names and roles for screen readers, headings and landmarks, target size, motion and flashing, language and right-to-left, errors and status messages announced — and write both the fixes and the annotations engineering needs (roles, names, states, focus management, live regions). Use when designing or reviewing any screen; whenever someone asks whether a design is accessible, or about contrast, screen readers, keyboard use, focus, captions, WCAG or the European Accessibility Act; and before a design is handed over. Measures on the render where it can (it uses design-qa's render pass) and judges the rest criterion by criterion. Works for any product and platform, inside its context card.
version: '1.0.0'
---

# Design accessibility

Check every success criterion a design can fail, fix what fails, and write
down what engineering must build so it stays accessible.

## Why this exists

Most accessibility failures are designed in: a grey that looked fine on a
good screen, a dialog that never says where focus goes, an icon button
with no name, an error shown only in red. Each is cheap to fix in a design
file and expensive in code, and a few, like focus order and names, cannot
be seen in a static design at all unless someone writes them down.

## What this skill does NOT do

- It does not claim conformance. It says which criteria were checked, how
  (measured on the render, or judged), and what failed. A conformance
  claim needs testing with assistive technology, which it names as the
  next step.
- It does not change the product's tokens. A failing colour gets a fix
  from the product's own palette; a colour the palette lacks is `[new]`.
- It does not replace design-qa. design-qa measures a subset on every
  render; this skill audits all of the criteria, including the ones only
  judgment can check.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | HTML files, screenshots, a URL or a Figma frame | yes |
| the context card | `design/context.json` (`references/context.md`): the a11y target, platforms, locales, palette | yes, built if missing |
| design-qa's report | `report.json`, when design-qa has run | no; its measured findings are reused |

## Run order

1. **Context.** Read the card, or build it. Its `a11y.target` is the bar;
   without one, WCAG 2.2 AA.
2. **Measure what can be measured.** With HTML and a browser, run
   design-qa's render pass with `--also-widths 320` (WCAG's reflow width),
   or read its `report.json`. It measures contrast (text, and the edges of
   fields), target size with WCAG's spacing exception, visible focus and
   focus hidden behind sticky content, reflow, text at 200%, WCAG text
   spacing, landscape on a phone, and reduced motion; `references/wcag22.md`
   names the check for each. `node scripts/measure.mjs <screen> --fonts`
   adds which face actually renders the text.
   Reuse its findings, citing their check ids.
3. **Judge the rest**, criterion by criterion, with `references/wcag22.md`:
   the reading order, the names and roles, the headings, the error
   messages, the keyboard path, captions and alternatives, consistent help,
   and authentication.
4. **Fix.** For every failure, the fix in the product's terms: the token,
   the component, the copy. Rank them: what blocks a person entirely first.
5. **Annotate** each screen for engineering with `references/annotations.md`:
   landmarks, the heading outline, the focus order, the name, role and
   state of every custom control, live regions, and where focus goes when
   things open and close.
6. **Emit** `a11y.json`, checked with
   `python3 scripts/validate.py schema/a11y.schema.json a11y.json`, and
   `a11y.md`, then one line in chat: the criteria checked (measured or
   judged), the failures by level, and the next step.

**Only success criteria are findings here.** A design-qa finding with no
criterion behind it (a misaligned header, a clipped menu) stays in its
report; it is not repeated as an accessibility finding. A criterion above the
target's level (2.3.3 is AAA) is a note, not a failure.

## Rules

- **Measured beats judged.** Where a number exists (contrast, size,
  spacing), measure it on the render. A judged finding says it is judged.
- **Never colour alone.** A status, an error, a selected item, a link in
  text: each has a second signal, a word, an icon, an underline.
- **Every control has a name** a person would say out loud: "Delete
  listing", not "button" or "icon-trash".
- **Focus is designed.** Its order follows the reading order; it is
  always visible; it is never trapped, except inside an open dialog, which
  returns it on close.
- **Text can grow.** At 200% zoom, and at 320 CSS px wide, nothing is cut
  off and nothing needs scrolling in two directions.
- **The product's language is declared**, and a passage in another
  language says so, so a screen reader pronounces it. Right-to-left
  screens mirror their layout, not their numbers.

## Output

```
a11y.json   schema v1 (schema/a11y.schema.json): the criteria checked, each
            failure with its fix, and the annotations per screen
a11y.md     the findings ranked, then each screen's annotations for engineering
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
output's shape is `schema_version` 1. `references/versioning.md` has the
policy.
