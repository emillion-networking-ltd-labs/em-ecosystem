import { randomInt, createHmac } from 'crypto';
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
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

const BCRYPT_ROUNDS_RECOVERY = 10;
const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 10;
const MFA_TOKEN_EXPIRY = '5m';

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
  ) {
    this.appName = process.env.MFA_APP_NAME || 'EM NexaCore';
    const jwtSecret =
      process.env.JWT_SECRET || 'default-dev-secret-change-in-production';
    this.mfaChallengeSecret = createHmac('sha256', jwtSecret)
      .update('mfa-challenge-token')
      .digest('hex');
  }

  async setupMfa(
    userId: string,
  ): Promise<{ secret: string; qrCodeDataUrl: string; recoveryCodes: string[] }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled');
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
      throw new UnauthorizedException('User not found');
    }

    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException(
        'MFA setup not initiated. Call POST /auth/mfa/setup first',
      );
    }

    const secret = this.cryptoService.decrypt(user.mfaSecret);
    const result = await otpVerify({ token, secret });
    if (!result.valid) {
      throw new BadRequestException('Invalid verification code');
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
      { sub: user.id, type: 'mfa-challenge' },
      { expiresIn: MFA_TOKEN_EXPIRY as StringValue, secret: this.mfaChallengeSecret },
    );
  }

  async verifyLoginCode(
    mfaToken: string,
    code?: string,
    recoveryCode?: string,
  ): Promise<{ user: User }> {
    if (!code && !recoveryCode) {
      throw new BadRequestException(
        'Either code or recoveryCode must be provided',
      );
    }

    let payload: { sub: string; type: string };
    try {
      payload = this.jwtService.verify<{ sub: string; type: string }>(mfaToken, {
        secret: this.mfaChallengeSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (payload.type !== 'mfa-challenge') {
      throw new UnauthorizedException('Invalid MFA token type');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (code) {
      const secret = this.cryptoService.decrypt(user.mfaSecret);
      const result = await otpVerify({ token: code, secret });
      if (!result.valid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    } else if (recoveryCode) {
      const codeIndex = await this.findMatchingRecoveryCode(
        recoveryCode,
        user.mfaRecoveryCodes,
      );
      if (codeIndex === -1) {
        throw new UnauthorizedException('Invalid recovery code');
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
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password confirmation required but no password set',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
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
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled');
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password confirmation required but no password set',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
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
      throw new UnauthorizedException('User not found');
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
