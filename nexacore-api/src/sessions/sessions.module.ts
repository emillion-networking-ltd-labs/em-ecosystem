import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
