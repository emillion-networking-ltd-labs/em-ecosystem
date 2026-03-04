#!/bin/bash
# ============================================================================
# NexaCore API — Security Smoke Test
# ============================================================================
# Tests security layers implemented in Sprints 1-3 against a RUNNING server.
#
# Usage:
#   bash scripts/security-smoke-test.sh                    # basic tests (no auth)
#   bash scripts/security-smoke-test.sh --full             # all tests (creates test user)
#   bash scripts/security-smoke-test.sh --email x --pass y # use existing user
#
# Prerequisites:
#   - Server running at localhost:3000
#   - curl available
#   - For --full: a verified user account
#
# Test order:
#   Phase 1 (1-7): Non-destructive, no auth required
#   Phase 2 (8-9): Auth-dependent (requires --full or --email)
#   Phase 3 (10-11): Destructive (rate limits, lockout) — LAST
# ============================================================================

# ── Configuration ──────────────────────────────────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%s)
TEST_EMAIL=""
TEST_PASS=""
FULL_MODE=false
ACCESS_TOKEN=""
CSRF_TOKEN=""
CSRF_COOKIE=""

# ── Colors ─────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Counters ───────────────────────────────────────────────────────────────
PASS=0
FAIL=0
WARN=0
SKIP=0

# ── Parse arguments ───────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --full) FULL_MODE=true; shift ;;
    --email) TEST_EMAIL="$2"; shift 2 ;;
    --pass) TEST_PASS="$2"; shift 2 ;;
    --url) BASE_URL="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--full] [--email EMAIL --pass PASSWORD] [--url URL]"
      echo ""
      echo "Options:"
      echo "  --full            Run all tests including auth + rate limit + lockout"
      echo "  --email EMAIL     Use existing verified user (skip registration)"
      echo "  --pass PASSWORD   Password for existing user"
      echo "  --url URL         Server URL (default: http://localhost:3000)"
      echo ""
      echo "Test phases:"
      echo "  1-7   Non-destructive (always run)"
      echo "  8-9   Auth-dependent (--full or --email/--pass)"
      echo "  10-11 Destructive: rate limits + lockout (--full only, run LAST)"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Helpers ────────────────────────────────────────────────────────────────

section() {
  echo ""
  echo -e "${BOLD}${CYAN}━━━ $1 ━━━${NC}"
}

check_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  local detail="${4:-}"

  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}PASS${NC}  $name ${DIM}(HTTP $actual)${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}FAIL${NC}  $name ${DIM}(expected $expected, got $actual)${NC}"
    [ -n "$detail" ] && echo -e "        ${DIM}$detail${NC}"
    ((FAIL++))
  fi
}

check_status_any() {
  local name="$1"
  local actual="$2"
  shift 2
  local expected_list=("$@")

  for exp in "${expected_list[@]}"; do
    if [ "$actual" = "$exp" ]; then
      echo -e "  ${GREEN}PASS${NC}  $name ${DIM}(HTTP $actual)${NC}"
      ((PASS++))
      return
    fi
  done

  echo -e "  ${RED}FAIL${NC}  $name ${DIM}(got $actual, expected one of: ${expected_list[*]})${NC}"
  ((FAIL++))
}

check_header() {
  local name="$1"
  local header="$2"
  local headers="$3"
  local expected="${4:-}"

  local value
  value=$(echo "$headers" | grep -i "^${header}:" | head -1 | sed 's/^[^:]*: //' | tr -d '\r')

  if [ -z "$value" ]; then
    echo -e "  ${RED}FAIL${NC}  $name ${DIM}(header missing)${NC}"
    ((FAIL++))
  elif [ -n "$expected" ] && ! echo "$value" | grep -qi "$expected"; then
    echo -e "  ${RED}FAIL${NC}  $name ${DIM}(got: $value)${NC}"
    ((FAIL++))
  else
    echo -e "  ${GREEN}PASS${NC}  $name ${DIM}($value)${NC}"
    ((PASS++))
  fi
}

check_contains() {
  local name="$1"
  local needle="$2"
  local haystack="$3"

  if echo "$haystack" | grep -qi "$needle"; then
    echo -e "  ${GREEN}PASS${NC}  $name"
    ((PASS++))
  else
    echo -e "  ${RED}FAIL${NC}  $name ${DIM}(not found: $needle)${NC}"
    ((FAIL++))
  fi
}

check_not_contains() {
  local name="$1"
  local needle="$2"
  local haystack="$3"

  if echo "$haystack" | grep -qi "$needle"; then
    echo -e "  ${RED}FAIL${NC}  $name ${DIM}(should not contain: $needle)${NC}"
    ((FAIL++))
  else
    echo -e "  ${GREEN}PASS${NC}  $name"
    ((PASS++))
  fi
}

skip_test() {
  echo -e "  ${YELLOW}SKIP${NC}  $1 ${DIM}($2)${NC}"
  ((SKIP++))
}

warn_test() {
  echo -e "  ${YELLOW}WARN${NC}  $1 ${DIM}($2)${NC}"
  ((WARN++))
}

extract_json_field() {
  local field="$1"
  local json="$2"
  echo "$json" | grep -o "\"${field}\":[^,}]*" | head -1 | sed "s/\"${field}\"://" | tr -d '"' | tr -d ' '
}

refresh_csrf() {
  local resp
  resp=$(curl -s -D - "${BASE_URL}/auth/csrf-token" 2>/dev/null)
  CSRF_TOKEN=$(echo "$resp" | tail -1 | grep -o '"csrfToken":"[^"]*"' | head -1 | sed 's/"csrfToken":"//' | sed 's/"//')
  CSRF_COOKIE=$(echo "$resp" | grep -i "set-cookie.*__csrf" | head -1 | sed 's/.*__csrf=//' | sed 's/;.*//')
}

# ── Pre-flight check ──────────────────────────────────────────────────────

echo -e "${BOLD}NexaCore API — Security Smoke Test${NC}"
echo -e "${DIM}Target: $BASE_URL${NC}"
echo -e "${DIM}Mode: $([ "$FULL_MODE" = true ] && echo "FULL" || echo "BASIC")${NC}"
echo -e "${DIM}Date: $(date '+%Y-%m-%d %H:%M:%S')${NC}"

section "0. Server Connectivity"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "${BASE_URL}/auth/csrf-token" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "000" ]; then
  echo -e "  ${RED}FAIL${NC}  Server not reachable at $BASE_URL"
  echo -e "  ${DIM}Start the server: cd nexacore-api && npm run start:dev${NC}"
  exit 1
fi
echo -e "  ${GREEN}PASS${NC}  Server reachable ${DIM}(HTTP $HTTP_CODE)${NC}"
((PASS++))

# Get initial CSRF token
refresh_csrf

# ============================================================================
# PHASE 1: Non-destructive, no auth required (tests 1-7)
# ============================================================================

# ── 1. Security Headers ───────────────────────────────────────────────────

section "1. Security Headers (Helmet)"

HEADERS=$(curl -sI "${BASE_URL}/auth/csrf-token" 2>/dev/null)

check_header "X-Content-Type-Options = nosniff" "x-content-type-options" "$HEADERS" "nosniff"
check_header "X-Frame-Options = DENY" "x-frame-options" "$HEADERS" "DENY"
check_header "Referrer-Policy" "referrer-policy" "$HEADERS" "strict-origin-when-cross-origin"
check_header "Content-Security-Policy present" "content-security-policy" "$HEADERS" "default-src"
check_header "Cross-Origin-Resource-Policy" "cross-origin-resource-policy" "$HEADERS" "same-site"
check_header "X-DNS-Prefetch-Control = off" "x-dns-prefetch-control" "$HEADERS" "off"
check_not_contains "No X-Powered-By leak" "x-powered-by" "$HEADERS"

# ── 2. CSRF Protection ───────────────────────────────────────────────────

section "2. CSRF Protection"

# 2a. Token endpoint works
if [ -n "$CSRF_TOKEN" ]; then
  echo -e "  ${GREEN}PASS${NC}  CSRF token endpoint returns token ${DIM}(${#CSRF_TOKEN} chars)${NC}"
  ((PASS++))
else
  echo -e "  ${RED}FAIL${NC}  CSRF token endpoint did not return token"
  ((FAIL++))
fi

if [ -n "$CSRF_COOKIE" ]; then
  echo -e "  ${GREEN}PASS${NC}  CSRF __csrf cookie set"
  ((PASS++))
else
  echo -e "  ${RED}FAIL${NC}  CSRF __csrf cookie not set"
  ((FAIL++))
fi

# 2b. POST without CSRF → 403
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/logout" \
  -H "Content-Type: application/json" 2>/dev/null)
check_status "POST without CSRF token → 403" "403" "$CODE"

# 2c. POST with invalid CSRF → 403
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/logout" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: fake-invalid-token" \
  -b "__csrf=fake-invalid-cookie" 2>/dev/null)
check_status "POST with invalid CSRF → 403" "403" "$CODE"

# 2d. Endpoints that skip CSRF (forgot-password)
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"csrf-skip-test@test.com"}' 2>/dev/null)
# 200 = success (anti-enum), 429 = rate limited from prev run. Both prove CSRF was skipped.
check_status_any "POST /auth/forgot-password skips CSRF (not 403)" "$CODE" "200" "201" "429"

# ── 3. JWT Authentication Guard ──────────────────────────────────────────

section "3. JWT Authentication Guard"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/me" 2>/dev/null)
check_status "GET /auth/me without token → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fake" 2>/dev/null)
check_status "GET /auth/me with fake JWT → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/sessions" 2>/dev/null)
check_status "GET /auth/sessions without token → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/users" 2>/dev/null)
check_status "GET /users without token → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/audit-logs" 2>/dev/null)
check_status "GET /audit-logs without token → 401" "401" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/permissions/roles/USER" 2>/dev/null)
check_status "GET /permissions without token → 401" "401" "$CODE"

# ── 4. Input Validation ──────────────────────────────────────────────────

section "4. Input Validation (ValidationPipe)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
  -d '{"email":"test@test.com","password":"ValidPass123","hackerField":"injected"}' 2>/dev/null)
check_status "Unknown field rejected (forbidNonWhitelisted)" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
  -d '{"email":"test@test.com"}' 2>/dev/null)
check_status "Missing required field → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
  -d '{"email":"not-an-email","password":"ValidPass123"}' 2>/dev/null)
check_status "Invalid email format → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
  -d '{"email":"test@test.com","password":"short"}' 2>/dev/null)
check_status "Short password → 400" "400" "$CODE"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/audit-logs/not-a-uuid" \
  -H "Authorization: Bearer fake" 2>/dev/null)
check_status_any "Invalid UUID in path param → 400 or 401" "$CODE" "400" "401"

# ── 5. CORS ──────────────────────────────────────────────────────────────

section "5. CORS Protection"

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"
CORS_HEADERS=$(curl -sI -X OPTIONS "${BASE_URL}/auth/login" \
  -H "Origin: ${FRONTEND_URL}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" 2>/dev/null)

if echo "$CORS_HEADERS" | grep -qi "access-control-allow-origin"; then
  echo -e "  ${GREEN}PASS${NC}  Preflight from allowed origin accepted"
  ((PASS++))
else
  warn_test "Preflight from allowed origin" "no ACAO header — check CORS_ALLOWED_ORIGINS or FRONTEND_URL env"
fi

EVIL_HEADERS=$(curl -sI -X OPTIONS "${BASE_URL}/auth/login" \
  -H "Origin: https://evil-attacker.com" \
  -H "Access-Control-Request-Method: POST" 2>/dev/null)

EVIL_ORIGIN=$(echo "$EVIL_HEADERS" | grep -i "access-control-allow-origin" | grep -i "evil-attacker" || true)
if [ -z "$EVIL_ORIGIN" ]; then
  echo -e "  ${GREEN}PASS${NC}  Evil origin rejected"
  ((PASS++))
else
  echo -e "  ${RED}FAIL${NC}  Evil origin in ACAO header"
  ((FAIL++))
fi

# ── 6. Anti-Enumeration ─────────────────────────────────────────────────

section "6. Anti-Enumeration"

# forgot-password: any non-403 proves CSRF skip + anti-enumeration
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"doesnt-exist-999@test.com"}' 2>/dev/null)
# 200 = anti-enum (same response for real/fake). 429 = rate limited but still no leak.
if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  echo -e "  ${GREEN}PASS${NC}  Forgot-password: same response for non-existent email ${DIM}(HTTP $CODE)${NC}"
  ((PASS++))
elif [ "$CODE" = "429" ]; then
  echo -e "  ${YELLOW}WARN${NC}  Forgot-password: rate limited (cannot verify anti-enum) ${DIM}(HTTP 429)${NC}"
  ((WARN++))
else
  echo -e "  ${RED}FAIL${NC}  Forgot-password: might leak user existence ${DIM}(HTTP $CODE)${NC}"
  ((FAIL++))
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/resend-verification-public" \
  -H "Content-Type: application/json" \
  -d '{"email":"doesnt-exist-999@test.com"}' 2>/dev/null)
if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  echo -e "  ${GREEN}PASS${NC}  Resend-verification: same response for non-existent email ${DIM}(HTTP $CODE)${NC}"
  ((PASS++))
elif [ "$CODE" = "429" ]; then
  echo -e "  ${YELLOW}WARN${NC}  Resend-verification: rate limited ${DIM}(HTTP 429)${NC}"
  ((WARN++))
else
  echo -e "  ${RED}FAIL${NC}  Resend-verification: might leak user existence ${DIM}(HTTP $CODE)${NC}"
  ((FAIL++))
fi

echo -e "  ${DIM}INFO${NC}  Timing-safe login (bcrypt dummy hash) cannot be automated — needs manual timing analysis"

# ── 7. Error Response Format ─────────────────────────────────────────────

section "7. Error Response Format (HttpExceptionFilter)"

refresh_csrf
RESP=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
  -d '{"email":"error-format-test@x.com","password":"wrong"}' 2>/dev/null)

check_contains "Response has success:false" "\"success\":false" "$RESP"
check_contains "Response has error.message" "\"message\"" "$RESP"
check_contains "Response has error.code" "\"code\"" "$RESP"
check_contains "Response has error.statusCode" "\"statusCode\"" "$RESP"

# ============================================================================
# PHASE 2: Auth-dependent tests (8-9)
# ============================================================================

if [ "$FULL_MODE" = true ] || [ -n "$TEST_EMAIL" ]; then

  section "8. Authenticated Endpoints"

  if [ -z "$TEST_EMAIL" ]; then
    TEST_EMAIL="debug500@test.com"
    TEST_PASS="TestPassword123"
    echo -e "  ${DIM}No --email provided, using debug500@test.com${NC}"
  fi

  # Login
  refresh_csrf
  LOGIN_RESP=$(curl -s -D - -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASS}\"}" 2>/dev/null)

  LOGIN_BODY=$(echo "$LOGIN_RESP" | tail -1)
  ACCESS_TOKEN=$(extract_json_field "accessToken" "$LOGIN_BODY")
  REFRESH_COOKIE=$(echo "$LOGIN_RESP" | grep -i "set-cookie.*refresh_token" | head -1)

  if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ] && [ ${#ACCESS_TOKEN} -gt 20 ]; then
    echo -e "  ${GREEN}PASS${NC}  Login successful ${DIM}(token: ${ACCESS_TOKEN:0:20}...)${NC}"
    ((PASS++))
  else
    LOGIN_CODE=$(echo "$LOGIN_RESP" | grep "^HTTP/" | tail -1 | awk '{print $2}')
    echo -e "  ${RED}FAIL${NC}  Login failed ${DIM}(HTTP $LOGIN_CODE — ${LOGIN_BODY:0:150})${NC}"
    ((FAIL++))
    ACCESS_TOKEN=""
  fi

  if [ -n "$ACCESS_TOKEN" ]; then

    # 8a. GET /auth/me
    RESP=$(curl -s "${BASE_URL}/auth/me" -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/me" -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    check_status "GET /auth/me with valid token → 200" "200" "$CODE"

    # 8b. SafeUser: no sensitive fields
    check_not_contains "/auth/me hides passwordHash" "passwordHash" "$RESP"
    check_not_contains "/auth/me hides mfaSecret" "mfaSecret" "$RESP"
    check_not_contains "/auth/me hides mfaRecoveryCodes" "mfaRecoveryCodes" "$RESP"
    check_contains "/auth/me returns email" "email" "$RESP"
    check_contains "/auth/me returns role" "role" "$RESP"

    # 8c. Sessions
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/sessions" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    check_status "GET /auth/sessions → 200" "200" "$CODE"

    # 8d. MFA status
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/mfa/status" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    check_status "GET /auth/mfa/status → 200" "200" "$CODE"

    # 8e. Passkeys list
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/passkeys" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    check_status "GET /auth/passkeys → 200" "200" "$CODE"

    # 8f. Trusted devices
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/trusted-devices" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    check_status "GET /auth/trusted-devices → 200" "200" "$CODE"

    # 8g. Refresh token cookie attributes
    if [ -n "$REFRESH_COOKIE" ]; then
      check_contains "Refresh cookie is HttpOnly" "httponly" "$REFRESH_COOKIE"
      check_contains "Refresh cookie has Path=/" "path=/" "$REFRESH_COOKIE"
      check_contains "Refresh cookie has SameSite" "samesite" "$REFRESH_COOKIE"
    else
      skip_test "Refresh cookie attributes" "no Set-Cookie received"
    fi

    # ── 9. RBAC ────────────────────────────────────────────────────────

    section "9. RBAC + Permissions Guard"

    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/auth/admin" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    if [ "$CODE" = "403" ]; then
      echo -e "  ${GREEN}PASS${NC}  Regular user blocked from /auth/admin ${DIM}(403)${NC}"
      ((PASS++))
    elif [ "$CODE" = "200" ]; then
      warn_test "Admin endpoint" "user has ADMIN role — test with regular USER for proper validation"
    else
      check_status_any "Admin endpoint requires ADMIN role" "$CODE" "403" "200"
    fi

    # Try admin-only user management
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/users" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>/dev/null)
    if [ "$CODE" = "403" ]; then
      echo -e "  ${GREEN}PASS${NC}  Regular user blocked from GET /users ${DIM}(403)${NC}"
      ((PASS++))
    elif [ "$CODE" = "200" ]; then
      warn_test "GET /users" "user has ADMIN role + users:read permission"
    else
      check_status_any "GET /users requires ADMIN + permission" "$CODE" "403" "200"
    fi

  fi

else
  section "8-9. Auth Tests (skipped)"
  skip_test "All auth-dependent tests" "use --full or --email/--pass to enable"
fi

# ============================================================================
# PHASE 3: Destructive tests — rate limits + lockout (10-11)
# Run LAST because they consume request quotas
# ============================================================================

if [ "$FULL_MODE" = true ]; then

  section "10. Rate Limiting (destructive — consumes quotas)"

  # 10a. Login: 10 req/60s
  echo -e "  ${DIM}Hammering POST /auth/login...${NC}"
  refresh_csrf
  RATE_LIMITED=false
  for i in $(seq 1 12); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/login" \
      -H "Content-Type: application/json" \
      -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
      -d "{\"email\":\"ratelimit-${TIMESTAMP}@test.com\",\"password\":\"Wrong123456\"}" 2>/dev/null)
    if [ "$CODE" = "429" ]; then
      RATE_LIMITED=true
      echo -e "  ${GREEN}PASS${NC}  Login rate limit triggered at request #$i ${DIM}(429)${NC}"
      ((PASS++))
      break
    fi
  done
  [ "$RATE_LIMITED" = false ] && echo -e "  ${RED}FAIL${NC}  Login rate limit NOT triggered after 12 requests" && ((FAIL++))

  # 10b. Register: 5 req/60s
  echo -e "  ${DIM}Hammering POST /auth/register...${NC}"
  refresh_csrf
  RATE_LIMITED=false
  for i in $(seq 1 7); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/register" \
      -H "Content-Type: application/json" \
      -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
      -d "{\"email\":\"ratereg-${TIMESTAMP}-${i}@test.com\",\"password\":\"ValidPass123\"}" 2>/dev/null)
    if [ "$CODE" = "429" ]; then
      RATE_LIMITED=true
      echo -e "  ${GREEN}PASS${NC}  Register rate limit triggered at request #$i ${DIM}(429)${NC}"
      ((PASS++))
      break
    fi
  done
  [ "$RATE_LIMITED" = false ] && echo -e "  ${RED}FAIL${NC}  Register rate limit NOT triggered after 7 requests" && ((FAIL++))

  # 10c. Forgot-password: 3 req/900s (15 min window!)
  echo -e "  ${DIM}Hammering POST /auth/forgot-password...${NC}"
  RATE_LIMITED=false
  for i in $(seq 1 5); do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/forgot-password" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"rateforgot-${TIMESTAMP}@test.com\"}" 2>/dev/null)
    if [ "$CODE" = "429" ]; then
      RATE_LIMITED=true
      echo -e "  ${GREEN}PASS${NC}  Forgot-password rate limit triggered at request #$i ${DIM}(429, 15min window)${NC}"
      ((PASS++))
      break
    fi
  done
  [ "$RATE_LIMITED" = false ] && echo -e "  ${RED}FAIL${NC}  Forgot-password rate limit NOT triggered after 5 requests" && ((FAIL++))

  # ── 11. Account Lockout ──────────────────────────────────────────────

  section "11. Account Lockout (5 failed attempts)"

  echo -e "  ${DIM}Creating disposable user for lockout test...${NC}"
  LOCKOUT_EMAIL="lockout-${TIMESTAMP}@test.com"
  refresh_csrf

  REG_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
    -d "{\"email\":\"${LOCKOUT_EMAIL}\",\"password\":\"LockoutTestPW123\"}" 2>/dev/null)

  if [ "$REG_CODE" = "201" ] || [ "$REG_CODE" = "200" ]; then
    echo -e "  ${DIM}Created: ${LOCKOUT_EMAIL}${NC}"

    LOCKOUT_TRIGGERED=false
    for i in $(seq 1 7); do
      RESP=$(curl -s -X POST "${BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
        -d "{\"email\":\"${LOCKOUT_EMAIL}\",\"password\":\"WrongPasswordXYZ\"}" 2>/dev/null)
      CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -H "x-csrf-token: ${CSRF_TOKEN}" -b "__csrf=${CSRF_COOKIE}" \
        -d "{\"email\":\"${LOCKOUT_EMAIL}\",\"password\":\"WrongPasswordXYZ\"}" 2>/dev/null)

      if echo "$RESP" | grep -q "retryAfter"; then
        LOCKOUT_TRIGGERED=true
        echo -e "  ${GREEN}PASS${NC}  Account locked after failed attempts ${DIM}(403 with retryAfter)${NC}"
        ((PASS++))
        check_contains "Lockout has retryAfter" "retryAfter" "$RESP"
        check_contains "Lockout has lockoutLevel" "lockoutLevel" "$RESP"
        break
      fi
    done

    if [ "$LOCKOUT_TRIGGERED" = false ]; then
      # Might be that unverified accounts don't get lockout, or rate limited
      warn_test "Account lockout" "not triggered — user may be unverified or rate limited"
    fi
  elif [ "$REG_CODE" = "429" ]; then
    skip_test "Account lockout" "rate limited from register — wait 60s and retry"
  else
    skip_test "Account lockout" "could not create test user (HTTP $REG_CODE)"
  fi

else

  section "10-11. Destructive Tests (skipped)"
  skip_test "Rate limiting tests" "use --full to enable (consumes request quotas)"
  skip_test "Account lockout test" "use --full to enable"

fi

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  RESULTS${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

TOTAL=$((PASS + FAIL + WARN + SKIP))
echo -e "  ${GREEN}PASS${NC}  $PASS"
echo -e "  ${RED}FAIL${NC}  $FAIL"
echo -e "  ${YELLOW}WARN${NC}  $WARN"
echo -e "  ${YELLOW}SKIP${NC}  $SKIP"
echo -e "  ${BOLD}TOTAL${NC} $TOTAL"
echo ""

if [ "$FAIL" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}All checks passed!${NC}"
else
  echo -e "  ${RED}${BOLD}$FAIL check(s) failed — review output above.${NC}"
fi

echo ""
if [ "$FULL_MODE" = true ]; then
  echo -e "${DIM}Rate limit quotas consumed. Wait 60s (login/register) or 15min (forgot-password) before re-running.${NC}"
fi
echo -e "${DIM}Full mode: $0 --full --email YOUR_EMAIL --pass YOUR_PASS${NC}"
echo ""

exit $FAIL
