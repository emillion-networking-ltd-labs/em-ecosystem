// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ErrorMessages } from '../common/constants/error-messages';
import { AuditAction } from '../audit/enums/audit-action.enum';
import {
  TRUSTED_DEVICE_TTL_DAYS,
  MAX_TRUSTED_DEVICES_PER_USER,
  DEVICE_FINGERPRINT_HMAC_LABEL,
  daysToMs,
} from './constants/auth.constants';

@Injectable()
export class TrustedDeviceService {
  private readonly fingerprintSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = this.configService.get<string>('auth.jwtSecret')!;
    this.fingerprintSecret = createHmac('sha256', jwtSecret)
      .update(DEVICE_FINGERPRINT_HMAC_LABEL)
      .digest('hex');
  }

  hashFingerprint(userId: string, fingerprint: string): string {
    return createHmac('sha256', this.fingerprintSecret)
      .update(`${userId}:${fingerprint}`)
      .digest('hex');
  }

  async trustDevice(
    userId: string,
    fingerprint: string,
    ipAddress: string,
    userAgent: string | null,
  ): Promise<{
    id: string;
    deviceName: string;
    expiresAt: Date;
    alreadyTrusted: boolean;
  }> {
    const fingerprintHash = this.hashFingerprint(userId, fingerprint);
    const deviceName = this.parseDeviceName(userAgent);
    const expiresAt = new Date(Date.now() + daysToMs(TRUSTED_DEVICE_TTL_DAYS));

    // Check if device is already trusted and active
    const existing = await this.prisma.trustedDevice.findUnique({
      where: { userId_fingerprintHash: { userId, fingerprintHash } },
    });
    if (existing && !existing.isRevoked && existing.expiresAt > new Date()) {
      return {
        id: existing.id,
        deviceName: existing.deviceName,
        expiresAt: existing.expiresAt,
        alreadyTrusted: true,
      };
    }

    // Enforce max trusted devices limit — revoke oldest if exceeded
    const activeCount = await this.prisma.trustedDevice.count({
      where: { userId, isRevoked: false },
    });

    if (activeCount >= MAX_TRUSTED_DEVICES_PER_USER) {
      const oldest = await this.prisma.trustedDevice.findFirst({
        where: { userId, isRevoked: false },
        orderBy: { createdAt: 'asc' },
      });
      if (oldest) {
        await this.prisma.trustedDevice.update({
          where: { id: oldest.id },
          data: { isRevoked: true },
        });
      }
    }

    // Upsert: re-activate if same fingerprint was previously revoked/expired
    const device = await this.prisma.trustedDevice.upsert({
      where: {
        userId_fingerprintHash: { userId, fingerprintHash },
      },
      update: {
        isRevoked: false,
        expiresAt,
        lastVerifiedAt: new Date(),
        deviceName,
        ipAddress,
      },
      create: {
        userId,
        fingerprintHash,
        deviceName,
        ipAddress,
        expiresAt,
      },
    });

    this.auditService
      .log({
        action: AuditAction.DEVICE_TRUSTED,
        userId,
        metadata: { deviceId: device.id, deviceName },
      })
      .catch(() => {});

    return {
      id: device.id,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
      alreadyTrusted: false,
    };
  }

  async isTrustedDevice(userId: string, fingerprint: string): Promise<boolean> {
    const fingerprintHash = this.hashFingerprint(userId, fingerprint);

    const device = await this.prisma.trustedDevice.findFirst({
      where: {
        userId,
        fingerprintHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!device) return false;

    // Update lastVerifiedAt on successful check
    await this.prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastVerifiedAt: new Date() },
    });

    return true;
  }

  async listTrustedDevices(userId: string): Promise<
    Array<{
      id: string;
      deviceName: string | null;
      ipAddress: string | null;
      lastVerifiedAt: Date;
      expiresAt: Date;
      createdAt: Date;
    }>
  > {
    const devices = await this.prisma.trustedDevice.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastVerifiedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        lastVerifiedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return devices;
  }

  async revokeDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.trustedDevice.findFirst({
      where: { id: deviceId, userId, isRevoked: false },
    });

    if (!device) {
      throw new NotFoundException(ErrorMessages.device.NOT_FOUND);
    }

    await this.prisma.trustedDevice.update({
      where: { id: deviceId },
      data: { isRevoked: true },
    });

    this.auditService
      .log({
        action: AuditAction.DEVICE_UNTRUSTED,
        userId,
        metadata: { deviceId, deviceName: device.deviceName },
      })
      .catch(() => {});
  }

  async revokeAllDevices(userId: string): Promise<number> {
    const result = await this.prisma.trustedDevice.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    if (result.count > 0) {
      this.auditService
        .log({
          action: AuditAction.DEVICE_UNTRUSTED,
          userId,
          metadata: { scope: 'all', count: result.count },
        })
        .catch(() => {});
    }

    return result.count;
  }

  // Re-authenticated wrappers (SCRUM-327): require password verification before
  // delegating to the existing internal methods. Internal callers (mfa.service,
  // login.service, mfa.controller fire-and-forget) keep using the bare methods
  // because they have already authenticated via a different factor.
  async trustDeviceWithReauth(
    userId: string,
    fingerprint: string,
    ipAddress: string,
    userAgent: string | null,
    password: string,
  ): Promise<{
    id: string;
    deviceName: string;
    expiresAt: Date;
    alreadyTrusted: boolean;
  }> {
    await this.verifyPassword(userId, password);
    return this.trustDevice(userId, fingerprint, ipAddress, userAgent);
  }

  async revokeDeviceWithReauth(
    userId: string,
    deviceId: string,
    password: string,
  ): Promise<void> {
    await this.verifyPassword(userId, password);
    return this.revokeDevice(userId, deviceId);
  }

  async revokeAllDevicesWithReauth(
    userId: string,
    password: string,
  ): Promise<number> {
    await this.verifyPassword(userId, password);
    return this.revokeAllDevices(userId);
  }

  // Inline lookup avoids injecting UsersService (which would create a DI
  // cycle: UsersService already injects TrustedDeviceService via forwardRef).
  // Reads only `passwordHash` — minimal surface, no business logic needed.
  private async verifyPassword(
    userId: string,
    password: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }
    if (!user.passwordHash) {
      throw new BadRequestException(
        ErrorMessages.mfa.PASSWORD_REQUIRED_NO_PASSWORD,
      );
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
    }
  }

  parseDeviceName(userAgent: string | null): string {
    if (!userAgent) return 'Unknown Device';

    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // Browser detection
    if (userAgent.includes('Firefox/')) {
      browser = 'Firefox';
    } else if (userAgent.includes('Edg/') || userAgent.includes('Edge/')) {
      browser = 'Edge';
    } else if (userAgent.includes('Chrome/')) {
      browser = 'Chrome';
    } else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
      browser = 'Safari';
    }

    // OS detection (order matters: Android UAs contain "Linux", iOS UAs contain "Mac OS")
    if (userAgent.includes('Android')) {
      os = 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      os = 'iOS';
    } else if (userAgent.includes('Windows')) {
      os = 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      os = 'macOS';
    } else if (userAgent.includes('Linux')) {
      os = 'Linux';
    }

    return `${browser} on ${os}`;
  }
}
