---
name: strategy
description: >
  Research and decide a development/engineering strategy for a topic (a module, security, a
  technology choice, an approach…). Produces a grounded, sourced strategy doc, driven through
  emkeel's governed-process engine, which REFUSES to skip a step. Use when you must choose the
  right path and want it researched, not guessed.
---

# /strategy <topic>

Produce a RESEARCHED strategy for `<topic>`, persisted at `emkeel-governance/strategy/<topic>.md`.
**Every claim must cite a real source (file:line in the repo, or a URL) gathered with TOOLS — never
from memory. Never invent an option or a source.**

This skill does NOT just narrate steps — it **drives a state machine**. After doing each step's work
you record it with `emkeel strategy advance <step> <topic> --set <evidence>` (emkeel ≥0.1.75). The engine
enforces the order and the evidence: **calling a step out of order, or without its evidence, is REFUSED
(exit 1) by `emkeel strategy advance` — not by your discipline.** So you cannot silently skip a step.
Check progress anytime with `emkeel strategy status <topic>`.

Run each `advance` ONLY after that step's real work is done; `--set` records the *evidence it happened*.

1. **Scaffold** — `emkeel strategy new <topic>` creates the structured doc. Then record it:
   `emkeel strategy advance scaffolded <topic> --set=topic=<topic>`
2. **Research** (ground in reality; fan out with subagents):
   - *Repo:* Read/Grep the actual code & config for `<topic>` — what exists, conventions, constraints. Cite `file:line`.
   - *Market:* WebSearch/fetch real options & trade-offs. Cite URLs. (No web access? Use the repo only and declare it.)
   Record the provenance — the engine REFUSES `researched` without it:
   `emkeel strategy advance researched <topic> --set='sources=[<url>,<file:line>,…]'`
   (repo-only / no external research? `--set=internal_only=true` instead — an explicit, honest declaration.)
3. **Propose** — fill the Options table with **≥2 real options**, each with its **Source**, pros, cons, risk. Then:
   `emkeel strategy advance proposed <topic> --set='options=[<opt1>,<opt2>,…]'`
4. **Critique** (adversarial; subagents): for each option a skeptic **re-opens the cited source** — does it
   really say that? — and attacks weaknesses + drift risks. Drop/fix anything unverified. Then record it:
   `emkeel strategy advance critiqued <topic> --set=critique="<what the adversarial pass found / fixed>"`
5. **Check** — run `emkeel strategy check <topic>` and fix until it passes (green = sourced + complete).
   Only once it's green, record the pass:
   `emkeel strategy advance checked <topic> --set=check_passed=true`
6. **Human gate — present** — present the options + your recommendation to the operator. **Do NOT decide
   for them.** Record that you showed it (this does NOT approve anything):
   `emkeel strategy advance presented <topic> --set=presented_to=<operator>`
7. **Human gate — approve** — the operator approves / refines / aborts. Run this ONLY after a real "yes",
   recording WHO approved (the engine REFUSES `approved` without the human gate):
   `emkeel strategy advance approved <topic> --set=approved_by=<operator>`
   Then set `Status: APPROVED`, finalize the Recommendation, offer to record the decision as an ADR in
   `emkeel-governance/adr/`, and remind them to add `Strategy: <topic>` to feature specs (the
   `check_strategy_link` gate enforces it).

`emkeel strategy status <topic>` shows where you are (✓ done / · pending) at any point.

Never skip the human gate (steps 6–7 are the operator's, not yours). Never cite a source you didn't open.
The engine is the guarantee that no obligatory step was skipped — not this prose.
