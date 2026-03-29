import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { RequestContext } from '../audit/interfaces/audit-log-entry.interface';
import { User } from '../users/entities/user.entity';
import { ErrorMessages } from '../common/constants/error-messages';
import { hashToken } from './utils/hash-token';
import { pseudonymizeEmail } from '../common/utils/pseudonymize-email';
import {
  VERIFICATION_TOKEN_EXPIRY_HOURS,
  RESEND_COOLDOWN_SECONDS,
  hoursToMs,
} from './constants/auth.constants';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly auditService: AuditService,
  ) {}

  async verifyEmail(token: string): Promise<{ status: 'success' | 'invalid' }> {
    const tokenHash = hashToken(token);

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

    if (!verificationToken) {
      return { status: 'invalid' };
    }

    // Cross-flow guard: reject EMAIL_CHANGE tokens at registration endpoint
    if (verificationToken.type !== 'REGISTRATION') {
      return { status: 'invalid' };
    }

    if (verificationToken.usedAt) {
      // Already used — still success if user is verified
      if (verificationToken.user.emailVerified) {
        return { status: 'success' };
      }
      return { status: 'invalid' };
    }

    if (verificationToken.expiresAt < new Date()) {
      return { status: 'invalid' };
    }

    // Mark token as used and user as verified
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
    ]);

    // Welcome email on first activation
    this.mailService
      .sendWelcomeEmail(
        verificationToken.user.email,
        verificationToken.user.firstName,
      )
      .catch(() => {});

    return { status: 'success' };
  }

  async verifyEmailChange(
    token: string,
    ctx?: RequestContext,
  ): Promise<{ status: 'success' | 'invalid' }> {
    const result = await this.validateEmailChangeToken(token);
    if (!result.valid) {
      return { status: 'invalid' };
    }

    const { verificationToken, user, oldEmail, newEmail } = result;

    await this.executeEmailSwap(user.id, newEmail, verificationToken.id);

    // Revoke all sessions — forces re-login with new email
    await this.sessionsService.revokeAllUserSessions(user.id);

    // Send confirmation to OLD email (fire-and-forget)
    this.mailService
      .sendEmailChangedConfirmation(oldEmail, newEmail, user.firstName)
      .catch(() => {});

    // Audit log (fire-and-forget)
    this.auditService
      .log({
        action: AuditAction.EMAIL_CHANGED,
        userId: user.id,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
        metadata: {
          oldEmail: pseudonymizeEmail(oldEmail),
          newEmail: pseudonymizeEmail(newEmail),
        },
      })
      .catch(() => {});

    return { status: 'success' };
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    if (user.emailVerified) {
      throw new BadRequestException(ErrorMessages.auth.EMAIL_ALREADY_VERIFIED);
    }

    // Rate limiting: check last token creation time
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const secondsSinceLastToken =
        (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (secondsSinceLastToken < RESEND_COOLDOWN_SECONDS) {
        throw new BadRequestException(ErrorMessages.auth.RESEND_COOLDOWN);
      }
    }

    await this.createAndSendVerificationEmail(user);
  }

  async resendVerificationByEmail(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    // Anti-enumeration: silently return for all non-happy paths
    if (!user) return;
    if (user.emailVerified) return;

    // Rate limiting: check last token creation time (silent)
    const lastToken = await this.prisma.emailVerificationToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (lastToken) {
      const secondsSinceLastToken =
        (Date.now() - lastToken.createdAt.getTime()) / 1000;
      if (secondsSinceLastToken < RESEND_COOLDOWN_SECONDS) {
        return; // Silent — anti-enumeration
      }
    }

    await this.createAndSendVerificationEmail(user);
  }

  async createAndSendVerificationEmail(user: User): Promise<void> {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(plainToken);
    const expiresAt = new Date(
      Date.now() + hoursToMs(VERIFICATION_TOKEN_EXPIRY_HOURS),
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      plainToken,
      user.firstName,
    );
  }

  private async validateEmailChangeToken(token: string): Promise<
    | {
        valid: true;
        verificationToken: { id: string };
        user: {
          id: string;
          email: string;
          firstName: string | null;
          pendingEmail: string | null;
        };
        oldEmail: string;
        newEmail: string;
      }
    | { valid: false }
  > {
    const tokenHash = hashToken(token);

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

    if (!verificationToken) {
      return { valid: false };
    }

    // Cross-flow guard: only accept EMAIL_CHANGE tokens
    if (verificationToken.type !== 'EMAIL_CHANGE') {
      return { valid: false };
    }

    if (verificationToken.usedAt) {
      return { valid: false };
    }

    if (verificationToken.expiresAt < new Date()) {
      return { valid: false };
    }

    const user = verificationToken.user;

    // Ensure pendingEmail is still set (request not cancelled)
    if (!user.pendingEmail) {
      return { valid: false };
    }

    // Race condition guard: check the pending email is still available
    const existingUser = await this.usersService.findByEmail(user.pendingEmail);
    if (existingUser && existingUser.id !== user.id) {
      return { valid: false };
    }

    return {
      valid: true,
      verificationToken: { id: verificationToken.id },
      user,
      oldEmail: user.email,
      newEmail: user.pendingEmail,
    };
  }

  private async executeEmailSwap(
    userId: string,
    newEmail: string,
    tokenId: string,
  ): Promise<void> {
    const hasOAuthAccounts =
      (await this.prisma.oAuthAccount.count({ where: { userId } })) > 0;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: newEmail,
          pendingEmail: null,
          emailVerified: true,
        },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() },
      }),
      ...(hasOAuthAccounts
        ? [this.prisma.oAuthAccount.deleteMany({ where: { userId } })]
        : []),
    ]);
  }
}
