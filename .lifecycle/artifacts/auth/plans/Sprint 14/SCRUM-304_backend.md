# SCRUM-304 — Plan: Remove deprecated @simplewebauthn/types

## Scope
Backend

## Steps
1. Change import in passkey.service.ts from @simplewebauthn/types to @simplewebauthn/server
2. npm uninstall @simplewebauthn/types
3. Build + test verification
4. Note: passport-github2 + otplib monitored, no action
