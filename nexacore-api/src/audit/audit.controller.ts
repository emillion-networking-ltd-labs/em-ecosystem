import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from '../users/enums/role.enum';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@RequirePermissions('audit-logs:read')
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of audit logs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — requires ADMIN role' })
  async listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      action: query.action,
      userId: query.userId,
      startDate: query.startDate,
      endDate: query.endDate,
      sortOrder: query.sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry by ID' })
  @ApiResponse({ status: 200, description: 'Audit log entry' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async getAuditLog(@Param('id') id: string) {
    const log = await this.auditService.findById(id);
    if (!log) {
      throw new NotFoundException('Audit log not found');
    }
    return log;
  }
}
