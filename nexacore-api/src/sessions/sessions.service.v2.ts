// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

/**
 * SessionsServiceV2 — internal scaffolding for AUTH v2 + Tenancy v1 Phase 1.2.
 *
 * SCRUM-493. See ai-specs/changes/auth/programs/AUTH-v2.md §4 Phase 1 + §2.4.
 *
 * Strangler-pattern: v2 opaque-refresh session lifecycle. v1 SessionsService
 * untouched in production. Zero consumers exist for this class until Phase 1.3.
 *
 * Security primitives:
 * - 256-bit CSPRNG opaque tokens → base64url plaintext → SHA-256 hex at rest.
 * - One-time-use rotation enforced atomically inside prisma.$transaction.
 * - No failure-mode enumeration: every reject path throws the same
 *   UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED).
 *
 * Tenant binding:
 * - Every SessionV2 row carries tenantId (NOT NULL) — mitigates MT-2.
 * - validateAndRotate wraps the initial cross-tenant lookup in
 *   TenantContext.runWithBypass('session-v2-refresh-lookup'), then runs
 *   the rotation transaction inside TenantContext.run(session.tenantId, ...).
 * - revokeAllForTenant is scoped (mitigates MT-10: v1's bulk revoke is cross-tenant).
 */

import { createHash, randomBytes } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { TenantContext } from '../common/context/tenant-context';
import { ErrorMessages } from '../common/constants/error-messages';
import { parseDurationMs } from '../auth/utils/parse-duration';

export interface CreateSessionV2Input {
  userId: string;
  tenantId: string;
  tenantRole: TenantRole;
  isPlatformAdmin: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface MintResult {
  sessionId: string;
  /** Plaintext refresh token. Returned ONCE on mint; never logged. */
  refreshToken: string;
  expiresAt: Date;
}

export interface RotateResult extends MintResult {
  userId: string;
  tenantId: string;
  tenantRole: TenantRole;
  isPlatformAdmin: boolean;
}

type RejectReasonClass =
  | 'not-found'
  | 'revoked'
  | 'expired'
  | 'membership-stale';

@Injectable()
export class SessionsServiceV2 {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Mint a fresh v2 session with a fresh opaque refresh token.
   * Caller is responsible for passing tenantId + tenantRole + isPlatformAdmin
   * already validated (typically from the v2 login orchestrator in Phase 2).
   */
  async createSession(input: CreateSessionV2Input): Promise<MintResult> {
    const plaintext = this.generateOpaqueToken();
    const refreshTokenHash = this.hashOpaqueToken(plaintext);
    const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());

    const created = await this.prisma.sessionV2.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        refreshTokenHash,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        expiresAt,
      },
    });

    await this.auditService.log({
      action: AuditAction.SESSION_V2_CREATED,
      userId: input.userId,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: {
        sessionId: created.id,
        tenantId: input.tenantId,
        tenantRole: input.tenantRole,
        isPlatformAdmin: input.isPlatformAdmin,
      },
    });

    return {
      sessionId: created.id,
      refreshToken: plaintext,
      expiresAt: created.expiresAt,
    };
  }

  /**
   * Validate an opaque refresh token + rotate atomically.
   *
   * Two-gate verification + tenant-context dance:
   *   1. Cross-tenant lookup (token hash is uniqueness key; tenant unknown until row found)
   *      wrapped in TenantContext.runWithBypass('session-v2-refresh-lookup').
   *   2. Eligibility gate: existence + isRevoked + expiresAt.
   *   3. Rotation transaction inside TenantContext.run(session.tenantId): mark OLD
   *      revoked + create NEW row in same $transaction (atomic one-time-use).
   *   4. Re-fetch membership + platform-admin flag (canonical source) for return payload.
   *
   * All failure modes throw the SAME UnauthorizedException — no enumeration leak.
   * Audit emission carries the reason class in metadata (for observability) but
   * NEVER in the exception message.
   */
  async validateAndRotate(opaqueToken: string): Promise<RotateResult> {
    const refreshTokenHash = this.hashOpaqueToken(opaqueToken);

    const session = await TenantContext.runWithBypass(
      'session-v2-refresh-lookup',
      () =>
        this.prisma.sessionV2.findUnique({
          where: { refreshTokenHash },
        }),
    );

    if (!session) {
      await this.rejectRefresh('not-found', null);
    }
    if (session!.isRevoked) {
      await this.rejectRefresh('revoked', session!.userId);
    }
    if (session!.expiresAt.getTime() <= Date.now()) {
      await this.rejectRefresh('expired', session!.userId);
    }

    return TenantContext.run(session!.tenantId, async () => {
      const membership = await this.prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId: session!.tenantId,
            userId: session!.userId,
          },
        },
        select: { role: true },
      });
      const user = await this.prisma.user.findUnique({
        where: { id: session!.userId },
        select: { isPlatformAdmin: true },
      });

      if (!membership || !user) {
        await this.rejectRefresh('membership-stale', session!.userId);
      }

      const newPlaintext = this.generateOpaqueToken();
      const newHash = this.hashOpaqueToken(newPlaintext);
      const newExpiresAt = new Date(Date.now() + this.getRefreshTtlMs());

      const rotated = await this.prisma.$transaction(async (tx) => {
        await tx.sessionV2.update({
          where: { id: session!.id },
          data: { isRevoked: true, lastUsedAt: new Date() },
        });
        return tx.sessionV2.create({
          data: {
            userId: session!.userId,
            tenantId: session!.tenantId,
            refreshTokenHash: newHash,
            ipAddress: session!.ipAddress,
            userAgent: session!.userAgent,
            expiresAt: newExpiresAt,
          },
        });
      });

      await this.auditService.log({
        action: AuditAction.SESSION_V2_ROTATED,
        userId: session!.userId,
        ipAddress: session!.ipAddress,
        userAgent: session!.userAgent,
        metadata: {
          oldSessionId: session!.id,
          newSessionId: rotated.id,
          tenantId: session!.tenantId,
        },
      });

      return {
        sessionId: rotated.id,
        refreshToken: newPlaintext,
        expiresAt: rotated.expiresAt,
        userId: session!.userId,
        tenantId: session!.tenantId,
        tenantRole: membership!.role,
        isPlatformAdmin: user!.isPlatformAdmin,
      };
    });
  }

  /**
   * Revoke a single v2 session by id. Idempotent — swallows P2025
   * (record-not-found) silently. Mirrors v1 revokeSession behavior.
   * Caller is responsible for tenant context (either explicit
   * TenantContext.run or runWithBypass).
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.sessionV2.update({
        where: { id: sessionId },
        data: { isRevoked: true },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2025') return;
      throw err;
    }
    await this.auditService.log({
      action: AuditAction.SESSION_V2_REVOKED,
      userId: null,
      metadata: { sessionId },
    });
  }

  /**
   * Revoke all (userId, tenantId) sessions — mitigates MT-10.
   * v1's revokeAllUserSessions revokes cross-tenant; this is scoped.
   * Caller MUST be inside TenantContext.run(tenantId, ...) to satisfy
   * the tenant-filter Prisma extension (SCRUM-488).
   */
  async revokeAllForTenant(
    userId: string,
    tenantId: string,
  ): Promise<{ revokedCount: number }> {
    const result = await this.prisma.sessionV2.updateMany({
      where: { userId, tenantId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.auditService.log({
      action: AuditAction.SESSION_V2_TENANT_BULK_REVOKED,
      userId,
      metadata: { userId, tenantId, revokedCount: result.count },
    });

    return { revokedCount: result.count };
  }

  // ── Internal helpers ──

  private generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashOpaqueToken(plaintext: string): string {
    return createHash('sha256').update(plaintext).digest('hex');
  }

  private getRefreshTtlMs(): number {
    const expr = this.configService.get<string>('auth.jwtRefreshExpiration')!;
    return parseDurationMs(expr);
  }

  /**
   * Centralized rejection path. Audits the reason class for observability,
   * then throws the generic UnauthorizedException with the same message for
   * every failure mode — no enumeration leak via exception payload.
   */
  private async rejectRefresh(
    reasonClass: RejectReasonClass,
    userId: string | null,
  ): Promise<never> {
    await this.auditService.log({
      action: AuditAction.SESSION_V2_REFRESH_REJECTED,
      userId,
      metadata: { reasonClass },
    });
    throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
  }
}
