---
name: strategy-check
description: >
  Report the implementation status of a strategy — how much of what it decided is actually built. Resolves
  every runbook piece's `done_when` against the repo and gives a truthful % done, plus what's pending and
  what still needs a human to confirm. Use to know where a strategy stands before claiming it's implemented.
---

# /strategy-check [topic]

The loop-closer. `/strategy` governs a strategy's BIRTH and `/strategy-refine` finishes a stalled one; this
tells you how much of an APPROVED strategy is actually BUILT — and whether it is WORKING — so "implemented"
is a measured fact, not a claim.

## 0. No topic? Start with the whole estate
`emkeel strategy progress` (no topic) measures EVERY strategy at once, worst first — one command answers
"where does the whole thing stand" without knowing any topic by name. Rows flagged **⚠ plan drift** or
**UNMEASURABLE** are where to look first. Then drill into a topic.

## 1. Measure — resolve the runbook, don't guess
`emkeel strategy progress <topic>` reads `<topic>.runbook.md` and resolves EVERY piece's `done_when`
against the repo (deterministic, offline):
- a `test:<name>` / `gate:<name>` that resolves → **✓ built (behavior-proved)** — the strongest evidence;
- a repo `file:line` that resolves → **✓ present on disk (existence-only)** — the file EXISTS; nothing
  asserts it is CORRECT. The summary counts these apart: prefer migrating them to a `test:`/`gate:` proof;
- a repo path / test / gate that does NOT resolve → **✗ not built**;
- genuinely manual (a URL, or no suite to look in) → **~ manual** — it does NOT inflate the %, but a human
  can SETTLE it on record (step 2).

**Verified built: N/Total (X%)** is the truthful floor. It also prints **⚠ DRIFT** when the doc decided
things the runbook doesn't build, or the runbook changed after it was presented — a happily-measured % of
an outdated plan was the reported hole; drift means refine/re-present BEFORE trusting the number.

## 2. Settle the manual pieces — auditable, never silent
A `~ manual` piece a human has actually verified is settled with
`emkeel strategy confirm <topic> <piece#> --set by=<who> --set evidence=<ref>` — who, evidence, when go on
record; the piece then counts as **✓ human-confirmed** and the % can reach 100 without inflating itself.
Editing the piece's `done_when` VOIDS its confirmation by construction. A confirmation can never replace a
resolvable proof nor overrule one that resolves as not-built (ADR-0049/0063).

## 3. Efficacy — built is not working
100% built and failing is a real state (if the baselines never drop, the ratchet does nothing). The
strategy declared how its own success is measured (its metric decisions + kill-criteria):
- `emkeel strategy efficacy <topic>` REPORTS: the kill-criteria as questions + the dated reading history.
- `emkeel strategy efficacy <topic> --set reading='<what the metric says>' --set
  verdict=healthy|failing|inconclusive [--set kill_triggered='<criterion>']` RECORDS a dated reading —
  `failing` is an honest record, not a gate failure. `progress` surfaces the last reading and warns loudly
  when the strategy's own measure says it is failing: then the declared rule applies — fix, pivot, or
  retire; a kill-criterion nobody acts on kills nothing.

## 4. Interpret for the operator
- Read back the %, then name: ✗ not built (remaining work) · existence-only (present, unasserted —
  candidates for a real test) · ~ manual still unsettled · any ⚠ DRIFT · the last efficacy verdict.
- If a piece carries a ticket, its status is the cross-check: a piece marked built whose ticket isn't Done
  (or vice-versa) is a discrepancy worth flagging.

## 5. When there's nothing to measure
- **No runbook** → the strategy has no implementation plan. Run `/strategy-refine <topic>` to write it (a
  NEW APPROVED strategy can't land without one, but a grandfathered older one may lack it).
- **Pieces with a blank/weak `done_when`** wouldn't have passed the gate for a new strategy; if you see one
  on an older strategy, fix it via `/strategy-refine` so it becomes measurable.

Measurement is read-only; `confirm` and `efficacy` write only their audited sidecar records
(`<topic>.confirmations.json`, `<topic>.efficacy.json` — commit them: they are part of the record).
**Cross-repo:** run it in the repo that owns the strategy.
