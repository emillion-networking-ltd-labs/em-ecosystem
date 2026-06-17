# AGENTS.md — this repo is governed by Emkeel

Rules that matter live in CI + branch protection, not here (this file is best-effort).

## Loop
1. One branch per ticket: `feat/<KEY-123>-slug` for features; `fix/`, `chore/`, `docs/` otherwise.
2. For `feat/` tickets: write `emkeel-governance/specs/<KEY>.md` with an "Acceptance Criteria" section.
3. Every bug fix starts with a failing test (permanent regression guard).
4. Open a PR. Merge requires: CI green + your approval + a linked ticket.

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
