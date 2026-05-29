# Fullstack Implementation Spec: SCRUM-29 Email Verification & Password Reset

## Overview

Complete implementation of email verification on registration and self-service password reset for the EM NexaCore platform. This story introduces two new Prisma models (`EmailVerificationToken`, `PasswordResetToken`), an email service powered by `@nestjs-modules/mailer` with SMTP transport, four new API endpoints, HTML email templates, and four new frontend pages. After this story, newly registered users must verify their email before accessing protected features, and any user can securely reset a forgotten password via email.

**Epic**: SCRUM-22 — Auth Security Hardening & Enterprise Features
**Story**: SCRUM-29 — Email Verification & Password Reset
**Layer**: 7 of 8 | **Priority**: MEDIUM
**Sub-tasks**: SCRUM-73 through SCRUM-80

---

## Architecture Context

### Email Verification Flow

```
                     ┌──────────────┐
  POST /auth/register│  AuthService │
  ──────────────────▶│   register() │
                     │              │
                     │ 1. Create user (emailVerified=false)
                     │ 2. Generate crypto token
                     │ 3. Store EmailVerificationToken
                     │ 4. Send verification email via MailService
                     │ 5. Return tokens + user
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
       User clicks   │  Email inbox │
       link in email │              │
                     └──────┬───────┘
                            │
                            ▼
  GET /auth/verify-email    ┌──────────────┐
  ?token=xxx ──────────────▶│  AuthService │
                            │ verifyEmail()│
                            │              │
                            │ 1. Find token by hash
                            │ 2. Check not expired, not used
                            │ 3. Mark user emailVerified=true
                            │ 4. Mark token usedAt=now
                            │ 5. Redirect to frontend /email-verified
                            └──────────────┘
```

### Password Reset Flow

```
  POST /auth/forgot-password   ┌──────────────┐
  { email } ──────────────────▶│  AuthService │
                               │forgotPassword│
                               │              │
                               │ 1. Find user by email
                               │ 2. Generate crypto token
                               │ 3. Invalidate previous reset tokens
                               │ 4. Store PasswordResetToken
                               │ 5. Send reset email via MailService
                               │ 6. Return { message } (always 200)
                               └──────────────┘

  POST /auth/reset-password    ┌──────────────┐
  { token, newPassword }──────▶│  AuthService │
                               │resetPassword │
                               │              │
                               │ 1. Find token by hash
                               │ 2. Check not expired, not used
                               │ 3. Hash new password
                               │ 4. Update user passwordHash
                               │ 5. Mark token usedAt=now
                               │ 6. Revoke all refresh tokens
                               │ 7. Return { message }
                               └──────────────┘
```

### Security Design Decisions

| Decision | Rationale |
|---|---|
| Tokens stored as SHA-256 hash in DB | Plain token only in email link; DB compromise does not reveal usable tokens |
| 24h expiry for verification, 1h for reset | Verification is low-risk; reset must be short-lived |
| One-time use (`usedAt` timestamp) | Prevents replay attacks |
| Rate limit on resend: 1 per 60s per user | Prevents email flooding |
| Rate limit on forgot-password: 3 per 15min per IP | Prevents enumeration and spam |
| Forgot-password always returns 200 | Prevents email enumeration |
| Reset invalidates all sessions | Forces re-authentication after password change |
| Verification link uses GET (redirect flow) | Standard email client behavior; redirects to frontend SPA |

### Route Map After SCRUM-29

```
Public (GuestRoute):
  /login                    ← existing
  /register                 ← existing
  /forgot-password          ← NEW
  /reset-password?token=xxx ← NEW

Public (no guard):
  /verify-email?token=xxx   ← NEW (shows status, no auth needed)
  /email-sent               ← NEW (confirmation after registration)
  /check-email              ← NEW (confirmation after forgot-password)

Protected (ProtectedRoute):
  /dashboard                ← existing
  /profile                  ← existing

Admin (AdminRoute):
  /admin                    ← existing
```

---

## Endpoint Specification

### 1. GET /auth/verify-email

Verifies a user's email address using the token from the verification email.

| Property | Value |
|---|---|
| Method | `GET` |
| Path | `/auth/verify-email` |
| Auth | None (public) |
| Query Params | `token` (string, required) |
| Success Response | `302` redirect to `{FRONTEND_URL}/verify-email?status=success` |
| Error Responses | `302` redirect to `{FRONTEND_URL}/verify-email?status=invalid` (bad/expired/used token) |

### 2. POST /auth/resend-verification

Resends the verification email to the authenticated user.

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/auth/resend-verification` |
| Auth | `JwtAuthGuard` (Bearer token) |
| Body | None |
| Success Response | `200 { message: 'Verification email sent' }` |
| Error: Already verified | `400 { message: 'Email already verified' }` |
| Error: Rate limited | `429 { message: 'Please wait before requesting another email' }` |

### 3. POST /auth/forgot-password

Initiates password reset flow. Always returns 200 to prevent email enumeration.

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/auth/forgot-password` |
| Auth | None (public) |
| Body | `{ email: string }` |
| Success Response | `200 { message: 'If an account exists, a reset email has been sent' }` |
| Rate limit | 3 requests per 15 minutes per IP (applied via `@nestjs/throttler`) |

### 4. POST /auth/reset-password

Validates the reset token and sets a new password.

| Property | Value |
|---|---|
| Method | `POST` |
| Path | `/auth/reset-password` |
| Auth | None (public) |
| Body | `{ token: string, newPassword: string }` |
| Success Response | `200 { message: 'Password reset successfully' }` |
| Error: Invalid token | `400 { message: 'Invalid or expired reset token' }` |
| Error: Validation | `400` (password strength validation from class-validator) |

---

## Database Changes

### New Models

#### EmailVerificationToken

```prisma
model EmailVerificationToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation("UserEmailVerificationTokens", fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@map("email_verification_tokens")
}
```

#### PasswordResetToken

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation("UserPasswordResetTokens", fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@map("password_reset_tokens")
}
```

#### User Model Changes (relations only)

Add relations to the existing `User` model:

```prisma
model User {
  // ... existing fields ...

  emailVerificationTokens EmailVerificationToken[] @relation("UserEmailVerificationTokens")
  passwordResetTokens     PasswordResetToken[]     @relation("UserPasswordResetTokens")

  @@map("users")
}
```

### Migration SQL

```sql
-- CreateTable: email_verification_tokens
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable: password_reset_tokens
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Files to Create

### Backend

| File | Purpose |
|---|---|
| `nexacore-api/src/mail/mail.module.ts` | NestJS module configuring `@nestjs-modules/mailer` with Handlebars transport |
| `nexacore-api/src/mail/mail.service.ts` | Service with `sendVerificationEmail()` and `sendPasswordResetEmail()` methods |
| `nexacore-api/src/mail/templates/verification.hbs` | Handlebars HTML template for email verification |
| `nexacore-api/src/mail/templates/password-reset.hbs` | Handlebars HTML template for password reset |
| `nexacore-api/src/auth/dto/forgot-password.dto.ts` | DTO: `{ email: string }` with `@IsEmail()` |
| `nexacore-api/src/auth/dto/reset-password.dto.ts` | DTO: `{ token: string, newPassword: string }` with password validation |
| `nexacore-api/src/auth/dto/resend-verification.dto.ts` | Empty DTO (no body, relies on JWT user) |
| `nexacore-api/prisma/migrations/YYYYMMDDHHMMSS_add_email_verification_and_password_reset_tokens/migration.sql` | Migration adding both token tables |

### Frontend

| File | Purpose |
|---|---|
| `nexacore-dashboard/src/app/forgot-password/page.tsx` | Forgot password page (GuestRoute + AuthLayout) |
| `nexacore-dashboard/src/app/reset-password/page.tsx` | Reset password form page (GuestRoute + AuthLayout) |
| `nexacore-dashboard/src/app/verify-email/page.tsx` | Email verification status page (no auth guard) |
| `nexacore-dashboard/src/app/email-sent/page.tsx` | Post-registration confirmation page (no auth guard) |
| `nexacore-dashboard/src/app/check-email/page.tsx` | Post-forgot-password confirmation page (no auth guard) |
| `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx` | Form component for email input + submit |
| `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx` | Form component for new password + confirm + submit |
| `nexacore-dashboard/src/components/auth/VerifyEmailStatus.tsx` | Status display component (success/error/loading) |

---

## Files to Modify

### Backend

| File | Changes |
|---|---|
| `nexacore-api/prisma/schema.prisma` | Add `EmailVerificationToken` and `PasswordResetToken` models; add relations to `User` |
| `nexacore-api/src/app.module.ts` | Import `MailModule` and `ThrottlerModule` |
| `nexacore-api/src/auth/auth.module.ts` | Import `MailModule` |
| `nexacore-api/src/auth/auth.service.ts` | Add `verifyEmail()`, `resendVerification()`, `forgotPassword()`, `resetPassword()` methods; modify `register()` to send verification email |
| `nexacore-api/src/auth/auth.controller.ts` | Add 4 new route handlers; import throttle decorator |
| `nexacore-api/package.json` | Add `@nestjs-modules/mailer`, `nodemailer`, `handlebars`, `@nestjs/throttler` deps |

### Frontend

| File | Changes |
|---|---|
| `nexacore-dashboard/src/context/AuthContext.tsx` | Add `forgotPassword()`, `resetPassword()`, `resendVerification()` methods to context |
| `nexacore-dashboard/src/lib/types.ts` | Add `ForgotPasswordDto`, `ResetPasswordDto` types |
| `nexacore-dashboard/src/components/auth/RegisterForm.tsx` | After successful registration, redirect to `/email-sent` instead of `/dashboard` |

---

## Implementation Steps

### Step 1: Install Backend Dependencies

```bash
cd em-ecosystem-code/nexacore-api
npm install @nestjs-modules/mailer nodemailer handlebars @nestjs/throttler
npm install -D @types/nodemailer
```

### Step 2: Update Prisma Schema

**File**: `nexacore-api/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  SUPERADMIN
  ADMIN
  USER
}

enum Provider {
  LOCAL
  GOOGLE
  GITHUB
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String?
  firstName      String?
  lastName       String?
  avatarUrl      String?
  role           Role      @default(USER)
  provider       Provider  @default(LOCAL)
  providerId     String?
  emailVerified  Boolean   @default(false)
  isActive       Boolean   @default(true)
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  refreshToken   String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  emailVerificationTokens EmailVerificationToken[] @relation("UserEmailVerificationTokens")
  passwordResetTokens     PasswordResetToken[]     @relation("UserPasswordResetTokens")

  @@map("users")
}

model EmailVerificationToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation("UserEmailVerificationTokens", fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  tokenHash String    @unique
  userId    String
  user      User      @relation("UserPasswordResetTokens", fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([userId])
  @@map("password_reset_tokens")
}
```

Then run:

```bash
npx prisma migrate dev --name add_email_verification_and_password_reset_tokens
npx prisma generate
```

### Step 3: Create Mail Module

**File**: `nexacore-api/src/mail/mail.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
      },
      defaults: {
        from: process.env.SMTP_FROM || '"EM NexaCore" <noreply@emillionnetworking.com>',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```

### Step 4: Create Mail Service

**File**: `nexacore-api/src/mail/mail.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const verificationUrl = `${apiUrl}/auth/verify-email?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify your EM NexaCore email address',
        template: 'verification',
        context: {
          name: firstName || email.split('@')[0],
          verificationUrl,
          frontendUrl,
          expiresIn: '24 hours',
        },
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      // Do not throw — registration should succeed even if email fails
      // A resend endpoint is available for retry
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName?: string | null,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your EM NexaCore password',
        template: 'password-reset',
        context: {
          name: firstName || email.split('@')[0],
          resetUrl,
          frontendUrl,
          expiresIn: '1 hour',
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      // Do not throw — always return 200 to prevent enumeration
    }
  }
}
```

### Step 5: Create Email Templates

**File**: `nexacore-api/src/mail/templates/verification.hbs`

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="font-size: 24px; font-weight: 700; color: #09090b; padding-bottom: 8px;">
              EM NexaCore
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #09090b;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Hi {{name}}, thanks for creating your EM NexaCore account. Please verify your email address by clicking the button below.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="border-radius: 8px; background-color: #09090b;">
                    <a href="{{verificationUrl}}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                This link will expire in {{expiresIn}}. If you did not create an account, you can safely ignore this email.
              </p>

              <!-- Fallback URL -->
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; word-break: break-all;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="{{verificationUrl}}" style="color: #71717a;">{{verificationUrl}}</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
          <tr>
            <td style="font-size: 12px; color: #a1a1aa; text-align: center;">
              &copy; {{currentYear}} EMillion Networking LTD. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**File**: `nexacore-api/src/mail/templates/password-reset.hbs`

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="font-size: 24px; font-weight: 700; color: #09090b; padding-bottom: 8px;">
              EM NexaCore
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #09090b;">
                Reset your password
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Hi {{name}}, we received a request to reset your EM NexaCore password. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="border-radius: 8px; background-color: #09090b;">
                    <a href="{{resetUrl}}" target="_blank" style="display: inline-block; padding: 12px 32px; font-size: 14px; font-weight: 500; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #a1a1aa;">
                This link will expire in {{expiresIn}}. If you did not request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>

              <!-- Fallback URL -->
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a1a1aa; word-break: break-all;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="{{resetUrl}}" style="color: #71717a;">{{resetUrl}}</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
          <tr>
            <td style="font-size: 12px; color: #a1a1aa; text-align: center;">
              &copy; {{currentYear}} EMillion Networking LTD. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Step 6: Create New DTOs

**File**: `nexacore-api/src/auth/dto/forgot-password.dto.ts`

```typescript
import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the account to reset',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
```

**File**: `nexacore-api/src/auth/dto/reset-password.dto.ts`

```typescript
import { IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'NewSecureP@ss1',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Password must contain at least one number',
  })
  @Matches(/(?=.*[@$!%*?&])/, {
    message: 'Password must include a special character (@$!%*?&)',
  })
  newPassword: string;
}
```

### Step 7: Update AppModule

**File**: `nexacore-api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 second
        limit: 10,    // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,   // 1 minute
        limit: 30,    // 30 requests per minute
      },
    ]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Step 8: Update AuthModule

**File**: `nexacore-api/src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Step 9: Update AuthService

**File**: `nexacore-api/src/auth/auth.service.ts`

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User, SafeUser, toSafeUser } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_HOURS = 1;
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // ── Registration (modified to send verification email) ──

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });

    // Send verification email (non-blocking — does not fail registration)
    await this.createAndSendVerificationEmail(user);

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

  // ── Email Verification ──

  async verifyEmail(token: string): Promise<{ status: 'success' | 'invalid' }> {
    const tokenHash = this.hashToken(token);

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!verificationToken) {
      return { status: 'invalid' };
    }

    if (verificationToken.usedAt) {
      // Already used — could still be success if user is verified
      if (verificationToken.user.emailVerified) {
        return { status: 'success' };
      }
      return { status: 'invalid' };
    }

    if (verificationToken.expiresAt < new Date()) {
      return { status: 'invalid' };
    }

    // Mark token as used and user as verified
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
    ]);

    return { status: 'success' };
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Rate limiting: check last token creation time
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const secondsSinceLastToken =
        (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (secondsSinceLastToken < RESEND_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          'Please wait before requesting another email',
        );
      }
    }

    await this.createAndSendVerificationEmail(user);
  }

  // ── Password Reset ──

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.log(`Forgot password requested for non-existent email: ${dto.email}`);
      return;
    }

    // OAuth-only accounts cannot reset password
    if (!user.passwordHash && user.provider !== 'LOCAL') {
      this.logger.log(`Forgot password requested for OAuth account: ${dto.email}`);
      return;
    }

    // Invalidate all existing unused reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    // Generate new reset token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      plainToken,
      user.firstName,
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.usedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    // Mark token as used, update password, and revoke all sessions
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: newPasswordHash,
          refreshToken: null, // Revoke all sessions
        },
      }),
    ]);
  }

  // ── Existing methods (unchanged) ──

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Account locked. Try again later.');
    }

    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const updated = await this.usersService.incrementFailedAttempts(user.id);
      if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await this.usersService.lockAccount(user.id);
        throw new ForbiddenException('Account locked. Try again later.');
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedAttempts > 0) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify<{ sub: string }>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isRefreshValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.generateTokens(user);
  }

  async validateOAuthUser(
    profile: OAuthProfile,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const user = await this.usersService.findOrCreateByOAuth(profile);
    const tokens = await this.generateTokens(user);
    return { ...tokens, user: toSafeUser(user) };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  // ── Private helpers ──

  private async createAndSendVerificationEmail(user: User): Promise<void> {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + VERIFICATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      plainToken,
      user.firstName,
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as StringValue,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }
}
```

### Step 10: Update AuthController

**File**: `nexacore-api/src/auth/auth.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Redirect,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { SafeUser } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: { user: { id: string } }) {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Request() req: { user: SafeUser }) {
    return req.user;
  }

  // ── Email Verification Endpoints ──

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address via token from email link' })
  @ApiQuery({ name: 'token', required: true, description: 'Verification token' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with status' })
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    if (!token) {
      return res.redirect(`${frontendUrl}/verify-email?status=invalid`);
    }

    const result = await this.authService.verifyEmail(token);
    return res.redirect(`${frontendUrl}/verify-email?status=${result.status}`);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'Email already verified or rate limited' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resendVerification(@Request() req: { user: { id: string } }) {
    await this.authService.resendVerificationEmail(req.user.id);
    return { message: 'Verification email sent' };
  }

  // ── Password Reset Endpoints ──

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900000, limit: 3 } }) // 3 requests per 15 minutes
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent (if account exists)' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { message: 'If an account exists, a reset email has been sent' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token, or validation error' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { message: 'Password reset successfully' };
  }

  // ── Existing OAuth & Admin Endpoints ──

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Access admin dashboard (ADMIN role required)' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  getAdminDashboard() {
    return { message: 'Admin access granted' };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google consent screen',
  })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with tokens',
  })
  googleAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; refreshToken: string; user: SafeUser };
    },
  ) {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return {
      url: `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    };
  }

  @Get('github')
  @UseGuards(GitHubAuthGuard)
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to GitHub authorization',
  })
  githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  @Redirect()
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend with tokens',
  })
  githubAuthCallback(
    @Request()
    req: {
      user: { accessToken: string; refreshToken: string; user: SafeUser };
    },
  ) {
    const { accessToken, refreshToken } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return {
      url: `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    };
  }
}
```

### Step 11: Add Environment Variables

**File**: `nexacore-api/.env` (add these variables)

```bash
# Email / SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM="EM NexaCore" <noreply@emillionnetworking.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001

# API URL (for verification redirect)
API_URL=http://localhost:3000
```

### Step 12: Update Frontend Types

**File**: `nexacore-dashboard/src/lib/types.ts` — add these types at the end:

```typescript
// ... existing types remain unchanged ...

export type ForgotPasswordDto = {
  email: string;
};

export type ResetPasswordDto = {
  token: string;
  newPassword: string;
};

export type MessageResponse = {
  message: string;
};
```

### Step 13: Update AuthContext

**File**: `nexacore-dashboard/src/context/AuthContext.tsx`

Changes to make:
1. Add `forgotPassword`, `resetPassword`, `resendVerification` methods to context type
2. Implement the three new methods in the provider
3. Modify `register` to signal that verification email was sent

```typescript
'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { apiClient } from '@/lib/api';
import type { SafeUser, AuthResponse, MessageResponse } from '@/lib/types';

/* ===== State ===== */

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  successMessage: string | null;
};

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: SafeUser; accessToken: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_MESSAGE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_MESSAGE' }
  | { type: 'UPDATE_USER'; payload: SafeUser };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null, successMessage: null };
    case 'AUTH_SUCCESS':
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isLoading: false,
        isInitialized: true,
        error: null,
        successMessage: null,
      };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, isInitialized: true, error: action.payload, successMessage: null };
    case 'AUTH_MESSAGE':
      return { ...state, isLoading: false, error: null, successMessage: action.payload };
    case 'LOGOUT':
      return { user: null, accessToken: null, isLoading: false, isInitialized: true, error: null, successMessage: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'CLEAR_MESSAGE':
      return { ...state, successMessage: null };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

/* ===== Context ===== */

type AuthContextType = AuthState & {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<boolean>;
  handleOAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  resendVerification: () => Promise<boolean>;
  clearError: () => void;
  clearMessage: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

/* ===== Helpers ===== */

type ApiError = { error?: { message?: string; details?: string[] } };

function extractErrorMessage(err: unknown, fallback: string): string {
  const errObj = err as ApiError;
  const details = errObj?.error?.details;
  if (Array.isArray(details) && details.length > 0) return details[0];
  return errObj?.error?.message ?? fallback;
}

/* ===== Provider ===== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    accessToken: null,
    isLoading: false,
    isInitialized: false,
    error: null,
    successMessage: null,
  });

  const refreshSession = useCallback(async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      if (!res.ok) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      const { accessToken } = (await res.json()) as { accessToken: string };
      apiClient.setAccessToken(accessToken);
      const user = await apiClient.get<SafeUser>('/auth/me');
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
    } catch {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // Attempt silent refresh on mount to restore session from httpOnly cookie
  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Login failed. Please try again.'),
      });
    }
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', { email, password });
      await fetch('/api/auth/set-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: data.refreshToken }),
      });
      apiClient.setAccessToken(data.accessToken);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: data.user, accessToken: data.accessToken },
      });
      return true; // Registration succeeded — caller can redirect to /email-sent
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Registration failed. Please try again.'),
      });
      return false;
    }
  }, []);

  const handleOAuthCallback = useCallback(
    async (accessToken: string, refreshToken: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        await fetch('/api/auth/set-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        apiClient.setAccessToken(accessToken);
        const user = await apiClient.get<SafeUser>('/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, accessToken } });
      } catch (err: unknown) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: extractErrorMessage(err, 'OAuth authentication failed.'),
        });
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      apiClient.clearAccessToken();
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<MessageResponse>('/auth/forgot-password', { email });
      dispatch({ type: 'AUTH_MESSAGE', payload: data.message });
      return true;
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Failed to send reset email. Please try again.'),
      });
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<MessageResponse>('/auth/reset-password', { token, newPassword });
      dispatch({ type: 'AUTH_MESSAGE', payload: data.message });
      return true;
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Failed to reset password. Please try again.'),
      });
      return false;
    }
  }, []);

  const resendVerification = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const data = await apiClient.post<MessageResponse>('/auth/resend-verification', {});
      dispatch({ type: 'AUTH_MESSAGE', payload: data.message });
      return true;
    } catch (err: unknown) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: extractErrorMessage(err, 'Failed to resend verification email.'),
      });
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const clearMessage = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGE' });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.user && !!state.accessToken,
        login,
        register,
        handleOAuthCallback,
        logout,
        refreshSession,
        forgotPassword,
        resetPassword,
        resendVerification,
        clearError,
        clearMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ===== Hook ===== */

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

### Step 14: Update RegisterForm Post-Registration Flow

**File**: `nexacore-dashboard/src/components/auth/RegisterForm.tsx`

Change the `handleRegister` function and redirect behavior:

```typescript
// Replace the existing handleRegister and the useEffect redirect:

// Remove or modify this useEffect:
// useEffect(() => {
//   if (isAuthenticated) router.replace('/dashboard');
// }, [isAuthenticated, router]);

// Replace with: redirect to /email-sent after successful registration
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formData.email) {
    setEmailError('Enter your email address');
    return;
  }
  if (!isValidEmail(formData.email)) {
    setEmailError('Enter a valid email address');
    return;
  }
  if (!formData.password) return;
  setEmailError(null);
  const success = await register(formData.email, formData.password);
  if (success) {
    router.push('/email-sent');
  }
};
```

### Step 15: Create Forgot Password Page

**File**: `nexacore-dashboard/src/app/forgot-password/page.tsx`

```tsx
import { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import GuestRoute from '@/components/guards/GuestRoute';

export const metadata = {
  title: 'Forgot Password — EM NexaCore',
};

export default function ForgotPasswordPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </AuthLayout>
    </GuestRoute>
  );
}
```

### Step 16: Create ForgotPasswordForm Component

**File**: `nexacore-dashboard/src/components/auth/ForgotPasswordForm.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import Input from '@/components/ui/Input';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import { useAuth } from '@/hooks/useAuth';

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setEmailError(null);
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Enter your email address');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError(null);
    const success = await forgotPassword(email);
    if (success) {
      router.push('/check-email');
    }
  };

  const activeError = emailError || error;
  const showError = !!activeError;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group */}
      <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Forgot Password
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Enter the email address associated with your account and we'll send
            you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex h-[116px] flex-col gap-2">
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="your@email.com"
              hasError={showError}
              autoFocus
            />

            {/* System Message */}
            <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
              {showError && (
                <>
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="flex-1 text-xs leading-6 text-error">{activeError}</span>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Back to Sign In
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none"
            >
              <span className={isLoading ? 'opacity-30' : ''}>Send Link</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Step 17: Create Reset Password Page

**File**: `nexacore-dashboard/src/app/reset-password/page.tsx`

```tsx
import { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import GuestRoute from '@/components/guards/GuestRoute';

export const metadata = {
  title: 'Reset Password — EM NexaCore',
};

export default function ResetPasswordPage() {
  return (
    <GuestRoute>
      <AuthLayout>
        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </AuthLayout>
    </GuestRoute>
  );
}
```

### Step 18: Create ResetPasswordForm Component

**File**: `nexacore-dashboard/src/components/auth/ResetPasswordForm.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RulerDimensionLine, Hash, Asterisk, CaseUpper, CaseLower, Check, AlertTriangle } from 'lucide-react';
import Input from '@/components/ui/Input';
import InfinitySpinner from '@/components/ui/InfinitySpinner';
import { useAuth } from '@/hooks/useAuth';

const PASSWORD_REQUIREMENTS = [
  { key: 'long',    Icon: RulerDimensionLine, test: (p: string) => p.length >= 8 },
  { key: 'number',  Icon: Hash,               test: (p: string) => /\d/.test(p) },
  { key: 'special', Icon: Asterisk,           test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
  { key: 'upper',   Icon: CaseUpper,          test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower',   Icon: CaseLower,          test: (p: string) => /[a-z]/.test(p) },
] as const;

export default function ResetPasswordForm() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    clearError();
  }, [clearError]);

  // If no token in URL, show error
  if (!token) {
    return (
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
          <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Invalid Link
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>
        </div>
        <div className="w-full md:w-[348px]">
          <Link
            href="/forgot-password"
            className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setFormError(null);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password) {
      setFormError('Enter your new password');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    // Check all password requirements
    const allMet = PASSWORD_REQUIREMENTS.every(({ test }) => test(formData.password));
    if (!allMet) {
      setFormError('Password does not meet all requirements');
      return;
    }

    setFormError(null);
    const success = await resetPassword(token, formData.password);
    if (success) {
      router.push('/login?message=password_reset');
    }
  };

  const activeError = formError || error;
  const showError = !!activeError;
  const showPasswordCheck = !showError && formData.password.length > 0;

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Title Group */}
      <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col gap-2 md:max-w-[300px]">
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            Reset Password
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            Choose a new password for your NexaCore account. Make sure it meets
            all the security requirements.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="w-full md:w-[348px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex min-h-[204px] flex-col gap-2">
            <Input
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password"
              hasError={showError}
              autoFocus
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              hasError={showError && formError === 'Passwords do not match'}
            />

            {/* System Message — Password Check XOR Error */}
            <div className={`flex items-center gap-2 ${showError ? 'min-h-6' : 'h-6'}`}>
              {showPasswordCheck && (
                <div className="flex shrink-0 items-center gap-[15px]">
                  {PASSWORD_REQUIREMENTS.map(({ key, Icon, test }) => {
                    const met = test(formData.password);
                    return (
                      <div key={key} className="relative h-6 w-6">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-border-default">
                          <Icon size={14} className="text-content-primary/50" />
                        </div>
                        {met && (
                          <div className="absolute -bottom-1 -right-1 flex h-[14px] w-[14px] items-center justify-center rounded-full border border-border-default bg-surface-primary">
                            <Check size={8} className="text-green-800" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {showError && (
                <>
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="text-xs leading-6 text-error">{activeError}</span>
                </>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Link
              href="/login"
              className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Back to Sign In
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="relative flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90 disabled:pointer-events-none"
            >
              <span className={isLoading ? 'opacity-30' : ''}>Reset Password</span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <InfinitySpinner />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Step 19: Create Verify Email Page

**File**: `nexacore-dashboard/src/app/verify-email/page.tsx`

```tsx
import { Suspense } from 'react';
import AuthLayout from '@/components/layout/AuthLayout';
import VerifyEmailStatus from '@/components/auth/VerifyEmailStatus';

export const metadata = {
  title: 'Verify Email — EM NexaCore',
};

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense>
        <VerifyEmailStatus />
      </Suspense>
    </AuthLayout>
  );
}
```

### Step 20: Create VerifyEmailStatus Component

**File**: `nexacore-dashboard/src/components/auth/VerifyEmailStatus.tsx`

```tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const isSuccess = status === 'success';

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      {/* Icon + Title Group */}
      <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
        <div className="flex w-full flex-col items-start gap-3 md:max-w-[300px]">
          {isSuccess ? (
            <CheckCircle2 size={40} className="text-green-600" />
          ) : (
            <XCircle size={40} className="text-error" />
          )}
          <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
            {isSuccess ? 'Email Verified' : 'Verification Failed'}
          </h1>
          <p className="text-justify text-sm leading-[21px] text-content-primary/50">
            {isSuccess
              ? 'Your email address has been verified successfully. You can now access all features of your NexaCore account.'
              : 'This verification link is invalid or has expired. Please sign in and request a new verification email from your profile settings.'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full md:w-[348px]">
        <div className="flex flex-col gap-2">
          {isSuccess ? (
            <Link
              href="/dashboard"
              className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
              >
                Create New Account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 21: Create Email Sent Confirmation Page

**File**: `nexacore-dashboard/src/app/email-sent/page.tsx`

```tsx
import AuthLayout from '@/components/layout/AuthLayout';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Email Sent — EM NexaCore',
};

export default function EmailSentPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Title Group */}
        <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
          <div className="flex w-full flex-col items-start gap-3 md:max-w-[300px]">
            <Mail size={40} className="text-content-primary/50" />
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Check Your Email
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              We've sent a verification link to your email address. Click the
              link to verify your account and get started with NexaCore.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full md:w-[348px]">
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-[21px] text-content-primary/50">
              Didn't receive the email? Check your spam folder or sign in to
              request a new verification link.
            </p>
            <Link
              href="/login"
              className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
```

### Step 22: Create Check Email (Password Reset) Confirmation Page

**File**: `nexacore-dashboard/src/app/check-email/page.tsx`

```tsx
import AuthLayout from '@/components/layout/AuthLayout';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Check Your Email — EM NexaCore',
};

export default function CheckEmailPage() {
  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Title Group */}
        <div className="flex w-full flex-col justify-center gap-2 md:w-[330px]">
          <div className="flex w-full flex-col items-start gap-3 md:max-w-[300px]">
            <Mail size={40} className="text-content-primary/50" />
            <h1 className="text-2xl font-semibold leading-[36px] text-content-primary">
              Check Your Email
            </h1>
            <p className="text-justify text-sm leading-[21px] text-content-primary/50">
              If an account exists for that email, we've sent a password reset
              link. The link will expire in 1 hour.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full md:w-[348px]">
          <div className="flex flex-col gap-2">
            <p className="text-sm leading-[21px] text-content-primary/50">
              Didn't receive the email? Check your spam folder or try again with
              a different email address.
            </p>
            <Link
              href="/forgot-password"
              className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-transparent px-6 py-2.5 text-base font-medium text-content-primary transition-colors hover:bg-surface-subtle"
            >
              Try Again
            </Link>
            <Link
              href="/login"
              className="flex h-10 w-full items-center justify-center rounded-md border border-border-default bg-surface-inverse px-6 py-2.5 text-base font-medium text-content-inverse transition-opacity hover:opacity-90"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
```

---

## Testing Checklist

### Email Verification — Backend

- [ ] `POST /auth/register` creates user with `emailVerified=false`
- [ ] `POST /auth/register` creates `EmailVerificationToken` record
- [ ] `POST /auth/register` sends verification email (check SMTP logs or Mailtrap)
- [ ] `GET /auth/verify-email?token=xxx` with valid token redirects to `?status=success`
- [ ] `GET /auth/verify-email?token=xxx` sets `emailVerified=true` on user
- [ ] `GET /auth/verify-email?token=xxx` marks token `usedAt` timestamp
- [ ] `GET /auth/verify-email?token=expired` redirects to `?status=invalid`
- [ ] `GET /auth/verify-email?token=used` redirects to `?status=success` (if user is verified)
- [ ] `GET /auth/verify-email?token=garbage` redirects to `?status=invalid`
- [ ] `GET /auth/verify-email` without token redirects to `?status=invalid`
- [ ] `POST /auth/resend-verification` (authenticated, unverified) creates new token and sends email
- [ ] `POST /auth/resend-verification` (already verified) returns 400
- [ ] `POST /auth/resend-verification` within 60s cooldown returns 400
- [ ] `POST /auth/resend-verification` (unauthenticated) returns 401

### Password Reset — Backend

- [ ] `POST /auth/forgot-password` with existing email sends reset email
- [ ] `POST /auth/forgot-password` with non-existent email returns 200 (no enumeration)
- [ ] `POST /auth/forgot-password` invalidates previous unused reset tokens
- [ ] `POST /auth/forgot-password` rate limited to 3 per 15 minutes per IP
- [ ] `POST /auth/forgot-password` with OAuth-only account returns 200 (no email sent)
- [ ] `POST /auth/reset-password` with valid token changes password
- [ ] `POST /auth/reset-password` with valid token revokes all refresh tokens
- [ ] `POST /auth/reset-password` with valid token marks token as used
- [ ] `POST /auth/reset-password` with expired token returns 400
- [ ] `POST /auth/reset-password` with used token returns 400
- [ ] `POST /auth/reset-password` with invalid token returns 400
- [ ] `POST /auth/reset-password` validates password strength (class-validator)
- [ ] Old password no longer works after reset
- [ ] New password works after reset

### Token Security — Backend

- [ ] Plain token only appears in email URL, never in database
- [ ] `tokenHash` in DB is SHA-256 hex digest
- [ ] Tokens are 32 bytes of `crypto.randomBytes` (64 hex chars)
- [ ] Verification token expires after 24 hours
- [ ] Reset token expires after 1 hour
- [ ] Used tokens cannot be reused

### Frontend — Forgot Password Flow

- [ ] `/forgot-password` page renders with email input
- [ ] Empty email submission shows inline error
- [ ] Invalid email shows inline error
- [ ] Valid email submission navigates to `/check-email`
- [ ] `/check-email` page shows confirmation message
- [ ] "Try Again" link goes back to `/forgot-password`
- [ ] "Back to Sign In" link goes to `/login`

### Frontend — Reset Password Flow

- [ ] `/reset-password?token=xxx` renders password form
- [ ] `/reset-password` (no token) shows "Invalid Link" with "Request New Link" button
- [ ] Password requirements check icons update in real-time
- [ ] Passwords that don't match show error
- [ ] Successful reset redirects to `/login?message=password_reset`
- [ ] API error (invalid/expired token) shows inline error message

### Frontend — Email Verification Status

- [ ] `/verify-email?status=success` shows green check and "Go to Dashboard" link
- [ ] `/verify-email?status=invalid` shows red X and "Sign In" / "Create New Account" links
- [ ] Page renders correctly without authentication

### Frontend — Registration Post-Flow

- [ ] Successful registration redirects to `/email-sent` (not `/dashboard`)
- [ ] `/email-sent` page shows email confirmation message
- [ ] "Go to Sign In" link goes to `/login`

### Build Verification

- [ ] `npx prisma migrate dev` succeeds
- [ ] `nest build` succeeds (nexacore-api)
- [ ] `next build` succeeds (nexacore-dashboard)
- [ ] No TypeScript errors
- [ ] All existing tests pass

---

## Error Handling

| Scenario | HTTP Code | User-Facing Message |
|---|---|---|
| Invalid verification token | 302 redirect | "This verification link is invalid or has expired" (on frontend) |
| Expired verification token | 302 redirect | "This verification link is invalid or has expired" (on frontend) |
| Already verified (resend) | 400 | "Email already verified" |
| Resend rate limited | 400 | "Please wait before requesting another email" |
| Forgot-password any email | 200 | "If an account exists, a reset email has been sent" |
| Forgot-password rate limited | 429 | "Too many requests. Please try again later." |
| Invalid reset token | 400 | "Invalid or expired reset token" |
| Expired reset token | 400 | "Invalid or expired reset token" |
| Used reset token | 400 | "Invalid or expired reset token" |
| Weak new password | 400 | Specific validation messages from class-validator |
| SMTP failure (verification) | — | Logged; registration succeeds; user can resend |
| SMTP failure (reset) | — | Logged; 200 returned; user can retry |
| Network error (frontend) | — | "Network error. Please check your connection." |

---

## Non-Functional Requirements

| Requirement | Implementation |
|---|---|
| **Security**: Tokens hashed in DB | SHA-256 hash of `crypto.randomBytes(32)` stored; plain token only in email URL |
| **Security**: No email enumeration | `POST /auth/forgot-password` always returns 200 with identical message |
| **Security**: Token single-use | `usedAt` timestamp set on consumption; checked before processing |
| **Security**: Session revocation on reset | `refreshToken: null` set alongside password update in same transaction |
| **Performance**: Index on tokenHash | `@unique` constraint creates B-tree index; O(log n) lookups |
| **Performance**: Index on userId | `@@index([userId])` on both token tables for cascade deletes |
| **Reliability**: Email failure non-blocking | Registration and forgot-password succeed even if SMTP fails; resend available |
| **Rate Limiting**: Resend cooldown | 60-second cooldown enforced at application level per user |
| **Rate Limiting**: Forgot-password | 3 requests per 15 minutes per IP via `@nestjs/throttler` |
| **Scalability**: Token cleanup | Expired tokens remain but are ignored; periodic cleanup can be added via CRON |
| **Accessibility**: Email templates | Semantic HTML tables, sufficient color contrast, fallback plain-text URLs |
| **Responsive**: Frontend pages | All new pages use existing AuthLayout responsive patterns (330px + 348px) |

---

## Dependencies

### New Backend Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@nestjs-modules/mailer` | ^2.x | NestJS email module with template support |
| `nodemailer` | ^6.x | SMTP transport for sending emails |
| `handlebars` | ^4.x | Template engine for HTML email templates |
| `@nestjs/throttler` | ^6.x | Rate limiting for forgot-password endpoint |
| `@types/nodemailer` | ^6.x | TypeScript types (devDependency) |

### Existing Dependencies Used

| Package | Usage |
|---|---|
| `crypto` (Node.js built-in) | `randomBytes` for token generation, `createHash` for SHA-256 |
| `bcrypt` | Password hashing (existing) |
| `class-validator` | DTO validation for ResetPasswordDto |
| `@prisma/client` | Database operations for token models |

### Environment Variables Required

| Variable | Default | Description |
|---|---|---|
| `SMTP_HOST` | `localhost` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_SECURE` | `false` | Use TLS (`true` for port 465) |
| `SMTP_USER` | (empty) | SMTP authentication username |
| `SMTP_PASSWORD` | (empty) | SMTP authentication password |
| `SMTP_FROM` | `"EM NexaCore" <noreply@emillionnetworking.com>` | Default sender address |
| `FRONTEND_URL` | `http://localhost:3001` | Frontend base URL for email links |
| `API_URL` | `http://localhost:3000` | API base URL for verification redirect |

---

## Documentation Updates

| Document | Update Required |
|---|---|
| `ai-specs/specs/api-spec.yml` | Add 4 new endpoints under `/auth` path |
| `ai-specs/specs/data-model.md` | Add `EmailVerificationToken` and `PasswordResetToken` entities |
| `ai-specs/specs/frontend-standards.mdc` | Add 5 new pages to route table |
| `ai-specs/specs/backend-standards.mdc` | Add email service section, rate limiting conventions |
| `.env.example` | Add SMTP configuration variables |

---

## Definition of Done

- [ ] **Prisma migration** applied successfully with both token tables created
- [ ] **Email verification** works end-to-end: register -> receive email -> click link -> emailVerified=true
- [ ] **Password reset** works end-to-end: forgot-password -> receive email -> click link -> set new password -> login with new password
- [ ] **Resend verification** endpoint works with 60s rate limit
- [ ] **Forgot-password** endpoint rate limited (3/15min) and never leaks email existence
- [ ] **Tokens** stored as SHA-256 hashes; plain tokens only in email URLs
- [ ] **Used tokens** cannot be replayed
- [ ] **Expired tokens** are rejected
- [ ] **Session revocation** occurs on password reset (refreshToken set to null)
- [ ] **Email templates** render correctly in major email clients (Gmail, Outlook, Apple Mail)
- [ ] **Frontend pages** follow existing AuthLayout patterns (GuestRoute wrapping, responsive 330+348 layout)
- [ ] **Error messages** are user-friendly and do not leak implementation details
- [ ] **SMTP failure** does not block registration or forgot-password flows
- [ ] **All existing tests** pass after changes
- [ ] **`nest build`** succeeds with zero errors
- [ ] **`next build`** succeeds with all pages compiled
- [ ] **No TypeScript errors** across both projects
- [ ] **Environment variables** documented in `.env.example`
- [ ] **Swagger docs** updated with all 4 new endpoints

---

## Sub-Task Mapping

| Sub-Task | Jira Key | Steps Covered |
|---|---|---|
| Email Verification Token Model | SCRUM-73 | Steps 2 (Prisma schema) |
| Email Service Integration | SCRUM-74 | Steps 1, 3, 4, 5, 7 (deps, MailModule, MailService, templates, AppModule) |
| Verify Email Endpoint | SCRUM-75 | Steps 9, 10 (`verifyEmail` in AuthService + AuthController) |
| Resend Verification Email | SCRUM-76 | Steps 9, 10 (`resendVerificationEmail` in AuthService + AuthController) |
| Password Reset Token Model | SCRUM-77 | Step 2 (Prisma schema) |
| Password Reset Flow | SCRUM-78 | Steps 6, 9, 10 (DTOs, `forgotPassword`/`resetPassword` in AuthService + AuthController) |
| Frontend Pages | SCRUM-79 | Steps 12-22 (types, AuthContext, all pages and components) |
| Email Templates | SCRUM-80 | Step 5 (Handlebars templates) |
