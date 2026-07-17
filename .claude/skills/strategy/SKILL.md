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
7. **Human gate — present, then the fork: APPROVE / REFINE / DISCARD.** Present the options + your
   recommendation. **Do NOT decide for them.** Record that you showed it (this does NOT approve anything):
   `emkeel strategy advance presented <topic> --set=presented_to=<operator>`
   (add `--set=proceed_justification="<why>"` when the reality outcome was `fail`/`mixed`). This **auto-binds
   a hash of the doc's substantive content** (KEEL-133) — so the version that LANDS is provably the version
   you presented. Then the operator chooses:
   - **APPROVE** → they approve + merge the PR. Nothing more to record; the merge IS the approval (step 8).
   - **REFINE** → open a round (durable the moment it's chosen): `emkeel strategy advance presented <topic>
     --set=presented_to=<operator> --set=refinement_open=true --set=refinement="<what the debate asks>"`.
     An open round is **NOT mergeable** (the gate is RED) — you don't leave the loop until it converges.
     Then edit the doc to the AGREED version and **RE-present** (`emkeel strategy advance presented …`),
     which re-binds the new hash and closes the round. The debate's CONCLUSION becomes the record; the
     conversation stays in the PR. You can iterate as many rounds as needed. **If you edit the doc after
     presenting and forget to re-present, the gate goes RED** (the hash won't match) — the stale draft can
     never merge silently.
   - **DISCARD** → retire it: delete `<topic>.md` AND `<topic>.process.json` together (a clean retiro).
8. **Approval is the MERGE — never stamp it yourself.** The operator approves by **approving + merging the
   PR** (branch protection requires a human approving review). Do NOT run `emkeel strategy advance approved`
   in the lane PR — a self-written `approved_by` certifies nothing, and the `check_strategy_process` gate
   FAILS a committed `approved` (the merge hasn't happened yet). The committed `<topic>.process.json` stops
   at `presented`; the merge IS the approval, recorded immutably in the PR/git history.
   To LAND, the doc must declare `Status: APPROVED` and link an ADR that RESOLVES (or `ADR: none — <why>`).
   Both are GATED (`check_strategy_process`), so neither depends on you remembering: a DRAFT in main is the
   model contradicting itself, and a decision that isn't recorded didn't happen. Declaring APPROVED before
   the merge is not a lie — it is what every ADR here does with `Status: accepted`; the operator's merge
   ratifies it. Finalize the Recommendation, write the ADR in `emkeel-governance/adr/` (a `00NN` placeholder
   resolves to nothing and FAILS), and remind them to add `Strategy: <topic>` to feature specs
   (`check_strategy_link` enforces that one).

**Refining an existing strategy?** A new refinement (a new ticket on the same `<topic>`) starts the process
CLEAN — re-run from `scaffolded`; the engine resets and a prior refinement's `approved` NEVER carries over.

**Retiring a strategy?** A path that didn't work can be withdrawn: in a `strategy/<KEY>-slug` lane (with a
ticket), DELETE `<topic>.md` AND its `<topic>.process.json` together — as a pair. The gate accepts a clean
retiro; deleting the doc while leaving the sidecar (or vice versa) is an orphan → FAIL.

**Commit `emkeel-governance/strategy/<topic>.process.json` alongside the doc** — it is the proof the steps
ran, and CI reads it. `emkeel strategy status <topic>` shows ✓/· per step. Never skip the human gate
(presenting + the merge are the operator's). Never cite a source you didn't open.
