---
name: "design-forms"
description: Design forms people finish — which fields, in what order, their labels and help, input types and keyboards, defaults, what is required, when validation runs and what it says, where errors appear, multi-step progress, saving, and what success looks like — inside the product's own components and copy. Use whenever a design has a form, a filter panel, a sign-up or sign-in, a checkout, a settings page, a search or an edit dialog; whenever someone asks how validation or error messages should work, which fields to ask for, or why people abandon a form. Produces a field-by-field spec engineering can build from. Works for any product and platform, inside its context card.
version: '1.0.0'
---

# Design forms

Ask for less, say what is needed before it is wrong, and keep everything the
person typed.

## Why this exists

Forms are where products lose people: a field nobody understood, an error
shown before they finished typing, a submit that wiped their answers. Each
is a small decision a designer did not make and an engineer made by
default. This skill makes them on purpose, field by field.

## What this skill does NOT do

- It does not invent what the product needs to collect. Every field
  traces to a need in the brief; one that does not is questioned, not
  added.
- It does not write final copy for legal consent or payment terms. Those
  are drafted and marked `[TBC: owner]`.
- It does not specify every control state: `design-interaction` covers
  states and feedback. This skill covers the form's own logic.

## Inputs

| input | where it comes from | required |
|---|---|---|
| what the form is for | the brief: what it collects, and why | yes |
| the context card | `design/context.json` (`references/context.md`): components, copy, locales, rules | yes, built if missing |
| the data rules | what each value must be: from the brief, the API, or the person | no, asked when missing |

## Run order

1. **Context.** Read the card, or build it: the product's field components,
   its error style, its copy for errors and buttons.
2. **The fields.** List what the form must collect and why each is needed.
   Remove what is not needed now, or can be derived or asked later.
3. **Order and grouping.** In the order people think of it, in groups
   with a heading when there are more than five or six fields. One column
   unless fields truly belong side by side (first and last name, city
   and postcode).
4. **Each field**, with `references/fields.md`: its label, help, input
   type, keyboard, autocomplete, default, required or optional, limits,
   and its missing, long and other-language values.
5. **Validation**, with `references/validation.md`: when each rule runs,
   what its message says, where it appears, and what happens on submit.
6. **Submit and after**: the button's label; what it does while
   submitting; success (where the person lands, what they see); failure
   (all input kept, the problem shown where it is); saving a draft if the
   form is long.
7. **Emit** `form.json`, checked with
   `python3 scripts/validate.py schema/form.schema.json form.json`, and
   `form.md`, then one line in chat: the fields, the required ones, the
   rules, any `[TBC]`.

**Words.** This skill drafts each label, help text and error, in every
language the product ships. When design-copy runs (after this skill and
design-interaction), it owns the final words: each field points at its
`copy_slot`, and `copy.json` wins. A section needs a title only when the
form has more than five or six fields.

## Rules

- **Labels above fields, always visible.** A placeholder is an example,
  never the label.
- **Mark the minority.** If most fields are required, mark the optional
  ones, and the other way round. Say which convention once, at the top.
- **Never block typing.** Accept what people type, and fix the format
  for them (spaces in a phone number, a pasted IBAN with spaces).
- **Validate late, clear early.** A field is checked when the person
  leaves it, not while they type; an error clears as soon as the value
  is fixed.
- **Keep everything.** A failed submit, a timeout or a back button never
  empties a field.
- **The submit button is never disabled to signal errors.** Pressed with
  problems, it shows them and moves focus to the first.
- **One question per field.** "Phone (optional, for urgent updates)" is
  a label, a marker and help: three things, three places.

## Output

```
form.json   schema v1 (schema/form.schema.json): fields, rules, submission
form.md     the form as a table per section, then the validation and submission
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry; the
spec's shape is `schema_version` 1. `references/versioning.md` has the
policy.
