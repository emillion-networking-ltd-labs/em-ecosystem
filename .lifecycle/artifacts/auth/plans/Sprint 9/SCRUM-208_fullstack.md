# Fullstack Implementation Plan: SCRUM-208 Move verification tokens from query strings to POST body

## Overview

Refactor email verification endpoints to accept tokens via POST body instead of GET query strings, per OWASP ASVS V8.3.1. Currently, email links point to backend GET endpoints with tokens in query strings. After the change, email links point to frontend pages, which extract the token and POST it to the backend.

## Architecture Context

**Current flow:**
1. Email link → `GET {apiUrl}/auth/verify-email?token=XXX` → backend validates → redirect to `{frontendUrl}/verify-email?status=success|invalid`

**New flow:**
1. Email link → `{frontendUrl}/verify-email?token=XXX` (token still in URL from email, unavoidable)
2. Frontend extracts token → `POST {apiUrl}/auth/verify-email` body `{ token }` → returns `{ status }` JSON
3. Frontend displays result based on response

Same pattern for `verify-email-change`.

## Backend Changes

### Step 1: Create VerifyEmailDto and VerifyEmailChangeDto
- `src/auth/dto/verify-email.dto.ts` — `{ token: string }` with `@IsString()` + `@IsNotEmpty()`
- `src/auth/dto/verify-email-change.dto.ts` — same pattern

### Step 2: Convert endpoints from GET→POST in account.controller.ts
- `GET verify-email` → `POST verify-email` with `@Body() dto`, return JSON `{ status }` instead of redirect
- `GET verify-email-change` → `POST verify-email-change` with `@Body() dto`, return JSON `{ status }`
- Add `@SkipCsrf()` (no auth, called from email link flow)
- Add `@Throttle()` to prevent brute-force token guessing

### Step 3: Update mail.service.ts
- Change verification URLs from `{apiUrl}/auth/verify-email?token=XXX` to `{frontendUrl}/verify-email?token=XXX`
- Same for email-change verification

### Step 4: Update tests
- account.controller.spec.ts — update from GET+redirect to POST+JSON
- mail.service.spec.ts — update expected URLs

## Frontend Changes

### Step 5: Update VerifyEmailStatus.tsx
- On mount: extract `token` from query params
- If token present: POST to `/auth/verify-email` with `{ token }`, show result
- If no token but `status` param: show status (backwards compat during transition)
- Show loading spinner while verifying

### Step 6: Update verify-email-change page
- Same pattern: extract token, POST to backend, show result

## Implementation Order
1. Create feature branch
2. Backend: DTOs, controller changes, mail service, tests
3. Frontend: both verification pages
4. Build verification + full test suite
