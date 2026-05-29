# Backend Implementation Plan: SCRUM-190 Complete .env.example with Missing Env Vars

## 1. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-188 (error.tsx boundaries)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/.env.example` — 31 vars currently present
  - `nexacore-api/src/config/config.validation.ts` — Joi validation schema (28 vars)
  - `nexacore-api/src/config/app.config.ts` — app namespace config
  - `nexacore-api/src/config/auth.config.ts` — auth namespace config
  - `nexacore-api/src/config/oauth.config.ts` — oauth namespace config
  - All `process.env.*` references across `src/` — 51 unique env vars total
- **Constructor signatures verified**: N/A (no code changes)
- **Methods verified to exist**: N/A (no code changes)
- **Guard dependency chain verified**: N/A (no code changes)
- **Discrepancies with integration-state.md**: None

## 2. Overview

Add 21 missing environment variables to `.env.example` and remove 1 stale entry. This is a documentation-only change — no source code modifications. The `.env.example` file serves as the developer-facing reference for project setup (SOC 2 CC8.2).

### Missing Variables (21)

| Variable | Category | Default | Security-Critical? |
|----------|----------|---------|-------------------|
| `NODE_ENV` | App | development | No |
| `API_URL` | App | http://localhost:3000 | No |
| `CORS_ALLOWED_ORIGINS` | Security | (uses FRONTEND_URL) | No |
| `CSRF_SECRET` | Security | (dev default) | **YES** |
| `MFA_ENCRYPTION_KEY` | Security | (dev default) | **YES** |
| `MFA_APP_NAME` | MFA | EM NexaCore | No |
| `SESSION_IDLE_TIMEOUT_HOURS` | Sessions | 0.5 | No |
| `MAX_CONCURRENT_SESSIONS` | Sessions | 5 | No |
| `TRUSTED_DEVICE_TTL_DAYS` | Sessions | 30 | No |
| `SMTP_HOST` | Email | localhost | No |
| `SMTP_PORT` | Email | 587 | No |
| `SMTP_SECURE` | Email | false | No |
| `SMTP_USER` | Email | (empty) | No |
| `SMTP_PASSWORD` | Email | (empty) | No |
| `SMTP_FROM` | Email | "EM NexaCore" <noreply@emillionnetworking.com> | No |
| `MAXMIND_DB_PATH` | Geolocation | ./data/GeoLite2-City.mmdb | No |
| `GEOLOCATION_CACHE_MAX_SIZE` | Geolocation | 10000 | No |
| `GEOLOCATION_CACHE_TTL_HOURS` | Geolocation | 24 | No |
| `IMPOSSIBLE_TRAVEL_SPEED_KMH` | Geolocation | 900 | No |
| `IMPOSSIBLE_TRAVEL_MIN_DISTANCE_KM` | Geolocation | 100 | No |
| `IMPOSSIBLE_TRAVEL_ALERT_STRATEGY` | Geolocation | alert_only | No |

### Stale Entry (1)

| Variable | Issue |
|----------|-------|
| `UNUSUAL_HOURS_MIN_LOGINS` | Present in .env.example but NOT referenced in source code — remove |

## 3. Architecture Context

- **File**: `nexacore-api/.env.example` (only file modified)
- No module, service, guard, or controller changes
- No test changes needed (no code changes)

## 4. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-190-backend` from latest `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-190-backend`

### Step 1: Update .env.example

- **File**: `nexacore-api/.env.example`
- **Action**: Add all 21 missing vars with placeholder values and comments, remove 1 stale entry
- **Implementation Steps**:
  1. Add `NODE_ENV` at the top (before DATABASE_URL)
  2. Add `API_URL` after `FRONTEND_URL`
  3. Add `CORS_ALLOWED_ORIGINS` in a new "CORS" section
  4. Add `CSRF_SECRET` in a new "CSRF Protection" section with clear production warning
  5. Add `MFA_ENCRYPTION_KEY` and `MFA_APP_NAME` in a new "MFA" section with clear production warning
  6. Add session vars (`SESSION_IDLE_TIMEOUT_HOURS`, `MAX_CONCURRENT_SESSIONS`, `TRUSTED_DEVICE_TTL_DAYS`) in a new "Sessions" section
  7. Add all SMTP vars in a new "SMTP / Email" section
  8. Add all geolocation/impossible travel vars in a new "Geolocation & Travel Detection" section
  9. Remove `UNUSUAL_HOURS_MIN_LOGINS` (stale — not in source code)
  10. Use placeholder format consistently: `"your-xxx-here"` for secrets, actual defaults for tuning params
  11. Add `# REQUIRED in production` comments on security-critical vars

- **Ordering**: Group by category, matching the config namespace structure:
  1. Environment & App
  2. Database
  3. JWT & Sessions
  4. MFA
  5. WebAuthn / Passkeys
  6. OAuth (Google, GitHub)
  7. CSRF Protection
  8. CORS
  9. Redis
  10. SMTP / Email
  11. Cloudflare Turnstile
  12. Geolocation & Travel Detection
  13. Suspicious Login Detection
  14. Swagger

### Step 2: Verify No Real Credentials

- **Action**: Review the final .env.example to ensure no real secrets are present
- **Implementation Steps**:
  1. Grep for any non-placeholder values that look like real credentials
  2. Ensure all secrets use `"your-xxx-here"` format or safe test values

### Step 3: Commit and Push

- **Action**: Stage only `.env.example`, commit, push, create PR

## 5. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Update .env.example
3. Step 2: Verify no real credentials
4. Step 3: Commit and push

## 6. Testing Checklist

- [ ] All 51 env vars in source code are present in .env.example
- [ ] No stale entries remain (UNUSUAL_HOURS_MIN_LOGINS removed)
- [ ] No real credentials in .env.example
- [ ] Security-critical vars have `# REQUIRED in production` comments
- [ ] Backend still starts with existing .env (no breaking changes)
- [ ] `nest build` still succeeds (no code changes, but verify)

## 7. Error Response Format

N/A — no code changes.

## 8. Dependencies

No new dependencies required.

## 9. Notes

- The Jira ticket says "17 missing vars" but actual count is **21 missing + 1 stale** (the audit count was approximate)
- `MFA_ENCRYPTION_KEY` and `CSRF_SECRET` are the most critical — both have dev defaults that MUST be changed in production
- `UNUSUAL_HOURS_MIN_LOGINS` is in the current .env.example but is NOT referenced anywhere in source — likely a remnant from an earlier iteration
- This is purely a documentation change — zero risk of breaking anything

## 10. Next Steps After Implementation

- Run `/update-docs SCRUM-190` to create implementation record
- This is the last ticket in Sprint 7 — sprint completion after merge

## 11. Implementation Verification

- [ ] **Code Quality**: .env.example is well-organized with clear comments
- [ ] **Completeness**: All 51 source-referenced env vars present
- [ ] **Security**: No real credentials, security warnings on critical vars
- [ ] **Documentation**: Integration state changelog updated
