import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GitHubStrategy } from './strategies/github.strategy';
import { OAuthStateStore } from './stores/oauth-state.store';
import { OAuthCodeStore } from './stores/oauth-code.store';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CryptoModule } from '../common/services/crypto.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    AuditModule,
    SessionsModule,
    CryptoModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as StringValue,
        issuer: 'nexacore-api',
        audience: 'nexacore-api',
      },
      verifyOptions: {
        issuer: 'nexacore-api',
        audience: 'nexacore-api',
      },
    }),
  ],
  controllers: [AuthController, MfaController],
  providers: [
    AuthService,
    MfaService,
    JwtStrategy,
    GoogleStrategy,
    GitHubStrategy,
    OAuthStateStore,
    OAuthCodeStore,
  ],
  exports: [AuthService],
})
export class AuthModule {}
