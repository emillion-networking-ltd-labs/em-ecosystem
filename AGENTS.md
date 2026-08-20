# AGENTS.md — the agent contract for this repo

Rules that matter live in CI + branch protection, not here (this file is best-effort).

## How to respond
Communicate like an engineer briefing the team: short and non-repetitive, without dropping context that changes the decision.
- Give the needed context first, briefly. Facts, results, or steps → a list, one per line. Reasoning → a short paragraph. Never chain separate facts with ";" on one line.
- No repetition, no tangents, no re-explaining what's known.
- Default to a few lines of prose + a short list. Reserve tables and multi-header layouts for genuinely complex comparisons, not routine updates.
- Refusing or blocked by a guardrail? State the block and the one correct path in a few lines — don't re-justify a safe decision.
- Put the conclusion and your recommendation last, with the next step.

## When to act vs wait
Analysis and action are different modes — don't slide from one into the other.
- After an analysis, a diagnosis, or anything that is the operator's to decide, STOP at the conclusion + recommendation and WAIT for an explicit go-ahead before starting work (creating a ticket, a branch, a PR, or changing shared state).
- A clarification or a restated requirement is NOT approval to execute. When unsure whether "go" was given, ask — don't assume.
- When the operator has already said to proceed ("do it", "go ahead"), act without re-asking.

## The two layers (do not confuse them)
- **STRATEGY** decides DIRECTIONS: a researched doc with decisions and a runbook of pieces, living in
  `emkeel-governance/strategy/<area>.md`. It creates no tickets — it decides which tickets deserve to
  exist. There is no engine driving it any more: a strategy is a DOCUMENT, and changing one is a
  deliberate act the operator approves (see **Strategy** below).
- **The TICKET cycle** (the Spec Kit funnel) governs how EVERY concrete piece of work is born and lives:
  intent → spec (`/speckit-specify`, operator-reviewed) → plan → tasks → GitHub Issue
  (`/speckit-taskstoissues`) → branch → PR → CI → the operator's merge. A runbook piece enters the same
  funnel.

**What actually enforces now.** The process gates were retired with emkeel (#676); the funnel is the
discipline, CI is the enforcement. What still blocks a merge: `Security Gate (All Checks)`,
`Tests & Build Gate`, and `code-health` (this repo's own ratchet — see below). Plus the non-required but
real checks: conflict markers, visual regression, em-ui governance, Storybook, the structural probe.
Nothing machine-checks ticket-first, spec presence, or commit format any more — that discipline is now
yours to keep, not a gate's to catch.

## Loop
0. **Work that arrives as PROSE becomes a SPEC before any building** (`/speckit-specify`). The operator's
   words are the input; the spec you write back IS your understanding made visible — every guess goes in
   `Assumptions` (declared, never silently decided), and real ambiguity is ASKED first (`/speckit-clarify`),
   not guessed. **Nothing proceeds to plan/tasks/code until the operator OKs the spec** — their review of it
   is the intent safeguard. Then `/speckit-plan` → `/speckit-tasks` → `/speckit-taskstoissues` births the
   GitHub Issue(s): the ticket, born linked to the spec. You cannot tell recalling a requirement from
   inventing a plausible one — so the spec exists outside you, and the operator reads it before anything is
   built.
1. One branch per work item: `feat/<N>-<slug>` for features (N = the GitHub Issue number the funnel
   birthed); `fix/`, `chore/`, `docs/` otherwise. **The Issue exists FIRST, then the branch, then the
   code.** Nothing checks that order any more, which makes it a matter of honesty rather than of
   getting caught: an issue opened after the fact documents a decision you already made alone. Mint the
   branch from the issue: `git checkout -b feat/<N>-<slug>` with the SAME slug the funnel gave the
   feature (`specs/<NNN>-<slug>/`) — keeping them equal is what lets anyone resolve the spec from the
   branch. Small conversation-born fixes take the light path: open an Issue (`gh issue create`), then
   branch — the issue IS the declaration.
   Every commit stays traceable: reference the issue parenthesized in the subject, e.g.
   `fix: resolve the flaky retry (#286)`.
2. For `feat/` work the spec is the funnel's: `specs/<NNN>-<slug>/spec.md` with a non-empty
   "Success Criteria" section — run `/speckit-specify` first, never hand-invent the layout.
3. Every bug fix starts with a failing test (permanent regression guard).
4. Open a PR. Merge requires: CI green + a linked issue, and YOUR approval.
   (`required_approvals` is 0 — GitHub forbids approving your own PR, so 1 would hard-block a lone
   operator.) With a single actor there is no mechanism that can tell your merge from an agent's: that is
   exactly why **the agent must never merge without your explicit go-ahead.**
5. **`Done` is earned by the work + the merge** — the PR body says `Closes #<N>` and the MERGE closes the
   issue; never close it by hand up front. (Like a strategy's `approved`, a terminal state is never
   self-written before the work lands.)

## Don't break something else in silence
- **Critical / cross-cutting change → add an INTEGRATION test.** If you touch creds, isolation, the
  distribution wiring, the agent contract, or a CI check, add/extend a test that exercises the affected
  flow end-to-end — not just a unit test. (Born from a creds change that silently broke ticket creation.)
- **Critical infra must be self-sufficient.** Don't depend on optional environment tools (e.g. `direnv`);
  read what you need directly (in-process) so the flow works on a bare machine.
- **Never hide failures with `2>/dev/null`** on a step that can fail, and **verify the `cwd`/destination
  before writing** — a silenced `cd` that failed once clobbered a real `.env`.

## Strategy (the north star — don't drift)
- A development strategy for an area lives in `emkeel-governance/strategy/<area>.md` (goal,
  architecture, parameters, non-goals). Created once, human-approved, committed. **Presenting one is
  never a hollow "draft ready, approve?"** — give the operator the summary and a real APPROVE / REFINE /
  DISCARD fork, and when they direct a REFINE, echo back what you understood and refine the doc
  end-to-end (no contradictory bolt-ons).
- **Before working a feature, read the strategy it serves and align to it.** Declare it in the
  feature's spec (`specs/<NNN>-<slug>/spec.md`) with a line `Strategy: <area>` (or `Strategy: none` for a
  deliberate standalone) — spec.md is hand-editable; add the line after `/speckit-specify` writes it.
- When a spec declares `Strategy: <area>`, it must also carry an `## Alignment` section listing which
  north-star decisions/constraints the feature implements or touches. Nothing checks this now: the
  operator judges it at the PR, and a missing section just means the thinking wasn't done.
- **Changing the north star is a deliberate act, never a side effect.** A PR that creates, edits, or
  deletes a `strategy/*.md` carries that as its stated purpose and needs the operator's explicit
  approval. Never drift the strategy silently inside a feature to make the code fit.

## Separation
- `emkeel-governance/` holds the governance artifacts (specs/adr/records/strategy) accumulated so far —
  the ADRs and strategies are the project's real decision history, kept after emkeel itself was retired
  (#676; the name stays for now). It is `export-ignore` (never distributed).

## Documentation (docs/)
- `docs/` = product reference documentation (architecture, how-it-works) — human-facing, living.
  Governance (strategy/adr/specs/records) lives in `emkeel-governance/`, **never** in `docs/`.
- Specs that mirror the code (OpenAPI, data model) are **regenerated** from the source — don't
  hand-maintain a frozen snapshot (it drifts and misleads).
- `docs/archive/` holds preserved-but-inactive docs; each carries a header marking it historical.
- A dead doc → delete it (git history is the archive); don't keep a "to-delete-later" pile.
