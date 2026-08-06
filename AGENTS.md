# AGENTS.md — this repo is governed by Emkeel

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
- **The STRATEGY cycle** (`emkeel strategy`, `/strategy*`) decides DIRECTIONS: a researched doc with
  decisions and a runbook of pieces, driven by the non-skippable engine. It creates no tickets — it
  decides which tickets deserve to exist.
- **The TICKET cycle** (the Spec Kit funnel + the thin gates) governs how EVERY concrete piece of work
  is born and lives: intent → spec (`/speckit-specify`, operator-reviewed) → plan → tasks → GitHub Issue
  (`/speckit-taskstoissues`) → branch → PR → gates → the operator's merge. A runbook piece enters the same
  funnel.
They feed each other: strategy work touches the strategy engine and its gates; ticket work flows through
the funnel and the identity chain. Extending one is not touching the other.

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
   code** — that order is not advice: `check_ticket_precedes_work` FAILS a PR whose issue was created
   AFTER the branch's first commit (GitHub's server-set `createdAt` vs the first commit's author-date —
   you cannot backdate either). Mint the branch from the issue: `git checkout -b feat/<N>-<slug>` with the
   SAME slug the funnel gave the feature (`specs/<NNN>-<slug>/`) — the gates resolve the spec by that slug,
   and `check_ticket_link` verifies the issue exists. Small conversation-born fixes take the light path:
   open an Issue (`gh issue create`), then branch — the issue IS the declaration.
   Every commit stays traceable: reference the issue parenthesized in the subject, e.g.
   `fix: resolve the flaky retry (#286)` — `check_commit_convention` requires a work identity on every
   subject.
2. For `feat/` work the spec is the funnel's: `specs/<NNN>-<slug>/spec.md` with a non-empty
   "Success Criteria" section (`check_plan_present` + `check_acceptance_criteria` resolve it by the branch
   slug and FAIL loud when it is missing — run `/speckit-specify` first, never hand-invent the layout).
3. Every bug fix starts with a failing test (permanent regression guard).
4. Open a PR. Merge requires: CI green + a linked ticket, and YOUR approval.
   (NOT enforced yet — the default `required_approvals` is 0 — GitHub forbids approving your own PR, so 1 would hard-block a lone operator. A team sets it and `connect` installs it; with a single actor no mechanism can tell your merge from an agent's)
   With a single actor there is no mechanism that can tell your merge from an agent's: that is exactly why
   the agent must never merge. `emkeel rules --gaps` lists every rule in this state.
5. **`Done` is earned by the work + the merge** — the PR body says `Closes #<N>` and the MERGE closes the
   issue; never close it by hand up front. (Like a strategy's `approved`, a terminal state is never
   self-written before the work lands.)

## Don't break something else in silence
- **Critical / cross-cutting change → add an INTEGRATION test.** If you touch creds, isolation, the
  distribution wiring, the agent contract, or a CI gate, add/extend a test under `tests/integration/`
  that exercises the affected flow end-to-end — not just a unit test. (The `check_critical_integration`
  gate enforces this; born from a creds change that silently broke ticket creation.)
- **Critical infra must be self-sufficient.** Don't depend on optional environment tools (e.g. `direnv`);
  read what you need directly (in-process) so the flow works on a bare machine.
- **Never hide failures with `2>/dev/null`** on a step that can fail, and **verify the `cwd`/destination
  before writing** — a silenced `cd` that failed once clobbered a real `.env`.

## Strategy (the north star — don't drift)
- **Presenting a strategy: use `emkeel strategy present <topic>` and honor the fork.** It generates the
  summary + the APPROVE/REFINE/DISCARD menu — never present a hollow "draft ready, approve?". **When the
  operator directs a REFINE, your FIRST act is `emkeel strategy refine <topic> --set=reason="<what>"`**
  (open the round before you discuss the change — it's durable the instant it's chosen), then echo back what
  you understood, refine the doc end-to-end (no contradictory bolt-ons), and re-run the tail
  (critiqued→checked→validated→present). The gate can't see this conversation — an unrecorded refinement is the one
  thing it can't catch, so opening the round is non-negotiable.
- A development strategy for an area lives in `emkeel-governance/strategy/<area>.md` (goal,
  architecture, parameters, non-goals). Created once, human-approved, committed.
- **Before working a feature, read the strategy it serves and align to it.** Declare it in the
  feature's spec (`specs/<NNN>-<slug>/spec.md`) with a line `Strategy: <area>` (or `Strategy: none` for a
  deliberate standalone) — spec.md is hand-editable; add the line after `/speckit-specify` writes it.
- When a spec declares `Strategy: <area>`, it must also carry an `## Alignment` section that lists
  which north-star decisions/constraints the feature implements or touches — the `check_strategy_alignment`
  gate requires it to exist and be non-empty (the human judges whether the content is true at the PR).
- Once any strategy exists, the `check_strategy_link` gate requires that line — so no feature
  merges without a conscious strategy decision.
- **Changing the north star is a deliberate act on its own lane.** A PR that creates, edits, or
  deletes a `strategy/*.md` MUST be on a `strategy/<KEY-123>-slug` branch (its own ticket,
  human-approved) — the `check_strategy_change` gate FAILS a `feat/`/`fix/` PR that touches it.
  Never drift the strategy silently inside a feature to make the code fit.

## Separation
- `emkeel-governance/` holds artifacts (specs/adr/records/strategy); it is `export-ignore` (never distributed).

## Documentation (docs/)
- `docs/` = product reference documentation (architecture, how-it-works) — human-facing, living.
  Governance (strategy/adr/specs/records) lives in `emkeel-governance/`, **never** in `docs/`.
- Specs that mirror the code (OpenAPI, data model) are **regenerated** from the source — don't
  hand-maintain a frozen snapshot (it drifts and misleads).
- `docs/archive/` holds preserved-but-inactive docs; each carries a header marking it historical.
- A dead doc → delete it (git history is the archive); don't keep a "to-delete-later" pile.
