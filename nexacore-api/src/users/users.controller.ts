import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
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
import { ChangeEmailDto } from './dto/change-email.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UnlinkOAuthDto } from './dto/unlink-oauth.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ListSecurityActivityQueryDto } from './dto/list-security-activity-query.dto';
import { ErrorMessages } from '../common/constants/error-messages';
import { extractRequestMeta } from '../common/utils/request-meta';
import { AUTH_RATE_LIMITS } from '../auth/constants/auth.constants';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Self-service endpoints ──

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.id,
      dto,
      extractRequestMeta(req),
    );
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'original', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  async uploadAvatar(
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
    @UploadedFiles()
    files: { avatar?: Express.Multer.File[]; original?: Express.Multer.File[] },
    @Body() body: { cropData?: string },
  ) {
    const avatar = files.avatar?.[0];
    if (!avatar) throw new BadRequestException('Avatar file is required');
    const original = files.original?.[0];
    const cropData = body.cropData
      ? (JSON.parse(body.cropData) as Record<string, number>)
      : undefined;
    return this.usersService.uploadAvatar(
      req.user.id,
      avatar,
      extractRequestMeta(req),
      original,
      cropData,
    );
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  async removeAvatar(
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
  ) {
    return this.usersService.removeAvatar(req.user.id, extractRequestMeta(req));
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      req.user.id,
      dto,
      extractRequestMeta(req),
    );
    return { message: 'Password changed successfully' };
  }

  @Post('me/email')
  @UseGuards(JwtAuthGuard)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.user_settings.ttl,
      limit: AUTH_RATE_LIMITS.user_settings.limit,
    },
  })
  @HttpCode(HttpStatus.OK)
  async requestEmailChange(
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
    @Body() dto: ChangeEmailDto,
  ) {
    return this.usersService.requestEmailChange(
      req.user.id,
      dto,
      extractRequestMeta(req),
    );
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteOwnAccount(
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.selfDeleteAccount(
      req.user.id,
      dto,
      extractRequestMeta(req),
    );
  }

  @Get('me/oauth')
  @UseGuards(JwtAuthGuard)
  async getLinkedProviders(@Request() req: { user: { id: string } }) {
    return this.usersService.getLinkedProviders(req.user.id);
  }

  @Delete('me/oauth/:provider')
  @UseGuards(JwtAuthGuard)
  @Throttle({
    global: {
      ttl: AUTH_RATE_LIMITS.user_settings.ttl,
      limit: AUTH_RATE_LIMITS.user_settings.limit,
    },
  })
  @HttpCode(HttpStatus.OK)
  async unlinkOAuth(
    @Param('provider') provider: string,
    @Request()
    req: {
      user: { id: string };
      ip?: string;
      headers?: Record<string, string>;
    },
    @Body() dto: UnlinkOAuthDto,
  ) {
    const validProviders = ['GOOGLE', 'GITHUB'];
    const normalizedProvider = provider.toUpperCase();
    if (!validProviders.includes(normalizedProvider)) {
      throw new BadRequestException(ErrorMessages.oauth.INVALID_PROVIDER);
    }
    return this.usersService.unlinkOAuth(
      req.user.id,
      normalizedProvider,
      dto,
      extractRequestMeta(req),
    );
  }

  @Get('me/security-activity')
  @UseGuards(JwtAuthGuard)
  async getSecurityActivity(
    @Request() req: { user: { id: string } },
    @Query() query: ListSecurityActivityQueryDto,
  ) {
    return this.usersService.getSecurityActivity(
      req.user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
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
      throw new NotFoundException(ErrorMessages.user.NOT_FOUND);
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
    return this.usersService.adminUpdateUser(
      id,
      dto,
      req.user,
      extractRequestMeta(req),
    );
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
    await this.usersService.softDelete(
      id,
      req.user.id,
      extractRequestMeta(req),
    );
    return { message: 'User deleted successfully' };
  }
}
