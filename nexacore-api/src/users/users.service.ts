import {
  Injectable,
  Inject,
  forwardRef,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { User, SafeUser, toSafeUser } from './entities/user.entity';
import { Provider } from './enums/provider.enum';
import { Role } from './enums/role.enum';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import { getLockoutDurationMs } from '../auth/constants/auth.constants';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { SessionsService } from '../sessions/sessions.service';
import { MailService } from '../mail/mail.service';
import { PasswordBreachService } from '../auth/password-breach.service';
import { TrustedDeviceService } from '../auth/trusted-device.service';
import {
  TokenDenyListService,
  ACCESS_TOKEN_TTL_SECONDS,
} from '../auth/token-deny-list.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UnlinkOAuthDto } from './dto/unlink-oauth.dto';
import * as crypto from 'crypto';
import { ErrorMessages } from '../common/constants/error-messages';
import { LinkedProvider } from '../auth/interfaces/oauth-account.interface';
import { pseudonymizeEmail } from '../common/utils/pseudonymize-email';
import { FILE_STORAGE } from '../storage/file-storage.interface';
import type { FileStorageService } from '../storage/file-storage.interface';

const BCRYPT_ROUNDS = 12;
const EMAIL_CHANGE_TOKEN_EXPIRY_HOURS = 24;

// SS-01/SS-02: hostnames allowed as source for OAuth-provider avatar downloads.
// Defense-in-depth against SSRF via attacker-controlled OAuth profile.avatarUrl.
const AVATAR_URL_ALLOWLIST = [
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly sessionsService: SessionsService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => PasswordBreachService))
    private readonly passwordBreachService: PasswordBreachService,
    @Inject(forwardRef(() => TrustedDeviceService))
    private readonly trustedDeviceService: TrustedDeviceService,
    @Inject(forwardRef(() => TokenDenyListService))
    private readonly tokenDenyListService: TokenDenyListService,
    @Inject(FILE_STORAGE)
    private readonly storage: FileStorageService,
    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: { select: { provider: true } } },
    }) as Promise<User | null>;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { oauthAccounts: { select: { provider: true } } },
    }) as Promise<User | null>;
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    try {
      return (await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
        },
      })) as User;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(ErrorMessages.auth.REGISTRATION_FAILED);
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async incrementFailedAttempts(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
    }) as Promise<User>;
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedAttempts: 0, lockedUntil: null },
    });
  }

  async lockAccount(userId: string, lockoutCount: number): Promise<void> {
    const durationMs = getLockoutDurationMs(lockoutCount);
    const lockUntil = new Date(Date.now() + durationMs);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: lockUntil,
        lockoutCount: { increment: 1 },
      },
    });
  }

  async resetLockoutEscalation(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
        lockoutCount: 0,
      },
    });
  }

  async findOrCreateByOAuth(profile: OAuthProfile): Promise<{
    user: User;
    action: 'login' | 'created' | 'linked' | 'auto-verified';
  }> {
    // Profile fields to populate from OAuth provider
    // avatarUrl handled separately via downloadAndStoreAvatar (needs userId)
    const profileData = {
      ...(profile.firstName && { firstName: profile.firstName }),
      ...(profile.lastName && { lastName: profile.lastName }),
    };

    // 1. Look up OAuthAccount by (provider, providerId)
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
      include: {
        user: { include: { oauthAccounts: { select: { provider: true } } } },
      },
    });

    if (existingAccount) {
      const existingUser = existingAccount.user as User;

      // If the linked user was deleted/deactivated, detach the stale OAuthAccount
      // so the OAuth identity can be re-linked to an active or new user.
      if (!existingUser.isActive) {
        await this.prisma.oAuthAccount.delete({
          where: { id: existingAccount.id },
        });
        // Fall through to email lookup / new user creation below
      } else {
        // Auto-verify if OAuth account exists but email is still unverified
        const needsVerify =
          !existingUser.emailVerified && profile.emailVerified;

        // Update profile fields if they were empty and OAuth provides them
        const needsProfileUpdate =
          (!existingUser.firstName && profileData.firstName) ||
          (!existingUser.lastName && profileData.lastName);

        if (needsVerify || needsProfileUpdate) {
          const user = (await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              ...(needsVerify && {
                emailVerified: true,
                passwordHash: null,
              }),
              ...(!existingUser.firstName &&
                profileData.firstName && { firstName: profileData.firstName }),
              ...(!existingUser.lastName &&
                profileData.lastName && { lastName: profileData.lastName }),
            },
            include: { oauthAccounts: { select: { provider: true } } },
          })) as User;
          if (needsVerify) {
            this.auditService
              .log({
                action: AuditAction.OAUTH_AUTO_VERIFIED,
                userId: existingUser.id,
                metadata: { provider: profile.provider },
              })
              .catch(() => {});
            this.mailService
              .sendWelcomeEmail(existingUser.email, existingUser.firstName)
              .catch(() => {});
          }
          // Download OAuth avatar if user has none
          if (!user.avatarUrl && profile.avatarUrl) {
            const localAvatar = await this.downloadAndStoreAvatar(
              profile.avatarUrl,
              user.id,
            );
            if (localAvatar) {
              const updated = (await this.prisma.user.update({
                where: { id: user.id },
                data: { avatarUrl: localAvatar },
                include: { oauthAccounts: { select: { provider: true } } },
              })) as User;
              return {
                user: updated,
                action: needsVerify ? 'auto-verified' : 'login',
              };
            }
          }
          return { user, action: needsVerify ? 'auto-verified' : 'login' };
        }

        // No profile update needed, but still check avatar
        if (!existingUser.avatarUrl && profile.avatarUrl) {
          const localAvatar = await this.downloadAndStoreAvatar(
            profile.avatarUrl,
            existingUser.id,
          );
          if (localAvatar) {
            const updated = (await this.prisma.user.update({
              where: { id: existingUser.id },
              data: { avatarUrl: localAvatar },
              include: { oauthAccounts: { select: { provider: true } } },
            })) as User;
            return { user: updated, action: 'login' };
          }
        }
        return { user: existingUser, action: 'login' };
      }
    }

    // 2. Look up User by email
    const existingUser = await this.findByEmail(profile.email);

    if (existingUser) {
      // Auto-link: only if the account has a verified email (prevents pre-account takeover)
      if (!existingUser.emailVerified) {
        if (profile.emailVerified) {
          // OAuth provider confirms email ownership → auto-verify + anti pre-hijack
          const [user] = await this.prisma.$transaction([
            this.prisma.user.update({
              where: { id: existingUser.id },
              data: {
                emailVerified: true,
                passwordHash: null, // Invalidate attacker's password (OWASP pre-hijack mitigation)
                ...profileData,
              },
              include: { oauthAccounts: { select: { provider: true } } },
            }),
            this.prisma.oAuthAccount.create({
              data: {
                userId: existingUser.id,
                provider: profile.provider,
                providerId: profile.providerId,
                email: profile.email,
              },
            }),
          ]);
          this.auditService
            .log({
              action: AuditAction.OAUTH_AUTO_VERIFIED,
              userId: existingUser.id,
              metadata: { provider: profile.provider },
            })
            .catch(() => {});
          this.mailService
            .sendWelcomeEmail(existingUser.email, existingUser.firstName)
            .catch(() => {});
          // Download OAuth avatar if user has none
          if (!existingUser.avatarUrl && profile.avatarUrl) {
            const localAvatar = await this.downloadAndStoreAvatar(
              profile.avatarUrl,
              existingUser.id,
            );
            if (localAvatar) {
              const updated = (await this.prisma.user.update({
                where: { id: existingUser.id },
                data: { avatarUrl: localAvatar },
                include: { oauthAccounts: { select: { provider: true } } },
              })) as User;
              return { user: updated, action: 'auto-verified' };
            }
          }
          return { user: user as User, action: 'auto-verified' };
        }
        throw new ConflictException(
          'An account with this email already exists but is not verified. Please verify your email first.',
        );
      }

      // Create OAuthAccount row + update user profile
      const [user] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerified: true,
            ...profileData,
          },
          include: { oauthAccounts: { select: { provider: true } } },
        }),
        this.prisma.oAuthAccount.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
          },
        }),
      ]);
      // Download OAuth avatar if user has none
      if (!existingUser.avatarUrl && profile.avatarUrl) {
        const localAvatar = await this.downloadAndStoreAvatar(
          profile.avatarUrl,
          existingUser.id,
        );
        if (localAvatar) {
          const updated = (await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { avatarUrl: localAvatar },
            include: { oauthAccounts: { select: { provider: true } } },
          })) as User;
          return { user: updated, action: 'linked' };
        }
      }
      return { user: user as User, action: 'linked' };
    }

    // 3. New user: create User with nested OAuthAccount
    const user = (await this.prisma.user.create({
      data: {
        email: profile.email,
        emailVerified: true,
        ...profileData,
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerId: profile.providerId,
            email: profile.email,
          },
        },
      },
      include: { oauthAccounts: { select: { provider: true } } },
    })) as User;
    this.mailService
      .sendWelcomeEmail(user.email, user.firstName)
      .catch(() => {});
    // Download OAuth avatar for new user
    if (profile.avatarUrl) {
      const localAvatar = await this.downloadAndStoreAvatar(
        profile.avatarUrl,
        user.id,
      );
      if (localAvatar) {
        const updated = (await this.prisma.user.update({
          where: { id: user.id },
          data: { avatarUrl: localAvatar },
          include: { oauthAccounts: { select: { provider: true } } },
        })) as User;
        return { user: updated, action: 'created' };
      }
    }
    return { user, action: 'created' };
  }

  // ── OAuth account management (SCRUM-161) ──

  async getLinkedProviders(userId: string): Promise<LinkedProvider[]> {
    const accounts = await this.prisma.oAuthAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return accounts.map((a) => ({
      provider: a.provider,
      providerId: a.providerId,
      email: a.email,
      linkedAt: a.createdAt.toISOString(),
    }));
  }

  async linkOAuthProvider(
    userId: string,
    profile: OAuthProfile,
    ctx?: RequestContext,
  ): Promise<LinkedProvider> {
    // User is already authenticated via JWT — no email match required
    // (GitHub/Stripe pattern: OAuth link is an auth method, not email proof)
    const user = await this.findById(userId);
    if (!user) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // Check if this OAuth identity is already linked to any user
    const existingAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.providerId,
        },
      },
    });
    if (existingAccount) {
      // CWE-200: Don't reveal if the OAuth identity belongs to another user
      throw new ConflictException(ErrorMessages.oauth.LINK_FAILED);
    }

    // Create OAuthAccount row (@@unique([userId, provider]) prevents duplicates)
    const account = await this.prisma.oAuthAccount.create({
      data: {
        userId,
        provider: profile.provider,
        providerId: profile.providerId,
        email: profile.email,
      },
    });

    this.auditService
      .log({
        action: AuditAction.OAUTH_LINKED,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { provider: profile.provider },
      })
      .catch(() => {});

    return {
      provider: account.provider,
      providerId: account.providerId,
      email: account.email,
      linkedAt: account.createdAt.toISOString(),
    };
  }

  // ── Security activity (SCRUM-135) ──

  async getSecurityActivity(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          ipAddress: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── New methods for SCRUM-21 ──

  async findAll(query: ListUsersQueryDto): Promise<{
    data: SafeUser[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const validSortFields = [
      'createdAt',
      'email',
      'role',
      'firstName',
      'lastName',
    ];
    const sortBy = validSortFields.includes(query.sortBy ?? '')
      ? query.sortBy
      : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: (users as User[]).map(toSafeUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    ctx?: RequestContext,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });

    this.auditService
      .log({
        action: AuditAction.PROFILE_UPDATE,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: {
          updatedFields: Object.keys(dto).filter(
            (k) => (dto as Record<string, unknown>)[k] !== undefined,
          ),
        },
      })
      .catch(() => {});

    return toSafeUser(user as User);
  }

  async uploadAvatar(
    userId: string,
    croppedFile: Express.Multer.File,
    ctx?: RequestContext,
    originalFile?: Express.Multer.File,
    cropData?: Record<string, number>,
  ): Promise<{
    avatarUrl: string;
    avatarOriginalUrl: string | null;
    avatarCropData: Record<string, number> | null;
  }> {
    const ts = Date.now();
    const ext = croppedFile.originalname.split('.').pop() || 'jpg';
    const croppedKey = `${userId}-${ts}.${ext}`;

    // Delete old cropped avatar
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (existing?.avatarUrl?.startsWith('/uploads/')) {
      await this.storage.delete(
        existing.avatarUrl.replace('/uploads/avatars/', ''),
      );
    }

    // Save new cropped avatar
    const croppedUrl = await this.storage.upload(
      croppedFile.buffer,
      croppedKey,
    );

    // Save original only if a new one is provided (first upload).
    // On re-edit, no original is sent — keep the existing one.
    let originalUrl = existing?.avatarOriginalUrl ?? null;
    if (originalFile) {
      // Delete old original before saving new one
      if (existing?.avatarOriginalUrl?.startsWith('/uploads/originals/')) {
        await this.deleteOriginalFile(
          existing.avatarOriginalUrl.replace('/uploads/originals/', ''),
        );
      }
      const origExt = originalFile.originalname.split('.').pop() || 'jpg';
      const origKey = `${userId}-${ts}-original.${origExt}`;
      originalUrl = await this.uploadOriginal(originalFile.buffer, origKey);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: croppedUrl,
        avatarOriginalUrl: originalUrl,
        avatarCropData: cropData ?? Prisma.JsonNull,
      },
    });

    this.auditService
      .log({
        action: AuditAction.PROFILE_UPDATE,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { field: 'avatarUrl', action: 'upload' },
      })
      .catch(() => {});

    return {
      avatarUrl: croppedUrl,
      avatarOriginalUrl: originalUrl,
      avatarCropData: cropData ?? null,
    };
  }

  private async uploadOriginal(buffer: Buffer, key: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    const origDir = path.join(uploadDir, 'originals');
    await fs.mkdir(origDir, { recursive: true });
    await fs.writeFile(path.join(origDir, key), buffer);
    return `/uploads/originals/${key}`;
  }

  private async deleteOriginalFile(key: string): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    try {
      await fs.unlink(path.join(uploadDir, 'originals', key));
    } catch {
      // File not found — no-op
    }
  }

  async removeAvatar(
    userId: string,
    ctx?: RequestContext,
  ): Promise<{ avatarUrl: null }> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (existing?.avatarUrl?.startsWith('/uploads/')) {
      await this.storage.delete(
        existing.avatarUrl.replace('/uploads/avatars/', ''),
      );
    }
    if (existing?.avatarOriginalUrl?.startsWith('/uploads/originals/')) {
      await this.deleteOriginalFile(
        existing.avatarOriginalUrl.replace('/uploads/originals/', ''),
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarOriginalUrl: null,
        avatarCropData: Prisma.JsonNull,
      },
    });

    this.auditService
      .log({
        action: AuditAction.PROFILE_UPDATE,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { field: 'avatarUrl', action: 'remove' },
      })
      .catch(() => {});

    return { avatarUrl: null };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ctx?: RequestContext,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      // CWE-200: JWT valid but user deleted — treat as auth failure, not 404
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    if (user.passwordHash) {
      // User has a password — require currentPassword
      if (!dto.currentPassword) {
        throw new BadRequestException(ErrorMessages.user.PASSWORD_REQUIRED);
      }
      const isCurrentValid = await bcrypt.compare(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!isCurrentValid) {
        throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
      }
    }

    const isBreached = await this.passwordBreachService.isBreached(
      dto.newPassword,
    );
    if (isBreached) {
      throw new BadRequestException(ErrorMessages.auth.PASSWORD_BREACHED);
    }

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Only revoke sessions/devices on actual password CHANGE (not first-time SET)
    if (user.passwordHash) {
      await this.sessionsService.revokeAllUserSessions(userId);
      await this.trustedDeviceService.revokeAllDevices(userId);
    }

    this.auditService
      .log({
        action: AuditAction.PASSWORD_CHANGE,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

    // Fire-and-forget password change notification email
    this.mailService
      .sendPasswordChangeNotification(user.email, user.firstName)
      .catch(() => {});
  }

  async adminUpdateUser(
    targetId: string,
    dto: AdminUpdateUserDto,
    actingUser: { id: string; role: Role; isPlatformAdmin: boolean },
    ctx?: RequestContext,
  ): Promise<SafeUser> {
    // V4.3.1: Admins cannot modify their own account via admin endpoints
    if (actingUser.id === targetId) {
      throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);
    }

    const target = await this.findById(targetId);
    if (!target) {
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
    }

    // Capability gate (SCRUM-489 / Phase 0.3): platform admins are untouchable.
    // Gated by isPlatformAdmin, NOT by legacy Role.SUPERADMIN.
    if (target.isPlatformAdmin === true) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Role-enum-value gate (KEEPS Role.SUPERADMIN check): forbids assigning the
    // legacy SUPERADMIN role via API. Guards the enum-value pathway, not capability —
    // platform-admin status is acquired via isPlatformAdmin (set during seed /
    // migration backfill), never through this user-update flow.
    if (dto.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Capability gate (SCRUM-489 / Phase 0.3): only platform admins can elevate
    // others to ADMIN. Gated by capability, not legacy role.
    if (dto.role && dto.role === Role.ADMIN && !actingUser.isPlatformAdmin) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    // Audit: role change
    if (dto.role !== undefined && dto.role !== target.role) {
      this.auditService
        .log({
          action: AuditAction.USER_ROLE_CHANGE,
          userId: actingUser.id,
          targetUserId: targetId,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { previousRole: target.role, newRole: dto.role },
        })
        .catch(() => {});
    }

    // Audit: activation/deactivation
    if (dto.isActive !== undefined && dto.isActive !== target.isActive) {
      this.auditService
        .log({
          action: dto.isActive
            ? AuditAction.USER_ACTIVATED
            : AuditAction.USER_DEACTIVATED,
          userId: actingUser.id,
          targetUserId: targetId,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
        })
        .catch(() => {});
    }

    // Revoke all sessions on deactivation (immediate lockout)
    if (dto.isActive === false && dto.isActive !== target.isActive) {
      await this.sessionsService.revokeAllUserSessions(targetId);
    }

    if (dto.isActive === false || dto.role !== undefined) {
      this.tokenDenyListService
        .denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS)
        .catch(() => {});
    }

    return toSafeUser(updated as User);
  }

  async softDelete(
    targetId: string,
    actorId?: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const target = await this.findById(targetId);
    if (!target) {
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
    }

    // Capability gate (SCRUM-489 / Phase 0.3): platform admins cannot be deleted.
    if (target.isPlatformAdmin === true) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Send confirmation email BEFORE anonymization (needs real email)
    await this.mailService.sendAccountDeletionConfirmation(
      target.email,
      target.firstName,
    );

    // Anonymize PII + delete related data
    await this.anonymizeAndDelete(targetId);

    // Audit log AFTER anonymization
    this.auditService
      .log({
        action: AuditAction.USER_DELETED,
        userId: actorId,
        targetUserId: targetId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { email: pseudonymizeEmail(target.email) },
      })
      .catch(() => {});
  }

  // ── Shared anonymization (SCRUM-310) ──

  private async anonymizeAndDelete(userId: string): Promise<void> {
    const anonymizedEmail = `deleted-${userId}@anonymized.local`;

    await this.prisma.$transaction([
      // 1. Anonymize user PII (tombstone)
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          passwordHash: null,
          firstName: null,
          lastName: null,
          avatarUrl: null,
          avatarOriginalUrl: null,
          avatarCropData: Prisma.JsonNull,
          pendingEmail: null,
          emailVerified: false,
          isActive: false,
          deletedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
          lockoutCount: 0,
          mfaEnabled: false,
          mfaSecret: null,
          mfaRecoveryCodes: [],
        },
      }),
      // 2. Delete all sessions (contain IP/UA PII)
      this.prisma.session.deleteMany({ where: { userId } }),
      // 3. Delete all email verification tokens
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      // 4. Delete all password reset tokens
      this.prisma.passwordResetToken.deleteMany({ where: { userId } }),
      // 5. Delete OAuth accounts
      this.prisma.oAuthAccount.deleteMany({ where: { userId } }),
      // 6. Delete trusted devices
      this.prisma.trustedDevice.deleteMany({ where: { userId } }),
      // 7. Delete WebAuthn credentials (passkeys)
      this.prisma.webAuthnCredential.deleteMany({ where: { userId } }),
      // 8. Scrub audit log PII (ipAddress, userAgent, metadata)
      this.prisma.auditLog.updateMany({
        where: { OR: [{ userId }, { targetUserId: userId }] },
        data: { ipAddress: null, userAgent: null, metadata: Prisma.DbNull },
      }),
    ]);

    // Deny all access tokens (immediate invalidation)
    this.tokenDenyListService
      .denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS)
      .catch(() => {});
  }

  // ── OAuth avatar download (SCRUM-311) ──

  private async downloadAndStoreAvatar(
    externalUrl: string,
    userId: string,
  ): Promise<string | null> {
    try {
      // SS-01/SS-02: allowlist OAuth-provider avatar CDNs; reject non-HTTPS
      const parsed = new URL(externalUrl);
      if (parsed.protocol !== 'https:') return null;
      if (!AVATAR_URL_ALLOWLIST.includes(parsed.hostname)) return null;

      const response = await fetch(externalUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;

      const contentType = response.headers.get('content-type') || '';
      const ext = contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
          ? 'webp'
          : 'jpg';

      const buffer = Buffer.from(await response.arrayBuffer());
      const key = `${userId}-oauth.${ext}`;
      return await this.storage.upload(buffer, key);
    } catch {
      // Download failure must NOT block login
      return null;
    }
  }

  // ── MFA data access methods (SCRUM-28) ──

  async updateMfaSetupData(
    userId: string,
    encryptedSecret: string,
    hashedRecoveryCodes: string[],
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encryptedSecret,
        mfaRecoveryCodes: hashedRecoveryCodes,
      },
    });
  }

  async enableMfa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  }

  async disableMfa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaRecoveryCodes: [],
      },
    });
  }

  async updateRecoveryCodes(
    userId: string,
    hashedCodes: string[],
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaRecoveryCodes: hashedCodes },
    });
  }

  // ── Email change methods (SCRUM-104) ──

  async requestEmailChange(
    userId: string,
    dto: ChangeEmailDto,
    ctx?: RequestContext,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      // CWE-200: JWT valid but user deleted — treat as auth failure, not 404
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        ErrorMessages.user.EMAIL_CHANGE_NOT_AVAILABLE,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase();

    if (normalizedNewEmail === user.email.toLowerCase()) {
      throw new BadRequestException(ErrorMessages.user.EMAIL_UNCHANGED);
    }

    const existingUser = await this.findByEmail(normalizedNewEmail);
    if (existingUser) {
      throw new ConflictException(ErrorMessages.auth.UNABLE_TO_COMPLETE);
    }

    // Store pending email on user
    await this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: normalizedNewEmail },
    });

    // Create verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + EMAIL_CHANGE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId,
        type: 'EMAIL_CHANGE',
        expiresAt,
      },
    });

    // Send verification email to NEW address (awaited — user needs the link)
    await this.mailService.sendEmailChangeVerificationEmail(
      normalizedNewEmail,
      rawToken,
      user.firstName,
    );

    // Send notification to OLD address (fire-and-forget)
    this.mailService
      .sendEmailChangeRequestNotification(
        user.email,
        normalizedNewEmail,
        user.firstName,
      )
      .catch(() => {});

    // Audit log (fire-and-forget)
    this.auditService
      .log({
        action: AuditAction.EMAIL_CHANGE_REQUESTED,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { newEmail: pseudonymizeEmail(normalizedNewEmail) },
      })
      .catch(() => {});

    return { message: 'Verification email sent to new address' };
  }

  // ── Account self-deletion (SCRUM-105) ──

  async selfDeleteAccount(
    userId: string,
    dto: DeleteAccountDto,
    ctx?: RequestContext,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      // CWE-200: JWT valid but user deleted — treat as auth failure, not 404
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // Capability gate (SCRUM-489 / Phase 0.3): platform admins cannot self-delete.
    if (user.isPlatformAdmin === true) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Password check: required for local accounts, skipped for OAuth-only
    if (user.passwordHash) {
      if (!dto.password) {
        throw new BadRequestException(
          ErrorMessages.user.PASSWORD_CONFIRMATION_REQUIRED,
        );
      }
      const isPasswordValid = await bcrypt.compare(
        dto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
      }
    }

    // Send confirmation email BEFORE anonymization (needs real email)
    await this.mailService.sendAccountDeletionConfirmation(
      user.email,
      user.firstName,
    );

    // Anonymize PII + delete related data (shared with admin softDelete)
    await this.anonymizeAndDelete(userId);

    // Audit log AFTER anonymization (intentionally keeps IP/UA for the deletion event)
    this.auditService
      .log({
        action: AuditAction.ACCOUNT_SELF_DELETED,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

    return { message: 'Account deleted successfully' };
  }

  // ── OAuth unlinking (SCRUM-111, refactored SCRUM-161) ──

  async unlinkOAuth(
    userId: string,
    provider: string,
    dto: UnlinkOAuthDto,
    ctx?: RequestContext,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      // CWE-200: JWT valid but user deleted — treat as auth failure, not 404
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    // Find the specific OAuthAccount to unlink
    const account = await this.prisma.oAuthAccount.findUnique({
      where: {
        userId_provider: { userId, provider: provider as Provider },
      },
    });
    if (!account) {
      throw new BadRequestException(ErrorMessages.oauth.NOT_LINKED);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        ErrorMessages.oauth.PASSWORD_REQUIRED_FOR_UNLINK,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
    }

    // Delete the OAuthAccount row
    await this.prisma.oAuthAccount.delete({
      where: { id: account.id },
    });

    this.auditService
      .log({
        action: AuditAction.OAUTH_UNLINKED,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: {
          provider: account.provider,
          providerId: account.providerId,
        },
      })
      .catch(() => {});

    return { message: 'OAuth provider unlinked successfully' };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
