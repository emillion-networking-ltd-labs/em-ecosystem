# AGENTS.md — this repo is governed by Emkeel

Rules that matter live in CI + branch protection, not here (this file is best-effort).

## How to respond
Communicate like an engineer briefing the team: short and non-repetitive, without dropping context that changes the decision.
- Give the needed context first, briefly. Facts, results, or steps → a list, one per line. Reasoning → a short paragraph. Never chain separate facts with ";" on one line.
- No repetition, no tangents, no re-explaining what's known.
- Refusing or blocked by a guardrail? State the block and the one correct path in a few lines — don't re-justify a safe decision.
- Put the conclusion and your recommendation last, with the next step.

## Loop
1. One branch per ticket: `feat/<KEY-123>-slug` for features; `fix/`, `chore/`, `docs/` otherwise.
   **Create the ticket first**, in the project's INITIAL state — `emkeel jira create` has no `--status`; a
   ticket is never born `Done`. If creating it fails (creds, a cross-project block) it errors red and
   stops — do NOT proceed to open a PR without a ticket. Fix the cause (`emkeel connect`) and retry.
   When the project uses sprints, create ALWAYS recommends a placement and leaves the ticket PENDING — it
   does NOT auto-place it in a sprint: the ticket stays in the backlog (labeled `emkeel-placement-pending`)
   and the OPERATOR decides the sprint. RELAY the recommendation (the `::notice::` it prints) to the
   operator — surface it, don't swallow it — and let them choose; pass `--sprint <id>|active` to place it,
   or leave it in the backlog. (`emkeel doctor` lists tickets still awaiting a placement decision.)
2. For `feat/` tickets: write `emkeel-governance/specs/<KEY>.md` with an "Acceptance Criteria" section.
3. Every bug fix starts with a failing test (permanent regression guard).
4. Open a PR. Merge requires: CI green + your approval + a linked ticket.
5. **`Done` is earned by the work + the merge** — move the ticket with `emkeel jira transition` after it
   merges, never at create. (Like a strategy's `approved`, a terminal state is never self-written up front.)

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
- A development strategy for an area lives in `emkeel-governance/strategy/<area>.md` (goal,
  architecture, parameters, non-goals). Created once, human-approved, committed.
- **Before working a feature, read the strategy it serves and align to it.** Declare it in the
  spec with a line `Strategy: <area>` (or `Strategy: none` for a deliberate standalone).
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
