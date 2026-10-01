# The rubric

One dimension at a time. Each has the questions to ask and, where a number
helps, a default to measure against. The context card's value wins over every
default here; a default that is used is named in the finding.

## Structure (both modes)

**Task fit**
- Can the person see, in one look, what this screen is for?
- Is the main action the most visible action? Is there exactly one?
- Does every element earn its place for this task, or is it here because the
  data exists?

**Flow**
- From where they arrive, can they get to done without backtracking?
- After each action, can they tell what happened: what changed, and where?
- Is every way out visible: cancel, back, close, undo for anything
  destructive?

**Hierarchy**
- What do the eyes land on first, second, third? Is that the order of
  importance?
- Do more than two things compete for first look?

**States**
- Is there a designed empty state, a loading state, an error state, and a
  no-results state wherever there is a filter or a search?
- What does a first-time person see, before there is any data?
- Does each state say what to do next?

**Content**
- Is the most important information first in each row, card and section?
- Does every label use the product's words (the card's `voice.terms`)?

## Craft (`craft` mode)

**Type**
- Only sizes from the scale (`tokens.type.scale`). Default: at most four
  sizes on one screen.
- Body line length 45 to 75 characters on web.
- Headings differ from body by size or weight, not both and colour as well.

**Spacing and alignment**
- Every gap is on the spacing scale (`grid.base`, `tokens.space`). Default
  base: 4 or 8.
- Related things sit closer together than unrelated things.
- Everything aligns to something: column edges, the text baseline of its
  neighbour, the centre of its row.

**Colour and contrast**
- Text contrast at least 4.5:1, or 3:1 at 18px and above, or 14px bold and
  above (WCAG 2.2 AA). Icons and control borders at least 3:1.
- Colour is never the only signal: a status also has a word or an icon.
- Only colours the card has. A new one is `[new]`.

**Components and states**
- The product's components, used the product's way (the card's
  `components`).
- Every control has its hover, pressed, focus, disabled and loading states.
- Similar controls are the same height and style across the screen.

**Consistency**
- Does this look like the rest of the product: the same patterns for the
  same jobs, the same placement for the same actions?

**Copy**
- Buttons say what they do ("Save listing", not "OK").
- Errors say what happened and what to do, without blame.

**Motion**
- Durations from the card's `tokens.motion`. Default for interface
  transitions: 150 to 300ms; what a person waits on before acting again (a
  button's response, a tab change) under 200ms.
- Every movement has a reason: feedback, where something came from, a
  change of state.

**Responsiveness**
- At each platform width: no sideways scroll, no clipped text, nothing that
  only works with a mouse.
- Hit targets: the card's `platforms[].min_target`. Defaults: 24px on the
  web (WCAG 2.5.8), 44pt on iOS, 48dp on Android.
