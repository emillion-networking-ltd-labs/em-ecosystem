import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogController } from './audit.controller';

@Module({
  controllers: [AuditLogController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
