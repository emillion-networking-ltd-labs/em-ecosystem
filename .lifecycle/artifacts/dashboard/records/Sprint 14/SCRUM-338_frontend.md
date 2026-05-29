# Implementation Record: SCRUM-338 Reconcile ui-design-system.md — Auth-specific atoms cluster

## Summary

B5 of 9 sub-tickets from SCRUM-329 Part B reconciliation — and the structurally simplest sub-ticket so far. Reconciled 5 components (CopyField, QrCodeCard, RecoveryCodesGrid, TurnstileWidget, CountdownTimer) as pure additions: no rewrites, no deletes, no renumbers, single big-edit insert at the end of the Components list. Section count grows from §1-§27 to §1-§32 (+5). Two of the five new sections (§31 TurnstileWidget, §32 CountdownTimer) are JSX-sourced because the components ship without spec exports — same precedent set in B4 §26 IdleWarningModal. §32 CountdownTimer fulfills the forward-reference left by §26 IdleWarningModal in B4.

- **Scope**: `frontend` (docs reconciliation of frontend components)
- **Branch**: none in `em-ecosystem-code` (carry-forward Accepted-Trivial — 5th application of the lifecycle adaptation declared in SCRUM-329).
- **Implementation date**: 2026-05-02
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1+B2+B3+B4+B5)
  - Doc starting state (`ai-specs`): `b5f89dd` (post-/update-docs of SCRUM-337)

## Plan Reference

- Plan: [`SCRUM-338_frontend.md`](../../plans/Sprint%2014/SCRUM-338_frontend.md)
- Verify: [`SCRUM-338_verify.md`](../../plans/Sprint%2014/SCRUM-338_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with six Accepted-Trivial deviations** (1 carry-forward + 5 honest-disclosure variants — highest count in any Part B sub-ticket so far).

## Commits

| Repo | Hash | Message | Files |
|---|---|---|---|
| `em-ecosystem` | (none) | No code changes — docs-only ticket | 0 files |
| `ai-specs` | (current /update-docs commit) | `docs(SCRUM-338): reconcile Auth-specific atoms cluster — B5 of SCRUM-329 Part B` | 4 files |

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | 0 | (Plan §4 Step 0 — "No code branch needed (carry-forward Accepted-Trivial)") | No `feature/SCRUM-338-frontend` branch in `em-ecosystem-code`. | 5th consecutive application — convention silenced (no longer needs explanation in plans/records). | **Accepted-Trivial** | — |
| 2 | 2a | "Draft §28 CopyField from `copyFieldSpecs`" | Section added + disclosed: (a) `text-green-600` is a Tailwind direct value, NOT a project token, used for the success state; (b) revert timing corrected from 1.5s (incorrectly stated in /enrich-us) to 2s (actual `setTimeout(2000)` in JSX). | The `text-green-600` non-token use is a real divergence worth disclosing for future migration to `--color-success`. The 1.5s→2s correction is a /enrich-us self-correction, allowed because it was caught during /develop's JSX read before reaching the rendered doc. | **Accepted-Trivial** | — |
| 3 | 2b | "Draft §29 QrCodeCard from `qrCodeCardSpecs`" | Section added + disclosed: (a) `bg-white` is hardcoded (NOT theme-aware) on the QR container with explicit "Why bg-white is hardcoded" rationale (QR scanner contrast requirement); (b) `onGenerate` prop is declared but unused — possibly dead prop or planned regenerate UX. | bg-white intentional → design decision worth documenting. `onGenerate` unused → code anomaly worth surfacing so a future developer either wires it or removes it. Both are non-obvious without explicit disclosure. | **Accepted-Trivial** | — |
| 4 | 2c | "Draft §30 RecoveryCodesGrid from `recoveryCodesGridSpecs`" | Section added + disclosed: second `text-green-600` use (same as §28). Suggested both should migrate together when `--color-success` semantic token becomes available. | Honest documentation prevents fragmented one-component-at-a-time cleanup. Same divergence as §28; better to flag both than handle them in isolated future tickets. | **Accepted-Trivial** | — |
| 5 | 2d | "Draft §31 TurnstileWidget addition" | Section added — JSX-sourced (no spec export). Disclosed in blockquote at top, same pattern as §26 IdleWarningModal (B4). Cloudflare always-pass test key `1x00000000000000000000AA` documented as official dev-mode key. | First JSX-only section in B5; consistent with the B4 precedent. Test-key explanation prevents accidental rotation by a future developer who assumes "1x00…AA" is a leaked production token. | **Accepted-Trivial** | — |
| 6 | 2e | "Draft §32 CountdownTimer addition" | Section added — JSX-sourced (no spec export, 2nd in B5). Documented the non-obvious React key-remount + `countdown-slide` CSS keyframe animation pattern explicitly. Fulfills B4 §26 IdleWarningModal forward-reference (7 cross-references). | The animation mechanism is the most subtle behavior in B5. Without explicit doc, a developer doing a dark-mode or a11y pass could break the animation by altering the `<span>` structure (changing the `key` prop or the wrapping element would silently disable the slide effect). | **Accepted-Trivial** | — |

**No Accepted-Quality, no Accepted-Risk, no Deferred, no Scope-Gap items.**

**6 deviations is the highest count in any Part B sub-ticket so far** (B1: 2, B2: 2, B3: 3, B4: 5, **B5: 6**). All Accepted-Trivial. The trend reflects deeper JSX reads + more disclosure surface as the doc grows — not a regression in plan fidelity.

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Docs-only ticket. |
| Build verification | N/A (no code change) | `em-ecosystem-code` working tree clean throughout. |
| 7 grep AC checks (per plan §6) | **7/7 PASS** | AC1 (§28 CopyField — 1) ✅, AC2 (§29 QrCodeCard — 1) ✅, AC3 (§30 RecoveryCodesGrid — 1) ✅, AC4 (§31 TurnstileWidget + no-spec disclosure — 1+2) ✅, AC5 (§32 CountdownTimer + no-spec disclosure — 1+2) ✅, AC6 (covered by AC4+AC5 disclosure pattern) ✅, AC7 (numbering continuous §1-§32, max=32, no GAP) ✅. **All checks ran with `grep -cE`** per the B4 lessons-learned (extended regex required for `+` quantifier). |
| Bonus integrity checks | **2/2 PASS** | §28 CopyField → §29 QrCodeCard forward cross-reference (2 mentions) ✅, §32 CountdownTimer → §26 IdleWarningModal cross-reference fulfilling B4 forward-ref (7 mentions) ✅. |
| Spot-check independent verification | **3/3 PASS** | §28-§32 at lines 1405, 1457, 1515, 1572, 1637 — consecutive, no gaps; §28 revert timing 2s matches JSX `setTimeout(2000)`; §29 → §28 composition cross-reference resolves to existing §28 at line 1405. |
| User-approval gates | 5/5 confirmed | Gate 1 (§28 CopyField), Gate 2 (§29 QrCodeCard), Gate 3 (§30 RecoveryCodesGrid), Gate 4 (§31 TurnstileWidget), Gate 5 (§32 CountdownTimer). Each draft presented with rationale and disclosures before applying. |

## Bugs Found

**One self-corrected during /develop**: /enrich-us description stated CopyField revert was 1.5s. JSX read during /develop confirmed actual value is 2s (`setTimeout(setCopied(false), 2000)`). Spec export also says "2s". Fixed in the §28 draft before applying. Documented as a lessons-learned: **/develop's JSX read is the safety net for /enrich-us description errors** — corrections are allowed and expected when the actual code disagrees with the ticket text.

No other bugs. The 5 honest-disclosure cases (text-green-600 in §28, bg-white + onGenerate in §29, text-green-600 in §30, no-spec-export in §31, no-spec-export + animation pattern in §32) are spec-vs-code documentation gaps and intentional design decisions, not defects — they're surfaced explicitly per the established honest-documentation pattern.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/specs/ui-design-system.md` | **Pure additions** — single big-edit insert before the `## Common Patterns` anchor. 5 new sections (§28-§32) added at the end of the Components list. Section count grows §1-§27 → §1-§32 (+5). Zero rewrites, zero deletes, zero renumbers — structurally the simplest Part B sub-ticket. |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-338_frontend.md` | Plan (NEW — written during /plan) |
| `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-338_verify.md` | Verify report (NEW — verdict PASS) |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-338_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update** — no module/guard/service changes |
| `ai-specs/specs/data-model.md` | **No update** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update** — no endpoints |

## Audit Finding Resolution

This sub-ticket of SCRUM-329 Part B resolves 5 component rows from the audit table:

| Item | Audit row | Original classification | Resolution | Verified by |
|---|---|---|---|---|
| CopyField | row 12 | Missing-from-doc | New §28 CopyField (sourced from `copyFieldSpecs`, Tooltip-wrapped, 2s revert, `text-green-600` disclosure) | AC1 PASS |
| QrCodeCard | row 31 | Missing-from-doc | New §29 QrCodeCard (sourced from `qrCodeCardSpecs`, composes §28, `bg-white` rationale, `qrcode` library dynamic import, `onGenerate` dead-prop disclosure) | AC2 PASS |
| RecoveryCodesGrid | row 33 | Missing-from-doc | New §30 RecoveryCodesGrid (sourced from `recoveryCodesGridSpecs`, 2-col grid, copy-all Button, second `text-green-600` disclosure) | AC3 PASS |
| TurnstileWidget | row 48 | Missing-from-doc | New §31 TurnstileWidget (JSX-sourced — first in B5, Cloudflare wrapper, theme-aware, reset hook documented, always-pass test key explained) | AC4 PASS |
| CountdownTimer | row 13 | Missing-from-doc | New §32 CountdownTimer (JSX-sourced — second in B5, React key-remount + CSS keyframe animation pattern, fulfills §26 IdleWarningModal B4 forward-ref) | AC5 PASS + Bonus (7 §26 references) |

Final state: 5/5 RESOLVED, 0 UNRESOLVED, 0 NEW instances found. Section numbering continuous §1-§32 (verified by AC7).

## Lessons Learned

### What went well

- **Single big-edit insert pattern worked perfectly for pure-addition clusters**. One Edit operation replaced the `## Common Patterns` anchor with all 5 new sections + 5 closing dividers. Atomic — all-or-nothing. No risk of partial state. The `## Common Patterns` line is a stable anchor (won't be touched by future B-sub-tickets) so this pattern can be reused for B6-B9 if any of them are pure-addition.
- **Honest-documentation pattern reached its highest disclosure count yet (5 in B5)**. The pattern grew B2 (1) → B3 (2) → B4 (4) → **B5 (5)** + introduced two new disclosure types: "non-token Tailwind direct value" (`text-green-600` in §28 + §30) and "hardcoded non-theme-aware bg" (`bg-white` in §29). Each has explicit forward-looking notes for migration. **Project signature confirmed**.
- **Cross-reference §32 → §26 fulfilled the B4 forward-reference**. B4 left "CountdownTimer documented separately... will get its own section in B5" as a forward-ref in §26 IdleWarningModal. B5 §32 fulfilled it with 7 cross-references back to §26, documenting the most prominent CountdownTimer use case (idle session warnings). The bidirectional pattern proven in B4 (§5 ↔ §26) extends cleanly to spanning sub-tickets.
- **/enrich-us self-correction during /develop**. The 1.5s→2s revert timing fix is a small win but proves the JSX read step is doing its job as a safety net. **The /enrich-us description is descriptive, not authoritative — JSX/spec is authoritative**. This understanding kept us from persisting an error into the final doc.
- **5 user-approval gates remained the right cadence** even with 5 components and 5 disclosures. Each gate took ~5-10 minutes including draft + review + approval; total /develop ~2h matched estimate.
- **Two JSX-only components handled smoothly using B4's precedent**. §31 TurnstileWidget and §32 CountdownTimer both used the blockquote-disclosure-at-top pattern from B4 §26 IdleWarningModal. No new pattern needed — reuse proved the precedent is durable.

### What was harder than expected

- **Two `text-green-600` instances + one `bg-white` instance felt like creeping debt**. While each is individually small and well-disclosed, having 3 non-token color uses across 3 components (CopyField, RecoveryCodesGrid, QrCodeCard) suggests the design system's color token coverage has gaps — specifically a missing `--color-success` semantic token. **Lesson**: track these in a code-cleanup ticket once `--color-success` exists, then handle all 3 in a single PR for atomic visual consistency. Avoid one-component-at-a-time PRs.
- **`onGenerate` dead-prop disclosure was new disclosure type**. Previous B-sub-tickets had spec-vs-JSX divergences, missing-spec exports, hardcoded values — but no "declared-but-unused prop" cases. Disclosing it required care: the prop is in the type signature (so consumers might pass it expecting it to work) but the JSX never invokes it. Documented with a gentle "either wire or remove" recommendation. **Lesson for B6-B9**: when reading spec exports, also scan for declared-but-not-used props; they're a real consumer-facing trap.
- **CountdownTimer animation mechanism was deeper than the JSX surface suggested**. The `<span key={...}>` pattern looks innocent, but it's the engine for the slide animation: changing the `key` triggers a remount, which re-applies the `countdown-slide` CSS keyframe. Without docs, a developer cleaning up "redundant keys" would silently disable the animation. The section now explains this with a "Why the React key matters" sub-explanation. **Lesson**: animation patterns that rely on React reconciliation behavior need explicit docs — they're invisible from the JSX alone.

### Recommendations for similar tickets (B6-B9)

1. **For pure-addition clusters, use the single big-edit insert pattern.** Anchor on `## Common Patterns` (stable across all sub-tickets). One Edit operation = atomic, all-or-nothing. No risk of partial state from a failed mid-batch edit.
2. **When reading spec exports, scan for declared-but-unused props.** They're a consumer-facing trap (consumers see the prop in the type signature and assume it works). Disclose with "either wire or remove" recommendation.
3. **Group related disclosures across components for migration.** The two `text-green-600` cases + one `bg-white` case in B5 should migrate together when `--color-success` becomes available. Avoid one-component PRs that fragment cleanup.
4. **Animation patterns relying on React reconciliation need explicit docs.** The `<span key={...}>` pattern in CountdownTimer is invisible from JSX alone but breaks silently if the key is removed. Document the "Why the React key matters" rationale.
5. **/enrich-us description errors are caught by /develop's JSX read.** Don't fight the correction — apply it in the draft and document as a lessons-learned. **JSX/spec is authoritative; /enrich-us description is descriptive**.
6. **Forward-references between sub-tickets are fine but track fulfillment**. B4 §26 left a forward-ref to a future §32 CountdownTimer; B5 §32 fulfilled it with 7 cross-references. Cleanup verified by /verify bonus integrity checks.

## Next Steps

After this `/update-docs` commits to `ai-specs` main, the next sub-ticket of SCRUM-329 Part B is **B6 — Display primitives (10 components — largest cluster, may need split)**. B6 may require a structural decision early in /enrich-us: handle as a single sub-ticket with 10 user-approval gates, or split into B6a + B6b. The decision criteria: if all 10 are pure-addition (like B5), one ticket with 10 gates is feasible; if any have rewrites/deletes, split into smaller chunks.

Pattern proven across B1-B5 is now stable. Carry-forward language is silent (5 consecutive applications). Honest-documentation pattern continues for any spec-vs-JSX divergence found. Single big-edit insert pattern available for pure-addition clusters.

Lessons-learned items captured in record (not auto-created tickets):
- `text-green-600` migration: when `--color-success` / `--color-success-content` semantic tokens become available, both §28 CopyField and §30 RecoveryCodesGrid should migrate together for visual consistency.
- TurnstileWidget could benefit from `turnstileWidgetSpecs` export to align with rest of catalog.
- CountdownTimer could benefit from `countdownTimerSpecs` export to align with rest of catalog.
- QrCodeCard `onGenerate` prop is declared but unused — either wire it to a regenerate UX or remove from the type signature.
- IdleWarningModal could benefit from `idleWarningModalSpecs` export (carry-over from B4 — still pending).
- SearchTrigger mobile variant decision (carry-over from B4 — still pending).
- Tabs dot indicators decision (carry-over from B3 — still pending).
- AC grep checks must use `-cE` flag (or POSIX `[0-9][0-9]*` pattern) — proven again in B5.
