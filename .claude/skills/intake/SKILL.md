# /intake — the operator's switch: an errand enters the ticket lifecycle here

You are in the ERRAND LANE. Announce it first, in one line: **"CARRIL ENCARGO — /intake"**.

## Why this skill exists
An agent cannot reliably tell an errand from conversation by content — measured twice, deterministically.
So the switch is the OPERATOR'S: this skill invoked = errand; without it = conversation, where you never
execute effects (no ticket, no branch, no code, no PR) and, if asked to build, you point HERE.

## The flow — two steps, always
1. **Invoked alone (the taught path): ask for the note.** Announce the lane and request the note to
   evaluate. The note must arrive as its OWN message — the operator pastes it; you never retype it from
   memory or context (the agent that built this mechanism once typed a note from memory and dropped the
   operator's strongest argument — the gate went green against the abridgement). If text arrived glued to
   the invocation, tolerate it as the note.
   **For a DEBATE, you MAY draft the note (D6) — a CONSCIOUS tradeoff the operator owns.** When the agreement
   emerged from a back-and-forth with no single note to paste, you may DRAFT it by QUOTING the operator's actual
   words from the conversation into `## Source` (never paraphrase — you hold the transcript), your own reading
   APART in `## Enrichment` (lettered, strikeable), presented EXPLICITLY as a draft, and SEALED only after the
   operator's point-by-point verdicts. Be HONEST about the residual, never safe-wash it: quoting defends the
   FIDELITY of what you quote and the `## Source`/`## Enrichment` split surfaces what you ADDED — but NEITHER
   makes an OMISSION visible. A dropped argument is text you never quoted; only the operator remembering it
   catches it — the same residual that produced the original incident. So the operator must verify COMPLETENESS,
   not only spin; that weight is theirs, consciously accepted for the convenience of not re-pasting a whole debate.
2. **The note enters VERBATIM.** Save it exactly as received and run the cycle:
   - `emkeel agree new <slug>` with the note as `## Source` (fenced, verbatim), your decomposition as
     numbered `## Points` (the operator's words), and what YOU add — assumptions, technical detail — as
     lettered `## Enrichment`, apart and strikeable.
   - `emkeel agree review <slug>` and show the operator its output **VERBATIM — never paraphrase it**.
     The canonical format is printed by the command (D16); a summary of it would be your reading standing
     in for their words, which is the exact failure this cycle kills.
   - Collect their verdicts point by point (`emkeel agree point <slug> <N> ok|out [--as "…"]`) — the
     verdicts are THEIRS; never record an approval they did not give.
   - `emkeel agree seal <slug>`, then `emkeel start --agreement <slug> …` so the sealed text lands in the
     ticket description under Jira's clock.
   - At close: `emkeel agree close` per point — done needs a test born in the PR; a deviation is RULED
     by the operator BEFORE it is built; pending blocks the merge.

## Presentation — the operator must be able to READ it
- **Plain text, always.** Show the `agree review` output as normal chat text — NEVER inside a
  syntax-highlighted code block: terminals colorize those (yellow on shadow) and the operator cannot
  read their own agreement. Verbatim refers to the CONTENT, not the wrapper.
- After the verbatim output, add APART your adjudication of the ⚠ coverage block — which lines are
  substance vs context — and offer to promote any to a point IN THE OPERATOR'S WORDS.
- Close with a compact-verdict example so one reply settles everything, e.g.:
  `1-9 ok, b fuera, 3 corrige: <tu redacción>`.
- Respond in the operator's language.

## Hard lines
- Nothing executes before the seal. Analysis is fine; effects are not.
- Your reading of the note (what is already built, what you would do differently) goes in the
  ENRICHMENT, strikeable — never as a verdict delivered instead of the agreement.
- Communication style: the repo contract's "How to respond" applies; the agreement's presentation format
  belongs to the command output, not to you.
