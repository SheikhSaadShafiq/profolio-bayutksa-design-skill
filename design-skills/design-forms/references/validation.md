# Validation

## When

| moment | what runs |
|---|---|
| before typing | nothing; the help text says the rule up front |
| choosing a file | its type and size, at once |
| while typing | only a live aid that helps (a character count, a password meter), never an error |
| leaving the field | that field's rules; an error appears now, at the earliest |
| fixing a field with an error | re-checks on every change, and the error clears the moment it is right |
| submit | every rule; the problems are shown, and focus moves to the first |
| on the server | what only the server knows (taken, expired); shown on the field it concerns |

## What an error says

What is wrong, and how to make it right, in the person's words:

| instead of | write |
|---|---|
| Invalid input | Enter a date like 31/12/2026 |
| Required field | Enter your phone number |
| Error 422 | This email already has an account. Sign in instead |

An error never blames ("You entered a wrong value"). It never only repeats
the label in red.

## Where

- Next to its field, below it, with an icon as well as colour: colour alone
  is not enough.
- A long form that fails on submit also lists the problems at the top, each
  linking to its field.
- An error that is not about one field (the payment declined) sits above
  the submit button, and says what to do.

## Submit

- The button keeps its label and gains a spinner while submitting; pressing
  again does nothing.
- On success, the person sees what happened and where it went, in place or
  on the next screen.
- On failure, every value stays; the message says what to do; nothing is
  submitted twice.
- A long or multi-step form saves its progress, and says so.

## Multi-step

Show the steps and where the person is. Each step validates on "Next".
"Back" keeps what was entered. The last step shows a summary to check
before submitting.
