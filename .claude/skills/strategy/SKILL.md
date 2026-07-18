---
name: strategy
description: >
  Research and decide a development/engineering strategy for a topic (a module, security, a
  technology choice, an approach…). Produces a grounded, sourced strategy doc, driven through
  emkeel's governed-process engine — the steps are NON-SKIPPABLE. Use when you must choose the
  right path and want it researched, not guessed.
---

# /strategy <topic>

Produce a RESEARCHED strategy for `<topic>`, persisted at `emkeel-governance/strategy/<topic>.md`.
**Every claim must cite a real source (file:line in the repo, or a URL) gathered with TOOLS — never
from memory. Never invent an option or a source.**

This skill is a state machine, not advisory prose. After each step's real work, record it with
`emkeel strategy advance <step> <topic> --set <evidence>` — the engine REFUSES an out-of-order or
evidence-less advance (exit 1), and CI (`check_strategy_process`) fails the PR unless the committed
`<topic>.process.json` reached `validated` (the strategy was tried on a real case) with real research
provenance. `emkeel strategy status <topic>` shows where you are. Run each `advance` ONLY after that step's
work is done.

1. **Scaffold** — `emkeel strategy new <topic>` creates the structured doc; declare up front the
   **kill-criteria** (what would prove this strategy WRONG — the conditions under which to abandon it):
   `emkeel strategy advance scaffolded <topic> --set=topic=<topic> --set='kill_criteria=[<cond1>,<cond2>,…]'`
2. **Research** (ground in reality; fan out with subagents):
   - *Repo:* Read/Grep the actual code & config for `<topic>` — what exists, conventions, constraints. Cite `file:line`.
   - *Market:* WebSearch/fetch real options & trade-offs. Cite URLs.
   Record the provenance — the engine and CI REFUSE `researched` without it:
   `emkeel strategy advance researched <topic> --set='sources=[<url>,<file:line>,…]'`
   If `<topic>` genuinely has no market/external dimension, declare it EXPLICITLY (never skip the web silently):
   `emkeel strategy advance researched <topic> --set=internal_only=true`
3. **Propose** — fill the Options table with **≥2 real options**, each with its **Source**, pros, cons, risk:
   `emkeel strategy advance proposed <topic> --set option_<name>='<summary>' --set option_<name2>='<summary>'`
   One field per option (the `lens_` shape) so a summary may contain commas safely. The engine REFUSES
   fewer than 2 — one option is a justification, not a decision.
4. **Critique** — a multi-lens adversarial PANEL (fan out subagents, one per angle): re-open each option's
   cited source (does it really say that?) AND attack from DISTINCT lenses — recommended: discovery/SEO,
   professional completeness, calibration to the real case, legal/compliance, plus any topic-specific angle.
   Then a **completeness critic**: what dimension is missing? Record ONE finding per lens + the completeness
   answer (the engine refuses a one-liner; CI requires ≥3 distinct lenses unless the doc declares `Impact: low`):
   `emkeel strategy advance critiqued <topic> --set lens_discovery="…" --set lens_completeness="…" --set lens_calibration="…" --set lens_legal="…" --set completeness="<what's missing, or 'none'>"`
5. **Check** — run `emkeel strategy check <topic>` and fix until it passes (green = sourced + complete). Then:
   `emkeel strategy advance checked <topic> --set=check_passed=true`
6. **Validate against reality** — apply the recommendation to ONE real case (cheap is fine: try it once and
   look at the result). Record the case, how you tested it, the **outcome** (`pass` | `fail` | `mixed`), and a
   **resolvable proof** (a repo `file:line`, a URL, or an external citation). The engine and CI REFUSE
   `validated` without it — reality is non-skippable, and a `fail`/`mixed` is an HONEST record, never hidden:
   `emkeel strategy advance validated <topic> --set=case="<the real case>" --set=method="<how you tested>" --set=outcome=<pass|fail|mixed> --set=evidence_ref=<file:line|URL>`
7. **Human gate — present with `emkeel strategy present <topic>`.** This GENERATES a summary from the doc
   (goal, options, recommendation, reality outcome) — so the presentation can't be hollow — prints the
   **APPROVE / REFINE / DISCARD** menu with the exact replies, and records `presented` (auto-binding a hash
   of the substantive content, so what LANDS is provably what you presented). Show the operator that output;
   **do NOT decide for them.** (Add `--set=proceed_justification="<why>"` when the reality outcome was
   `fail`/`mixed`.) The operator replies with one:
   - **APPROVE** → they approve + merge the PR. Nothing more to record; the merge IS the approval (step 8).
   - **REFINE: `<what>`** → your FIRST act is to open the round — `emkeel strategy refine <topic>
     --set=reason="<what>"` — so the refinement is durable the instant it's chosen. **Echo back what you
     understood and confirm before editing.** An open round is **NOT mergeable** (RED). Then refine the doc
     **end-to-end** (update every affected section, remove contradictions — never a bolt-on), and re-run the
     TAIL for coherence: `emkeel strategy advance critiqued …` (re-runs the panel over the new version) →
     `advance validated …` → `emkeel strategy present …` (re-binds + closes the round). Editing the doc and
     only re-presenting is **RED** — a stale critique can't land a contradiction nobody checked. Iterate as
     many rounds as the debate needs.
   - **DISCARD: `<why>`** → retire it: delete `<topic>.md` AND `<topic>.process.json` together (clean retiro).
8. **Approval is the MERGE — never stamp it yourself.** The operator approves by **approving + merging the
   PR**. (NOT enforced yet — the default `required_approvals` is 0 — GitHub forbids approving your own PR, so 1 would hard-block a lone operator. A team sets it and `connect` installs it; with a single actor no mechanism can tell your merge from an agent's)
   Do NOT run `emkeel strategy advance approved`
   in the lane PR — a self-written `approved_by` certifies nothing, and the `check_strategy_process` gate
   FAILS a committed `approved` (the merge hasn't happened yet). The committed `<topic>.process.json` stops
   at `presented`; the merge IS the approval, recorded immutably in the PR/git history.
   To LAND, the doc must declare `Status: APPROVED`, link an ADR that RESOLVES (or `ADR: none — <why>`), AND
   carry a filled **runbook** (`<topic>.runbook.md`, scaffolded by `emkeel strategy new`). All three are
   GATED (`check_strategy_process`), so none depends on you remembering: a DRAFT in main is the model
   contradicting itself, a decision that isn't recorded didn't happen, and a strategy with no implementation
   plan never gets built. Declaring APPROVED before the merge is not a lie — it is what every ADR here does
   with `Status: accepted`; the operator's merge ratifies it. Finalize the Recommendation, write the ADR in
   `emkeel-governance/adr/` (a `00NN` placeholder resolves to nothing and FAILS), **fill the runbook's
   Implementation plan** — **REGISTER each decision in `## Recommendation` as `- D1 — <what you decided>`,
   and give each one a piece whose `Implements` column cites it** (the gate checks BOTH directions: no
   decision without a piece, no citation without a decision — so nothing decided is dropped from the plan).
   Each piece carries a ticket and a `done_when` from the RESOLVABLE vocabulary — a repo `path:line`, a URL,
   `test:<name>` or `gate:<name>`; prose is REJECTED. Keep the `## Recommendation` DECIDED: `emkeel strategy diagnose`
   REPORTS an open marker there ("por decidir", "decisión abierta") but does NOT block the landing — gating
   it was tried and withdrawn because those words are ordinary Spanish and legitimate sentences went red.
   What IS gated is the decision REGISTER: every `- D1 — <what>` must have a runbook piece that builds it. And re-present if you touch the runbook after presenting: the plan that lands must be the
   plan the operator saw. Remind them to add `Strategy: <topic>`
   to feature specs (`check_strategy_link` enforces that one).

**Refining an existing strategy?** A new refinement (a new ticket on the same `<topic>`) starts the process
CLEAN — re-run from `scaffolded`; the engine resets and a prior refinement's `approved` NEVER carries over.

**Retiring a strategy?** A path that didn't work can be withdrawn: in a `strategy/<KEY>-slug` lane (with a
ticket), DELETE `<topic>.md` AND its `<topic>.process.json` together — as a pair. The gate accepts a clean
retiro; deleting the doc while leaving the sidecar (or vice versa) is an orphan → FAIL.

**Commit `emkeel-governance/strategy/<topic>.process.json` alongside the doc** — it is the proof the steps
ran, and CI reads it. `emkeel strategy status <topic>` shows ✓/· per step. Never skip the human gate
(presenting + the merge are the operator's). Never cite a source you didn't open.
