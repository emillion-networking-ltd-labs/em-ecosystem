import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { SessionsService } from '../sessions/sessions.service';
import { PasswordBreachService } from './password-breach.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ErrorMessages } from '../common/constants/error-messages';
import { hashToken } from './utils/hash-token';
import {
  BCRYPT_ROUNDS,
  DUMMY_PASSWORD_HASH,
  RESET_TOKEN_EXPIRY_HOURS,
  hoursToMs,
} from './constants/auth.constants';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly sessionsService: SessionsService,
    private readonly passwordBreachService: PasswordBreachService,
    private readonly auditService: AuditService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      // CWE-203: timing protection — match CPU cost of existing-email path
      await bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH);
      return;
    }

    if (!user.passwordHash) {
      // CWE-203: timing protection — match CPU cost of LOCAL-email path
      await bcrypt.compare(dto.email, DUMMY_PASSWORD_HASH);
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
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + hoursToMs(RESET_TOKEN_EXPIRY_HOURS),
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

  async resetPassword(
    dto: ResetPasswordDto,
    ctx?: RequestContext,
  ): Promise<void> {
    const tokenHash = hashToken(dto.token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw new BadRequestException(ErrorMessages.auth.INVALID_RESET_TOKEN);
    }

    if (resetToken.usedAt) {
      throw new BadRequestException(ErrorMessages.auth.INVALID_RESET_TOKEN);
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException(ErrorMessages.auth.INVALID_RESET_TOKEN);
    }

    // Reject if new password is same as current
    if (resetToken.user.passwordHash) {
      const isSamePassword = await bcrypt.compare(
        dto.newPassword,
        resetToken.user.passwordHash,
      );
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
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

    const newPasswordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    // Mark token as used and update password
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
    ]);

    // Revoke all sessions (forces re-authentication)
    await this.sessionsService.revokeAllUserSessions(resetToken.userId);

    // Unlock account — password reset proves email ownership, lockout no longer needed
    await this.usersService.resetLockoutEscalation(resetToken.userId);

    this.auditService
      .log({
        action: AuditAction.PASSWORD_CHANGE,
        userId: resetToken.userId,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: { method: 'reset_token' },
      })
      .catch(() => {});
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const tokenHash = hashToken(token);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return { valid: false };
    }

    return { valid: true };
  }
}
