---
schema: ai-specs/schemas/plan.schema.yml
ticket: SCRUM-499
sprint: Sprint 15
scope: frontend
module: dashboard
date: 2026-05-22
status: draft
last_completed_ticket: SCRUM-497
framework_version: 0.16.0
---

# Frontend Implementation Plan: SCRUM-499 AUTH v2 Phase 2.3 — Dashboard wiring (Next.js 14 reference impl for `AuthIntent` v2 login flow)

## 1. Overview

Third and final sub-phase of Phase 2 of the AUTH v2 + Tenancy v1 program. Frontend reference implementation that consumes the AuthIntent v2 endpoints shipped in SCRUM-497 (Phase 2.2): `POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance`. **Closes the umbrella Phase 2 and the D-010 MVP scope** for the 3-week commercial window.

**Strangler pattern**: v1 login UI (`/login` route + `LoginForm.tsx` + `AuthContext.login()`) stays bit-identical and continues to serve production traffic. v2 path lives in parallel behind a feature flag (`NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED`, default `false` in prod, `true` in CI/dev).

**Architecture principles applied**:
- **Page-level conditional rendering**: `/login/page.tsx` (Server Component) reads the env-baked flag and renders either v1 `<LoginForm />` or v2 `<AuthIntentFlow />`. Both share `<GuestRoute><AuthLayout><Suspense>` wrapper.
- **State machine on the frontend**: `AuthIntentFlow` orchestrator component reads `AuthContext` state and conditionally renders `LoginFormV2` / `MfaTotpStepV2` / `TenantPickStep` based on the current intent status — mirrors the backend state machine in UI form.
- **Extend, don't fork the context**: `AuthContext` gains `loginV2()` method + 2 new reducer actions (`MFA_REQUIRED_V2`, `TENANT_PICK_REQUIRED_V2`) + state slots. v1 `login()`, v1 reducer actions, and existing `verifyMfaLogin()` stay untouched.
- **No new shared UI**: reuses existing `<Button>`, `<Input>`, `<MfaDigitInput>`, `<Spinner>`, `<InlineError>`, `<RateLimitBanner>`. TailwindCSS tokens unchanged.
- **Defense-in-depth on the feature flag**: even if `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED=true` but backend `AUTH_INTENT_V2_ENABLED=false`, the first `createAuthIntent()` returns 404 → silent fallback to v1 path (logged in dev console).

### 1.1 Codebase State Snapshot (frontend equivalent of backend §1)

- **Date**: 2026-05-22
- **Last completed ticket**: SCRUM-497 (Phase 2.2 — AuthIntent state machine, merged `561c141`). Backend v2 endpoints live behind `AUTH_INTENT_V2_ENABLED` env flag.
- **Integration-state verified**: Yes (header reads `Last update: SCRUM-497`).
- **Files verified against live dashboard codebase** (all read from `nexacore-dashboard/src/`):
  - `src/app/login/page.tsx` (21 LOC) — Server Component, renders `<GuestRoute><AuthLayout><Suspense><LoginForm /></Suspense></AuthLayout></GuestRoute>`. No `"use client"` directive at top.
  - `src/components/auth/LoginForm.tsx` (434 LOC) — v1 Client Component, calls `useAuth().login(email, password, turnstileToken?)`. Will stay bit-identical.
  - `src/components/auth/MfaTotpStep.tsx` (245 LOC) — v1 MFA component. Pattern to mirror: `useState<string[]>(Array(6).fill(""))` for 6-digit `<MfaDigitInput>` + `useRecovery` boolean toggle. Will stay bit-identical.
  - `src/context/AuthContext.tsx` (863 LOC) — hosts `AuthState` (10 fields), `AuthAction` (8 actions: AUTH_START / AUTH_SUCCESS / AUTH_ERROR / AUTH_STOP / MFA_REQUIRED / MFA_SETUP_REQUIRED / LOGOUT / CLEAR_ERROR), `AuthContextType` (11 methods + state fields), reducer (line ~57 onwards), provider (line ~190 onwards). `login()` method at line 381.
  - `src/context/ToastContext.tsx` — `useToast()` hook with `addToast({ variant, title, description?, duration? })`. Variants: error | success | warning | info.
  - `src/lib/api.ts` (289 LOC) — `apiClient` singleton at line 289. Public methods: `setAccessToken(token)`, `clearAccessToken()`, `getAccessToken()`, `request<T>(endpoint, options)`, `get<T>(endpoint)`, `post<T>(endpoint, body)`, `put<T>(endpoint, body)`, `delete<T>(endpoint)`, `deleteWithBody<T>(...)`. `SKIP_REFRESH_ON_401` Set at line 19 contains `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password` — **this set must be extended** with `/auth/v2/intents` (the create-intent endpoint shares the "credentials invalid OR no session yet" semantic; 401 must NOT trigger silentRefresh).
  - `src/lib/constants.ts` (2 LOC) — only exports `APP_NAME` + `APP_DESCRIPTION`. Clean placement for new flag.
  - `src/lib/types.ts` (264 LOC) — hosts `SafeUser`, `AuthResponse`, `LoginResponse`, `MessageResponse`, `RateLimitKind`, `RateLimitError`. Will be extended with `AuthIntentResponse`, `AuthIntentStatus`, `AdvanceAuthIntentInput` interfaces matching the backend DTO shapes.
  - `src/lib/toast-messages.ts` — centralized toast message constants. New entry `AUTH_INTENT_EXPIRED` needed.
  - `src/components/guards/GuestRoute.tsx` — Client Component; redirects authenticated users to `/dashboard`. Unchanged by this ticket.
  - `src/components/ui/*` — `Button`, `Input`, `Checkbox`, `InlineError`, `MfaDigitInput`, `RateLimitBanner`, `RingSpinner` — all reused as-is.
  - `src/hooks/useAuth.ts` — re-exports `useAuth` from AuthContext (1 line). No change needed.
  - `src/hooks/useToast.ts` — re-exports `useToast` from ToastContext (1 line). No change needed.
  - `tests/components/auth/LoginForm.test.tsx` + `tests/components/auth/MfaTotpStep.test.tsx` + `tests/context/AuthContext.test.tsx` — confirms test layout: `tests/` at root, mirror src structure.
- **Constructor / hook signatures verified**:
  - `useAuth()` returns `AuthContextType` (state fields + 11 methods).
  - `useToast()` returns `{ toasts, addToast(input), removeToast(id), clearToasts() }`.
  - `apiClient.post<T>(endpoint, body, options?)` — generic; throws on non-2xx.
- **Methods verified to exist**:
  - `apiClient.post`, `apiClient.get`, `apiClient.setAccessToken`, `apiClient.clearAccessToken` — all at `src/lib/api.ts:184-212`.
  - `useAuth().login(email, password, turnstileToken?)` — entry point of v1 flow at AuthContext.tsx:381.
- **No existing `src/components/auth/v2/` directory** — confirmed via `ls`. Net-new namespace for this ticket.
- **No existing `src/lib/auth-intent-api.ts`** — confirmed via `ls`. NEW file.
- **No NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED env var anywhere** — confirmed via grep. NEW.
- **Discrepancies with integration-state.md**: dashboard module is not listed in `integration-state.md` (which is backend-focused). No discrepancies — this plan is grounded entirely in live dashboard code.

### 1.2 Regression Impact Analysis

- **Blast radius**:
  - **Direct MOD**: `src/app/login/page.tsx` (1 conditional added — Server Component; reads NEXT_PUBLIC_* env at build time), `src/context/AuthContext.tsx` (+ NEW `loginV2()` method + 2 new reducer actions + 4 new state fields; existing surface untouched), `src/lib/constants.ts` (+1 export), `src/lib/types.ts` (+3 interfaces), `src/lib/toast-messages.ts` (+1 constant), `src/lib/api.ts` (+1 entry in `SKIP_REFRESH_ON_401` Set for `/auth/v2/intents`).
  - **NEW**: `src/lib/auth-intent-api.ts`, `src/components/auth/v2/LoginFormV2.tsx`, `src/components/auth/v2/MfaTotpStepV2.tsx`, `src/components/auth/v2/TenantPickStep.tsx`, `src/components/auth/v2/AuthIntentFlow.tsx`, `tests/components/auth/v2/LoginFormV2.test.tsx`, `tests/components/auth/v2/MfaTotpStepV2.test.tsx`, `tests/components/auth/v2/TenantPickStep.test.tsx`, `tests/components/auth/v2/AuthIntentFlow.test.tsx`, `tests/context/AuthContext-loginV2.test.tsx`.
  - **Test dependents that MIGHT need updates** (verified):
    - `tests/context/AuthContext.test.tsx` — should pass unchanged (v1 `login()` reducer paths untouched). Verify at /develop time that all existing assertions on `AuthState` shape still pass after the 4 new state fields are added (the test should use `expect.objectContaining(...)` patterns; if any test uses strict `expect.toEqual({...})` on the whole state, it may need updating).
    - `tests/components/auth/LoginForm.test.tsx` — v1 component unchanged → no test changes.
    - `tests/components/auth/MfaTotpStep.test.tsx` — v1 component unchanged → no test changes.
- **Breaking changes identified**: **NONE**. This is a pure-additive ticket on the frontend side. The only structural change is +4 fields on `AuthState` and +2 actions on `AuthAction` — both are additive (existing reducer cases stay; new ones added). The v1 `login()` method signature is unchanged.
- **API contract impact**: NO endpoints added/modified. This ticket CONSUMES the backend endpoints shipped in SCRUM-497 (`POST /auth/v2/intents` + `POST /auth/v2/intents/:id/advance` from api-spec.yml). The Phase 1.3 `POST /auth/v2/refresh` is also consumed for session refresh — already wired in `apiClient`.
- **Test files requiring updates**: 1 likely (`tests/context/AuthContext.test.tsx`) — if any assertion uses strict `toEqual` on the full state shape. Confirm at /develop time and update only if needed.
- **Blast radius size**: **10 NEW files + 6 MOD files = 16 files**. Above the >5 "extra review attention" threshold. Pure-additive nature mitigates risk — careful regression testing in `/verify` focuses on:
  1. v1 strangler invariant (`git diff main` against `src/components/auth/LoginForm.tsx`, `src/components/auth/MfaTotpStep.tsx`, and the existing v1 paths in `AuthContext.tsx` must be empty for the v1 `login()` method body).
  2. AuthContext.test.tsx still passes.
  3. Feature flag OFF behavior — `/login` renders v1 LoginForm unchanged.

### 1.3 Plan-time decisions

**Locked at /enrich-us (D1-D6, with D2 corrected to live API surface)**:
1. **D1 Feature flag scope**: env var only (`NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED`) → exported as `AUTH_INTENT_V2_ENABLED` const from `src/lib/constants.ts`.
2. **D2 Tenant display strategy**: raw tenantIds (NOT name fetch — `GET /tenants/:tenantId` doesn't exist in the live API surface; tenant names available post-login via `/auth/me` only). Renders as monospace short-id labels with `<Button variant="ghost">` per id.
3. **D3 Recovery-code UX**: explicit "Use recovery code instead" toggle button (mirrors v1 `MfaTotpStep` convention).
4. **D4 410 Gone UX**: toast (variant=warning) via `useToast()` + `router.replace('/login')`.
5. **D5 createAuthIntent() failure fallback**: silent fallback to v1 path on first-call failure; `console.warn` in dev only.
6. **D6 Page-level conditional rendering**: at `src/app/login/page.tsx` (Server Component reads env-baked flag).

**Plan-time decisions resolved here** (new at /plan, per SCRUM-495/497 precedent):

| # | Decision | Locked value | Rationale |
|---|---|---|---|
| A | **Cancel/back navigation in v2 flow** | Each non-terminal step has a "Cancel" button that resets the intent state in the AuthContext (dispatch `AUTH_STOP`) and returns the user to the credentials step. Equivalent to v1's `cancelMfa()`. NO API call to abandon the intent (lets it expire naturally per Phase 2.2 TTL). | Avoids adding a backend "cancel" endpoint to Phase 2.3 scope. Backend's lazy-expiry on the next `advance()` handles the abandoned-intent case cleanly. |
| B | **Concurrent `advance()` calls** | Disable the submit button while a request is in flight (existing `useState<boolean>` pattern from v1 LoginForm `isSubmitting`). On 410 Gone (terminal-state replay), redirect to /login. | Prevents double-advance from racing the same intent. The backend's 410 is the safety net. |
| C | **`AuthContext.loginV2()` placement** | Add as a NEW useCallback method on the Provider, parallel to `login()` at line ~381. No extraction to a separate file. | Keeps the cohesion of "all auth flows live in AuthContext". v1's `login()` is also in this file. Extracting to a separate file would create artificial split. |
| D | **TypeScript type sharing with backend** | Re-declare types in `src/lib/types.ts` to match backend DTO shapes. Comment with backend source location for traceability. | Standard pattern in this monorepo — backend doesn't generate TS clients for frontend. Single-source-of-truth lives in api-spec.yml. |
| E | **SKIP_REFRESH_ON_401 entry** | Add `/auth/v2/intents` to the existing Set in `src/lib/api.ts:19`. (The advance endpoint is `/auth/v2/intents/:id/advance` which doesn't match by prefix; the Set uses exact match — need to add wildcard-or-pattern support OR a startsWith helper.) **LOCK: add a startsWith helper** that scans the Set for prefix matches. Backward-compatible. | The advance endpoint can return 401 (auth failed mid-flow) and that 401 must NOT trigger silentRefresh — same semantic as v1 `/auth/login`. |
| F | **AuthIntentFlow state-driven rendering** | Single switch on `authState.authIntentStatus` field. Render `<LoginFormV2 />` for null/`requires_credentials`, `<MfaTotpStepV2 />` for `requires_mfa`, `<TenantPickStep />` for `requires_tenant_pick`, redirect on `succeeded`/`failed`/`expired`. | Mirrors backend state machine in UI. Single source of truth = AuthContext state. |

### 1.4 CI Gate Anticipation

| CI gate | Expected behavior |
|---|---|
| Layer 1: Secrets Detection | PASS / unchanged |
| Layer 2: Dependency Audit (nexacore-api) | PASS / unchanged (not touched). |
| Layer 2: Dependency Audit (nexacore-dashboard) | PASS / unchanged. **Zero new deps** — Node stdlib + React + Next.js + existing apiClient + class-validator types only. |
| Layer 3: SAST (Backend) | PASS / unchanged. |
| Layer 3: SAST (Frontend) | PASS — no new `process.env` reads outside the documented flag pattern; no new `dangerouslySetInnerHTML`; no `any` in production code; cookies managed by browser (httpOnly from backend) so no frontend manipulation. |
| **Layer 4: Tests (Backend)** | PASS / unchanged. |
| **Layer 4: Tests (Frontend)** | **PASS** — ~44 new tests on heavily-testable surface (5 component specs + AuthContext reducer + feature-flag toggle). Existing v1 tests pass unchanged. |
| Layer 5: Build (Backend) | PASS / unchanged. |
| Layer 5: Build (Frontend) | PASS — `next build` clean; TypeScript types match backend DTOs (verified post-implementation). |
| Security Gate (All Checks) | PASS (cascade). |

**ai-specs CI**: not exercised by this ticket — em-ecosystem PR does not touch ai-specs.

## 2. Architecture Context

- **Routing**:
  - `/login` (existing) — `src/app/login/page.tsx`. Server Component. Gains a conditional that imports + renders v2 `AuthIntentFlow` when `AUTH_INTENT_V2_ENABLED` is true.
  - No new routes.
- **State management**:
  - `AuthContext` (existing) — extended with `loginV2()` method + 2 new reducer actions + 4 new state fields (`authIntentId`, `authIntentStatus`, `authIntentExpiresAt`, `authIntentAvailableTenantIds`). All other state untouched.
  - Local `useState` inside each v2 component (form inputs, isSubmitting, etc.).
- **Components/pages involved**:
  - `src/app/login/page.tsx` (MOD)
  - `src/context/AuthContext.tsx` (MOD)
  - `src/lib/constants.ts` (MOD)
  - `src/lib/types.ts` (MOD)
  - `src/lib/toast-messages.ts` (MOD)
  - `src/lib/api.ts` (MOD — 1 line: add `/auth/v2/intents` to `SKIP_REFRESH_ON_401`)
  - `src/lib/auth-intent-api.ts` (NEW)
  - `src/components/auth/v2/LoginFormV2.tsx` (NEW)
  - `src/components/auth/v2/MfaTotpStepV2.tsx` (NEW)
  - `src/components/auth/v2/TenantPickStep.tsx` (NEW)
  - `src/components/auth/v2/AuthIntentFlow.tsx` (NEW)
- **API endpoints consumed**:
  - `POST /auth/v2/intents` (Phase 2.2) — entry point
  - `POST /auth/v2/intents/:id/advance` (Phase 2.2) — state transition
  - `GET /auth/me` (v1, kept) — called once on `status === 'succeeded'` to hydrate `SafeUser`
  - `POST /auth/v2/refresh` (Phase 1.3, already wired in `apiClient`) — automatic on 401
- **Cookie handling**: `refresh_token_v2` httpOnly cookie set by backend on `succeeded`. Frontend never touches it.
- **TailwindCSS**: existing tokens reused. No design system changes.

## 3. Architecture Context

(Same content as §2 above — schema requires a top-level §3 named "Architecture Context"; the snapshot lives in §1.1 for narrative cohesion.)

This frontend ticket is a pure consumer of backend services. Authority flow:
- Backend's AuthIntent state machine drives the flow; frontend reads `intent.status` and renders the correct UI step.
- v1 `AuthContext.login()` shape is preserved bit-identical — production traffic continues unaffected until operator flips both flags.

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: `feature/SCRUM-499-dashboard-frontend` from latest main.
- **Implementation Steps**:
  1. `cd ~/projects/em-ecosystem && git checkout main && git pull origin main`
  2. Confirm `git log --oneline -1` shows `561c141` (SCRUM-497 squash merge) or a newer main HEAD.
  3. `git checkout -b feature/SCRUM-499-dashboard-frontend`
  4. `git branch --show-current` → `feature/SCRUM-499-dashboard-frontend`
- **Notes**: First step before any code. Refer to `ai-specs/specs/frontend-standards.mdc` Development Workflow section.

### Step 1: Add feature flag constant

- **File**: `nexacore-dashboard/src/lib/constants.ts` (MOD)
- **Action**: Add `AUTH_INTENT_V2_ENABLED` exported constant.
- **Implementation Steps**:
  1. Append after the existing `APP_DESCRIPTION` export:
     ```typescript
     /**
      * SCRUM-499 / AUTH v2 Phase 2.3: feature flag for the v2 login flow.
      * Mirrors backend's app.authIntentV2Enabled. Default false in prod, true in
      * CI/dev. Env var baked at build time (NEXT_PUBLIC_*).
      */
     export const AUTH_INTENT_V2_ENABLED =
       process.env.NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED === "true";
     ```
- **Notes**: NEXT_PUBLIC_* env vars are inlined at build time by Next.js. No runtime override.

### Step 2: Add TypeScript types

- **File**: `nexacore-dashboard/src/lib/types.ts` (MOD)
- **Action**: Add `AuthIntentResponse`, `AuthIntentStatus`, `AdvanceAuthIntentInput` interfaces matching backend DTO shapes.
- **Implementation Steps**:
  1. Append new types at the end of the file (after `RateLimitError`):
     ```typescript
     /**
      * SCRUM-499 / Phase 2.3: AuthIntent v2 login flow types.
      * Mirrors backend Prisma enum AuthIntentStatus + AuthIntentResponseDto.
      * Backend source: nexacore-api/src/auth/dto/auth-intent-response.dto.ts
      *                nexacore-api/src/auth/dto/advance-auth-intent.dto.ts
      */
     export type AuthIntentStatus =
       | "requires_credentials"
       | "requires_tenant_pick"
       | "requires_mfa"
       | "requires_passkey" // Phase 3 reserves
       | "requires_setup" // Phase 3+ reserves
       | "succeeded"
       | "failed"
       | "expired";

     export type AdvanceAuthIntentInput =
       | { kind: "credentials"; email: string; password: string }
       | { kind: "mfa"; code?: string; recoveryCode?: string }
       | { kind: "tenant_pick"; tenantId: string }
       | { kind: "passkey"; assertion: Record<string, unknown> };

     export interface AuthIntentResponse {
       id: string;
       status: AuthIntentStatus;
       nextStep: "credentials" | "mfa" | "tenant_pick" | "passkey" | null;
       expiresAt: string; // ISO 8601 from backend
       accessToken?: string; // present only when status === 'succeeded'
       user?: {
         id: string;
         tenantId: string;
         tenantRole: string;
         isPlatformAdmin: boolean;
       };
       availableTenantIds?: string[]; // present when status === 'requires_tenant_pick'
     }
     ```
- **Notes**: Re-declared in frontend per plan decision D. Comment with backend source location for traceability.

### Step 3: Add toast message for AuthIntent expiry

- **File**: `nexacore-dashboard/src/lib/toast-messages.ts` (MOD)
- **Action**: Add `AUTH_INTENT_EXPIRED` toast message constant.
- **Implementation Steps**:
  1. Append a new entry to the `AUTH_TOAST` const (or equivalent grouping):
     ```typescript
     AUTH_INTENT_EXPIRED: {
       variant: "warning" as const,
       title: "Login session expired",
       description: "Please start again.",
     },
     ```
- **Notes**: 410 Gone on `advance()` triggers this toast + redirect to `/login`.

### Step 4: Extend `SKIP_REFRESH_ON_401` to match `/auth/v2/intents*` (plan decision E)

- **File**: `nexacore-dashboard/src/lib/api.ts` (MOD)
- **Action**: Replace the exact-match `Set.has(endpoint)` lookup in the 401 interceptor with a `startsWith` scan that also covers `/auth/v2/intents` and `/auth/v2/intents/{id}/advance`.
- **Implementation Steps**:
  1. Change the `SKIP_REFRESH_ON_401` Set entries to include the v2 base prefix:
     ```typescript
     const SKIP_REFRESH_ON_401 = new Set([
       "/auth/login",
       "/auth/register",
       "/auth/refresh",
       "/auth/forgot-password",
       "/auth/v2/intents", // SCRUM-499 / Phase 2.3
     ]);
     ```
  2. Locate the `request<T>` method's 401-handling block. Replace `if (SKIP_REFRESH_ON_401.has(endpoint))` with a small helper:
     ```typescript
     function shouldSkipRefresh(endpoint: string): boolean {
       for (const skip of SKIP_REFRESH_ON_401) {
         if (endpoint === skip || endpoint.startsWith(skip + "/")) return true;
       }
       return false;
     }
     ```
     Then: `if (shouldSkipRefresh(endpoint)) { ... }`. This covers `/auth/v2/intents` AND `/auth/v2/intents/<uuid>/advance`.
  3. Verify existing 401 behavior on v1 endpoints unchanged: `/auth/login` still skip-refresh; `/auth/refresh` still skip-refresh.
- **Implementation Notes**: Without this change, a 401 from `/auth/v2/intents/:id/advance` (legitimate auth failure mid-flow) would trigger `silentRefresh` which would then fail (no refresh cookie yet for v2 since `succeeded` hasn't fired) — the genuine error would be swallowed and replaced with `SessionExpiredError`.

### Step 5: Create `auth-intent-api.ts` wrapper

- **File**: `nexacore-dashboard/src/lib/auth-intent-api.ts` (NEW, ~60 LOC)
- **Action**: Wrap `apiClient.post` calls in typed methods for the 2 v2 endpoints.
- **Function Signatures**:
  ```typescript
  export async function createAuthIntent(): Promise<AuthIntentResponse>
  export async function advanceAuthIntent(
    intentId: string,
    input: AdvanceAuthIntentInput,
  ): Promise<AuthIntentResponse>
  ```
- **Implementation Steps**:
  1. Import `apiClient` from `./api` and types from `./types`.
  2. `createAuthIntent` calls `apiClient.post<AuthIntentResponse>("/auth/v2/intents", {})`.
  3. `advanceAuthIntent` calls `apiClient.post<AuthIntentResponse>(\`/auth/v2/intents/${intentId}/advance\`, input)`.
  4. Re-throw all errors (no swallowing). The caller (`AuthContext.loginV2`) handles error semantics.
- **Implementation Notes**: Thin layer to keep the apiClient generic and types co-located with the endpoint shape.

### Step 6: Extend `AuthContext` with `loginV2()` + 2 new actions + 4 new state fields

- **File**: `nexacore-dashboard/src/context/AuthContext.tsx` (MOD)
- **Implementation Steps**:
  1. **Extend `AuthState` type** (line ~33) with 4 new fields:
     ```typescript
     authIntentId: string | null;
     authIntentStatus: AuthIntentStatus | null;
     authIntentExpiresAt: Date | null;
     authIntentAvailableTenantIds: string[] | null;
     ```
  2. **Extend `AuthAction` union** (line ~45) with 2 new actions:
     ```typescript
     | { type: "MFA_REQUIRED_V2"; payload: { intentId: string; expiresAt: Date } }
     | { type: "TENANT_PICK_REQUIRED_V2"; payload: { intentId: string; availableTenantIds: string[]; expiresAt: Date } }
     ```
  3. **Extend `authReducer`** with cases for the 2 new actions. Each sets the appropriate `authIntent*` fields + clears v1 MFA fields (mutually exclusive).
  4. **Extend the initial state** in `useReducer` initializer with the 4 new fields set to `null`.
  5. **Extend `AUTH_SUCCESS` case** to ALSO clear all `authIntent*` fields (terminal state).
  6. **Extend `AUTH_STOP` case** to ALSO clear all `authIntent*` fields (cancel/error path).
  7. **Extend `AuthContextType`** with the `loginV2` method signature:
     ```typescript
     loginV2: (email: string, password: string) => Promise<void>;
     ```
  8. **Add the `loginV2` useCallback** near the existing v1 `login` (line ~381):
     ```typescript
     const loginV2 = useCallback(async (email: string, password: string) => {
       dispatch({ type: "AUTH_START" });
       try {
         const intent = await createAuthIntent();
         const result = await advanceAuthIntent(intent.id, {
           kind: "credentials",
           email,
           password,
         });
         await handleAuthIntentResult(result);
       } catch (err) {
         apiClient.clearAccessToken();
         dispatch({ type: "AUTH_ERROR", payload: extractErrorMessage(err) });
         throw err;
       }
     }, [/* deps */]);
     ```
  9. **Add internal `handleAuthIntentResult(result)` helper** that switches on `result.status`:
     - `requires_mfa` → `dispatch({ type: "MFA_REQUIRED_V2", payload: { intentId: result.id, expiresAt: new Date(result.expiresAt) } })`
     - `requires_tenant_pick` → `dispatch({ type: "TENANT_PICK_REQUIRED_V2", payload: { intentId: result.id, availableTenantIds: result.availableTenantIds!, expiresAt: new Date(result.expiresAt) } })`
     - `succeeded` → `apiClient.setAccessToken(result.accessToken!)`; fetch `/auth/me` via `apiClient.get<SafeUser>("/auth/me")`; `dispatch({ type: "AUTH_SUCCESS", payload: { user, accessToken: result.accessToken! } })`.
     - Any other status (`failed`, `expired`, `requires_passkey`, `requires_setup`) → throw `new Error("Authentication failed")` to be caught by the outer try/catch in `loginV2()` or whichever public method called this helper.
  10. **Add public methods for the next-step advances** (called by MfaTotpStepV2 + TenantPickStep components):
      ```typescript
      const advanceMfaV2 = useCallback(async (code: string | undefined, recoveryCode: string | undefined) => {
        const intentId = stateRef.current.authIntentId;
        if (!intentId) throw new Error("Invalid state");
        dispatch({ type: "AUTH_START" });
        try {
          const result = await advanceAuthIntent(intentId, { kind: "mfa", code, recoveryCode });
          await handleAuthIntentResult(result);
        } catch (err) {
          // 410 handling: redirect + toast
          if (isGoneError(err)) {
            addToast(AUTH_TOAST.AUTH_INTENT_EXPIRED);
            dispatch({ type: "AUTH_STOP" });
            router.replace("/login");
            return;
          }
          dispatch({ type: "AUTH_ERROR", payload: extractErrorMessage(err) });
          throw err;
        }
      }, [/* deps */]);

      const advanceTenantPickV2 = useCallback(async (tenantId: string) => {
        // same shape as advanceMfaV2, but { kind: 'tenant_pick', tenantId }
      }, [/* deps */]);

      const cancelAuthIntentV2 = useCallback(() => {
        dispatch({ type: "AUTH_STOP" });
        // No backend call (let intent expire naturally — plan decision A)
      }, []);
      ```
  11. **Add the 4 new methods to the context value** at the bottom of the Provider's `value` object.
  12. **Add a `stateRef` ref** (using `useRef<AuthState>(state)`) updated on every render so the useCallbacks have stable identity but access fresh state. Alternative: include state slices in dep arrays — pick whichever pattern v1 already uses.
- **Implementation Notes**:
  - Total LOC delta on this file: ~120 LOC added (1 new public method + 2 internal advance methods + 1 cancel method + 1 helper + state/action/reducer extensions).
  - **Strangler invariant**: v1 `login()` (lines 381-440), `verifyMfaLogin()`, `setupMfa()`, `verifyMfaSetup()`, `cancelMfa()`, `register()`, `handleOAuthCallback()`, `passkeyLogin()`, `logout()`, `refreshSession()` — ALL stay bit-identical. Only additions.
  - `isGoneError(err)` helper: scans err for HTTP status 410 (apiClient throws errors with status info; check existing util `error-utils.ts` first; add helper if needed).

### Step 7: Create `LoginFormV2`

- **File**: `nexacore-dashboard/src/components/auth/v2/LoginFormV2.tsx` (NEW, ~150 LOC)
- **Action**: Credentials capture for v2 flow.
- **Component Signature**: `export default function LoginFormV2()` — no props.
- **Implementation Steps**:
  1. Mirror v1 `LoginForm.tsx` layout: email + password `<Input>`s; `<Button>` submit; `<InlineError>` for client-side form validation; `<RateLimitBanner>` for 429s.
  2. State: `email, password, isSubmitting` via `useState`.
  3. On submit: call `useAuth().loginV2(email, password)`. Catch errors → `useToast().addToast(...)` (toast-only convention from SCRUM-342 — matches v1 LoginForm.tsx).
  4. **Differences from v1 LoginForm**:
     - NO `turnstileToken` parameter (out of scope for Phase 2.3; can be added in a follow-up if security review demands it).
     - NO OAuth buttons (v1 has them; v2 OAuth integration is Phase 3+ per scope-OUT).
     - On success, the page-level conditional in `AuthIntentFlow` re-renders to the next step automatically.
  5. Reuse existing components: `<Input>` from `src/components/ui/Input.tsx`, `<Button>`, `<Checkbox>` (NOT needed here — no "remember me" in v2), `<InlineError>`, `<RateLimitBanner>`, `<MfaDigitInput>` (NOT used here).
- **Implementation Notes**: TailwindCSS classes copied from v1 LoginForm.tsx (visual parity). No new tokens.

### Step 8: Create `MfaTotpStepV2`

- **File**: `nexacore-dashboard/src/components/auth/v2/MfaTotpStepV2.tsx` (NEW, ~120 LOC)
- **Action**: MFA challenge UI for v2 flow.
- **Component Signature**: `export default function MfaTotpStepV2()` — no props.
- **Implementation Steps**:
  1. Mirror v1 `MfaTotpStep.tsx` layout: `<MfaDigitInput>` 6-digit input; `<Button>` submit; "Use recovery code instead" toggle button.
  2. State: `code: string[]` (Array(6).fill("")), `useRecovery: boolean`, `recoveryCode: string`, `isSubmitting`.
  3. **On submit**:
     - If `!useRecovery`: call `useAuth().advanceMfaV2(code.join(''), undefined)`.
     - If `useRecovery`: call `useAuth().advanceMfaV2(undefined, recoveryCode)`.
  4. **Cancel button** → `useAuth().cancelAuthIntentV2()` (resets AuthContext intent state; AuthIntentFlow re-renders to LoginFormV2).
  5. Errors → toast (matches v1 convention).
- **Implementation Notes**: Reuse `<MfaDigitInput>` from `src/components/ui/MfaDigitInput.tsx` — the same component v1 uses.

### Step 9: Create `TenantPickStep`

- **File**: `nexacore-dashboard/src/components/auth/v2/TenantPickStep.tsx` (NEW, ~100 LOC)
- **Action**: Tenant selection UI (genuinely new — no v1 equivalent).
- **Component Signature**: `export default function TenantPickStep()` — no props.
- **Implementation Steps**:
  1. Read `availableTenantIds: string[]` from `useAuth().authIntentAvailableTenantIds`.
  2. Render header: "Select your workspace" or equivalent. Localization deferred (English-only per project convention).
  3. Render list of selectable tenant items. Per plan decision D2, **display raw tenantIds** (no name fetch in Phase 2.3):
     - Each item is a `<Button variant="ghost">` with `tenantId` shown in monospace short form (`{tenantId.slice(0, 8)}...{tenantId.slice(-4)}`).
     - Optional: small "(member)" label since all listed ids are user's active memberships.
  4. **On click** of an item: call `useAuth().advanceTenantPickV2(tenantId)`.
  5. **Cancel button** → `useAuth().cancelAuthIntentV2()` (returns to LoginFormV2).
  6. Empty array case: should never happen (backend filters `availableTenantIds` to user's active memberships), but defensively render an "Account configuration error" message + Cancel button.
- **Implementation Notes**: This is the first UI in the dashboard that displays tenantIds. UX is intentionally minimal (raw ids) — designed to be replaced by a richer tenant-pick when names become available via a future backend endpoint.

### Step 10: Create `AuthIntentFlow` orchestrator

- **File**: `nexacore-dashboard/src/components/auth/v2/AuthIntentFlow.tsx` (NEW, ~80 LOC)
- **Action**: Top-level orchestrator that reads `AuthContext` state and renders the appropriate step.
- **Component Signature**: `export default function AuthIntentFlow()` — no props.
- **Implementation Steps**:
  1. `useAuth()` to read `authIntentStatus` (and `authIntentId`, `authIntentExpiresAt`, etc.).
  2. Switch on `authIntentStatus`:
     - `null` OR `'requires_credentials'` → `<LoginFormV2 />`
     - `'requires_mfa'` → `<MfaTotpStepV2 />`
     - `'requires_tenant_pick'` → `<TenantPickStep />`
     - `'succeeded'` → null (AuthContext's `AUTH_SUCCESS` handler should redirect via existing patterns)
     - `'failed'` | `'expired'` | `'requires_passkey'` | `'requires_setup'` → defensive `<LoginFormV2 />` with a toast on mount (e.g., "Login failed, please try again")
  3. NO direct API calls in this component — purely state-driven rendering.
- **Implementation Notes**: Drives the entire flow purely from AuthContext state. Plan decision F.

### Step 11: Wire `AuthIntentFlow` into `/login/page.tsx`

- **File**: `nexacore-dashboard/src/app/login/page.tsx` (MOD)
- **Action**: Add conditional rendering based on `AUTH_INTENT_V2_ENABLED`.
- **Implementation Steps**:
  1. Import `AUTH_INTENT_V2_ENABLED` from `@/lib/constants` and `AuthIntentFlow` from `@/components/auth/v2/AuthIntentFlow`.
  2. Replace the body to conditionally render:
     ```typescript
     export default function LoginPage() {
       return (
         <GuestRoute>
           <AuthLayout>
             <Suspense>
               {AUTH_INTENT_V2_ENABLED ? <AuthIntentFlow /> : <LoginForm />}
             </Suspense>
           </AuthLayout>
         </GuestRoute>
       );
     }
     ```
  3. **Strangler invariant verified**: `git diff main -- src/components/auth/LoginForm.tsx` is 0 lines after this ticket. Only page.tsx has a 1-line conditional addition.
- **Implementation Notes**: Server Component reads NEXT_PUBLIC_* env at build time — no client/server hydration mismatch. Both branches are wrapped identically in `<GuestRoute><AuthLayout><Suspense>`.

### Step 12: Write tests

#### 12a: `LoginFormV2.test.tsx` (~12 tests)

- **File**: `nexacore-dashboard/tests/components/auth/v2/LoginFormV2.test.tsx` (NEW)
- **Pattern**: Jest + React Testing Library, mock `useAuth` + `useToast` (same idiom as v1 LoginForm.test.tsx).
- **Coverage**:
  - Happy: enter email + password → submit → `loginV2()` called with correct args.
  - Validation: empty email → inline error.
  - Validation: short password → inline error.
  - Submitting state: button disabled, spinner shown.
  - Error: `loginV2()` throws → toast shown.
  - Rate limit: 429 → `<RateLimitBanner>` rendered.
  - Accessibility: form has `aria-label`; submit button has visible label.

#### 12b: `MfaTotpStepV2.test.tsx` (~10 tests)

- **File**: `nexacore-dashboard/tests/components/auth/v2/MfaTotpStepV2.test.tsx` (NEW)
- **Coverage**:
  - Happy TOTP: enter 6 digits → submit → `advanceMfaV2(code, undefined)`.
  - Recovery toggle: click "Use recovery code" → input swaps to text field → enter code → submit → `advanceMfaV2(undefined, recoveryCode)`.
  - Invalid code: error response → toast shown.
  - Cancel: click Cancel → `cancelAuthIntentV2()` called → returns to creds step (verify state).
  - Auto-submit on 6 digits filled: confirm whether v1 has this behavior; mirror.

#### 12c: `TenantPickStep.test.tsx` (~8 tests)

- **File**: `nexacore-dashboard/tests/components/auth/v2/TenantPickStep.test.tsx` (NEW)
- **Coverage**:
  - Renders list of tenantIds from AuthContext state.
  - Click on tenantId → `advanceTenantPickV2(tenantId)` called.
  - Empty `availableTenantIds` array (defensive case) → renders error UI.
  - 401 from advance → toast.
  - Cancel → `cancelAuthIntentV2()`.

#### 12d: `AuthIntentFlow.test.tsx` (~6 tests integration)

- **File**: `nexacore-dashboard/tests/components/auth/v2/AuthIntentFlow.test.tsx` (NEW)
- **Coverage**:
  - Initial state (null intent) renders `LoginFormV2`.
  - State `requires_mfa` renders `MfaTotpStepV2`.
  - State `requires_tenant_pick` renders `TenantPickStep`.
  - State `succeeded` renders null.
  - State `failed` renders `LoginFormV2` (defensive).
  - Full flow simulation: mock AuthContext through credentials → mfa → tenant_pick → succeeded.

#### 12e: `AuthContext-loginV2.test.tsx` (~8 tests)

- **File**: `nexacore-dashboard/tests/context/AuthContext-loginV2.test.tsx` (NEW)
- **Coverage**:
  - `loginV2(email, password)` calls `createAuthIntent()` then `advanceAuthIntent(intent.id, {kind: 'credentials', ...})`.
  - On `requires_mfa` response: dispatches `MFA_REQUIRED_V2` with correct payload.
  - On `requires_tenant_pick` response: dispatches `TENANT_PICK_REQUIRED_V2` with correct payload (incl. `availableTenantIds`).
  - On `succeeded` response: sets access token, fetches `/auth/me`, dispatches `AUTH_SUCCESS`.
  - On 410 Gone from `advanceMfaV2`: toast shown + dispatches `AUTH_STOP` + redirect to /login.
  - On 401 from `advanceMfaV2`: dispatches `AUTH_ERROR` + throws.
  - `cancelAuthIntentV2()` dispatches `AUTH_STOP` and clears all `authIntent*` state fields.
  - v1 `login()` method continues to work bit-identical (regression assertion).

#### 12f: Feature flag tests

- **Approach**: Mock `AUTH_INTENT_V2_ENABLED` via Jest module mock (`jest.mock("@/lib/constants", () => ({ AUTH_INTENT_V2_ENABLED: true, ...originalModule }))`) in dedicated test file or as part of `AuthIntentFlow.test.tsx`.
- **Coverage**:
  - Flag off: `/login/page.tsx` renders `<LoginForm />` (not `<AuthIntentFlow />`).
  - Flag on: renders `<AuthIntentFlow />`.

### Step 13: Build + lint + jest + grep invariants

- **Implementation Steps**:
  1. `npm run build` → exit 0 (Next.js compile + TypeScript check).
  2. `npx jest --testPathPatterns='v2|loginV2|AuthIntentFlow' --maxWorkers=1` → all new specs pass.
  3. Full project: `npx jest --maxWorkers=1` → all existing + new tests pass.
  4. Coverage: `--coverage` → ≥85% on new files (frontend convention).
  5. ESLint: `npx eslint --fix src/components/auth/v2 src/lib/auth-intent-api.ts tests/components/auth/v2 tests/context/AuthContext-loginV2.test.tsx`.
  6. **Strangler invariant grep**:
     - `git diff main -- src/components/auth/LoginForm.tsx src/components/auth/MfaTotpStep.tsx` → 0 lines (v1 components untouched).
     - `git diff main -- src/context/AuthContext.tsx` shows ONLY new additions; existing v1 `login()` method body unchanged (line range ~381-440 verified by inspection).
  7. **Sanity grep**:
     - `grep -rn "AUTH_INTENT_V2_ENABLED" src/` → expected 3-4 places (constants.ts decl + page.tsx use + test mocks).
     - `grep -rn "loginV2\|advanceMfaV2\|advanceTenantPickV2\|cancelAuthIntentV2" src/` → AuthContext decl + AuthIntentFlow consumers + LoginFormV2/MfaTotpStepV2/TenantPickStep consumers.

### Step 14: Update Technical Documentation

- **Action**: Deferred-by-design to `/update-docs`.
- **Implementation Steps**: NOT in this branch. `/update-docs` will:
  - Update `ai-specs/specs/integration-state.md`: header bump (Last update SCRUM-499) + new dashboard module entry (the file is backend-focused but should still log this ticket's footprint in the Changelog row + a brief "dashboard auth surface" annotation).
  - Update `ai-specs/changes/auth/programs/AUTH-v2.md` §6 Phase 2.3 row marked complete; "Currently active" updated to Phase 0+1+2.1+2.2+2.3 COMPLETE; mark D-010 MVP scope CLOSED.
  - Update `ai-specs/specs/frontend-standards.mdc`: any new patterns documented (e.g., `jest.mock("@/lib/constants", ...)` pattern for feature-flag tests).
  - NO changes to `api-spec.yml` (no backend changes) or `data-model.md` (no entity changes).

## 5. Implementation Order

1. Step 0: Create feature branch.
2. Step 1: `constants.ts` add `AUTH_INTENT_V2_ENABLED`.
3. Step 2: `types.ts` add interfaces.
4. Step 3: `toast-messages.ts` add `AUTH_INTENT_EXPIRED`.
5. Step 4: `api.ts` extend `SKIP_REFRESH_ON_401` + add `shouldSkipRefresh` helper.
6. Step 5: `auth-intent-api.ts` NEW.
7. Step 6: `AuthContext.tsx` extend (+state, +reducer actions, +loginV2, +advanceMfaV2, +advanceTenantPickV2, +cancelAuthIntentV2, +handleAuthIntentResult helper).
8. Step 7: `LoginFormV2.tsx` NEW.
9. Step 8: `MfaTotpStepV2.tsx` NEW.
10. Step 9: `TenantPickStep.tsx` NEW.
11. Step 10: `AuthIntentFlow.tsx` NEW.
12. Step 11: `login/page.tsx` conditional.
13. Step 12a-f: Tests.
14. Step 13: Build + lint + jest + grep invariants.
15. Step 14: Docs deferred to `/update-docs`.

## 6. Testing Checklist

- [ ] `npm run build` exit 0.
- [ ] Targeted jest: all new v2 component + AuthContext-loginV2 specs pass.
- [ ] Full project jest: existing tests pass unchanged.
- [ ] Coverage ≥85% per-file on new files.
- [ ] ESLint clean.
- [ ] **Strangler invariant**: `git diff main` on `LoginForm.tsx`, `MfaTotpStep.tsx`, the v1 `login()` body in AuthContext.tsx → 0 lines.
- [ ] **Feature flag OFF** integration check: NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED=false → /login renders LoginForm (manual smoke OR jest with module-mock).
- [ ] **Feature flag ON** integration check: NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED=true → /login renders AuthIntentFlow (manual smoke OR jest).
- [ ] **Backend integration** (manual): with backend AUTH_INTENT_V2_ENABLED=true, complete a full flow: credentials → MFA (if user has MFA) → tenant_pick (if multi-tenant) → succeeded. Verify access token in apiClient + refresh_token_v2 cookie set in browser devtools.
- [ ] **410 Gone path**: trigger by waiting > 15 min between advance calls (or manually delete the intent in DB) → confirm toast appears + redirect to /login.

## 7. Error Handling Patterns

- **401 from `/auth/v2/intents` or `/auth/v2/intents/:id/advance`**: NOT a silent-refresh trigger (SKIP_REFRESH_ON_401 covers via startsWith helper). Surfaced as the backend's standard `Authentication failed` 401 → toast (matches v1 convention from SCRUM-342).
- **410 Gone (terminal-state replay, expired-at-advance)**: caught by AuthContext's advance methods; toast `AUTH_INTENT_EXPIRED` + dispatch `AUTH_STOP` + `router.replace('/login')`.
- **404 on `createAuthIntent()`** (feature flag mismatch — frontend on, backend off): caught in `loginV2()` — silent fallback to v1 (`useAuth().login(email, password)`). Dev mode console.warn for traceability.
- **Validation errors (400)**: from backend ValidationPipe — surface via toast.
- **Rate limit (429)**: existing `RateLimitError` handling in apiClient; `<RateLimitBanner>` rendered in the active step.
- **Network errors**: catch in api wrapper; generic "Network error, please try again" toast. Existing pattern from apiClient.

## 8. Dependencies

- **No new external libraries**. All deps already in package.json:
  - `react`, `react-dom`, `next` (existing)
  - `lucide-react` for icons (existing — e.g., `ArrowLeft` for back/cancel buttons)
  - `@testing-library/react` + `@testing-library/jest-dom` for tests (existing)
- **Reused UI components**: `Button`, `Input`, `Checkbox` (unused here), `InlineError`, `MfaDigitInput`, `RateLimitBanner`, `RingSpinner` — all under `src/components/ui/`.
- **Reused hooks**: `useAuth`, `useToast`, `useRateLimit`.

## 9. Notes

- **Strangler-pattern invariant**: v1 `LoginForm.tsx` + `MfaTotpStep.tsx` + the v1 `login()` body in AuthContext.tsx ALL stay bit-identical. CI gate at `/verify` will assert `git diff main` returns 0 lines for these v1 paths.
- **Feature flag provides emergency disable**: flip `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED` to `false` AND rebuild + redeploy → v2 surface disappears (next build embeds the new env value). Backend flag flip alone makes v2 return 404 → frontend falls back silently.
- **No `@UseGuards` equivalent on frontend** — `GuestRoute` (existing) ensures /login is reachable only for unauthenticated users; the AuthIntent state machine itself handles the orchestration.
- **English-only**: all code, comments, copy, commit messages, ai-specs artifacts.
- **§15 N/A** — this is a frontend consumer of AUTH endpoints; no `src/auth/**`, `src/audit/**`, or `prisma/schema.prisma` paths touched in nexacore-api. Standard PR review applies.

## 10. Next Steps After Implementation

After `/develop` + `/verify` + `/commit` + `/update-docs`:
1. **Phase 2 umbrella CLOSES** — D-010 MVP scope (3-week commercial window) complete.
2. **Phase 3 (Passkey-first reframing)** becomes unblocked — Phase 3 will reframe `LoginFormV2` to put passkey first.
3. **Phase 4 (AuthChallenge step-up)** becomes parallelizable with Phase 3.
4. **Phase 5 (OIDC issuer)** + **Phase 6 (v1 sunset)** remain post-MVP per D-010.
5. Operator decision: when to flip `NEXT_PUBLIC_AUTH_INTENT_V2_ENABLED=true` in production (gradual rollout strategy TBD).

## 11. Implementation Verification

Final verification checklist:

- **Code Quality**: ESLint clean; no `any` in production code; no `dangerouslySetInnerHTML`; no `eval`; consistent with v1 component style.
- **Functionality**: full happy path covered (creds → mfa → tenant_pick → success); cancel/back works; toast on errors.
- **Testing**: ~44 jest tests passing; per-file ≥85% coverage on new files.
- **Integration**: `npm run build` (Next.js) exit 0; AuthContext changes don't break existing `tests/context/AuthContext.test.tsx`.
- **Documentation**: deferred to `/update-docs` per Step 14.
- **Strangler invariants verified**:
  - `git diff main -- src/components/auth/LoginForm.tsx` → 0 lines
  - `git diff main -- src/components/auth/MfaTotpStep.tsx` → 0 lines
  - v1 `login()` body in AuthContext.tsx (lines ~381-440) → 0 lines difference vs main (verified by careful inspection of the diff during /verify)

## 12. Module-Level Planning

This is a frontend feature within the existing NexaCore dashboard — not a new module per se, but extends the auth surface with a parallel v2 flow.

- **Module scope**: dashboard auth namespace. New `src/components/auth/v2/` subfolder is the conceptual "v2 auth module" boundary.
- **Page structure**: NO new pages; conditional rendering inside existing `/login/page.tsx`.
- **Component tree**:
  - `AuthIntentFlow.tsx` (orchestrator, Client Component — needs `useAuth()`)
  - `LoginFormV2.tsx` (form, Client Component — `useState` for inputs)
  - `MfaTotpStepV2.tsx` (form, Client Component)
  - `TenantPickStep.tsx` (form, Client Component — reads from AuthContext)
- **State management**: extend existing `AuthContext` (decision C). No new context.
- **API integration**: `createAuthIntent()` + `advanceAuthIntent(id, input)` in `src/lib/auth-intent-api.ts` wrapping `apiClient.post`.
- **Route guards**: existing `GuestRoute` (unchanged) wraps `/login/page.tsx`.
- **Sidebar/Navigation**: NO changes (this is the unauthenticated-user surface).
- **Shared types**: 3 new interfaces in `src/lib/types.ts` (Step 2).
- **Frontend-standards.mdc impact**: minor — may want to document the `jest.mock("@/lib/constants", ...)` pattern for feature-flag tests as a recipe in the testing section. Deferred to `/update-docs`.
