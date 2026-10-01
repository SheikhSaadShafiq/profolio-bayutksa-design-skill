# The case matrix

## Why classify instead of enumerate

Five states × three roles × four flags × two platforms × two locales × four
breakpoints is 1,920 cases for one screen. Nobody reviews that, and a report
nobody reads is the same as no report.

So `matrix.py` assigns every case to one of four classes and only the first
two are guaranteed to run.

## The four classes

### required
Every declared state × every platform in scope, at the default role and the
primary locale.

This is the floor. It is small — five states × two platforms is ten cases —
and it is where the most common failure lives, which is a state that was never
drawn at all.

Empty state is required even when the registry does not declare it. If a
screen can show a list, it can show an empty list.

### required-if-differs
A role or flag combination is promoted to required when the registry says it
changes the surface.

This is derived, not guessed. `registry[page].flags` names which flags gate
the page, and `registry[component].used_on` says which surfaces a component
touches. If a flag gates nothing on this screen, its off-state is not a case.

The rule matters because it keeps the matrix honest in both directions: it
does not test combinations that cannot differ, and it does not skip ones that
can.

### sampled
Everything else. One representative per family, chosen deterministically.

Deterministic matters. If the sample is random, two runs of the same screen
produce different results and you cannot tell a regression from a reshuffle.
Sample by sorting the family's cases by a stable key and taking the first.

### excluded
Impossible or meaningless combinations, each with a stated reason in the
matrix output. Examples:

- `no-permission` × `empty` — the user cannot see the list to find it empty
- `flag-off` × any state other than the flag-off render
- `loading` × content extremes — nothing is rendered yet to overflow

An exclusion without a reason is a gap pretending to be a decision. Write the
reason.

## Showing the matrix before running

The matrix is the scope. Present it before running checks, as a count per
class plus the full required list. Correcting scope at this point costs one
message; correcting it after a full render pass costs a rerun.

If the user says a sampled case matters, promote it and note the promotion in
the matrix output so the next run keeps it.

## Output shape

```json
{
  "scope": { "feature": "my-listings", "platforms": ["web","mobile"], "locales": ["en"] },
  "counts": { "required": 10, "required_if_differs": 6, "sampled": 12, "excluded": 31 },
  "cases": [
    {
      "id": "my-listings/web/empty/en/default/1440",
      "class": "required",
      "screen": "web/my-listings",
      "state": "empty",
      "role": "default",
      "flags": {},
      "locale": "en",
      "width": 1440,
      "promoted_by": null
    }
  ],
  "excluded": [
    { "pattern": "no-permission × empty", "reason": "list not visible to this role" }
  ]
}
```
