import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { SuspiciousLoginService } from './suspicious-login.service';
import { TurnstileService } from './turnstile.service';
import { TurnstileGuard } from './turnstile.guard';

@Module({
  imports: [AuditModule, MailModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    SuspiciousLoginService,
    TurnstileService,
    TurnstileGuard,
  ],
  exports: [SuspiciousLoginService, TurnstileService, TurnstileGuard],
})
export class SecurityModule {}
