# Manual checklist

Rules catch mechanical failures. These need judgment, and skipping them
produces a green report on a design nobody would ship.

Record each against a node id, in the same finding shape the automated checks
use, so the gate reads one file.

## Per state

**Empty**
- [ ] Does it say what to do next, or only that there is nothing here?
- [ ] Is there an action, and is it the right one?
- [ ] Is it distinguishable from an error and from a still-loading state?

**Loading**
- [ ] Is it honest about what is loading?
- [ ] Does the layout hold its shape, so nothing jumps when content arrives?
- [ ] For anything over ~2s, is there progress rather than an indefinite spinner?

**Error**
- [ ] Is there a recovery path, not just an apology?
- [ ] Does it name what failed in terms the user can act on?
- [ ] Is anything the user typed preserved?

**No permission**
- [ ] Does it explain who to ask, rather than implying the feature is broken?
- [ ] Is it clearly different from an empty state?

**Flag off**
- [ ] Does the surface degrade cleanly, or leave a hole where the widget was?
- [ ] Is anything referencing the hidden feature left behind?

## Per screen

- [ ] Does visual hierarchy match task priority — is the most common action
      the most prominent?
- [ ] Is the copy in the product's voice, or in a generic UI voice?
- [ ] Would a first-time user know where to start?
- [ ] Is anything on screen that only makes sense to someone who built it?
- [ ] At the smallest breakpoint, is the primary action reachable without
      scrolling?

## Per flow

- [ ] Can the user get back from every screen without the browser back button?
- [ ] Is destructive action confirmed, and is the confirmation specific about
      what will be destroyed?
- [ ] After completing the task, is it obvious what happened?

## Cross-platform

- [ ] Where web and mobile differ, is the difference a deliberate adaptation
      or an oversight?
- [ ] Do the same words mean the same thing on both?

## Recording

```json
{
  "check": "manual.empty.next_action",
  "severity": "warning",
  "screen": "web/my-listings",
  "node": "3:412",
  "message": "empty state says 'No listings found' with no action",
  "section_hint": "state-screens"
}
```
