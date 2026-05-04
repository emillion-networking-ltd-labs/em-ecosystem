import { forwardRef, Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  // forwardRef on AuthModule resolves the AuthModule <-> SessionsModule cycle
  // (AuthModule already imports SessionsModule). SCRUM-347 needs
  // TokenDenyListService (provided by AuthModule) inside SessionsService.
  imports: [AuditModule, forwardRef(() => AuthModule)],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
