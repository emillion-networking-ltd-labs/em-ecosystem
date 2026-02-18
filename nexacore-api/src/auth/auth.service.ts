import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, SafeUser, toSafeUser } from '../users/entities/user.entity';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { OAuthProfile } from '../common/interfaces/oauth-profile.interface';
import type { StringValue } from 'ms';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

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
