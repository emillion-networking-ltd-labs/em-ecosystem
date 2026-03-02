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
import { ChangeEmailDto } from './dto/change-email.dto';
import * as crypto from 'crypto';

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
        throw new ConflictException('Email already registered');
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

  async findOrCreateByOAuth(profile: OAuthProfile): Promise<User> {
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
          return this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              ...(!existingUser.firstName && profileData.firstName && { firstName: profileData.firstName }),
              ...(!existingUser.lastName && profileData.lastName && { lastName: profileData.lastName }),
              ...(!existingUser.avatarUrl && profileData.avatarUrl && { avatarUrl: profileData.avatarUrl }),
            },
          }) as Promise<User>;
        }
        return existingUser;
      }

      if (existingUser.provider === Provider.LOCAL) {
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            provider: profile.provider,
            providerId: profile.providerId,
            emailVerified: true,
            ...profileData,
          },
        }) as Promise<User>;
      }

      return existingUser;
    }

    return this.prisma.user.create({
      data: {
        email: profile.email,
        provider: profile.provider,
        providerId: profile.providerId,
        emailVerified: true,
        ...profileData,
      },
    }) as Promise<User>;
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
      throw new NotFoundException('User not found');
    }

    if (!user.passwordHash) {
      throw new ForbiddenException(
        'Password change not available for OAuth accounts',
      );
    }

    const isCurrentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
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

    // Revoke all sessions on password change
    await this.sessionsService.revokeAllUserSessions(userId);

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
      throw new NotFoundException('User not found');
    }

    // Cannot modify SUPERADMIN users
    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot modify SUPERADMIN accounts');
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

    return toSafeUser(updated as User);
  }

  async softDelete(
    targetId: string,
    actorId?: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const target = await this.findById(targetId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot delete SUPERADMIN accounts');
    }

    await this.prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
    });

    // Revoke all sessions on soft delete (immediate lockout)
    await this.sessionsService.revokeAllUserSessions(targetId);

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
      throw new NotFoundException('User not found');
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
      throw new UnauthorizedException('Password is incorrect');
    }

    const normalizedNewEmail = dto.newEmail.toLowerCase();

    if (normalizedNewEmail === user.email.toLowerCase()) {
      throw new BadRequestException(
        'New email must be different from current email',
      );
    }

    const existingUser = await this.findByEmail(normalizedNewEmail);
    if (existingUser) {
      throw new ConflictException('Email already registered');
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

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
