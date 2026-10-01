# Node ids

## Format

`{screen}:{node}` → `3:147`

Screen number from the registry. Node number monotonic within that screen.
Readable, sortable, obviously an id when someone pastes it into a ticket.

## The requirement is stability, not uniqueness

Uniqueness is trivial. Stability is the hard part, and it is the reason the
ledger exists.

If ids are assigned at build time by DOM order, then inserting one row above
renumbers everything below it. Every redline reference in every ticket,
comment and Slack thread silently points at a different element. That is worse
than having no ids, because it fails quietly.

So: ids are assigned once, on first sight, and stored. Regeneration matches
existing nodes to existing ids. A node's id is a fact about the node, not a
function of its position.

## The ledger

`ids.json`, committed to git.

```json
{
  "ledger_version": 1,
  "screens": { "my-listings-web": 3, "my-listings-mobile": 12 },
  "nodes": {
    "3:147": {
      "kind": "text",
      "role": "listing-price",
      "screen": "my-listings-web",
      "path": "listing-table > row[2] > price",
      "fingerprint": "text:1,250,000|font:700/20|token:--gray-900",
      "pair": "12:88",
      "first_seen": "2026-09-29",
      "last_seen": "2026-09-29",
      "status": "active"
    }
  },
  "next_node": { "3": 148, "12": 89 },
  "retired": ["3:96"]
}
```

## Rules

**Assign once.** A node gets its id the first time it is seen and keeps it
forever.

**Never reuse.** A deleted node goes `status: "retired"`. Its number is not
returned to the pool. Reusing a number means an old reference resolves to a
different element, which is the exact failure the ledger exists to prevent.

**Match on regeneration** by a composite key, in this order:

1. `role` + `path` exact → same id, no change
2. `role` + `fingerprint` exact, path moved → same id, log the move
3. `role` + `path`, fingerprint changed → same id, log the content change
4. `role` matches, nothing else → same id if exactly one candidate, otherwise
   ask rather than guess
5. no match → new id, reported as new

Step 5 is reported, not silent. A node that should have matched but did not is
usually a renamed role, and catching it at assignment costs nothing while
catching it later costs every reference.

**Role matters more than the id.** `listing-price` is what makes the
fingerprint survive edits and what lets the redline panel group sensibly. Roles
should map to design system component names wherever one exists — that mapping
is the join between the two skills.

**Pairing.** `pair` links a web node to its mobile counterpart. This is what
lets a redline say "differs from mobile" and be checkable, and what lets the
parity QA check point at both sides.

## What gets an id

Not everything. Fourteen hundred ids is noise.

Include: every screen, every component instance, every text node carrying
copy, every icon, every interactive control.

Exclude: layout wrappers, spacers, purely decorative elements, anything a
reviewer would never point at.

Roughly 150–250 per screen, which is the same order of magnitude Figma
produces for a screen of similar density. If a screen is producing 600, the
inclusion rule is being applied too broadly — usually wrappers are being
counted.

## Who assigns them

`scripts/assign_ids.py` at build time, with the skill reviewing the unmatched
list. The script is deterministic and fast; the judgment call — "is this the
same node that moved, or a new one" — is the part worth a human or a model
looking at.

## Diffing across versions

Because ids are stable, a version diff is meaningful: nodes added, nodes
retired, nodes whose fingerprint changed. That diff belongs in the
deliverable's own changelog section, and it is the thing a reviewer opening v4
actually wants to see.
