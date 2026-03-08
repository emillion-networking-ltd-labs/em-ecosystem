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
import { TokenDenyListService, ACCESS_TOKEN_TTL_SECONDS } from '../auth/token-deny-list.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UnlinkOAuthDto } from './dto/unlink-oauth.dto';
import * as crypto from 'crypto';
import { ErrorMessages } from '../common/constants/error-messages';

const BCRYPT_ROUNDS = 12;
const EMAIL_CHANGE_TOKEN_EXPIRY_HOURS = 24;

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
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    }) as Promise<User | null>;
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<User | null>;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    provider?: Provider;
  }): Promise<User> {
    try {
      return (await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          provider: data.provider || Provider.LOCAL,
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

  async findOrCreateByOAuth(
    profile: OAuthProfile,
  ): Promise<{ user: User; action: 'login' | 'created' | 'linked' }> {
    const existingUser = await this.findByEmail(profile.email);

    // Profile fields to populate from OAuth provider
    const profileData = {
      ...(profile.firstName && { firstName: profile.firstName }),
      ...(profile.lastName && { lastName: profile.lastName }),
      ...(profile.avatarUrl && { avatarUrl: profile.avatarUrl }),
    };

    if (existingUser) {
      if (
        existingUser.provider === profile.provider &&
        existingUser.providerId === profile.providerId
      ) {
        // Update profile fields if they were empty and OAuth provides them
        const needsUpdate =
          (!existingUser.firstName && profileData.firstName) ||
          (!existingUser.lastName && profileData.lastName) ||
          (!existingUser.avatarUrl && profileData.avatarUrl);

        if (needsUpdate) {
          const user = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              ...(!existingUser.firstName && profileData.firstName && { firstName: profileData.firstName }),
              ...(!existingUser.lastName && profileData.lastName && { lastName: profileData.lastName }),
              ...(!existingUser.avatarUrl && profileData.avatarUrl && { avatarUrl: profileData.avatarUrl }),
            },
          }) as User;
          return { user, action: 'login' };
        }
        return { user: existingUser, action: 'login' };
      }

      if (existingUser.provider === Provider.LOCAL) {
        // Auto-link: only if the LOCAL account has a verified email (prevents pre-account takeover)
        if (!existingUser.emailVerified) {
          throw new ConflictException(
            'An account with this email already exists but is not verified. Please verify your email first.',
          );
        }
        const user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            provider: profile.provider,
            providerId: profile.providerId,
            emailVerified: true,
            ...profileData,
          },
        }) as User;
        return { user, action: 'linked' };
      }

      return { user: existingUser, action: 'login' };
    }

    const user = await this.prisma.user.create({
      data: {
        email: profile.email,
        provider: profile.provider,
        providerId: profile.providerId,
        emailVerified: true,
        ...profileData,
      },
    }) as User;
    return { user, action: 'created' };
  }

  // ── Security activity (SCRUM-135) ──

  async getSecurityActivity(
    userId: string,
    page: number,
    limit: number,
  ) {
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

  async findAll(
    query: ListUsersQueryDto,
  ): Promise<{ data: SafeUser[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

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

    const validSortFields = ['createdAt', 'email', 'role', 'firstName', 'lastName'];
    const sortBy = validSortFields.includes(query.sortBy ?? '') ? query.sortBy : 'createdAt';
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

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ctx?: RequestContext,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
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
      throw new BadRequestException(
        'This password has appeared in a data breach. Please choose a different password.',
      );
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
    actingUser: { id: string; role: Role },
    ctx?: RequestContext,
  ): Promise<SafeUser> {
    const target = await this.findById(targetId);
    if (!target) {
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
    }

    // Cannot modify SUPERADMIN users
    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Only SUPERADMIN can assign ADMIN or SUPERADMIN roles
    if (
      dto.role &&
      (dto.role === Role.ADMIN || dto.role === Role.SUPERADMIN) &&
      actingUser.role !== Role.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'Only SUPERADMIN can assign ADMIN or SUPERADMIN roles',
      );
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
      this.tokenDenyListService.denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});
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

    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
    });

    // Revoke all sessions on soft delete (immediate lockout)
    await this.sessionsService.revokeAllUserSessions(targetId);
    this.tokenDenyListService.denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});

    this.auditService
      .log({
        action: AuditAction.USER_DELETED,
        userId: actorId,
        targetUserId: targetId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { email: target.email },
      })
      .catch(() => {});
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
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Email change not available for OAuth accounts',
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
      throw new BadRequestException(
        'New email must be different from current email',
      );
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
        metadata: { newEmail: normalizedNewEmail },
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
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
    }

    if (user.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ErrorMessages.user.OPERATION_NOT_PERMITTED);
    }

    // Password check: required for local accounts, skipped for OAuth-only
    if (user.passwordHash) {
      if (!dto.password) {
        throw new BadRequestException(
          'Password confirmation required for local accounts',
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

    // Anonymize PII + delete related data in a single transaction
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
          providerId: null,
          pendingEmail: null,
          emailVerified: false,
          isActive: false,
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
      // 5. Scrub audit log PII (ipAddress, userAgent, metadata)
      this.prisma.auditLog.updateMany({
        where: { OR: [{ userId }, { targetUserId: userId }] },
        data: { ipAddress: null, userAgent: null, metadata: Prisma.DbNull },
      }),
    ]);

    // Audit log AFTER transaction (intentionally keeps IP/UA for the deletion event)
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

  // ── OAuth unlinking (SCRUM-111) ──

  async unlinkOAuth(
    userId: string,
    dto: UnlinkOAuthDto,
    ctx?: RequestContext,
  ): Promise<{ message: string }> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
    }

    if (user.provider === Provider.LOCAL) {
      throw new BadRequestException(
        'No OAuth provider linked to this account',
      );
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'You must set a password before unlinking your OAuth provider',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
    }

    const previousProvider = user.provider;
    const previousProviderId = user.providerId;

    await this.prisma.user.update({
      where: { id: userId },
      data: { provider: Provider.LOCAL, providerId: null },
    });

    this.auditService
      .log({
        action: AuditAction.OAUTH_UNLINKED,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { previousProvider, previousProviderId },
      })
      .catch(() => {});

    return { message: 'OAuth provider unlinked successfully' };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
