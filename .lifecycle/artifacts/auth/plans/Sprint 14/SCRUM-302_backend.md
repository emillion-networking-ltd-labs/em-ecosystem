# SCRUM-302 — Plan: Send welcome email on first account activation

## Scope
Backend

## Steps

### Step 1 — Create welcome.hbs template
New file: `nexacore-api/src/mail/templates/welcome.hbs`

### Step 2 — Add sendWelcomeEmail to MailService
File: `nexacore-api/src/mail/mail.service.ts`

### Step 3 — Email verification link activation
File: `nexacore-api/src/auth/email-verification.service.ts`
- After verifyEmail transaction: if was unverified → send welcome

### Step 4 — Password reset implicit activation
File: `nexacore-api/src/auth/password-reset.service.ts`
- Save wasUnverified before transaction, send welcome after if true

### Step 5 — OAuth auto-verify
File: `nexacore-api/src/users/users.service.ts`
- Path A/B: needsVerify → send welcome
- Path C: new user → send welcome
- Inject MailService

### Step 6 — Tests
### Step 7 — Build verification
