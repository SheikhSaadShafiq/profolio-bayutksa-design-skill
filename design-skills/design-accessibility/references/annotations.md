# Annotations for engineering

What a static design cannot show, written down per screen. Keep each one
short and pinned to the element (node id or selector).

## Landmarks

The regions of the page: `banner` (the header), `navigation` (each nav,
labelled when there is more than one: "Main", "Account"), `main` (exactly
one), `complementary`, `contentinfo` (the footer), `search`.

## Heading outline

The headings in order, with their levels, as a screen reader lists them:

```
h1 Orders
  h2 Filters
  h2 3 orders
    h3 Maha Al-Rashid
```

One `h1` per page. No level skipped going down.

## Focus order

The Tab sequence, numbered on the screen. Where it differs from the visual
order, say why. Mark anything that must not take focus (a decorative
image, a disabled control that is explained elsewhere).

## Name, role, state

For every control that is not a plain native one:

| element | role | name | state |
|---|---|---|---|
| the star on a card | button | "Save Maha's order" | pressed / not pressed |
| the filter chip | button | "Status: Paid, remove" | — |
| the sort menu trigger | button, opens a menu | "Sort: Newest first" | expanded / collapsed |

A visible label is part of its name (2.5.3).

## Focus management

| when | focus goes to | and returns to |
|---|---|---|
| a dialog opens | its first field, or its title | the control that opened it |
| a menu opens | its first item | the trigger |
| a row is removed | the next row, or the list's heading | — |
| a form fails on submit | the first field with an error, or the error summary | — |
| a page changes without a reload | its main heading | — |

## Live regions

What changes on its own and must be announced, and how politely:

| change | announced as |
|---|---|
| a toast | polite status |
| a result count after filtering | polite status |
| an error after submit | assertive alert, once |
| a timer running out | assertive alert, a minute before |

## Alternatives

For each meaningful image: its alternative text. For each decorative one:
"decorative". For each chart: the numbers it shows, as a table or a
sentence.
