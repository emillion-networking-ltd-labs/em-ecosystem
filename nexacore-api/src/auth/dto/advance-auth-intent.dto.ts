// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * AdvanceAuthIntentDto — body for `POST /auth/v2/intents/:id/advance`.
 *
 * SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2 (D-004).
 *
 * Plan decision B: single discriminated DTO (NOT per-kind sub-endpoints) keeps
 * the "single advance endpoint" semantic from the program doc §4. The `kind`
 * discriminator drives `@ValidateIf` per-field. Unknown `kind` → 400 via IsIn.
 *
 * Kind summary:
 *   - 'credentials' — `email` + `password` (Phase 2.2)
 *   - 'mfa'         — `code` (6 digits TOTP) XOR `recoveryCode` (Phase 2.2)
 *   - 'tenant_pick' — `tenantId` UUID (Phase 2.2)
 *   - 'passkey'     — `assertion` (declared for Phase 3 forward-compat; transition NOT wired in 2.2)
 */
export type AdvanceIntentKind =
  'credentials' | 'mfa' | 'tenant_pick' | 'passkey';

export class AdvanceAuthIntentDto {
  @IsIn(['credentials', 'mfa', 'tenant_pick', 'passkey'])
  kind!: AdvanceIntentKind;

  // ─── credentials ────────────────────────────────────────────────────────
  @ValidateIf((o: AdvanceAuthIntentDto) => o.kind === 'credentials')
  @IsEmail()
  email?: string;

  @ValidateIf((o: AdvanceAuthIntentDto) => o.kind === 'credentials')
  @IsString()
  @MinLength(8)
  password?: string;

  // ─── mfa ────────────────────────────────────────────────────────────────
  /** TOTP code — 6 digits. Exactly one of {code, recoveryCode} required for kind='mfa'. */
  @ValidateIf((o: AdvanceAuthIntentDto) => o.kind === 'mfa' && !o.recoveryCode)
  @IsString()
  @Length(6, 6)
  code?: string;

  /** Plaintext recovery code (operator stored hashed at MFA setup). */
  @ValidateIf((o: AdvanceAuthIntentDto) => o.kind === 'mfa' && !o.code)
  @IsString()
  @MinLength(8)
  recoveryCode?: string;

  // ─── tenant_pick ────────────────────────────────────────────────────────
  @ValidateIf((o: AdvanceAuthIntentDto) => o.kind === 'tenant_pick')
  @IsUUID()
  tenantId?: string;

  // ─── passkey (declared for Phase 3 forward-compat) ──────────────────────
  @ValidateIf((o: AdvanceAuthIntentDto) => o.kind === 'passkey')
  @IsObject()
  @IsOptional()
  assertion?: Record<string, unknown>;
}
