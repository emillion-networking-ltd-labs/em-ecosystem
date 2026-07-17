---
name: strategy-refine
description: >
  Review and CONSOLIDATE an EXISTING but incomplete strategy — one left in DRAFT, with open decisions,
  a placeholder ADR, or a stale critique. Diagnoses the gaps (generated from the doc + process record +
  the gate's own criteria), then drives it to a complete, coherent, APPROVED state through emkeel's
  governed refinement loop. Use to finish a strategy that stalled, before building on it.
---

# /strategy-refine <topic>

For a strategy that ALREADY exists at `emkeel-governance/strategy/<topic>.md` but isn't done — the
`/strategy` create flow is for a NEW one; this is for finishing a stalled one (e.g. a DRAFT with unresolved
"open decisions" and a `00NN` placeholder ADR). It reuses the SAME governed engine; it does not freestyle.

## 1. Diagnose — read the gaps, don't eyeball them
`emkeel strategy diagnose <topic>` GENERATES the gap list from the doc + `<topic>.process.json` + the gate's
criteria: Status not APPROVED, the process short of the `validated` bar, no ADR link that RESOLVES, a STALE
critique/presented hash (edited after critiquing), and a heuristic scan for OPEN-DECISION markers. Read it —
that is your work-list.

## 2. Open a governed round
Touching a landed strategy needs a ticket + lane (`emkeel start`), then open the round as your FIRST act:
`emkeel strategy refine <topic> --set=reason="consolidate: <what the diagnosis found>"`. An open round is
NOT mergeable — you don't leave until it converges.

## 3. Resolve the gaps END-TO-END
Edit the doc to close every gap — no contradictory bolt-ons:
- **Open decisions** → resolve each (or consciously re-defer with a recorded reason). These are the
  operator's calls at the interrupts — present them, don't decide for them.
- **The ADR** → point `## Decisions` at the ADR that RESOLVES (write it, or fix a `00NN` placeholder to the
  real number). If none is warranted, declare `ADR: none — <why>`.
- **Provenance / missing steps** → resume them with `emkeel strategy advance <step>` (real sources, real
  reality evidence).

## 4. Re-run the tail for coherence (KEEL-134)
A substantive edit makes the critique STALE. Re-run: `emkeel strategy advance critiqued …` (the panel +
completeness critic over the consolidated version) → `advance validated …` → `emkeel strategy present …`
(re-binds the content hash, closes the round). `diagnose` should now be clean.

## 5. Land it
The doc declares `Status: APPROVED` with a resolving ADR; the operator approves by merging the lane PR (the
merge IS the approval — never stamp `approved` yourself). Re-run `emkeel strategy diagnose <topic>` to
confirm zero gaps before you ask for the merge.

**Cross-repo:** if the strategy lives in another governed repo, run this THERE (that repo owns its strategies).
