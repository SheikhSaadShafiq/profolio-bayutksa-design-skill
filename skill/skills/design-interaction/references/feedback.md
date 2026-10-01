# Feedback over time

Every action has the same timeline. Fill each step, or say why it does not
apply.

| when | what the person needs | typical answer |
|---|---|---|
| at once (under 100 ms) | proof the press landed | the pressed state; the control changes; optimistic result |
| while it runs (100 ms to 1 s) | that it is working | a spinner in the control; the item greyed out |
| longer (over 1 s) | how long, and that they can go on | progress, or a message; the rest of the screen stays usable |
| very long (over 10 s) | to leave and come back | a background task with a notification when done |
| done | what changed, and where | the result in place; a toast for what is not visible; the count updated |
| failed | what happened and what to do | the old state back; a message next to it; a retry |
| undo | a way back from a mistake | an undo in the toast for a few seconds, or a confirmation first |

These thresholds are the long-standing response-time limits for
interfaces: a tenth of a second feels instant, one second keeps the train
of thought, ten seconds is the limit of attention.

## Optimistic or not

Show the result before the server confirms only when:

- the action almost always succeeds;
- a failure can be shown and undone cleanly, in place;
- nothing irreversible (a payment, a message sent) has happened.

Never optimistic: payments, purchases, sending, deleting for good.

## Confirm or undo

- **Undo** for frequent, cheap, reversible actions: archive, remove from a
  list, mark as read.
- **Confirm first** for rare, costly or irreversible ones: pay, delete for
  good, send to someone else. The confirmation repeats the action and its
  cost in its button ("Delete 3 files"), not "Yes".
