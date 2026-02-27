import { Global, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsCache } from './permissions.cache';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsController } from './permissions.controller';
import { AuditModule } from '../audit/audit.module';

@Global()
@Module({
  imports: [AuditModule],
  providers: [PermissionsService, PermissionsCache, PermissionsGuard],
  controllers: [PermissionsController],
  exports: [PermissionsService, PermissionsCache, PermissionsGuard],
})
export class PermissionsModule {}
