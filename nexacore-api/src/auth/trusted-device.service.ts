import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import {
  TRUSTED_DEVICE_TTL_DAYS,
  MAX_TRUSTED_DEVICES_PER_USER,
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
      .update('device-fingerprint-key')
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
  ) {
    const fingerprintHash = this.hashFingerprint(userId, fingerprint);
    const deviceName = this.parseDeviceName(userAgent);
    const expiresAt = new Date(
      Date.now() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

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

    return device;
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

  async listTrustedDevices(userId: string) {
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
      throw new NotFoundException('Trusted device not found');
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
