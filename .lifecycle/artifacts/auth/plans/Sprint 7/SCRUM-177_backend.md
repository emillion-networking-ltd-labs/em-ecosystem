# Backend Implementation Plan: SCRUM-177 Document link/google and link/github Endpoints + Guard Chains

## 1. Header

- **Ticket**: SCRUM-177
- **Sprint**: Sprint 7 - Audit Remediation
- **Parent**: SCRUM-174 (Auth Module Audit Epic)
- **Audit Finding**: Phase 3 F-03 — OAuth link endpoints (`/auth/link/google`, `/auth/link/github`) and `OAuthLinkGuard` missing from technical documentation

---

## 2. Codebase State Snapshot

- **Date**: 2026-03-12
- **Last completed ticket**: SCRUM-176 (commit `80aa471`, NoCacheInterceptor on auth controllers)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `src/auth/auth.controller.ts` — Lines 637-681: `GET /link/google` with `@UseGuards(OAuthLinkGuard, GoogleAuthGuard)` and `GET /link/github` with `@UseGuards(OAuthLinkGuard, GitHubAuthGuard)`. Both have `@Throttle(oauth)`, `@ApiBearerAuth()`, `@ApiOperation`, `@ApiResponse(302)`, `@ApiResponse(401)`.
  - `src/auth/guards/oauth-link.guard.ts` — `OAuthLinkGuard implements CanActivate`. Constructor: `JwtService`. Validates JWT from `Authorization` header or `?token=` query param. Sets `req.oauthAction='link'` and `req.user = { id: payload.sub }`.
  - `ai-specs/specs/api-spec.yml` — `/auth/link/google` and `/auth/link/github` are NOT documented. Existing OAuth endpoints (`/auth/google`, `/auth/github`, callbacks, exchange) are at lines 270-324.
  - `ai-specs/specs/integration-state.md` — `OAuthLinkGuard` is NOT in Guard Dependency Map. Link endpoints are NOT in AuthController Method Guards table. Lines 78-87 show the last entries (oauth/exchange through trusted-devices).
- **Constructor signatures verified**: OAuthLinkGuard(JwtService) — line 16
- **Methods verified to exist**: N/A — documentation-only ticket
- **Guard dependency chain verified**: OAuthLinkGuard depends on JwtService (from JwtModule in AuthModule imports)
- **Discrepancies with integration-state.md**:
  - Missing: `OAuthLinkGuard` in Guard Dependency Map
  - Missing: `GET /auth/link/google` and `GET /auth/link/github` in AuthController Method Guards table

---

## 3. Overview

Documentation-only ticket. Add the two OAuth account linking endpoints (`GET /auth/link/google`, `GET /auth/link/github`) and the `OAuthLinkGuard` to technical documentation. These endpoints were implemented in SCRUM-161 but their documentation was missed.

**No code changes.** Only `api-spec.yml` and `integration-state.md` are modified.

---

## 4. Architecture Context

- **Modules involved**: None (documentation-only)
- **Components affected**:
  - Modified: `ai-specs/specs/api-spec.yml` (add 2 endpoint definitions)
  - Modified: `ai-specs/specs/integration-state.md` (add OAuthLinkGuard to Guard Dependency Map, add 2 endpoints to AuthController Method Guards)
- **Files referenced**: `src/auth/auth.controller.ts` (lines 637-681), `src/auth/guards/oauth-link.guard.ts`

---

## 5. Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create `feature/SCRUM-177-backend` from `main`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. `git checkout -b feature/SCRUM-177-backend`

### Step 1: Add OAuthLinkGuard to Guard Dependency Map in integration-state.md

- **File**: `ai-specs/specs/integration-state.md`
- **Action**: Add `OAuthLinkGuard` row to Guard Dependency Map table (after `GitHubAuthGuard` row, before `TurnstileGuard`)
- **Implementation Steps**:
  1. Add row:
     ```
     | `OAuthLinkGuard` | `JwtService` | AuthModule (JwtModule) | Only in AuthModule context |
     ```
- **Implementation Notes**: OAuthLinkGuard is a custom CanActivate guard (not a Passport guard). It validates JWT from Authorization header or `?token=` query param and sets `req.oauthAction='link'`.

### Step 2: Add Link Endpoints to AuthController Method Guards in integration-state.md

- **File**: `ai-specs/specs/integration-state.md`
- **Action**: Add `GET /link/google` and `GET /link/github` rows to AuthController Method Guards table (after `POST /oauth/exchange`, before `POST /trusted-devices`)
- **Implementation Steps**:
  1. Add rows:
     ```
     | GET /link/google | OAuthLinkGuard, GoogleAuthGuard | @Throttle(oauth), @ApiBearerAuth |
     | GET /link/github | OAuthLinkGuard, GitHubAuthGuard | @Throttle(oauth), @ApiBearerAuth |
     ```

### Step 3: Add Link Endpoints to api-spec.yml

- **File**: `ai-specs/specs/api-spec.yml`
- **Action**: Add `/auth/link/google` and `/auth/link/github` endpoint definitions after `/auth/github/callback` (line 304) and before `/auth/oauth/exchange` (line 306)
- **Implementation Steps**:
  1. Add `/auth/link/google` endpoint:
     ```yaml
     /auth/link/google:
       get:
         summary: Link Google account to authenticated user
         description: >-
           Requires a valid JWT (via Authorization header or ?token= query param).
           OAuthLinkGuard validates the token and sets oauthAction='link',
           then GoogleAuthGuard redirects to Google consent screen with
           action=link and userId embedded in the OAuth state parameter.
           On callback, the user's Google account is linked to their existing account.
         tags: [OAuth]
         security:
           - BearerAuth: []
         parameters:
           - name: token
             in: query
             required: false
             schema:
               type: string
             description: JWT token (alternative to Authorization header, needed for browser redirects)
         responses:
           '302':
             description: Redirects to Google consent screen
           '401':
             description: Unauthorized — valid JWT required
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/ErrorResponse'
     ```
  2. Add `/auth/link/github` endpoint (same structure, replace Google with GitHub):
     ```yaml
     /auth/link/github:
       get:
         summary: Link GitHub account to authenticated user
         description: >-
           Requires a valid JWT (via Authorization header or ?token= query param).
           OAuthLinkGuard validates the token and sets oauthAction='link',
           then GitHubAuthGuard redirects to GitHub authorization screen with
           action=link and userId embedded in the OAuth state parameter.
           On callback, the user's GitHub account is linked to their existing account.
         tags: [OAuth]
         security:
           - BearerAuth: []
         parameters:
           - name: token
             in: query
             required: false
             schema:
               type: string
             description: JWT token (alternative to Authorization header, needed for browser redirects)
         responses:
           '302':
             description: Redirects to GitHub authorization screen
           '401':
             description: Unauthorized — valid JWT required
             content:
               application/json:
                 schema:
                   $ref: '#/components/schemas/ErrorResponse'
     ```

### Step 4: Add Changelog Entry to integration-state.md

- **File**: `ai-specs/specs/integration-state.md`
- **Action**: Add changelog entry at top of Changelog table
- **Implementation Steps**:
  1. Add row:
     ```
     | 2026-03-12 | SCRUM-177 | Documentation-only: Added `OAuthLinkGuard` to Guard Dependency Map (deps: JwtService, AuthModule context). Added `GET /auth/link/google` (OAuthLinkGuard → GoogleAuthGuard) and `GET /auth/link/github` (OAuthLinkGuard → GitHubAuthGuard) to AuthController Method Guards table and api-spec.yml. No code changes. |
     ```

---

## 6. Implementation Order

1. Step 0: Create feature branch
2. Step 1: Add OAuthLinkGuard to Guard Dependency Map
3. Step 2: Add link endpoints to AuthController Method Guards
4. Step 3: Add link endpoints to api-spec.yml
5. Step 4: Add changelog entry

---

## 7. Testing Checklist

- [ ] `OAuthLinkGuard` appears in Guard Dependency Map with correct dependencies
- [ ] `GET /link/google` appears in AuthController Method Guards with `OAuthLinkGuard, GoogleAuthGuard`
- [ ] `GET /link/github` appears in AuthController Method Guards with `OAuthLinkGuard, GitHubAuthGuard`
- [ ] `/auth/link/google` appears in api-spec.yml with security, parameters, and responses
- [ ] `/auth/link/github` appears in api-spec.yml with security, parameters, and responses
- [ ] All documentation matches actual code in `auth.controller.ts` lines 637-681 and `oauth-link.guard.ts`
- [ ] No code files modified (documentation-only)

---

## 8. Error Response Format

N/A — documentation-only ticket, no new error responses.

---

## 9. Partial Update Support

N/A

---

## 10. Dependencies

No new dependencies. Documentation-only.

---

## 11. Notes

- The `?token=` query parameter on link endpoints is necessary because browser redirects (`window.location.href`) cannot carry `Authorization` headers. OAuthLinkGuard accepts JWT from either source.
- OAuthLinkGuard is NOT a Passport guard — it's a plain `CanActivate` implementation that manually verifies JWT via `JwtService.verify()`.
- The guard chain is: OAuthLinkGuard (validates JWT, sets `req.oauthAction='link'`) → GoogleAuthGuard/GitHubAuthGuard (reads oauthAction from request, embeds `action=link` + `userId` in OAuth state parameter).
- These endpoints were implemented in SCRUM-161 but documentation was deferred.

---

## 12. Next Steps After Implementation

- Run `/update-docs` to create implementation record
- Commit and create PR

---

## 13. Implementation Verification

- [ ] `OAuthLinkGuard` in Guard Dependency Map (integration-state.md)
- [ ] 2 link endpoints in AuthController Method Guards (integration-state.md)
- [ ] 2 link endpoints in api-spec.yml
- [ ] Changelog entry added
- [ ] Zero code files modified
