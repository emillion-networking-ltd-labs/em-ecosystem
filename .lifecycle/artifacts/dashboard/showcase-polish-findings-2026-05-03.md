# Design System Showcase — UX Polish Findings

**Status**: ACTIVE — collecting findings during SCRUM-348 user review (2026-05-03)
**Disposition pending**: convert to a single batch Jira ticket OR distribute to existing tickets when user finishes review.
**Out of scope**: SCRUM-348 (per its plan). Listed here to avoid scope creep + persist findings beyond the conversation.

---

## Resolved during review session (no longer in inventory)

- **ThemeToggle tooltip position**: resolved inline during SCRUM-348 dev — added `tooltipPosition?: TooltipPosition` prop to ThemeToggle (default `"auto"`, NavBar unchanged); showcase passes `"right"`. Patched in SCRUM-348 branch.
- **StickyCard demo hijacking page on scroll**: resolved inline during SCRUM-348 dev — replaced real `<StickyCard>` (uses `position: fixed` against viewport) with CSS `position: sticky` interactive demo scoped to its own scroll container. Honest note in showcase explains real component lives in this page's tab bar. Patched in SCRUM-348 branch.
- **Lightbox missing from showcase**: dedicated ticket created — **SCRUM-351** (Sprint 14). First ecosystem-promotion ticket exercising the reverse-flow rule documented in SCRUM-348. Out of inventory (has its own lifecycle).

---

## Finding #1 — Modal showcase: button-label/button-size ambiguity

**Where**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` lines 3594-3615 (`ModalShowcase` function)

**What was observed (user)**: "las medidas que se muestran todas son md creo y algunas ponen sm"

**Verified**:
- `ConfirmModal.tsx:70` defaults to `size = "sm"`.
- The 3 trigger buttons all render at `size="md"` (40px) — visually identical.
- Labels say "(sm)", "(sm)", "(md)" referring to the **modal size that opens**, not the button size:

| Button label | Button `size` | Modal `size` |
|---|---|---|
| "Confirm (sm)" | md (40px) | sm (default) |
| "Danger (sm)" | md (40px) | sm (default) |
| "Form (md)" | md (40px) | md (explicit) |

The labels are **technically correct** (they describe the modal, not the button) but **visually misleading** — anyone reading "(sm)" next to a 40px md button assumes the button is sm.

**Recommended fix** (Option A, ~2 min):
Reword labels to disambiguate. Example diff:

```tsx
// line 3600
- Confirm (sm)
+ Confirm → modal sm

// line 3607
- Danger (sm)
+ Danger → modal sm

// line 3614
- Form (md)
+ Form → modal md
```

**Alternative options considered**:
- Option B: add `<Badge>` inline after label showing modal size (more visual, more noise).
- Option C: change Button `size` to match modal size (NO — confuses Button size with Modal size further).

**Effort**: ~2 min (3 string edits, single Edit call).

**Pre-existing**: Yes. Last touched in showcase file before SCRUM-348 work began. Not a regression.

---
