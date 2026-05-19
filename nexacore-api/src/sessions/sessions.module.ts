import { forwardRef, Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsServiceV2 } from './sessions.service.v2';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  // forwardRef on AuthModule resolves the AuthModule <-> SessionsModule cycle
  // (AuthModule already imports SessionsModule). SCRUM-347 needs
  // TokenDenyListService (provided by AuthModule) inside SessionsService.
  imports: [AuditModule, forwardRef(() => AuthModule)],
  // SessionsServiceV2 [SCRUM-493 — Phase 1.2]: internal scaffolding, NOT exported
  // (strangler-pattern invariant — Phase 1.3 wires the first consumer).
  providers: [SessionsService, SessionsServiceV2],
  exports: [SessionsService],
})
export class SessionsModule {}
