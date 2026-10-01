---
name: "design-prompt-images"
description: Write prompts for image-generation and image-editing models that produce pictures in the product's own art direction — photographs, scenes, people, places, objects, backgrounds, hero and banner images, realistic placeholders — consistent across a set, each with its subject, composition, light, lens, palette, aspect ratio and what must stay the same between images; and generate them where an image tool is connected. Use when a design needs a photo or hero image that does not exist yet, realistic placeholder imagery, a consistent set of images, or an edit to an existing image; and whenever someone asks for an image prompt. Every generated image is marked as generated and never presents a real person, brand or place as something it is not. Works for any product, inside its context card.
version: '1.0.0'
---

# Design prompt images

Describe the picture the design needs so precisely that any good image
model makes the same one, in the product's style, every time.

## Why this exists

A design with grey boxes where the photos go is judged as a grey design. A
design with random stock photos is judged by the photos. Generated images
can fill the gap well, but only with prompts that carry the product's art
direction and stay consistent across a set: the same light, the same lens,
the same people treated the same way. A keyword list does not do that; a
written description does.

## What this skill does NOT do

- It does not draw illustrations or icons: `design-illustration` and
  `design-icons` do.
- It does not put text in images. Words belong in the interface, where
  they can be translated and read aloud.
- It does not make an image look like a real, identifiable person, a real
  brand or logo, or a real place presented as somewhere it is not.
- It does not ship a generated image as final: it is marked generated, for
  the product's owner to replace or approve, with the model's terms of use
  noted.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the slots | each image the design needs: where, what size, what it must show | yes |
| the context card | `design/context.json` (`references/context.md`): market, audience, palette, `assets.images` | yes, built if missing |
| references | the product's existing photographs, if it has any | no |

## Run order

1. **Context.** Read the card: the market and audience the pictures must
   be true to (`product.market`, `product.audience`; ask once if the card
   has neither), the palette they should sit with, and any existing imagery.
2. **Art direction.** Write one style block (`references/prompts.md`
   § The style block): light, lens and distance, colour, mood, how people
   appear, what never appears. Every prompt in the set reuses it word for
   word; that is what keeps a set consistent.
3. **One prompt per slot**, with `references/prompts.md`: the subject and
   what they are doing, the setting, the composition (where the subject
   sits, where the text in the design will go), the aspect ratio from the
   slot, then the style block.
4. **Edits.** To change an existing image, say what changes and what stays,
   one change at a time.
5. **Alternative text** for each image, written for the design, or
   "decorative" when the words beside it say everything.
6. **Generate**, when an image tool is connected: run each prompt, look at
   every result, and regenerate what is off-brief before using it.
   Without a tool, the prompts are the deliverable.
7. **Emit** `prompts.md`: the style block, then each slot's prompt, its
   aspect ratio and placement notes, and the generated files (named
   `<slot>.generated.<ext>`). One line in chat.

## Rules

- **Sentences, not keyword lists.** Describe the picture as you would to a
  photographer.
- **Composition serves the layout.** Leave clear space where the design
  puts a headline or a button, and say where.
- **True to the market and audience**: settings, architecture, dress and
  people that the product's users would recognise as theirs, shown with
  respect.
- **Consistent across the set**: the same style block, the same light, the
  same distance. When a model supports a reference image, use one.
- **Marked as generated**, everywhere it appears, until replaced.

## Output

```
prompts.md                 the style block and each slot's prompt
images/<slot>.generated.*  the generated images, when a tool was available
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry.
`references/versioning.md` has the policy.
