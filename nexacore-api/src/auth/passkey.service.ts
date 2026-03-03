import { randomUUID } from 'crypto';
import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { REDIS_CLIENT } from '../common/services/redis.constants';
import {
  WEBAUTHN_REG_KEY_PREFIX,
  WEBAUTHN_AUTH_KEY_PREFIX,
  WEBAUTHN_CHALLENGE_TTL_SECONDS,
  MAX_PASSKEYS_PER_USER,
  DEFAULT_PASSKEY_NAME,
} from './constants/passkey.constants';

@Injectable()
export class PasskeyService {
  private readonly rpId: string;
  private readonly rpName: string;
  private readonly origin: string;
  private readonly auditNoop = () => {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.rpId = process.env.WEBAUTHN_RP_ID || 'localhost';
    this.rpName = process.env.WEBAUTHN_RP_NAME || 'EM NexaCore';
    this.origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3001';
  }

  async generateRegOptions(
    userId: string,
  ): Promise<Record<string, unknown>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const count = await this.prisma.webAuthnCredential.count({
      where: { userId },
    });
    if (count >= MAX_PASSKEYS_PER_USER) {
      throw new BadRequestException(
        `Maximum of ${MAX_PASSKEYS_PER_USER} passkeys reached`,
      );
    }

    const existingCredentials = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userName: user.email,
      attestationType: 'none',
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialId,
        transports: cred.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    await this.redis.set(
      `${WEBAUTHN_REG_KEY_PREFIX}${userId}`,
      JSON.stringify(options),
      'EX',
      WEBAUTHN_CHALLENGE_TTL_SECONDS,
    );

    return options as unknown as Record<string, unknown>;
  }

  async verifyRegistration(
    userId: string,
    credential: Record<string, unknown>,
    name?: string,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<{ id: string; name: string }> {
    const stored = await this.redis.getdel(
      `${WEBAUTHN_REG_KEY_PREFIX}${userId}`,
    );
    if (!stored) {
      throw new BadRequestException(
        'Registration challenge not found or expired',
      );
    }

    const expectedOptions = JSON.parse(stored);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential as unknown as RegistrationResponseJSON,
        expectedChallenge: expectedOptions.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpId,
      });
    } catch {
      throw new UnauthorizedException('Passkey registration verification failed');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('Passkey registration verification failed');
    }

    const { credential: regCredential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    const passkeyName = name || DEFAULT_PASSKEY_NAME;

    const record = await this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: regCredential.id,
        publicKey: Buffer.from(regCredential.publicKey),
        signCount: regCredential.counter,
        transports: (regCredential.transports ?? []) as string[],
        backedUp: credentialBackedUp,
        deviceType: credentialDeviceType,
        name: passkeyName,
      },
    });

    this.auditService
      .log({
        action: AuditAction.PASSKEY_REGISTERED,
        userId,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
        metadata: { passkeyId: record.id, name: passkeyName },
      })
      .catch(this.auditNoop);

    return { id: record.id, name: passkeyName };
  }

  async generateAuthOptions(
    email?: string,
  ): Promise<{ options: Record<string, unknown>; challengeId: string }> {
    let allowCredentials: { id: string; transports: AuthenticatorTransportFuture[] }[] | undefined;

    if (email) {
      const user = await this.usersService.findByEmail(email);
      if (user) {
        const credentials = await this.prisma.webAuthnCredential.findMany({
          where: { userId: user.id },
          select: { credentialId: true, transports: true },
        });
        if (credentials.length > 0) {
          allowCredentials = credentials.map((cred) => ({
            id: cred.credentialId,
            transports: cred.transports as AuthenticatorTransportFuture[],
          }));
        }
      }
      // Anti-enumeration: no error if user not found or has no passkeys
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      userVerification: 'preferred',
      allowCredentials,
    });

    const challengeId = randomUUID();

    await this.redis.set(
      `${WEBAUTHN_AUTH_KEY_PREFIX}${challengeId}`,
      JSON.stringify(options),
      'EX',
      WEBAUTHN_CHALLENGE_TTL_SECONDS,
    );

    return {
      options: options as unknown as Record<string, unknown>,
      challengeId,
    };
  }

  async verifyAuthentication(
    challengeId: string,
    credential: Record<string, unknown>,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<string> {
    const stored = await this.redis.getdel(
      `${WEBAUTHN_AUTH_KEY_PREFIX}${challengeId}`,
    );
    if (!stored) {
      throw new UnauthorizedException(
        'Authentication challenge not found or expired',
      );
    }

    const expectedOptions = JSON.parse(stored);
    const authResponse = credential as unknown as AuthenticationResponseJSON;

    const storedCredential = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: authResponse.id },
      include: { user: true },
    });

    if (!storedCredential) {
      this.auditService
        .log({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          userId: null,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: { reason: 'credential_not_found' },
        })
        .catch(this.auditNoop);
      throw new UnauthorizedException('Passkey not recognized');
    }

    if (!storedCredential.user.isActive) {
      this.auditService
        .log({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          userId: storedCredential.userId,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: { reason: 'account_deactivated' },
        })
        .catch(this.auditNoop);
      throw new ForbiddenException('Account is deactivated');
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge: expectedOptions.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpId,
        credential: {
          id: storedCredential.credentialId,
          publicKey: storedCredential.publicKey,
          counter: storedCredential.signCount,
          transports:
            storedCredential.transports as AuthenticatorTransportFuture[],
        },
      });
    } catch {
      this.auditService
        .log({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          userId: storedCredential.userId,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: { reason: 'verification_failed' },
        })
        .catch(this.auditNoop);
      throw new UnauthorizedException('Passkey authentication failed');
    }

    if (!verification.verified) {
      this.auditService
        .log({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          userId: storedCredential.userId,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: { reason: 'verification_not_verified' },
        })
        .catch(this.auditNoop);
      throw new UnauthorizedException('Passkey authentication failed');
    }

    // Sign count replay detection (skip if both are 0 — some authenticators don't track)
    const newSignCount = verification.authenticationInfo.newCounter;
    if (
      storedCredential.signCount > 0 &&
      newSignCount <= storedCredential.signCount
    ) {
      this.auditService
        .log({
          action: AuditAction.PASSKEY_AUTH_FAILURE,
          userId: storedCredential.userId,
          ipAddress: ctx?.ipAddress ?? null,
          userAgent: ctx?.userAgent ?? null,
          metadata: {
            reason: 'sign_count_replay',
            expected: storedCredential.signCount,
            received: newSignCount,
          },
        })
        .catch(this.auditNoop);
      throw new UnauthorizedException(
        'Passkey may have been cloned. Authentication rejected.',
      );
    }

    await this.prisma.webAuthnCredential.update({
      where: { id: storedCredential.id },
      data: {
        signCount: newSignCount,
        lastUsedAt: new Date(),
      },
    });

    this.auditService
      .log({
        action: AuditAction.PASSKEY_AUTH_SUCCESS,
        userId: storedCredential.userId,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
        metadata: { passkeyId: storedCredential.id },
      })
      .catch(this.auditNoop);

    return storedCredential.userId;
  }

  async listPasskeys(
    userId: string,
  ): Promise<
    {
      id: string;
      name: string | null;
      deviceType: string;
      backedUp: boolean;
      transports: string[];
      lastUsedAt: Date | null;
      createdAt: Date;
    }[]
  > {
    return this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        deviceType: true,
        backedUp: true,
        transports: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async renamePasskey(
    userId: string,
    passkeyId: string,
    name: string,
  ): Promise<{ id: string; name: string }> {
    const passkey = await this.prisma.webAuthnCredential.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }

    await this.prisma.webAuthnCredential.update({
      where: { id: passkeyId },
      data: { name },
    });

    return { id: passkeyId, name };
  }

  async deletePasskey(
    userId: string,
    passkeyId: string,
    password?: string,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.passwordHash) {
      if (!password) {
        throw new BadRequestException(
          'Password confirmation required to delete passkey',
        );
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid password');
      }
    }

    const passkey = await this.prisma.webAuthnCredential.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new NotFoundException('Passkey not found');
    }

    await this.prisma.webAuthnCredential.delete({
      where: { id: passkeyId },
    });

    this.auditService
      .log({
        action: AuditAction.PASSKEY_DELETED,
        userId,
        ipAddress: ctx?.ipAddress ?? null,
        userAgent: ctx?.userAgent ?? null,
        metadata: { passkeyId, name: passkey.name },
      })
      .catch(this.auditNoop);
  }
}
