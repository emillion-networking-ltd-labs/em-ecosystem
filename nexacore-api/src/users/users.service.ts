import {
  Injectable,
  Inject,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  forwardRef,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TokenDenyListService, ACCESS_TOKEN_TTL_SECONDS } from '../auth/token-deny-list.service';
import { User, SafeUser, toSafeUser } from './entities/user.entity';
import { Provider } from './enums/provider.enum';
import { Role } from './enums/role.enum';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
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
        throw new ConflictException('Email already registered');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
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

  async lockAccount(userId: string): Promise<void> {
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: lockUntil },
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

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
    });
    return toSafeUser(user as User);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
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

    const newHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        refreshToken: null, // Revoke all sessions
      },
    });

    this.tokenDenyListService.denyAllForUser(userId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});
  }

  async adminUpdateUser(
    targetId: string,
    dto: AdminUpdateUserDto,
    actingUser: { role: Role },
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

    if (dto.isActive === false || dto.role !== undefined) {
      this.tokenDenyListService.denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});
    }

    return toSafeUser(updated as User);
  }

  async softDelete(targetId: string): Promise<void> {
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

    this.tokenDenyListService.denyAllForUser(targetId, ACCESS_TOKEN_TTL_SECONDS).catch(() => {});
  }
}
