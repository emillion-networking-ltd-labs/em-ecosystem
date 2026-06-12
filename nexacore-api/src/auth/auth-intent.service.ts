// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * AuthIntentService — server-side state machine for v2 login orchestration.
 *
 * SCRUM-497 / AUTH v2 + Tenancy v1 Phase 2.2 (D-004).
 * See AUTH-v2 program §4 Phase 2 + §5 D-004.
 *
 * Replaces the procedural `executeLogin` in v1 `LoginService` (strangler —
 * v1 stays bit-identical in production). v2 endpoints behind a feature flag
 * (`app.authIntentV2Enabled`, default off in prod; on in CI/test).
 *
 * State machine:
 *   `requires_credentials`
 *     → `requires_mfa` (if user.mfaEnabled)
 *     → `requires_tenant_pick` (if multi-tenant + no subdomain auto-resolve)
 *     → `succeeded`
 *   Terminal: `succeeded`, `failed`, `expired`. Replay → 410 Gone (decision D4).
 *
 * Decisions (from plan §1 + /enrich-us [enhanced]):
 *   D1 Persistence: Prisma `auth_intents` row, TTL-bounded.
 *   D2 Expiry: 15 min default; configurable via `app.authIntentTtlMs`.
 *   D3 GC: on-the-fly expiry check in advance(); lazy flip to `expired`.
 *   D4 Replay: 410 Gone on terminal states.
 *   D5 Subdomain auto-resolve: `requires_tenant_pick` auto-resolves if Host
 *      pins single valid tenantId AND user is member.
 *   D6 Feature flag: app.authIntentV2Enabled (env AUTH_INTENT_V2_ENABLED).
 *   C  MFA gate: inline otpVerify + recovery-code (CryptoService dep, not MfaService).
 *   D  Single-tenant short-circuit: skip `requires_tenant_pick` when user has 1 active membership.
 *   E  Status enum: 8 values (added `expired` for clean audit trail).
 *
 * No failure-mode enumeration: all rejection paths converge to a single
 * `UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED)` throw.
 * Discrimination only lives in audit metadata (`AUTH_INTENT_FAILED.reason`).
 */

import * as bcrypt from 'bcrypt';
import {
  Injectable,
  NotFoundException,
  GoneException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthIntent, AuthIntentStatus, TenantMembership } from '@prisma/client';
import { verify as otpVerify } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { CryptoService } from '../common/services/crypto.service';
import { TenantContext } from '../common/context/tenant-context';
import { ErrorMessages } from '../common/constants/error-messages';
import { UsersService } from '../users/users.service';
import { SessionsServiceV2 } from '../sessions/sessions.service.v2';
import { TokenServiceV2 } from './token.service.v2';
import { DUMMY_PASSWORD_HASH } from './constants/auth.constants';
import { parseDurationMs } from './utils/parse-duration';
import { AdvanceAuthIntentDto } from './dto/advance-auth-intent.dto';

export interface AdvanceRequestMeta {
  ipAddress?: string;
  userAgent?: string | null;
}

/** Result returned by advance() — the controller maps this to the HTTP response. */
export interface AdvanceResult {
  id: string;
  status: AuthIntentStatus;
  expiresAt: Date;
  /** Present only when status === 'succeeded'. */
  accessToken?: string;
  /** Present only when status === 'succeeded'. */
  refreshToken?: string;
  /** Present only when status === 'succeeded'. Milliseconds. */
  refreshMaxAgeMs?: number;
  /** Present only when status === 'succeeded'. */
  user?: {
    id: string;
    tenantId: string;
    tenantRole: string;
    isPlatformAdmin: boolean;
  };
  /** Present when status === 'requires_tenant_pick' (so UI can render the selector). */
  availableTenantIds?: string[];
}

type FailReason =
  | 'user_not_found'
  | 'account_locked'
  | 'bad_password'
  | 'email_not_verified'
  | 'no_tenant_membership'
  | 'invalid_state'
  | 'mfa_state_invalid'
  | 'mfa_code_wrong'
  | 'tenant_pick_invalid'
  | 'state_mismatch'
  | 'passkey_not_implemented';

@Injectable()
export class AuthIntentService {
  private readonly refreshMaxAgeMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly tokenServiceV2: TokenServiceV2,
    private readonly sessionsServiceV2: SessionsServiceV2,
    private readonly usersService: UsersService,
    private readonly cryptoService: CryptoService,
    private readonly configService: ConfigService,
  ) {
    // Refresh cookie maxAge mirrors v1 + Phase 1.3 cookie posture.
    const refreshExpiration = this.configService.get<string>(
      'auth.jwtRefreshExpiration',
    )!;
    this.refreshMaxAgeMs = parseDurationMs(refreshExpiration);
  }

  // ──────────────────────────────────────────────────────────────────────
  // createIntent
  // ──────────────────────────────────────────────────────────────────────

  async createIntent(meta: AdvanceRequestMeta): Promise<AuthIntent> {
    const ttl =
      this.configService.get<number>('app.authIntentTtlMs') ?? 900_000;
    const expiresAt = new Date(Date.now() + ttl);

    const created = await this.prisma.authIntent.create({
      data: {
        status: 'requires_credentials',
        expiresAt,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
      },
    });

    await this.auditService.log({
      action: AuditAction.AUTH_INTENT_CREATED,
      userId: null,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: { intentId: created.id, expiresAt },
    });

    return created;
  }

  // ──────────────────────────────────────────────────────────────────────
  // advance — central dispatcher
  // ──────────────────────────────────────────────────────────────────────

  async advance(
    intentId: string,
    input: AdvanceAuthIntentDto,
    meta: AdvanceRequestMeta,
  ): Promise<AdvanceResult> {
    const intent = await this.prisma.authIntent.findUnique({
      where: { id: intentId },
    });

    // Not found: 404 with single message constant.
    if (!intent) {
      throw new NotFoundException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // Terminal-state replay (decision D4): 410 Gone.
    if (
      intent.status === 'succeeded' ||
      intent.status === 'failed' ||
      intent.status === 'expired'
    ) {
      throw new GoneException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // Expiry check (decision D3): lazy flip + 410.
    if (intent.expiresAt < new Date()) {
      await this.prisma.authIntent.update({
        where: { id: intent.id },
        data: { status: 'expired', fulfilledAt: new Date() },
      });
      await this.auditService.log({
        action: AuditAction.AUTH_INTENT_EXPIRED,
        userId: intent.userId,
        metadata: { intentId: intent.id, expiredAt: intent.expiresAt },
      });
      throw new GoneException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // Dispatch by status × kind.
    switch (input.kind) {
      case 'credentials':
        if (intent.status !== 'requires_credentials') {
          return this.failAndThrow(intent, 'state_mismatch');
        }
        return this.advanceCredentials(intent, input, meta);
      case 'mfa':
        if (intent.status !== 'requires_mfa') {
          return this.failAndThrow(intent, 'state_mismatch');
        }
        return this.advanceMfa(intent, input, meta);
      case 'tenant_pick':
        if (intent.status !== 'requires_tenant_pick') {
          return this.failAndThrow(intent, 'state_mismatch');
        }
        return this.advanceTenantPick(intent, input, meta);
      case 'passkey':
        // Phase 3 reserves this slot — transition NOT wired in 2.2 (plan scope-OUT).
        return this.failAndThrow(intent, 'passkey_not_implemented');
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // advanceCredentials — credential gate
  // ──────────────────────────────────────────────────────────────────────

  private async advanceCredentials(
    intent: AuthIntent,
    input: AdvanceAuthIntentDto,
    meta: AdvanceRequestMeta,
  ): Promise<AdvanceResult> {
    const email = input.email!;
    const password = input.password!;

    const user = await this.usersService.findByEmail(email);

    // User not found — timing-equalized bcrypt to match v1 LoginService:111.
    if (!user) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return this.failAndThrow(intent, 'user_not_found');
    }

    // Account locked — equalize timing too (matches v1 H-12 mitigation).
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      return this.failAndThrow(intent, 'account_locked');
    }

    // Bad password.
    if (!user.passwordHash) {
      return this.failAndThrow(intent, 'bad_password');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return this.failAndThrow(intent, 'bad_password');
    }

    // Email-verification gate (mirrors v1 LoginService:134).
    if (!user.emailVerified) {
      return this.failAndThrow(intent, 'email_not_verified');
    }

    // Compute next status (single source of truth for fan-out).
    return this.transitionFromCredsCleared(intent, user.id, meta);
  }

  // ──────────────────────────────────────────────────────────────────────
  // advanceMfa — MFA gate (TOTP code XOR recovery code)
  // ──────────────────────────────────────────────────────────────────────

  private async advanceMfa(
    intent: AuthIntent,
    input: AdvanceAuthIntentDto,
    meta: AdvanceRequestMeta,
  ): Promise<AdvanceResult> {
    if (!intent.userId) {
      return this.failAndThrow(intent, 'invalid_state');
    }

    const user = await this.usersService.findById(intent.userId);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return this.failAndThrow(intent, 'mfa_state_invalid');
    }

    if (input.code) {
      // TOTP code path — matches MfaService.verifyLoginCode logic at mfa.service.ts:170-175.
      const secret = this.cryptoService.decrypt(user.mfaSecret);
      const result = await otpVerify({ token: input.code, secret });
      if (!result.valid) {
        return this.failAndThrow(intent, 'mfa_code_wrong');
      }
    } else if (input.recoveryCode) {
      // Recovery code path — inline bcrypt-compare loop (mirrors private
      // MfaService.findMatchingRecoveryCode at mfa.service.ts:296-305).
      const codeIndex = await this.findMatchingRecoveryCode(
        input.recoveryCode,
        user.mfaRecoveryCodes,
      );
      if (codeIndex === -1) {
        return this.failAndThrow(intent, 'mfa_code_wrong');
      }
      // Consume the recovery code (one-time use).
      const updatedCodes = [...user.mfaRecoveryCodes];
      updatedCodes.splice(codeIndex, 1);
      await this.usersService.updateRecoveryCodes(user.id, updatedCodes);
    } else {
      // DTO validation should prevent this (kind='mfa' requires one of {code, recoveryCode}).
      return this.failAndThrow(intent, 'mfa_code_wrong');
    }

    // MFA cleared → continue the credentials-cleared fan-out.
    return this.transitionFromCredsCleared(intent, user.id, meta);
  }

  // ──────────────────────────────────────────────────────────────────────
  // advanceTenantPick — multi-tenant selection
  // ──────────────────────────────────────────────────────────────────────

  private async advanceTenantPick(
    intent: AuthIntent,
    input: AdvanceAuthIntentDto,
    meta: AdvanceRequestMeta,
  ): Promise<AdvanceResult> {
    if (!intent.userId) {
      return this.failAndThrow(intent, 'invalid_state');
    }

    const membership = await this.prisma.tenantMembership.findFirst({
      where: {
        userId: intent.userId,
        tenantId: input.tenantId!,
        status: 'active',
      },
    });

    if (!membership) {
      return this.failAndThrow(intent, 'tenant_pick_invalid');
    }

    return this.succeed(intent, membership, meta);
  }

  // ──────────────────────────────────────────────────────────────────────
  // transitionFromCredsCleared — shared fan-out after creds/MFA pass
  // ──────────────────────────────────────────────────────────────────────

  private async transitionFromCredsCleared(
    intent: AuthIntent,
    userId: string,
    meta: AdvanceRequestMeta,
  ): Promise<AdvanceResult> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return this.failAndThrow(intent, 'invalid_state');
    }

    const mfaRequired =
      user.mfaEnabled && intent.status === 'requires_credentials';
    const activeMemberships = await this.prisma.tenantMembership.findMany({
      where: { userId, status: 'active' },
      orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
    });

    // MFA required & we just cleared credentials → move to requires_mfa.
    if (mfaRequired) {
      const updated = await this.prisma.authIntent.update({
        where: { id: intent.id },
        data: {
          status: 'requires_mfa',
          userId,
        },
      });
      await this.emitAdvancedAudit(intent, userId, meta, 'requires_mfa');
      return {
        id: updated.id,
        status: updated.status,
        expiresAt: updated.expiresAt,
      };
    }

    // No memberships → cannot proceed (no tenant to bind).
    if (activeMemberships.length === 0) {
      return this.failAndThrow(intent, 'no_tenant_membership');
    }

    // Subdomain auto-resolve (decision D5): if Host pins a tenantId AND user is member.
    const subdomainHint = TenantContext.getActiveTenantId();
    if (subdomainHint && activeMemberships.length > 1) {
      const subdomainMatch = activeMemberships.find(
        (m) => m.tenantId === subdomainHint,
      );
      if (subdomainMatch) {
        return this.succeed(intent, subdomainMatch, meta);
      }
    }

    // Single-tenant short-circuit (decision D): skip tenant_pick.
    if (activeMemberships.length === 1) {
      return this.succeed(intent, activeMemberships[0], meta);
    }

    // Multi-tenant + no subdomain auto-resolve → requires_tenant_pick.
    const availableTenantIds = activeMemberships.map((m) => m.tenantId);
    const updated = await this.prisma.authIntent.update({
      where: { id: intent.id },
      data: {
        status: 'requires_tenant_pick',
        userId,
        context: { availableTenantIds },
      },
    });
    await this.emitAdvancedAudit(intent, userId, meta, 'requires_tenant_pick');
    return {
      id: updated.id,
      status: updated.status,
      expiresAt: updated.expiresAt,
      availableTenantIds,
    };
  }

  // ──────────────────────────────────────────────────────────────────────
  // succeed — terminal happy path
  // ──────────────────────────────────────────────────────────────────────

  private async succeed(
    intent: AuthIntent,
    membership: TenantMembership,
    meta: AdvanceRequestMeta,
  ): Promise<AdvanceResult> {
    // Cross-tenant session mint requires an audited bypass (SCRUM-488 convention).
    return TenantContext.runWithBypass('auth-intent-succeed-mint', async () => {
      const user = await this.usersService.findById(
        intent.userId ?? membership.userId,
      );
      if (!user) {
        return this.failAndThrow(intent, 'invalid_state');
      }

      // Mint session via Phase 1.2 SessionsServiceV2.
      const session = await this.sessionsServiceV2.createSession({
        userId: user.id,
        tenantId: membership.tenantId,
        tenantRole: membership.role,
        isPlatformAdmin: user.isPlatformAdmin,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent ?? undefined,
      });

      // Mint access via Phase 1.1 TokenServiceV2.
      const accessToken = this.tokenServiceV2.mintAccessToken({
        userId: user.id,
        sessionId: session.sessionId,
        tenantId: membership.tenantId,
        tenantRole: membership.role,
        isPlatformAdmin: user.isPlatformAdmin,
      });

      // Persist intent → succeeded.
      const updated = await this.prisma.authIntent.update({
        where: { id: intent.id },
        data: {
          status: 'succeeded',
          userId: user.id,
          tenantId: membership.tenantId,
          fulfilledAt: new Date(),
        },
      });

      await this.auditService.log({
        action: AuditAction.AUTH_INTENT_SUCCEEDED,
        userId: user.id,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        metadata: {
          intentId: intent.id,
          tenantId: membership.tenantId,
          role: membership.role,
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        expiresAt: updated.expiresAt,
        accessToken,
        refreshToken: session.refreshToken,
        refreshMaxAgeMs: this.refreshMaxAgeMs,
        user: {
          id: user.id,
          tenantId: membership.tenantId,
          tenantRole: membership.role,
          isPlatformAdmin: user.isPlatformAdmin,
        },
      };
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // failAndThrow — terminal sad path (NEVER returns; throws)
  // ──────────────────────────────────────────────────────────────────────

  private async failAndThrow(
    intent: AuthIntent,
    reason: FailReason,
  ): Promise<never> {
    const currentContext = (intent.context as Record<string, unknown>) ?? {};
    await this.prisma.authIntent.update({
      where: { id: intent.id },
      data: {
        status: 'failed',
        fulfilledAt: new Date(),
        context: { ...currentContext, failReason: reason },
      },
    });
    await this.auditService.log({
      action: AuditAction.AUTH_INTENT_FAILED,
      userId: intent.userId,
      ipAddress: intent.ipAddress,
      userAgent: intent.userAgent,
      metadata: {
        intentId: intent.id,
        fromStatus: intent.status,
        reason,
      },
    });
    throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
  }

  // ──────────────────────────────────────────────────────────────────────
  // emitAdvancedAudit — shared audit emission for non-terminal transitions.
  // Extracted to satisfy the Rule of Three (2nd copy → extract) — the
  // requires_mfa and requires_tenant_pick transitions emit the same audit
  // shape with only `toStatus` differing.
  // ──────────────────────────────────────────────────────────────────────

  private async emitAdvancedAudit(
    intent: AuthIntent,
    userId: string,
    meta: AdvanceRequestMeta,
    toStatus: AuthIntentStatus,
  ): Promise<void> {
    await this.auditService.log({
      action: AuditAction.AUTH_INTENT_ADVANCED,
      userId,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      metadata: {
        intentId: intent.id,
        fromStatus: intent.status,
        toStatus,
      },
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Inline helper — bcrypt-compare loop for recovery codes.
  // Mirrors the private MfaService.findMatchingRecoveryCode at mfa.service.ts:296-305.
  // ──────────────────────────────────────────────────────────────────────

  private async findMatchingRecoveryCode(
    plainCode: string,
    hashedCodes: string[],
  ): Promise<number> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(plainCode, hashedCodes[i]);
      if (isMatch) return i;
    }
    return -1;
  }
}
