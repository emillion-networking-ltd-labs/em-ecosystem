# Frontend Implementation Plan: SCRUM-408 — EmptyState error variant

## 2. Overview

Extend `<EmptyState>` with `variant?: "default" | "error"` prop so consumers can render error states with consistent visual treatment (AlertTriangle icon + `text-error` color) without re-doing layout at each call site.

This ticket is **B6 of SCRUM-352** (Audit Loading & Empty States Phase A) and **blocker for**:
- **SCRUM-403** (B1): SecurityActivity error path uses this variant
- **SCRUM-407** (B5): DataTable error rendering uses this variant

Architecture principles applied:
- **Backward compatibility**: existing API stays unchanged. `variant` is optional with default `"default"` preserving current behavior.
- **Minimal API surface**: only the necessary delta (1 new prop, 1 new default icon). No container-level styling changes (bg tint, border) — explicit YAGNI.
- **Single source of truth for tokens**: error color comes from `--color-error` (already defined in `ui-design-system.md` §Semantic Feedback Colors).
- **Doc-from-code pattern** (per SCRUM-329 Part B convention): the `emptyStateSpecs` export updated to list both variants so future doc audits stay aligned.

## 3. Architecture Context

**Components/pages involved**:
- `nexacore-dashboard/src/components/ui/EmptyState.tsx` — atomic UI component, lives in `src/components/ui/` registry.
- `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` — design-system showcase that renders all UI components including EmptyState.
- `ai-specs/specs/ui-design-system.md` §36 EmptyState — SSoT documentation that future tickets reference.

**Files referenced**:
- Current `EmptyState.tsx` (44 lines, single component, no variants) — read in `/enrich-us`.
- Current ComponentShowcase EmptyState demo — to be extended with error variant.
- Current `ui-design-system.md` §36 — to add `variant` documentation.

**Routing considerations**: N/A (atomic component, not a route).

**State management approach**: N/A (stateless presentational component, props-only).

**Component registry impact**:
- `nexacore-dashboard/src/lib/component-registry.ts` line entry for EmptyState — no API change required (the registry tracks names + category + file, not props). Verified during `/enrich-us` codebase analysis.

## 4. Implementation Steps

### Step 0 — Create Feature Branch

- **Action**: Branch from up-to-date `main` per project convention.
- **Branch naming**: `feature/SCRUM-408-frontend` (required by `/develop` rule).
- **Implementation steps**:
  1. `git checkout main`
  2. `git pull origin main`
  3. `git checkout -b feature/SCRUM-408-frontend`
  4. `git branch` → confirm new branch active
- **Notes**: First step before any code change. Follows `ai-specs/specs/frontend-standards.mdc` "Development Workflow".

### Step 1 — Extend EmptyState API

- **File**: `nexacore-dashboard/src/components/ui/EmptyState.tsx`
- **Action**: Add `variant?: "default" | "error"` prop with optional default icon swap and color-class swap.
- **Function signature** (before → after):
  ```tsx
  // Before
  interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
  }

  // After
  interface EmptyStateProps {
    variant?: "default" | "error";
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
  }
  ```
- **Implementation details**:
  1. Import `AlertTriangle` from `lucide-react` (alongside existing `Inbox`).
  2. Inside component body, derive:
     ```tsx
     const isError = variant === "error";
     const defaultIcon = isError ? <AlertTriangle size={48} /> : <Inbox size={48} />;
     const iconColorClass = isError ? "text-error" : "text-content-primary/30";
     ```
  3. Replace `<span className="text-content-primary/30">` with `<span className={iconColorClass}>`.
  4. Replace `{icon || <Inbox size={48} />}` with `{icon || defaultIcon}`.
  5. Title + description + action + container layout: **unchanged**.
- **Dependencies**:
  - `lucide-react` `^1.14.0` — already a dependency.
  - `AlertTriangle` — verified stable v1 icon (used in `InlineError`, `RecentActivityFeed`, satellite `InlineError`, etc.).

### Step 2 — Update `emptyStateSpecs` export

- **File**: `nexacore-dashboard/src/components/ui/EmptyState.tsx`
- **Action**: Document both variants in the `emptyStateSpecs` const so future audits (per SCRUM-329 doc-from-code pattern) see the variant matrix.
- **Implementation**:
  ```tsx
  // Before
  export const emptyStateSpecs = {
    container: "flex flex-col items-center gap-3 py-12",
    icon: "48px text-content-primary/30 (default: Inbox)",
    title: "text-body font-semibold text-content-primary",
    description: "text-caption text-content-primary/50 text-center",
    action: "Optional ReactNode (Button, Link, etc.)",
  };

  // After
  export const emptyStateSpecs = {
    container: "flex flex-col items-center gap-3 py-12",
    variants: {
      default: {
        icon: "48px text-content-primary/30 (default: Inbox)",
      },
      error: {
        icon: "48px text-error (default: AlertTriangle)",
      },
    },
    title: "text-body font-semibold text-content-primary",
    description: "text-caption text-content-primary/50 text-center",
    action: "Optional ReactNode (Button, Link, etc.)",
  };
  ```

### Step 3 — Add error variant demo to ComponentShowcase

- **File**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx`
- **Action**: Add a second EmptyState demo next to the existing default one, demonstrating `variant="error"` with retry action.
- **Implementation steps**:
  1. Locate existing EmptyState showcase block (grep `<EmptyState` in `ComponentShowcase.tsx`).
  2. Add an adjacent block (likely sibling under the same showcase section) rendering:
     ```tsx
     <EmptyState
       variant="error"
       title="Couldn't load X"
       description="Network error — please try again."
       action={<Button variant="primary" size="md">Retry</Button>}
     />
     ```
  3. Side-by-side or stacked with default demo so visual diff is immediately obvious in the design system.
- **Implementation notes**:
  - The exact label ("Couldn't load X") is illustrative — should match the canonical wording from `ui-design-system.md` §0.2 ("Couldn't load X" pattern).
  - Action button is `<Button variant="primary">Retry</Button>` per canonical patterns §0.2.

### Step 4 — Update `ui-design-system.md` §36 EmptyState spec

- **File**: `ai-specs/specs/ui-design-system.md`
- **Action**: Extend §36 EmptyState section to document `variant` prop + both visual treatments.
- **Implementation steps**:
  1. Locate §36 EmptyState in `ui-design-system.md`.
  2. Add a `variants` subsection beneath the existing spec describing:
     - `variant="default"`: Inbox icon, `text-content-primary/30` gray
     - `variant="error"`: AlertTriangle icon, `text-error` color
  3. Cross-reference the new entry to the Loading/Empty/Error patterns block added by SCRUM-352 (§0.2).
- **Notes**: All content in English per `documentation-standards.mdc`.

### Step 5 — Verify

- **Action**: Local validation before commit.
- **Implementation steps**:
  1. `cd nexacore-dashboard && npm run lint` → 0 errors expected.
  2. `cd nexacore-dashboard && npm run build` → clean, 19 routes generated.
  3. `npm run dev` → navigate to `/admin/design-system`, locate EmptyState section, visually verify:
     - Default variant: Inbox icon (gray)
     - Error variant: AlertTriangle icon (red `#8a1111` light / `#ef4444` dark)
  4. Toggle light/dark mode on the design-system page → verify both variants respect theme (the error color is theme-aware via `--color-error` token).

### Step 6 — Update Technical Documentation

- **Action**: Already covered in Step 4 (ui-design-system.md). Verify any other doc reference to EmptyState that may need a note about variants:
  1. `grep -rn 'EmptyState\b' ai-specs/specs/` — list all references.
  2. For each match: if it's a current-state spec, update with variant note; if it's a historical record, leave intact.
- **Notes**: MANDATORY before considering implementation complete.

## 5. Implementation Order

0. Branch
1. Extend `EmptyState.tsx` props + body (Step 1)
2. Update `emptyStateSpecs` export (Step 2 — same file)
3. Add error demo to ComponentShowcase (Step 3)
4. Update `ui-design-system.md` §36 (Step 4)
5. Local verification: lint + build + dev smoke (Step 5)
6. Doc cross-reference grep + updates (Step 6)
7. Hand off to `/verify SCRUM-408`

## 6. Testing Checklist

- [ ] `npm run lint` 0 errors
- [ ] `npm run build` clean, 19 routes
- [ ] Existing EmptyState consumers (currently 0 production + 1 in ComponentShowcase) compile without source change — backward compat verified
- [ ] `npm run dev` → `/admin/design-system` shows BOTH default + error EmptyState demos
- [ ] Default demo: Inbox icon, gray
- [ ] Error demo: AlertTriangle icon, red (`text-error`)
- [ ] Toggle dark mode on /admin/design-system → error icon switches to dark-red (`#ef4444`)
- [ ] `emptyStateSpecs` export type still resolves cleanly when imported (verify no TS errors)
- [ ] No existing Jest test depends on `<Inbox>` being the only default icon (grep `tests/` for EmptyState)
- [ ] `ui-design-system.md` §36 documents `variant` prop with both visual rules

## 7. Error Handling Patterns

N/A — EmptyState is a presentational component. The `variant="error"` itself IS the error-handling pattern for callers; it doesn't itself produce errors.

## 8. UI/UX Considerations

- **Theme compliance**: error color uses `text-error` Tailwind utility which resolves to `--color-error` CSS variable. The variable is theme-aware (`#8a1111` light, `#ef4444` dark). No manual theme handling needed.
- **A11y**: AlertTriangle icon conveys semantic state via shape. Title remains `text-content-primary` (high contrast) so screen readers + low-vision users still get the message clearly. WCAG 2.1 AA contrast preserved.
- **Responsive design**: layout is `flex flex-col items-center` with `py-12` vertical padding — unchanged. Same behavior across breakpoints.
- **Loading states**: not relevant — EmptyState is the empty/error final state. Loading is handled separately per canonical pattern §0.3.
- **Animation**: no entry animation added in this ticket (could be a future refinement; YAGNI for now).

## 9. Dependencies

- `lucide-react` `^1.14.0` (already installed, just adds `AlertTriangle` import)
- No new packages, no `package.json` changes, no `package-lock.json` changes expected.

## 10. Notes

- **Pre-freeze AUTH cleanup**: SCRUM-408 is a precondition for SCRUM-403 (B1) AUTH profile components empty/error refactor. While EmptyState itself is cross-cutting (not AUTH-specific), this ticket is on the critical path for AUTH stabilization per the SCRUM-352 audit recommendations.
- **No new tokens introduced**: error color reuses the existing `--color-error` token. No design system extension.
- **YAGNI on additional variants**: `"warning"` and `"info"` variants explicitly NOT added — wait for a concrete consumer need before extending the API.
- **Showcase update is mandatory**: the design-system showcase is consulted by future devs as living examples. Skipping it would leave the error variant invisible.
- All code/comments in English per `base-standards.mdc`.

## 11. Next Steps After Implementation

1. `/verify SCRUM-408` — quality gate.
2. `/commit SCRUM-408` — feature branch PR + squash merge.
3. `/update-docs SCRUM-408` — record + ai-specs sync.
4. Unblock SCRUM-403 (B1) — its plan can now reference `<EmptyState variant="error">` confidently.

## 12. Implementation Verification

Before `/commit`:

- [ ] Code Quality: lint 0, build clean, TypeScript 0 errors.
- [ ] Functionality: dev server renders both variants correctly in `/admin/design-system`.
- [ ] Testing: no existing test broken by the prop addition.
- [ ] Integration: SCRUM-403 + SCRUM-407 (consumers) can be planned referencing this API without further design discussion.
- [ ] Documentation: `ui-design-system.md` §36 lists both variants.

## 13. Module-Level Planning

N/A — SCRUM-408 extends a single atomic UI component, does not introduce or significantly modify a NexaCore frontend module.

## 14. Satellite App Planning

N/A — satellite (`sat-cristian-garcia`) does not currently use `<EmptyState>`. Satellite has its own STYLE_GUIDE roadmap (SAT01-2) for parallel UI primitives. Out of scope for this ticket.
