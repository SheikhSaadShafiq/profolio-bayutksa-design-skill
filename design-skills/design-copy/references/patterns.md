# Patterns, by kind of slot

Each kind has a shape. The product's own strings for the same kind come
first: if it writes empty states a certain way, follow it.

## Button and link

A verb and its object: "Pay invoice", "Save changes", "Add customer". The verb
says what happens on press. Avoid "OK", "Submit", "Yes", "Click here".

A destructive button names the thing: "Delete project", never "Delete".

## Heading

What this screen or section is, in the product's term: "Order
history", "Billing". No "Welcome to", no sentence punctuation.

## Label and placeholder

A label names the field: "City". A placeholder shows an example, never the
label: "e.g. Manchester". A field without a visible label is not labelled.

## Help text

What the person needs to fill the field right, said once: format, limit,
why it is asked. "Shown to customers on your invoices."

## Empty state

1. What would be here: "No orders match these filters".
2. Why, if it is not obvious: "Orders appear here when customers check out".
3. What to do next, as a button when there is an action: "Clear filters".

A first-use empty state invites ("Create your first project"). A no-results
state points at the filter. An error is not an empty state.

## Error

1. What happened, in the person's terms: "The payment didn't go through".
2. What to do: "Check your card details or try another card".
3. Keep what they entered. Never "Something went wrong" on its own.

A field error sits next to the field and says how to fix it: "Enter a
phone number with its country code".

## Confirmation (before)

For anything destructive, costly or hard to undo:

- the title asks the exact question: "Cancel this subscription?";
- the body says the consequence: "You keep access until 30 June. This
  can't be undone";
- the buttons repeat the action and the way out: "Cancel subscription",
  "Keep subscription".

## Toast and success (after)

What happened, past tense, with the thing: "Invoice sent to Maha".
Add the next step only if there is one: "View invoice". A toast never carries
something the person must read to continue.

## Tooltip

One short sentence that explains a term or an icon. It never holds an
action, and the interface works without it: a touch screen has no hover.

## Numbers in copy

Use digits, the product's currency sign and format, and the unit:
"40 items", "3 days left". Pluralise for real counts: "1 order",
"2 orders". Zero has its own message when it means something: "No seats
left".
