---
name: "design-apple-hig"
description: Design and check interfaces for iPhone, iPad and Apple Watch the way Apple's Human Interface Guidelines describe — navigation (tab bars, navigation stacks, sidebars, sheets, modality), native controls, San Francisco type and Dynamic Type, semantic and dark-mode colour, SF Symbols, layout margins and safe areas, touch targets, gestures, haptics, and accessibility (VoiceOver, Dynamic Type, Reduce Motion) — keeping the product's own brand, adapted to the platform, with SwiftUI or UIKit notes for engineering. Use when designing or reviewing a native Apple app, or a web app that should feel at home on iOS; whenever someone asks about the HIG, iOS conventions, tab bar or sidebar, sheets, SF Symbols, Dynamic Type or what feels native. Works for any product, inside its context card.
version: '1.0.0'
---

# Apple HIG

Make an Apple app feel native without losing the product: the platform's
structure and behaviour, the product's brand and words.

## Why this exists

People learn one way to navigate, go back, dismiss and share on their phone,
and they expect every app to work that way. An app that invents its own back
gesture or puts a web-style menu in a tab bar feels foreign, however good it
looks. Apple documents these conventions in its Human Interface Guidelines;
this skill applies them, and says where the product's brand still leads.

## What this skill does NOT do

- It does not quote or reproduce Apple's guidelines. It applies them, in
  its own words, and points to the topic for detail.
- It does not replace the product's brand with Apple's defaults: the
  product's colours, voice and imagery stay; the structure and behaviour
  become native.
- It does not cover Android: Material Design differs on navigation, back
  and typography. A cross-platform design is checked on each.

## Inputs

| input | where it comes from | required |
|---|---|---|
| the design | screens for iPhone, iPad or Watch; or, for a new app, the product's web screens and the brief | yes |
| the context card | `design/context.json` (`references/context.md`): brand colours, type, voice | yes, built if missing |
| the platforms | iPhone, iPad or Watch, and the minimum OS version | yes; an unstated minimum is assumed as the current release and flagged |

## Run order

1. **Context.** Read the card: the brand to keep, and the type and colours
   to map onto system equivalents. The platform's own values (text styles,
   semantic colours, margins) are named by their system role and are not
   `[new]`; only a brand value the card lacks is, such as a dark-mode tint.
   Check Apple's current guidelines for the OS version in scope:
   `references/hig.md` describes conventions that have held across recent
   releases, and a new release can move things (where search sits, how
   bars behave on scroll).
2. **Structure.** Choose the navigation per `references/hig.md` §
   Navigation: a tab bar for a few top-level areas, a navigation stack
   inside each, a sidebar on iPad, sheets for focused tasks. Check that
   back, dismiss and swipe behave as the system does.
3. **Controls.** Use native controls where they exist (lists, toggles,
   pickers, segmented controls, menus, search fields), styled with the
   product's accent, not rebuilt.
4. **Type and colour.** Map the product's type roles onto Dynamic Type
   text styles, so text scales with the person's setting; map its colours
   onto semantic roles (label, secondary label, background, grouped
   background, separator, tint) with dark-mode values.
5. **Layout.** Safe areas, system margins, the keyboard, and every size
   class from the smallest iPhone to the largest iPad.
6. **Check** with `references/hig.md` § Checklist, and write each issue
   with its fix.
7. **Emit** `hig.md`: the structure chosen and why, the mappings (type
   roles to text styles, colours to semantic roles), the issues with
   fixes, and SwiftUI or UIKit notes per component. One line in chat.

## Rules

- **The system's behaviour wins**: back sits at the top leading edge (top
  left, mirrored to the top right in right-to-left languages) with the
  matching edge swipe; sheets dismiss by swiping down; the tab bar stays.
- **The product's brand stays**: its accent as the tint, its voice in
  every label, its imagery.
- **Dynamic Type always.** Every text style scales; layouts reflow at the
  largest accessibility sizes instead of truncating.
- **44 × 44 points** minimum for every touch target.
- **SF Symbols** for system concepts (share, close, settings), matched to
  the text weight beside them; the product's own icons for its own
  concepts.
- **Dark mode is designed**, not inverted.

## Output

```
hig.md   structure, mappings, issues with fixes, engineering notes
```

## Versioning

The skill version is in the frontmatter, with a `CHANGELOG.md` entry.
`references/versioning.md` has the policy.
