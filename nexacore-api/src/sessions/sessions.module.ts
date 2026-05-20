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
  // SessionsServiceV2 [SCRUM-493 — Phase 1.2 internal scaffolding]: now EXPORTED
  // as of SCRUM-494 — Phase 1.3 wired the first consumer (AuthV2Controller).
  // The strangler-pattern invariant from Phase 1.2 is deliberately relaxed here
  // (named transition out of internal-only).
  providers: [SessionsService, SessionsServiceV2],
  exports: [SessionsService, SessionsServiceV2],
})
export class SessionsModule {}
