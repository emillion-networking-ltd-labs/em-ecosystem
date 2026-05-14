// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { randomInt, createHmac } from 'crypto';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { generateSecret, generateURI, verify as otpVerify } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { CryptoService } from '../common/services/crypto.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { UsersService } from '../users/users.service';
import { TrustedDeviceService } from './trusted-device.service';
import { User } from '../users/entities/user.entity';
import type { StringValue } from 'ms';
import { ErrorMessages } from '../common/constants/error-messages';
import {
  MFA_CHALLENGE_HMAC_LABEL,
  MFA_CHALLENGE_TOKEN_TYPE,
  MFA_CHALLENGE_EXPIRY,
  BCRYPT_ROUNDS_RECOVERY,
  RECOVERY_CODE_COUNT,
  RECOVERY_CODE_LENGTH,
} from './constants/auth.constants';

@Injectable()
export class MfaService {
  private readonly appName: string;
  private readonly mfaChallengeSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly trustedDeviceService: TrustedDeviceService,
    private readonly configService: ConfigService,
  ) {
    this.appName = this.configService.get<string>('auth.mfaAppName')!;
    const jwtSecret = this.configService.get<string>('auth.jwtSecret')!;
    this.mfaChallengeSecret = createHmac('sha256', jwtSecret)
      .update(MFA_CHALLENGE_HMAC_LABEL)
      .digest('hex');
  }

  async setupMfa(userId: string): Promise<{
    secret: string;
    qrCodeDataUrl: string;
    recoveryCodes: string[];
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    if (user.mfaEnabled) {
      throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE);
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      issuer: this.appName,
      label: user.email,
      secret,
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(
      recoveryCodes.map((code) => bcrypt.hash(code, BCRYPT_ROUNDS_RECOVERY)),
    );

    const encryptedSecret = this.cryptoService.encrypt(secret);

    await this.usersService.updateMfaSetupData(
      userId,
      encryptedSecret,
      hashedCodes,
    );

    return { secret, qrCodeDataUrl, recoveryCodes };
  }

  async verifySetup(
    userId: string,
    token: string,
    meta?: { ipAddress: string; userAgent: string | null },
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    if (user.mfaEnabled) {
      throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE);
    }

    if (!user.mfaSecret) {
      throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE);
    }

    const secret = this.cryptoService.decrypt(user.mfaSecret);
    const result = await otpVerify({ token, secret });
    if (!result.valid) {
      throw new BadRequestException(ErrorMessages.mfa.INVALID_CODE);
    }

    await this.usersService.enableMfa(userId);

    await this.auditService.log({
      action: AuditAction.MFA_ENABLED,
      userId,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    });
  }

  generateMfaToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id, type: MFA_CHALLENGE_TOKEN_TYPE },
      {
        expiresIn: MFA_CHALLENGE_EXPIRY as StringValue,
        secret: this.mfaChallengeSecret,
      },
    );
  }

  async verifyLoginCode(
    mfaToken: string,
    code?: string,
    recoveryCode?: string,
  ): Promise<{ user: User }> {
    if (!code && !recoveryCode) {
      throw new BadRequestException(ErrorMessages.mfa.INVALID_CODE);
    }

    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: string; type: string }>(
        mfaToken,
        {
          secret: this.mfaChallengeSecret,
        },
      );
    } catch {
      throw new UnauthorizedException(ErrorMessages.mfa.INVALID_TOKEN);
    }

    if (payload.type !== MFA_CHALLENGE_TOKEN_TYPE) {
      throw new UnauthorizedException(ErrorMessages.mfa.INVALID_TOKEN);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException(ErrorMessages.mfa.INVALID_TOKEN);
    }

    if (code) {
      const secret = this.cryptoService.decrypt(user.mfaSecret);
      const result = await otpVerify({ token: code, secret });
      if (!result.valid) {
        throw new UnauthorizedException(ErrorMessages.mfa.INVALID_CODE);
      }
    } else if (recoveryCode) {
      const codeIndex = await this.findMatchingRecoveryCode(
        recoveryCode,
        user.mfaRecoveryCodes,
      );
      if (codeIndex === -1) {
        throw new UnauthorizedException(ErrorMessages.mfa.INVALID_CODE);
      }

      const updatedCodes = [...user.mfaRecoveryCodes];
      updatedCodes.splice(codeIndex, 1);
      await this.usersService.updateRecoveryCodes(user.id, updatedCodes);
    }

    return { user };
  }

  async disableMfa(
    userId: string,
    password: string,
    meta?: { ipAddress: string; userAgent: string | null },
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
    }

    await this.usersService.disableMfa(userId);
    await this.trustedDeviceService.revokeAllDevices(userId);

    await this.auditService.log({
      action: AuditAction.MFA_DISABLED,
      userId,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    });
  }

  async regenerateRecoveryCodes(
    userId: string,
    password: string,
  ): Promise<string[]> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException(ErrorMessages.mfa.OPERATION_NOT_AVAILABLE);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
    }

    const recoveryCodes = this.generateRecoveryCodes();
    const hashedCodes = await Promise.all(
      recoveryCodes.map((code) => bcrypt.hash(code, BCRYPT_ROUNDS_RECOVERY)),
    );

    await this.usersService.updateRecoveryCodes(userId, hashedCodes);

    return recoveryCodes;
  }

  async getMfaStatus(
    userId: string,
  ): Promise<{ mfaEnabled: boolean; recoveryCodesRemaining: number }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    return {
      mfaEnabled: user.mfaEnabled,
      recoveryCodesRemaining: user.mfaRecoveryCodes.length,
    };
  }

  private generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
      let code = '';
      for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
        code += chars.charAt(randomInt(chars.length));
      }
      codes.push(code);
    }
    return codes;
  }

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
