---
name: "design-inspiration"
description: Find how other products solve a pattern this product does not have yet — on Mobbin (real screens, multi-step flows and website sections) and the web — and turn it into a short reference board, every example cited with its link, saying what to borrow, what to avoid and why, and two or three directions adapted to the product's own components and style. Use before wireframing a feature that needs a pattern the product lacks; when someone asks for inspiration, references, examples, competitors' approaches, "how do others do X" or best practice for a flow; and when weighing the options for an open design decision. Never copies a design: it cites, compares and adapts. Works for any product, inside its context card.
version: '1.0.0'
---

# Design inspiration

Look at how others solved it, cite them, and bring back what fits this
product, not their look.

## Why this exists

A pattern a product has never drawn is where design guesses most. Others
have usually solved it, and seeing five real versions side by side shows
which choices are conventions people expect and which are one company's
taste. The answer is still this product's own: its components, its words,
its constraints. The board is the evidence; the design stays original.

## What this skill does NOT do

- It does not copy a screen, a layout, an illustration or another
  product's copy. It names what a pattern does and adapts the idea.
- It does not decide. It gives the directions and their trade-offs; the
  person picks.
- It does not describe a screen from its metadata. It looks at the
  picture, or it does not cite the example.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the question | the pattern and the job it does: "a team admin approves expense claims in bulk" | yes |
| the context card | `design/context.json` (`references/context.md`): platform, components, rules | yes, built if missing |
| constraints | from the brief: what the product must or must not do | no |

## Run order

1. **Context.** Read the card, or build it. The platform decides where to
   look, the components decide what can be adapted, and the rules decide
   what is off the table.
2. **Frame the question** in one line: the job, the person, and what makes
   it hard. Split it into the screens, flows and components it needs.
3. **Search Mobbin** when its connector is available:
   - one screen → search screens; a journey of several steps → search
     flows; a website or marketing section → search sections (web only:
     sections take no platform);
   - set the platform for screens and flows: `web` for a web product; `ios`
     for a phone app, and for Android too, saying that Mobbin's examples
     are iOS;
   - ask for what the board needs: a limit of 6 to 8 screens, or 3 to 5
     flows, in `standard` mode. A larger or deeper search costs more and
     the board keeps six;
   - describe one screen or one journey per query, in plain words: what
     you would see and how it fits together. No platform words, no
     negations, no style words like "modern". Name an app to see its
     version;
   - keep the task intent, the output destination and the output tool the
     same on every call of one task: `code` when the results feed a coded
     design or prototype, `design_tool` when they go onto a design canvas
     (name it as the output tool), `doc` when the board is the deliverable;
   - look at every returned image before you use it.

   Without Mobbin, search the web: product pages, public design galleries,
   help centres. Say plainly that Mobbin was not available.
4. **Choose five or six examples** from at least three different products.
   Prefer products that serve a similar job and audience over famous ones.
5. **Read each one**: what it does well, specifically ("the price sits in
   the button, so the cost is seen at the moment of buying"), what to
   borrow, and what not to, with the reason in this product's terms.
6. **Directions.** Two or three ways this product could do it, each built
   from its own components and tokens (the card), each with its trade-off.
   Name the convention most examples share; going against it needs a
   reason.
7. **Emit** the board, `references/board.md` has its shape, and one line in
   chat: the question, the examples, and the direction you would pick
   first, with why.

## Rules

- **Cite every example** as a link to where it can be seen: Mobbin's link
  for a Mobbin result, the page for a web one. An uncited example is not on
  the board.
- **A flow is cited by its own link**, and described only by the steps its
  previews show. Say how many steps it has; never describe a step you have
  not seen.
- **Mobbin's notices are shown as given.** If a result carries a usage
  notice, show it word for word, as its own block after the results.
- **Images.** Mobbin's inline previews are for reading, not for the board.
  To put a picture on a board that is kept, download it from its
  high-resolution image link (those links expire after 30 days), and still
  cite the example's Mobbin link.
- **Adapt, never transplant.** A direction is described in the product's
  components and words. If it needs something the product does not have,
  that part is marked `[new]`.
- **Diversity over volume.** Five examples from five products teach more
  than twenty from one.

## Output

```
inspiration.md   the board: the question, the examples (cited), what most
                 do, the directions with trade-offs, open questions
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry.
`references/versioning.md` has the policy.
