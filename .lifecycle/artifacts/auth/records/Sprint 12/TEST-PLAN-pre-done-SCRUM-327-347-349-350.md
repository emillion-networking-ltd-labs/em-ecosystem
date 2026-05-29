# Pre-Done Test Plan — SCRUM-327 + SCRUM-347 + SCRUM-349 + SCRUM-350

**Date**: 2026-05-04
**Purpose**: validate the 4 Camino Total tickets in main BEFORE transitioning their Jira status to Done.
**Scope**: tests grouped by who runs them — automated (assistant-run, results below) vs manual browser (user-run) vs curl smoke (user-run when backend stack is up).

---

## Section A — Automated tests (✅ ALREADY RUN)

| Test | Command | Result | Notes |
|------|---------|--------|-------|
| Backend Jest full suite | `cd nexacore-api && npm test -- --maxWorkers=1 --forceExit` | **1052 / 1052 PASS** ✅ | 69 suites green; 27.3s |
| Backend `nest build` | `cd nexacore-api && npm run build` | **Clean** ✅ | No DI errors, no type errors |
| Frontend Jest full suite | `cd nexacore-dashboard && npm test -- --maxWorkers=1 --forceExit` | 98 / 111 (13 pre-existing failures unchanged) | Failures all in unrelated specs (`Button.test`, `Pagination.test`, `MfaTotpStep.test`, `ConnectedAccounts.test`, `SecurityActivity.test`) — same baseline as post-SCRUM-327. |
| Frontend Jest — SCRUM-only specs | `npx jest tests/components/profile/TrustedDevices.test.tsx tests/components/profile/PasskeyManager.test.tsx tests/hooks/useCrossTabAuth.test.ts tests/hooks/usePasskey.test.ts` | **32 / 32 PASS** ✅ | All SCRUM-327 + SCRUM-349 component/hook tests green |
| Playwright dry-run | `cd nexacore-dashboard && npx playwright test` | **6 skipped (clean)** ✅ | SCRUM-350 infrastructure works; bodies are TODO per plan |

**Conclusion**: automated test layer is GREEN. No regressions. The 13 pre-existing frontend failures were ALREADY failing on `main` before this work and remain unchanged.

---

## Section B — Manual browser tests (🟡 USER MUST RUN)

> Setup before this section:
> 1. Start backend: `cd nexacore-api && npm run start:dev` (port 3000). Requires Postgres + Redis running.
> 2. Start dashboard: `cd nexacore-dashboard && npm run dev` (port 3001).
> 3. Have at least 2 test accounts available:
>    - **A**: regular account WITH password set (use any test user from your seed/fixtures).
>    - **B** (optional, for AC5 verification): OAuth-only account (no password set — created via Google/GitHub OAuth without ever calling `/account/password/set`).
> 4. Open browser, log in as A, navigate to `/profile`.

### B.1 — SCRUM-327 Trust Device modal

| # | Step | Expected | Actual | Notes |
|---|------|----------|--------|-------|
| B1.1 | Click "Trust This Device" button | Modal opens with title "Trust This Device", password input (autofocus), "Trust Device" button. NO immediate API call yet. | ☐ | |
| B1.2 | Leave password empty, click "Trust Device" | Inline error "Enter your password" appears under the input. Modal stays open. NO API call. | ☐ | |
| B1.3 | Enter wrong password, click "Trust Device" | Inline error "Invalid password" appears under the input. Modal stays open. The password field retains the wrong value (does NOT auto-clear) so the user can fix it. | ☐ | |
| B1.4 | Enter correct password, click "Trust Device" | Modal closes. Toast appears (`PROFILE_TOAST.DEVICE_TRUSTED` — green / "Device trusted"). New device row appears in the list with browser/OS name + IP + "Just now" + "Expires …" | ☐ | |
| B1.5 | Click "Trust This Device" again immediately | Modal opens again. Re-enter correct password and submit. Toast `DEVICE_ALREADY_TRUSTED` (informational). List unchanged. | ☐ | |

### B.2 — SCRUM-327 Revoke Device flows

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B2.1 | Click trash icon on a single device | "Revoke Device Trust" modal opens with password input + "Revoke" button (red). | ☐ |
| B2.2 | Wrong password → submit | Inline "Invalid password". Modal stays. Device still in list. | ☐ |
| B2.3 | Correct password → submit | Modal closes. Toast `DEVICE_REVOKED`. Row disappears from list (animated). | ☐ |
| B2.4 | Click "Revoke All" (visible if 1+ devices remain) | "Revoke All Devices" modal opens with password input + "Revoke All" button (red). Description shows count: "N devices will be affected". | ☐ |
| B2.5 | Wrong password → submit | Inline "Invalid password". Modal stays. List unchanged. | ☐ |
| B2.6 | Correct password → submit | Modal closes. Toast `DEVICE_REVOKED`. List goes empty. | ☐ |

### B.3 — SCRUM-327 Passkey register modal

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B3.1 | Click "Add Passkey" | Modal opens. Password input on top (autofocus). Optional "Passkey name" input below. "Register Passkey" button. | ☐ |
| B3.2 | Wrong password → submit | Inline "Invalid password" on the password field. Modal stays. NO biometric/WebAuthn prompt. | ☐ |
| B3.3 | Correct password + name "My Mac" → submit | Browser triggers biometric / security key prompt (WebAuthn challenge). Complete it. Modal closes (~350ms). Toast `PASSKEY_REGISTERED`. Passkey row appears in list (animated). | ☐ |
| B3.4 | Repeat with empty name | Same flow but list shows passkey with default name (e.g. "Passkey"). | ☐ |

### B.4 — SCRUM-327 Passkey delete (regression — already had password)

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B4.1 | Click trash icon on a passkey | Delete modal with password input. | ☐ |
| B4.2 | Wrong password → submit | Inline "Invalid password". Modal stays. Passkey not removed. | ☐ |
| B4.3 | Correct password → submit | Modal closes. Toast `PASSKEY_DELETED`. Row disappears (animated). | ☐ |

### B.5 — SCRUM-327 OAuth-only user (account B, optional)

> If you have an OAuth-only test account (no `passwordHash`), log in as them and:

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B5.1 | Click "Trust This Device" → enter ANY value → submit | Toast: error message indicating password is required (per `ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD` = "Password confirmation required"). Modal closes or stays open with the error visible. **Critical:** must NOT proceed (silent bypass would be a security regression). | ☐ |
| B5.2 | Same for revoke + passkey-delete | Same 400 error pattern — does NOT silently allow. | ☐ |

If you do NOT have an OAuth-only account: **skip B.5** — covered by backend unit tests.

### B.6 — SCRUM-349 Rate-limit toasts

> Trigger trust-device or passkey-register **5+ times in 60 seconds** to trip `AUTH_RATE_LIMITS.trust_device` / `AUTH_RATE_LIMITS.mfa`.

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B6.1 | Trust This Device: enter wrong password 5+ times rapidly (the throttler counts attempts, not successes) | After ~5 attempts: yellow toast `AUTH_TOAST.TOO_MANY_ATTEMPTS_GENERIC()` ("Too many attempts. Try again later."). Inline `RateLimitBanner` with countdown also appears below the buttons. Trust This Device button becomes disabled. | ☐ |
| B6.2 | Passkey register: open modal, enter wrong password 5+ times, click Register repeatedly | Same toast appears once on first rate-limit transition. Rate-limit banner shows below the Add Passkey button. Add Passkey button disabled. | ☐ |
| B6.3 | Wait for the countdown to expire | Banner disappears, button re-enables, NO duplicate toast on re-enable (transition logic is null→set, not set→null). | ☐ |

### B.7 — SCRUM-347 Per-session deny-list (immediate revoke)

> This requires inspecting backend timing — easier with 2 browser windows.

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B7.1 | Open `/profile` in **window A**. Open `/profile/sessions` (or wherever Active Sessions lists) in **window B**. Both windows must be the SAME logged-in user but DIFFERENT browser contexts (use Chrome + Firefox, OR Chrome + Chrome incognito, OR 2 separate Chrome profiles). | Both windows show the user's content. | ☐ |
| B7.2 | In window B's Active Sessions list, click "Revoke" on **window A's** session (identify by IP / time / device name). | Window B refreshes: that session row gone. | ☐ |
| B7.3 | In window A, perform any action that requires the access token (e.g. refresh the profile page, or click "Trusted Devices" tab). | **Window A: 401 within 1 request** (NOT after 15 min). The session-expired toast appears + redirect to `/login`. This is the SCRUM-347 fix — pre-SCRUM-347 the access token would have remained valid until its TTL expired. | ☐ |
| B7.4 | In window A, log in as the SAME user. Open dashboard. In window B, click "Sign out from all sessions" (the SCRUM-342 button). | **Window A: 401 within 1 request** + toast + redirect to `/login` (immediate, not eventual). | ☐ |

### B.8 — SCRUM-349 Cross-tab session sync via BroadcastChannel

> Use 2 tabs in the **same browser profile** (NOT incognito-vs-normal — those are separate profiles by design).

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B8.1 | Open 2 tabs of `/profile` in the same browser. Both logged in as the same user. | Both load successfully. | ☐ |
| B8.2 | In tab A, click logout (or use the "Sign out from all sessions" button). | Tab A: redirected to `/login`. **Tab B: redirects to `/login` within ~100ms** (visibly, not after the next API call). This is the BroadcastChannel propagation. | ☐ |
| B8.3 | Open 1 tab in normal browser, 1 tab in incognito. Log in as same user in both. Logout from one. | The OTHER tab does NOT auto-redirect (different browser profiles). It will redirect on its next 401 cascade. **This is by design** — incognito = isolated profile. | ☐ |
| B8.4 | (Old browser test — optional) If you have an ancient browser without `BroadcastChannel` support, the feature is a silent no-op. Open a tab in an old browser, log out from a modern browser tab — old tab does NOT auto-redirect (graceful degradation). | If you don't have an old browser, skip — covered by `useCrossTabAuth.test.ts` "no-op fallback" case. | ☐ |

### B.9 — SCRUM-350 Playwright scaffolding

| # | Step | Expected | Actual |
|---|------|----------|--------|
| B9.1 | `cd nexacore-dashboard && npm run test:e2e` | Output ends with "6 skipped" (no failures, no crashes). Exit code 0. | ☐ |
| B9.2 | `npx playwright --version` | `Version 1.59.x` | ☐ |
| B9.3 | Verify `nexacore-dashboard/.gitignore` includes `/test-results/` and `/playwright-report/` | Present. | ☐ |

---

## Section C — Backend `curl` smoke (🟡 USER MUST RUN — when API is up)

> Setup: backend running at `http://localhost:3000`. Have a JWT for a test user account A (with password set). Get one by logging in via the dashboard or running `curl POST /auth/login` and capturing the access token from the response.

```bash
# Set these once at the start of the section
export API=http://localhost:3000
export TOKEN="<paste your access token here>"
export FP="$(uuidgen | tr -d -)"  # any 32+ char random string for fingerprint
```

### C.1 — SCRUM-327 trust device requires password (AC1)

```bash
# 1. Without password → 400
curl -i -X POST $API/auth/trusted-devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\":\"$FP\"}"
# Expected: HTTP/1.1 400 Bad Request, body says "password" is required.

# 2. With wrong password → 401
curl -i -X POST $API/auth/trusted-devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\":\"$FP\",\"password\":\"wrong\"}"
# Expected: HTTP/1.1 401 Unauthorized, message "Invalid password".

# 3. With correct password → 201
curl -i -X POST $API/auth/trusted-devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fingerprint\":\"$FP\",\"password\":\"<your-test-password>\"}"
# Expected: HTTP/1.1 201, JSON with id, deviceName, expiresAt.
```

### C.2 — SCRUM-327 passkey register options requires password (AC3)

```bash
# Without password → 400
curl -i -X POST $API/auth/passkeys/register/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
# Expected: 400, "password" required.

# Wrong password → 401
curl -i -X POST $API/auth/passkeys/register/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"wrong\"}"
# Expected: 401, "Invalid password".

# Correct password → 200 with WebAuthn challenge
curl -i -X POST $API/auth/passkeys/register/options \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"<your-test-password>\"}"
# Expected: 200, JSON with `challenge`, `rp`, etc.
```

### C.3 — SCRUM-327 passkey delete requires password (AC4)

```bash
# Get a passkey id first
curl -s $API/auth/passkeys -H "Authorization: Bearer $TOKEN" | head -3
# Capture an `id` field. Then:
export PASSKEY_ID="<paste-id-here>"

# Without password → 400
curl -i -X DELETE $API/auth/passkeys/$PASSKEY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}"
# Expected: 400, password required.

# Wrong password → 401
curl -i -X DELETE $API/auth/passkeys/$PASSKEY_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"wrong\"}"
# Expected: 401, Invalid password.
```

### C.4 — SCRUM-347 per-session deny-list timing (V3.3.1)

```bash
# 1. Login and capture access token + the session id from the cookie
# (Skip this if you already have $TOKEN and a known $SESSION_ID)

# 2. Confirm /auth/sessions returns the current session
curl -s $API/auth/sessions -H "Authorization: Bearer $TOKEN" | head -10
# Capture the `id` of the session you'll revoke (NOT the current one if you want
# to keep using $TOKEN for the next step — for this test we revoke the current).

# 3. Revoke that session via DELETE /auth/sessions/:id from a SECOND token
#    (or from the same one — for the test it doesn't matter since the goal is
#    to verify the access token dies after the revoke)
export OTHER_SESSION_ID="<paste-other-session-id-here>"
curl -i -X DELETE $API/auth/sessions/$OTHER_SESSION_ID \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200, { "message": "Session revoked" }.

# 4. Within ~1s, attempt a request using the access token of the revoked session
# Easier: revoke the CURRENT session and immediately retry any authed endpoint.
# Pre-SCRUM-347 expectation: this would still work for up to 15 min.
# Post-SCRUM-347 expectation: 401 immediately.
curl -i $API/auth/me -H "Authorization: Bearer $TOKEN"
# Expected: HTTP/1.1 401 Unauthorized.
```

### C.5 — SCRUM-347 logout-all is immediate (V3.3.4)

```bash
# Trigger logout-all (find the right endpoint — likely DELETE /auth/sessions or POST /auth/logout-all)
curl -i -X DELETE $API/auth/sessions \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200.

# Immediately retry any authed endpoint with the same token
curl -i $API/auth/me -H "Authorization: Bearer $TOKEN"
# Expected: 401 immediately.
```

### C.6 — Redis deny-list keys (optional Redis observability)

```bash
# If you have redis-cli available:
redis-cli KEYS "deny:session:*"
# Expected: at least one key for each session you revoked above.

redis-cli TTL "deny:session:<some-session-id>"
# Expected: a number close to 900 (= 15 min ACCESS_TOKEN_TTL_SECONDS).
```

---

## Section D — Acceptance Criteria summary (after manual tests)

Mark each AC after running the relevant section:

### SCRUM-327
- [ ] AC1 (Trust device requires password — B1, C1) → PASS
- [ ] AC2 (Revoke trusted device requires password — B2) → PASS
- [ ] AC3 (Register passkey requires password — B3, C2) → PASS
- [ ] AC4 (Delete passkey requires password mandatorily — B4, C3) → PASS
- [ ] AC5 (OAuth-only user gets 400 — B5 if applicable, else covered by unit tests) → PASS / N/A
- [ ] AC6 (Frontend ConfirmModal flow — B1, B2, B3, B4) → PASS
- [ ] AC7 (Audit logs on success path — backend logs visible in DB or logs) → PASS (no UI surface)
- [ ] AC8 (Backend tests) → ✅ already PASS (1052/1052)
- [ ] AC9 (Frontend tests) → ✅ already PASS (32/32 SCRUM-relevant)
- [ ] AC10 (Phase 3 audit re-run) → ✅ already PASS (`audit-2026-05-04T00-30/`, 18/18)
- [ ] AC11 (SCRUM-342 design respected — "Sign out from all sessions" still works) → covered by B7.4

### SCRUM-347
- [ ] V3.3.1 immediate revoke (C4 / B7.3) → PASS
- [ ] V3.3.4 immediate logout-all (C5 / B7.4) → PASS
- [ ] In-flight tokens (no sessionId payload) graceful degradation → covered by unit tests; manual not feasible without forging old payloads

### SCRUM-349
- [ ] AC1 TrustedDevices toast on rate-limit (B6.1) → PASS
- [ ] AC2 PasskeyManager toast on rate-limit (B6.2) → PASS
- [ ] AC3 Cross-tab logout propagation (B8.2) → PASS
- [ ] AC4 audit-standards.mdc Section 6.7 → already in main via SCRUM-347 docs commit `5ec1199`

### SCRUM-350
- [ ] AC1 `npm run test:e2e` works locally (B9.1) → PASS (6 skipped clean)
- [ ] AC2 CI integration → DEFERRED (separate ticket)
- [ ] AC3 audit Phase 9b documented → ✅ already in audit-standards.mdc
- [ ] AC4 SCRUM-342 cases covered → PARTIAL (stubs reference; bodies pending)

---

## Section E — Final transition

Once all manual + curl checklists pass:

```
Transition each ticket to Done via Jira UI:
- SCRUM-327
- SCRUM-347
- SCRUM-349
- SCRUM-350 (if user accepts the 3 Deferred follow-ups as separate tickets — see SCRUM-350_verify.md)
```

If any check fails, **do NOT transition** — open a follow-up bug ticket and assess severity:
- HIGH = blocker, fix before transition.
- MEDIUM = ship-and-fix-next-sprint, transition with caveat in comment.
- LOW = follow-up bug ticket, transition.

---

## Appendix — Stale Jira tickets (for cleanup)

Per the Jira query at session end, these auth-keyword tickets show as "To Do" but are functionally complete per memory — only Jira transition pending:

- **SCRUM-294** (Design System showcase polish) — Sprint 14, per `MEMORY.md` it's already ✅ DONE.
- **SCRUM-338** (Reconcile UI design system Auth atoms B5) — Sprint 12, per `MEMORY.md` it's already ✅ DONE (ai-specs commit `4ed94e9`).

These can be transitioned to Done independently (no code testing needed — already shipped earlier).

Also potentially relevant for a future session (NOT part of Camino Total scope):
- **SCRUM-311** (Sprint 14, OAuth avatar download local) — pending implementation.
- **SCRUM-313** (Sprint 14, IconButton tooltips) — pending implementation.
