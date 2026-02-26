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
import { OAuthCodeStore } from './stores/oauth-code.store';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import type { StringValue } from 'ms';
import {
  BCRYPT_ROUNDS,
  MAX_FAILED_ATTEMPTS,
  DUMMY_PASSWORD_HASH,
  getLockoutDurationMinutes,
} from './constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly oauthCodeStore: OAuthCodeStore,
    private readonly auditService: AuditService,
  ) {}

  async register(
    dto: RegisterDto,
    ctx?: RequestContext,
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

    this.auditService
      .log({
        action: AuditAction.REGISTER,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { email: dto.email },
      })
      .catch(() => {});

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

  async login(
    dto: LoginDto,
    ctx?: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const user = await this.usersService.findByEmail(dto.email);

    // Timing attack protection: constant-time response when user not found
    if (!user) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { email: dto.email, reason: 'user_not_found' },
        })
        .catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }

    // Account lockout check with detailed response
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      const remainingMinutes = Math.ceil(remainingMs / 60_000);

      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { reason: 'account_locked' },
        })
        .catch(() => {});

      throw new ForbiddenException({
        message: `Account locked due to too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        error: 'Forbidden',
        statusCode: 403,
        retryAfter: remainingSeconds,
        lockoutLevel: user.lockoutCount,
      });
    }

    // Expired lockout: reset failed attempts (but NOT lockoutCount)
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    // OAuth-only account (no password set) — constant timing
    if (!user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);
      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: { reason: 'no_password_set' },
        })
        .catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      const updated = await this.usersService.incrementFailedAttempts(user.id);

      if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        await this.usersService.lockAccount(user.id, user.lockoutCount);

        const lockoutMinutes = getLockoutDurationMinutes(user.lockoutCount);
        const lockoutSeconds = lockoutMinutes * 60;

        this.auditService
          .log({
            action: AuditAction.ACCOUNT_LOCKED,
            userId: user.id,
            ipAddress: ctx?.ipAddress,
            userAgent: ctx?.userAgent,
            metadata: {
              reason: 'max_failed_attempts',
              failedAttempts: MAX_FAILED_ATTEMPTS,
            },
          })
          .catch(() => {});

        throw new ForbiddenException({
          message: `Account locked due to too many failed attempts. Try again in ${lockoutMinutes} minute${lockoutMinutes !== 1 ? 's' : ''}.`,
          error: 'Forbidden',
          statusCode: 403,
          retryAfter: lockoutSeconds,
          lockoutLevel: user.lockoutCount + 1,
        });
      }

      this.auditService
        .log({
          action: AuditAction.LOGIN_FAILURE,
          userId: user.id,
          ipAddress: ctx?.ipAddress,
          userAgent: ctx?.userAgent,
          metadata: {
            reason: 'invalid_password',
            failedAttempts: updated.failedAttempts,
          },
        })
        .catch(() => {});

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedAttempts > 0) {
      await this.usersService.resetFailedAttempts(user.id);
    }

    const tokens = await this.generateTokens(user);

    this.auditService
      .log({
        action: AuditAction.LOGIN_SUCCESS,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

    return {
      ...tokens,
      user: toSafeUser(user),
    };
  }

  async refreshTokens(
    refreshToken: string,
    ctx?: RequestContext,
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

    const tokens = await this.generateTokens(user);

    this.auditService
      .log({
        action: AuditAction.TOKEN_REFRESH,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});

    return tokens;
  }

  async validateOAuthUser(
    profile: OAuthProfile,
    ctx?: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const user = await this.usersService.findOrCreateByOAuth(profile);
    const tokens = await this.generateTokens(user);

    this.auditService
      .log({
        action: AuditAction.OAUTH_LOGIN,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { provider: profile.provider },
      })
      .catch(() => {});

    return { ...tokens, user: toSafeUser(user) };
  }

  generateOAuthCode(payload: {
    accessToken: string;
    refreshToken: string;
    user: SafeUser;
  }): string {
    return this.oauthCodeStore.store(payload);
  }

  exchangeOAuthCode(code: string): {
    accessToken: string;
    refreshToken: string;
    user: SafeUser;
  } {
    const payload = this.oauthCodeStore.exchange(code);
    if (!payload) {
      throw new UnauthorizedException(
        'Invalid or expired authorization code',
      );
    }
    return payload;
  }

  async logout(userId: string, ctx?: RequestContext): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);

    this.auditService
      .log({
        action: AuditAction.LOGOUT,
        userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch(() => {});
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
