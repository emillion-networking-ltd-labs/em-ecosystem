import { randomUUID } from 'crypto';
import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { createAuditLogger, AuditLogger } from './utils/audit-log.helper';
import { REDIS_CLIENT } from '../common/services/redis.constants';
import {
  WEBAUTHN_REG_KEY_PREFIX,
  WEBAUTHN_AUTH_KEY_PREFIX,
  WEBAUTHN_CHALLENGE_TTL_SECONDS,
  MAX_PASSKEYS_PER_USER,
  DEFAULT_PASSKEY_NAME,
} from './constants/passkey.constants';
import { ErrorMessages } from '../common/constants/error-messages';

function toWebAuthnRecord(
  options:
    | PublicKeyCredentialCreationOptionsJSON
    | PublicKeyCredentialRequestOptionsJSON,
): Record<string, unknown> {
  return options as unknown as Record<string, unknown>;
}

@Injectable()
export class PasskeyService {
  private readonly rpId: string;
  private readonly rpName: string;
  private readonly origin: string;
  private readonly logAuditEvent: AuditLogger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.rpId = this.configService.get<string>('auth.webauthnRpId')!;
    this.rpName = this.configService.get<string>('auth.webauthnRpName')!;
    this.origin = this.configService.get<string>('auth.webauthnOrigin')!;
    this.logAuditEvent = createAuditLogger(this.auditService);
  }

  async generateRegOptions(userId: string): Promise<Record<string, unknown>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    const count = await this.prisma.webAuthnCredential.count({
      where: { userId },
    });
    if (count >= MAX_PASSKEYS_PER_USER) {
      throw new BadRequestException(ErrorMessages.passkey.LIMIT_REACHED);
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

    return toWebAuthnRecord(options);
  }

  async verifyRegistration(
    userId: string,
    credential: Record<string, unknown>,
    name?: string,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<{ id: string; name: string }> {
    const expectedOptions = await this.retrieveAndDeleteRegChallenge(userId);
    const registrationInfo = await this.performRegistrationVerification(
      credential,
      expectedOptions,
    );

    const {
      credential: regCredential,
      credentialDeviceType,
      credentialBackedUp,
    } = registrationInfo;

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

    this.logAuditEvent(AuditAction.PASSKEY_REGISTERED, ctx, userId, {
      passkeyId: record.id,
      name: passkeyName,
    });

    return { id: record.id, name: passkeyName };
  }

  async generateAuthOptions(
    email?: string,
  ): Promise<{ options: Record<string, unknown>; challengeId: string }> {
    let allowCredentials:
      | { id: string; transports: AuthenticatorTransportFuture[] }[]
      | undefined;

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
      options: toWebAuthnRecord(options),
      challengeId,
    };
  }

  async verifyAuthentication(
    challengeId: string,
    credential: Record<string, unknown>,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<string> {
    const { expectedOptions, authResponse } =
      await this.retrieveAndDeleteChallenge(challengeId, credential);

    const storedCredential = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: authResponse.id },
      include: { user: true },
    });

    if (!storedCredential) {
      return this.failPasskeyAuth(ctx, undefined, 'credential_not_found');
    }

    if (!storedCredential.user.isActive) {
      return this.failPasskeyAuth(
        ctx,
        storedCredential.userId,
        'account_deactivated',
      );
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
      return this.failPasskeyAuth(
        ctx,
        storedCredential.userId,
        'verification_failed',
      );
    }

    if (!verification.verified) {
      return this.failPasskeyAuth(
        ctx,
        storedCredential.userId,
        'verification_not_verified',
      );
    }

    await this.verifySignCountAndUpdate(
      storedCredential,
      verification.authenticationInfo.newCounter,
      ctx,
    );

    return storedCredential.userId;
  }

  async listPasskeys(userId: string): Promise<
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
      throw new NotFoundException(ErrorMessages.passkey.NOT_FOUND);
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
      throw new UnauthorizedException(
        ErrorMessages.mfa.AUTHENTICATION_REQUIRED,
      );
    }

    if (user.passwordHash) {
      if (!password) {
        throw new BadRequestException(
          ErrorMessages.passkey.PASSWORD_REQUIRED_FOR_DELETE,
        );
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException(ErrorMessages.user.INVALID_PASSWORD);
      }
    }

    const passkey = await this.prisma.webAuthnCredential.findFirst({
      where: { id: passkeyId, userId },
    });

    if (!passkey) {
      throw new NotFoundException(ErrorMessages.passkey.NOT_FOUND);
    }

    await this.prisma.webAuthnCredential.delete({
      where: { id: passkeyId },
    });

    this.logAuditEvent(AuditAction.PASSKEY_DELETED, ctx, userId, {
      passkeyId,
      name: passkey.name,
    });
  }

  private async retrieveAndDeleteRegChallenge(
    userId: string,
  ): Promise<Record<string, unknown>> {
    const regKey = `${WEBAUTHN_REG_KEY_PREFIX}${userId}`;
    const stored = await this.redis.get(regKey);
    if (!stored) {
      throw new BadRequestException(ErrorMessages.passkey.CHALLENGE_EXPIRED);
    }
    await this.redis.del(regKey);
    return JSON.parse(stored);
  }

  private async performRegistrationVerification(
    credential: Record<string, unknown>,
    expectedOptions: Record<string, unknown>,
  ) {
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential as unknown as RegistrationResponseJSON,
        expectedChallenge: expectedOptions.challenge as string,
        expectedOrigin: this.origin,
        expectedRPID: this.rpId,
      });
    } catch {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
    }

    return verification.registrationInfo;
  }

  private async retrieveAndDeleteChallenge(
    challengeId: string,
    credential: Record<string, unknown>,
  ): Promise<{
    expectedOptions: PublicKeyCredentialRequestOptionsJSON;
    authResponse: AuthenticationResponseJSON;
  }> {
    const authKey = `${WEBAUTHN_AUTH_KEY_PREFIX}${challengeId}`;
    const stored = await this.redis.get(authKey);
    if (!stored) {
      throw new UnauthorizedException(ErrorMessages.passkey.CHALLENGE_EXPIRED);
    }
    await this.redis.del(authKey);

    const expectedOptions = JSON.parse(
      stored,
    ) as PublicKeyCredentialRequestOptionsJSON;
    const authResponse = credential as unknown as AuthenticationResponseJSON;
    return { expectedOptions, authResponse };
  }

  private async verifySignCountAndUpdate(
    storedCredential: { id: string; signCount: number; userId: string },
    newSignCount: number,
    ctx?: { ipAddress: string; userAgent: string | null },
  ): Promise<void> {
    // Sign count replay detection (skip if both are 0 — some authenticators don't track)
    if (
      storedCredential.signCount > 0 &&
      newSignCount <= storedCredential.signCount
    ) {
      this.failPasskeyAuth(ctx, storedCredential.userId, 'sign_count_replay', {
        expected: storedCredential.signCount,
        received: newSignCount,
      });
    }

    await this.prisma.webAuthnCredential.update({
      where: { id: storedCredential.id },
      data: {
        signCount: newSignCount,
        lastUsedAt: new Date(),
      },
    });

    this.logAuditEvent(
      AuditAction.PASSKEY_AUTH_SUCCESS,
      ctx,
      storedCredential.userId,
      { passkeyId: storedCredential.id },
    );
  }

  private failPasskeyAuth(
    ctx: { ipAddress: string; userAgent: string | null } | undefined,
    userId: string | undefined,
    reason: string,
    extra?: Record<string, unknown>,
  ): never {
    this.logAuditEvent(AuditAction.PASSKEY_AUTH_FAILURE, ctx, userId, {
      reason,
      ...extra,
    });
    throw new UnauthorizedException(ErrorMessages.auth.AUTHENTICATION_FAILED);
  }
}
