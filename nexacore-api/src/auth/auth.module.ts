// WARNING: AUTH DOMAIN — changes require Jira ticket + owner approval (see workflow-standards.mdc §15 Auth Change-Control)

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { AccountController } from './account.controller';
import { SessionController } from './session.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { TokenServiceV2 } from './token.service.v2';
import { LoginService } from './login.service';
import { OAuthAuthService } from './oauth-auth.service';
import { EmailVerificationService } from './email-verification.service';
import { PasswordResetService } from './password-reset.service';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { OAuthStateStore } from './stores/oauth-state.store';
import { OAuthCodeStore } from './stores/oauth-code.store';
import { OAuthLinkCodeStore } from './stores/oauth-link-code.store';
import { OAuthLinkGuard } from './guards/oauth-link.guard';
import { MfaSetupGuard } from './guards/mfa-setup.guard';
import { JwtOrMfaSetupGuard } from './guards/jwt-or-mfa-setup.guard';
import { PasswordBreachService } from './password-breach.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TokenDenyListService } from './token-deny-list.service';
import { LoginSecurityService } from './login-security.service';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CryptoModule } from '../common/services/crypto.module';
import { MailModule } from '../mail/mail.module';
import { SecurityModule } from '../security/security.module';
import { JWT_ISSUER, JWT_AUDIENCE } from './constants/auth.constants';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    AuditModule,
    // forwardRef on SessionsModule completes the bidirectional cycle:
    // SessionsModule now imports AuthModule (forwardRef) to receive
    // TokenDenyListService for SCRUM-347's instant per-session revocation.
    forwardRef(() => SessionsModule),
    CryptoModule,
    MailModule,
    SecurityModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<string>(
            'auth.jwtAccessExpiration',
          ) as StringValue,
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          algorithm: 'HS256' as const,
        },
        verifyOptions: {
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
          algorithms: ['HS256'],
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    OAuthController,
    AccountController,
    SessionController,
    MfaController,
    PasskeyController,
  ],
  providers: [
    AuthService,
    TokenService,
    TokenServiceV2,
    LoginService,
    OAuthAuthService,
    EmailVerificationService,
    PasswordResetService,
    MfaService,
    PasskeyService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    OAuthStateStore,
    OAuthCodeStore,
    OAuthLinkCodeStore,
    OAuthLinkGuard,
    MfaSetupGuard,
    JwtOrMfaSetupGuard,
    PasswordBreachService,
    TrustedDeviceService,
    TokenDenyListService,
    LoginSecurityService,
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordBreachService,
    TrustedDeviceService,
    TokenDenyListService,
  ],
})
export class AuthModule {}
