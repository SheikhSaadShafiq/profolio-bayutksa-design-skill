# Severity and waivers

## The three levels

**blocker** — downstream work stops. Reserved for failures that would ship a
broken screen or make a deliverable misleading:

- a required state missing entirely
- a flow transition pointing at a node that does not exist
- a colour or size value outside the token system
- body text under 4.5:1 contrast
- a hit target under the platform's declared minimum
- placeholder text in a user-visible string
- a 200-character string breaking layout

**warning** — proceeds, carried forward as an open item. Things that are
probably wrong but might be intentional, or that affect a sampled case rather
than a required one.

**note** — informational. Observations, counts, things worth knowing.

## Why the policy is written down

Without a stated policy, severity gets argued case by case, and the argument
always resolves toward shipping. Writing it down means the conversation is
"should this check be a blocker" — a real design question — rather than
"should this instance block", which is just pressure.

## Waivers

A blocker can be waived. It cannot be waived silently.

```json
{
  "waivers": [
    {
      "check": "a11y.contrast.ui",
      "node": "3:147",
      "screen": "web/my-listings",
      "reason": "table header grey is a product-wide value; tracked in DS-412",
      "granted_by": "umair",
      "granted_on": "2026-09-29",
      "expires_on": "2026-12-31"
    }
  ]
}
```

Rules:

- A waiver is per check per node, never per check globally. A blanket waiver
  disables the check, which is a different decision and should be made in the
  check catalogue.
- A waiver needs a reason a stranger can evaluate. "Known issue" is not a
  reason.
- A waiver expires. An expired waiver reverts to a blocker on the next run.
  This is the mechanism that stops waivers accumulating into a permanently
  green report on a permanently broken design.
- Waived findings stay in the report, marked `"waived": true`, and appear in
  the deliverable's open-questions section.

## What is not allowed

Lowering a check's severity to make a report pass. If a check is genuinely too
strict, change it in `references/checks.md`, bump the skill version, and write
the reason in the changelog. The difference matters: one is a decision with a
record, the other is erosion.
