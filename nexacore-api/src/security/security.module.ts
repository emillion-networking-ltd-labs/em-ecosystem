import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CsrfGuard } from '../common/guards/csrf.guard';
import { AuditModule } from '../audit/audit.module';
import { MailModule } from '../mail/mail.module';
import { SuspiciousLoginService } from './suspicious-login.service';

@Module({
  imports: [AuditModule, MailModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
    SuspiciousLoginService,
  ],
  exports: [SuspiciousLoginService],
})
export class SecurityModule {}
