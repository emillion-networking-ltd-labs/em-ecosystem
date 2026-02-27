import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from '../users/enums/role.enum';
import { PermissionsService } from './permissions.service';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  private parseRole(role: string): Role {
    const upperRole = role.toUpperCase();
    if (!Object.values(Role).includes(upperRole as Role)) {
      throw new BadRequestException(
        `Invalid role: ${role}. Valid roles: ${Object.values(Role).join(', ')}`,
      );
    }
    return upperRole as Role;
  }

  @Get()
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'List all defined permissions' })
  @ApiResponse({ status: 200, description: 'Returns all permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Get('roles/:role')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiResponse({ status: 200, description: 'Returns role permissions' })
  @ApiResponse({ status: 400, description: 'Invalid role or SUPERADMIN' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getForRole(@Param('role') role: string) {
    return this.permissionsService.getPermissionsForRole(this.parseRole(role));
  }

  @Put('roles/:role')
  @RequirePermissions('permissions:write')
  @ApiOperation({ summary: 'Set permissions for a role' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  @ApiResponse({
    status: 400,
    description: 'Invalid role, SUPERADMIN, or invalid permission keys',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async setForRole(
    @Param('role') role: string,
    @Body() dto: SetRolePermissionsDto,
    @Request() req: any,
  ) {
    await this.permissionsService.setPermissionsForRole(
      this.parseRole(role),
      dto.permissionKeys,
      req.user.role,
    );
    return { message: 'Permissions updated successfully' };
  }
}
