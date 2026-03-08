import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum';
import { PERMISSIONS_KEY } from '../../common/decorators/permissions.decorator';
import { PermissionsService } from '../../permissions/permissions.service';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: string; role: Role } }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);
    }

    // SUPERADMIN bypasses all permission checks (RolesGuard already logs bypass)
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    const hasPermissions =
      await this.permissionsService.roleHasAllPermissions(
        user.role,
        requiredPermissions,
      );

    if (!hasPermissions) {
      throw new ForbiddenException(ErrorMessages.permission.INSUFFICIENT_PERMISSIONS);
    }

    return true;
  }
}
