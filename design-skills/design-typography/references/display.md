# Display type: banners, promos, heroes, explorations

Display type has one job: one message, read in a second.

## Structure

1. **The message**: one line, or two at most, in the display role.
2. **The support**: one sentence in body, if needed.
3. **The action**: one button, using the product's button.

Three levels, never more. A banner that needs a fourth is two banners.

## Size

- Use the scale's largest steps first. A display size the product lacks is
  `[new]`, chosen to continue the scale's ratio, not picked by eye.
- Scale it with the viewport between two steps, for example with CSS
  `clamp(<smaller step>, <fluid value>, <larger step>)`, so it never drops
  below the body size on a phone.

## Over images

- Text over a photograph needs 4.5:1 against every part of the image it
  covers. Use a scrim (a gradient or a solid band) from the product's
  palette, or move the text off the image.
- Never put text in the image file: it cannot be translated or resized.

## Explorations

When asked for options, give two or three type directions that each use the
product's faces differently (weight, case, scale contrast), side by side
with the same content. Mark anything outside the product's faces or scale as
`[new]`, and say what the person is choosing between.
