# Recipes

CSS using custom properties: map `--motion-*` and `--ease-*` to the product's
own names from the card (`tokens.motion`). Every `var()` carries a fallback,
so a screen that does not load the token sheet still moves at the right
speed. Each recipe moves transform and opacity only, and hides what is
closed with `visibility`, so nothing invisible takes a click or focus.

```css
:root {
  --motion-fast: 150ms;      /* the product's fast duration */
  --motion-mid: 250ms;       /* the product's mid duration */
  --motion-exit: 100ms;      /* about two thirds of fast */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}

/* a native <dialog>, opened with showModal(): fades and rises in, faster out.
   @starting-style gives the opening its first frame; allow-discrete lets display
   and the top layer wait for the closing transition to finish. */
dialog {
  opacity: 0; transform: translateY(8px) scale(0.98);
  transition: opacity var(--motion-exit, 100ms) var(--ease-in, ease-in),
              transform var(--motion-exit, 100ms) var(--ease-in, ease-in),
              overlay var(--motion-exit, 100ms) allow-discrete,
              display var(--motion-exit, 100ms) allow-discrete;
}
dialog[open] {
  opacity: 1; transform: none;
  transition-duration: var(--motion-mid, 250ms);
  transition-timing-function: var(--ease-out, ease-out);
}
@starting-style { dialog[open] { opacity: 0; transform: translateY(8px) scale(0.98); } }
dialog::backdrop {
  background-color: rgb(0 0 0 / 0);
  transition: background-color var(--motion-mid, 250ms) var(--ease-out, ease-out),
              overlay var(--motion-mid, 250ms) allow-discrete, display var(--motion-mid, 250ms) allow-discrete;
}
dialog[open]::backdrop { background-color: rgb(0 0 0 / 0.4); }
@starting-style { dialog[open]::backdrop { background-color: rgb(0 0 0 / 0); } }

/* anything toggled by a class: hidden for real once it has gone */
.sheet, .menu, .toast {
  visibility: hidden;
  transition: opacity var(--motion-exit, 100ms) var(--ease-in, ease-in),
              transform var(--motion-exit, 100ms) var(--ease-in, ease-in),
              visibility 0s linear var(--motion-exit, 100ms);
}
.sheet.is-open, .menu.is-open, .toast.is-shown {
  visibility: visible; opacity: 1; transform: none;
  transition: opacity var(--motion-fast, 150ms) var(--ease-out, ease-out),
              transform var(--motion-fast, 150ms) var(--ease-out, ease-out),
              visibility 0s;
}
.sheet.is-open { transition-duration: var(--motion-mid, 250ms), var(--motion-mid, 250ms), 0s; }   /* a panel: the slower step */
.sheet { transform: translateY(100%); }                         /* a phone sheet: from the bottom edge */
.menu  { opacity: 0; transform: translateY(-4px); transform-origin: top; }
.toast { opacity: 0; transform: translateY(12px); }

/* a row removed: fades and slides toward the start edge (mirrors in RTL) */
.row.is-leaving {
  opacity: 0; transform: translateX(-8px);
  transition: opacity var(--motion-exit, 100ms) var(--ease-in, ease-in), transform var(--motion-exit, 100ms) var(--ease-in, ease-in);
}
[dir="rtl"] .row.is-leaving { transform: translateX(8px); }

/* skeleton to content: a cross-fade, never a jump */
.content.is-ready { animation: fade-in var(--motion-fast, 150ms) var(--ease-out, ease-out); }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

/* press feedback */
.button:active { transform: scale(0.98); transition: transform 80ms var(--ease-out, ease-out); }

/* reduced motion, one rule per motion (references/reduced.md): movement goes, meaning stays.
   Each list names the same properties, in the same order, as the rule it overrides. */
@media (prefers-reduced-motion: reduce) {
  dialog, dialog[open], .sheet, .sheet.is-open, .menu, .menu.is-open, .toast, .toast.is-shown,
  .row.is-leaving, [dir="rtl"] .row.is-leaving { transform: none; }
  @starting-style { dialog[open] { transform: none; } }
  dialog, dialog[open] { transition-duration: 100ms, 0s, 100ms, 100ms; }               /* opacity, transform, overlay, display */
  .sheet, .menu, .toast { transition-duration: 100ms, 0s, 0s; transition-delay: 0s, 0s, 100ms; }   /* opacity, transform, visibility */
  .sheet.is-open, .menu.is-open, .toast.is-shown { transition-duration: 100ms, 0s, 0s; transition-delay: 0s; }
  .row.is-leaving, [dir="rtl"] .row.is-leaving { transition-duration: 100ms, 0s; }
  .button:active { transform: none; filter: brightness(0.95); }                          /* a colour change instead */
  .content.is-ready { animation-duration: 100ms; }
  /* a spinner keeps turning: it carries meaning */
}
```

How long a toast stays is not motion: it is the time a person needs to
read it (about 4 to 6 seconds, longer when it holds an action), paused while
the pointer or focus is on it.

A list that closes the gap after a row leaves animates the rows below with a
transform (the FLIP technique: measure, move, then animate back to place),
never the height of the gap.
