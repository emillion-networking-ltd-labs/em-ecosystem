# Backend Implementation Plan: SCRUM-126 Document CORS Null-Origin as Accepted Risk (H-06)

## Codebase State Snapshot

- **Date**: 2026-03-04
- **Last completed ticket on branch**: SCRUM-125 (npm dependency security update)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/main.ts` — 77 lines. CORS origin callback at lines 24-43. `if (!origin)` check at line 29 with `callback(null, true)` at line 30. No inline comment explaining the accepted risk.
- **Constructor signatures verified**: N/A — comment-only change to main.ts bootstrap function
- **Guard dependency chain verified**: N/A — no guard changes
- **Discrepancies with integration-state.md**: None relevant — comment-only ticket

## Overview

Document the CORS null/undefined origin acceptance as an accepted risk with an inline code comment in `main.ts`. The audit (H-06 WARN) flagged that requests without an Origin header are allowed, but this is standard practice: browsers always send Origin for cross-origin requests; requests without Origin come from server-to-server calls, cURL, Postman, and same-origin form submissions. No behavioral change needed.

## Architecture Context

- **Modules involved**: None — comment-only change to bootstrap function
- **Components affected**: `src/main.ts` (line 29, inline comment)
- **No DI, module, guard, controller, or schema changes**

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-126-backend` from SCRUM-125 branch
- **Implementation Steps**:
  1. `git checkout feature/SCRUM-125-backend` (should already be there)
  2. `git checkout -b feature/SCRUM-126-backend`
  3. Verify branch: `git branch --show-current`

### Step 1: Add Accepted Risk Comment in main.ts

- **File**: `nexacore-api/src/main.ts`
- **Action**: Add inline comment above the `if (!origin)` check at line 29
- **Implementation Steps**:
  1. Add a multi-line comment directly above line 29 (`if (!origin)`) with:
     - `ACCEPTED RISK [H-06]` label
     - Explanation: Requests without an Origin header are intentionally allowed
     - Rationale: These come from non-browser clients (server-to-server, cURL, Postman) and same-origin form submissions
     - Note: Browsers always send Origin header for cross-origin requests, so CORS protection is effective for browser-based attacks
  2. Keep the comment concise (3-4 lines max) following existing code style
  3. Do NOT modify any logic — comment only

### Step 2: Build, Test, Verify

- **Implementation Steps**:
  1. `nest build` — zero errors (comment doesn't affect compilation)
  2. `npx jest --maxWorkers=1 --forceExit` — all 773 tests pass (no behavioral changes)

### Step 3: Update Technical Documentation

- **Action**: Update integration-state.md changelog
- **Implementation Steps**:
  1. Add SCRUM-126 changelog entry to `ai-specs/specs/integration-state.md`
  2. No api-spec.yml, data-model.md, or other doc changes

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add accepted risk comment in main.ts
3. Step 2: Build, test, verify
4. Step 3: Update integration-state.md changelog

## Testing Checklist

- [ ] Inline comment present above `if (!origin)` in main.ts
- [ ] Comment includes risk ID (H-06) and ACCEPTED RISK label
- [ ] `nest build` — zero errors
- [ ] All 773 tests pass (no behavioral changes)
- [ ] integration-state.md changelog entry added

## Error Response Format

No API error responses — comment-only change with no runtime behavior modifications.

## Dependencies

- No new npm packages
- **Prerequisite**: SCRUM-125 (must be on `feature/SCRUM-125-backend` branch)

## Notes

- **Comment-only ticket**: Single inline comment added to `src/main.ts`. No behavioral changes.
- **Why not a fix**: The `!origin` acceptance is standard CORS behavior. Browsers always send Origin for cross-origin requests. Requests without Origin are non-browser clients that aren't subject to CORS anyway. Blocking null origin would break server-to-server integrations.
- **Last ticket in rectification sequence**: SCRUM-126 completes the SCRUM-119–126 rectification (replacing bulk commit `e0f12f7` with individual branches/commits/PRs).
- **Rectified**: Individual branch/commit/PR replacing bulk commit `e0f12f7`.

## Next Steps After Implementation

1. Commit, push, create PR
2. Run `/update-docs SCRUM-126`
3. Rectification sequence SCRUM-119–126 complete

## Implementation Verification

- [ ] **Code Quality**: Comment follows existing code style
- [ ] **Functionality**: No behavioral changes — comment only
- [ ] **Testing**: All existing tests pass
- [ ] **Security**: H-06 audit finding documented as accepted risk
- [ ] **Integration**: No module, guard, or DI changes
- [ ] **Documentation**: integration-state.md updated
