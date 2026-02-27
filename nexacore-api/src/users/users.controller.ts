import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Role } from './enums/role.enum';
import { toSafeUser } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Self-service endpoints ──

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request()
    req: { user: { id: string }; ip?: string; headers?: Record<string, string> },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto, {
      ipAddress: req.ip || null,
      userAgent: req.headers?.['user-agent'] || null,
    });
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request()
    req: { user: { id: string }; ip?: string; headers?: Record<string, string> },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(req.user.id, dto, {
      ipAddress: req.ip || null,
      userAgent: req.headers?.['user-agent'] || null,
    });
    return { message: 'Password changed successfully' };
  }

  // ── Admin endpoints ──

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:read')
  async listUsers(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:read')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      return { error: 'User not found' };
    }
    return toSafeUser(user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:write')
  async adminUpdateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
    @Request()
    req: {
      user: { id: string; role: Role };
      ip?: string;
      headers?: Record<string, string>;
    },
  ) {
    return this.usersService.adminUpdateUser(id, dto, req.user, {
      ipAddress: req.ip || null,
      userAgent: req.headers?.['user-agent'] || null,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ADMIN)
  @RequirePermissions('users:delete')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
  ) {
    await this.usersService.softDelete(id, req.user.id, {
      ipAddress: req.ip || null,
      userAgent: req.headers?.['user-agent'] || null,
    });
    return { message: 'User deactivated successfully' };
  }
}
