# Fields

## Choosing the input

| the value | input | why |
|---|---|---|
| short free text | text | |
| long free text | textarea, sized to the expected length | its size says how much to write |
| email | `type=email`, `autocomplete=email` | the right keyboard; the browser can fill it |
| phone | `type=tel`, `autocomplete=tel` | a number pad on phones |
| a number you count with (quantity) | `inputmode=numeric`, with steppers only for small ranges | |
| a number you don't count with (ID, card, postcode) | text with `inputmode=numeric` | `type=number` drops leading zeros and adds scroll-to-change |
| money | text with `inputmode=decimal`, the currency sign outside the field | the card's currency rule |
| a date | the product's date picker; typing allowed for dates far away (birth dates) | |
| one of 2 to 5 | radio buttons, or a segmented control | all choices visible at once |
| one of 6 to 15 | a select | |
| one of many | a searchable select | |
| several of a few | checkboxes | |
| several of many | a multi-select with chips | |
| yes or no that takes effect at once | a switch | |
| yes or no that takes effect on submit | a checkbox | |
| a file or photo | a file field with what it takes (types, largest size), a preview, and remove | validated when chosen: too large, wrong type |

## Autocomplete

Set `autocomplete` on every field the browser can fill: name, email, tel,
street-address, postal-code, country, cc-number, one-time-code,
current-password, new-password. It is the cheapest speed-up a form has.

## Defaults

Pre-fill what is very likely and easy to change: the person's country, the
most common option. Never pre-select consent, a paid option, or anything
the person would be surprised to have agreed to.

## Each field's edge values

For each field, say what happens with:

- **nothing**: is it allowed, and what does the result show then?
- **the longest real value**: does the field and every place showing it
  later fit it?
- **another language or script**: Arabic in an English form, and the other
  way round. Digits in another script (٠١٢٣).
- **pasted text**: with spaces, line breaks, or a leading zero.
