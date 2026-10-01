# What each section needs

Canonical ids and applicability are in `schema/sections.json`. This file is
about content — what makes each section useful rather than decorative.

Rule for all of them: a section that does not apply is marked **not
applicable, with a reason**. Never fill a shape with invented content.

---

## summary
Feature, the problem it solves, platforms, scope, and — for any version past
the first — what changed since the previous version. Audience-sensitive: an
engineer wants scope and constraints, a stakeholder wants the problem and the
decision. Ask which, do not average them.

## prototype
Clickable, driven by `flows.json`. Transitions key on node ids, never CSS
selectors, so a hotspot survives a re-layout. Needs forward, back, reset,
per-screen state picker, deep-link (`?screen=…&state=…`) and a hotspot-reveal
toggle. Deep-link matters more than it sounds: it is how a reviewer sends
someone to the exact thing they are commenting on.

## button-states
Every interactive component in use, with default, hover, active, focus,
disabled and loading side by side. Generated from the design system's declared
component states, not authored — authoring it guarantees drift from the
catalogue.

## state-screens
Screen-level states: loading, empty, error, flag-off, no-permission. Generated
from the registry plus QA. Empty appears whether or not the registry declared
it.

## screens-redlines
The screens themselves with the inspector attached. Each node shows its id,
role, the design system component it instantiates, its box, and the tokens it
consumes. This is the section engineers actually work from.

## rules
Behaviour that is not visible in a screenshot: what happens on conflict, what
is validated when, what persists, what is optimistic. Each rule must be
testable — a reader should be able to say whether an implementation satisfies
it. "Should feel responsive" is not a rule.

## motion
Every transition with duration, easing, trigger and reduced-motion behaviour.
A named duration with no easing is half a spec.

## dotlottie
Each animation with its trigger, loop behaviour, fallback when it fails to
load, and the inlined asset. A Lottie with no fallback is an empty box on a
slow connection.

## gestures
Any platform with touch or pointer gestures. Each gesture with its target node
id, threshold, what happens below threshold, and what happens on conflict with
scroll. Thresholds come from the platform config, not from this section —
a swipe distance that is right on a phone is wrong on a tablet.

## edge-cases
Content extremes, network failure, permission failure, and the empty-vs-error
distinction. Generated from QA's `ovf` findings plus authored cases. This is
where the longest-real-string and the Arabic overflow live.

## assets
Name, format, dimensions, size, and where it is used, for every asset — all
inlined in the bundle. An asset section that lists files the reader cannot
open is not a handoff.

## tokens
**A filtered view.** Only the tokens these screens consume, each linking back
to the design system. Never restate the full set: a copy will disagree with
the source within a month, and then nobody knows which is authoritative.

## accessibility
Contrast results, hit targets, focus order, labels, RTL. Generated from QA.
Anything out of scope is stated as out of scope, not omitted.

## performance
Only when a budget has been declared, and it must say what is being budgeted
against what number and where the number came from. A budget with no source is
a wish.

## acceptance
Every criterion objectively checkable, referencing a node id or a QA check id.
Generated from checks that passed, plus authored rules. Checks that were
skipped are listed separately as not verified — claiming nothing is better
than implying coverage that does not exist.

## platform-notes
Every declared cross-platform difference with its reason. Every undeclared
difference becomes an open question. Differences are usually correct; silent
ones are usually not.

## open-questions
QA warnings, waived blockers with their reasons, open `[TBC]` tokens,
unanswered intake rows. Each names who can answer it and what is blocked until
they do. An open question with no owner will still be open at sign-off.
