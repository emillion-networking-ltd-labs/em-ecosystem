# SCRUM-299 Phase 2 — Plan: Session expired toast + suppress component toasts

## Scope
Frontend

## Steps

### Step 1 — Add session expired toast in handleAuthFailure
**File**: `nexacore-dashboard/src/context/AuthContext.tsx`
- Add toast warning before LOGOUT dispatch
- Need addToast access in handleAuthFailure

### Step 2 — SessionExpiredError class for 401-after-refresh
**File**: `nexacore-dashboard/src/lib/api.ts`
- Throw SessionExpiredError when silentRefresh fails
- Components can detect and skip their own toasts

### Step 3 — Update components to skip toast on SessionExpiredError
**Files**: `admin/page.tsx` and other data-fetching components
- Check instanceof SessionExpiredError in catch → don't show component toast

### Step 4 — Build verification
- next build compiles, 0 errors
