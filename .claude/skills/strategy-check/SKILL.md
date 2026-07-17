---
name: strategy-check
description: >
  Report the implementation status of a strategy — how much of what it decided is actually built. Resolves
  every runbook piece's `done_when` against the repo and gives a truthful % done, plus what's pending and
  what still needs a human to confirm. Use to know where a strategy stands before claiming it's implemented.
---

# /strategy-check <topic>

The loop-closer. `/strategy` governs a strategy's BIRTH and `/strategy-refine` finishes a stalled one; this
tells you how much of an APPROVED strategy is actually BUILT — so "implemented" is a measured fact, not a claim.

## 1. Measure — resolve the runbook, don't guess
`emkeel strategy progress <topic>` reads `<topic>.runbook.md` and resolves EVERY piece's `done_when` against
the repo (deterministic, offline):
- a repo `file:line` that resolves → **✓ built**;
- a repo `file:line` that doesn't → **✗ not built** (the artifact isn't there yet);
- a test / gate / prose `done_when` → **~ manual** (can't auto-resolve — it's surfaced with its declared
  status, and it does NOT inflate the %).

The printed **Verified built: N/Total (X%)** is the truthful floor — what's mechanically confirmed on disk.
KEEL-139 guarantees every piece HAS a resolvable-shaped `done_when`, so the number isn't a guess.

## 2. Interpret for the operator
- Read back the % and name what's ✗ **not built** (the remaining work) and what's ~ **manual** (needs a human
  to confirm — e.g. "a test passes", "a gate is green"; check the ticket or run the check to confirm it).
- If a piece carries a ticket, its status is the cross-check: a piece marked built whose ticket isn't Done (or
  vice-versa) is a discrepancy worth flagging.

## 3. When there's nothing to measure
- **No runbook** → the strategy has no implementation plan. Run `/strategy-refine <topic>` to write it (a NEW
  APPROVED strategy can't land without one, but a grandfathered older one may lack it).
- **Pieces with a blank/weak `done_when`** wouldn't have passed the gate for a new strategy; if you see one on
  an older strategy, fix it via `/strategy-refine` so it becomes measurable.

Read-only — it changes nothing. **Cross-repo:** run it in the repo that owns the strategy.
