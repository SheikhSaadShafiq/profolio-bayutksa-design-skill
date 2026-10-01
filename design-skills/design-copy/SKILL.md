---
name: "design-copy"
description: Write the words in an interface — buttons, labels, headings, empty states, errors, confirmations, toasts, tooltips, onboarding — in the product's own voice, reusing its existing strings first, in English and Arabic (or whatever languages the product ships), and fitted to the component each one goes in. Use whenever a design needs words; whenever someone asks what a button, empty state, error or message should say; when copy needs a review for tone, clarity or consistency; and when a string needs its other-language version for the product. Every string is marked reused (verbatim from the product) or new, so new copy is reviewed before it ships. Works for any product, inside its context card (voice, terms, copy source).
version: '1.0.0'
---

# Design copy

Find the product's words first, write new ones only where it has none, and
make every string fit the place it goes.

## Why this exists

Interface copy goes wrong in three ways, and all of them are cheap to catch
before a build. A second word for something the product already names: the
product says "Credits", the new screen says "Points". A message that says
what went wrong but not what to do. A label that fits in English and wraps
in Arabic. This skill checks the product's own strings before writing any,
and measures the room each one has.

## What this skill does NOT do

- It does not change a string the product ships. A better wording for an
  existing string is a proposal, marked as one, never a silent edit.
- It does not write legal, pricing, payment or regulatory text as final.
  Those are drafted, marked `[TBC: owner]`, and named in the output.
- It does not invent product facts (limits, prices, durations) to make a
  sentence complete. A fact it does not have is a `‹placeholder›`.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the slots | the design: each place that needs words, and what it is for | yes |
| the context card | `design/context.json` (`references/context.md`): voice, terms, copy source, locales | yes, built if missing |
| the product's strings | the card's `voice.copy_source`, or the product's translation files | no, but reuse needs them |

## Run order

1. **Context.** Read the card, or build it. Note the languages, the tone,
   the product's terms, and where its strings live.
2. **List the slots.** For each one: the screen, the element, its kind
   (button, heading, empty state…), what it must make the person understand
   or do, and its room: the width and lines it has, measured from the
   design where possible.
3. **Reuse first.** Search the product's strings for the same meaning. A
   match is used verbatim, casing and punctuation included, with its
   source, but only a string the product shows in this market: one its copy
   marks hidden (a feature switched off, another market's) is not a reuse. Same meaning, not same words: "Nothing here yet" may already
   exist as "No Record Found", and the product's string wins.
4. **Write the rest** with `references/patterns.md`: each kind of slot has a
   shape (a button is a verb and its object; an error says what happened and
   what to do). Use the product's terms, never synonyms.
5. **The other languages.** For each new string, write it natively in each
   locale the card lists, not word for word. Check its length against the
   slot: Arabic often runs longer than English, and a slot sized for the
   English wraps. New strings in a second language are marked for a native
   speaker's review unless the product already has the same string.
6. **Fit.** If a string does not fit its slot in every language and on
   every platform, shorten it before anyone has to truncate it. Never rely
   on an ellipsis for a label. Measure each language in the face that
   renders it (the card's `locales[].font`; check with a browser), never in
   a face the product does not ship. If the product has no face for a
   language, measure what actually renders, mark the fit `assumed`, and flag
   the missing face as `[new]` for the designer.
   Runtime values are written `{name}`; a count gets its plural forms
   (Arabic has six: zero, one, two, few, many, other).
7. **Emit** `copy.json`, checked with
   `python3 scripts/validate.py schema/copy.schema.json copy.json`, and
   `copy.md`, then one line in chat: how many slots, how many reused, how
   many new, and any `[TBC]`.

When design-forms and design-interaction run too, run them first: they list
the slots (labels, errors, states), and this skill writes the final words.
`copy.json` is the one source of every string; the others point at its
slot ids.

## Rules

- **The product's word wins.** If the product calls it a listing, it is
  never a property, an ad or a post on this screen.
- **When the product contradicts itself** ("View" on one screen, "View
  order" on another): the wording used on more of its screens wins; on a
  tie, the one in its own copy files (the translation strings) wins; then
  the shorter. List the other under `inconsistencies`.
- **One string, one job.** A label does not also explain; help text does.
- **Say what happens.** "Save changes", not "OK"; "Delete 3 listings", not
  "Confirm".
- **Errors are for the person, not the system.** What happened, in their
  terms, and what to do next. No codes on their own, no blame.
- **Numbers, dates and money follow the card's rules**: the product's
  currency sign, date format and digits, in every language.
- **Casing** follows the product's own strings for that kind of slot (the
  card's `voice.casing`; if it has none, count the product's buttons,
  headings and labels and record it). Sentence case only where the product
  has no habit.
- **The product's pattern wins over these patterns.** If its modals say
  "Confirm", a new modal reuses "Confirm", and a better label is a
  proposal beside it.

## Output

```
copy.json   schema v1 (schema/copy.schema.json): one entry per slot
copy.md     the copy deck: screen by screen, each language side by side,
            reused / new / proposal, and the [TBC] list
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
deck's shape is `schema_version` 1. `references/versioning.md` has the
policy.
