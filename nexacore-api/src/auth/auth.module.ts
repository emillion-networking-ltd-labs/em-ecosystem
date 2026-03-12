import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
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
import { OAuthLinkGuard } from './guards/oauth-link.guard';
import { PasswordBreachService } from './password-breach.service';
import { TrustedDeviceService } from './trusted-device.service';
import { TokenDenyListService } from './token-deny-list.service';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CryptoModule } from '../common/services/crypto.module';
import { MailModule } from '../mail/mail.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    AuditModule,
    SessionsModule,
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
          issuer: 'nexacore-api',
          audience: 'nexacore-api',
          algorithm: 'HS256' as const,
        },
        verifyOptions: {
          issuer: 'nexacore-api',
          audience: 'nexacore-api',
          algorithms: ['HS256'],
        },
      }),
    }),
  ],
  controllers: [AuthController, MfaController, PasskeyController],
  providers: [
    AuthService,
    TokenService,
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
    OAuthLinkGuard,
    PasswordBreachService,
    TrustedDeviceService,
    TokenDenyListService,
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
