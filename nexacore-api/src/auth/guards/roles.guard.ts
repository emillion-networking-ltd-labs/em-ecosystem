import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/enums/role.enum';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/enums/audit-action.enum';
import { ErrorMessages } from '../../common/constants/error-messages';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{
        user?: { id: string; role: Role };
        ip?: string;
        headers?: Record<string, string>;
        route?: { path?: string };
        method?: string;
      }>();
    const user = request.user;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // SUPERADMIN bypasses all role checks — log when roles are actually required
    if (user?.role === Role.SUPERADMIN) {
      if (requiredRoles && requiredRoles.length > 0) {
        this.auditService
          .log({
            action: AuditAction.SUPERADMIN_BYPASS,
            userId: user.id,
            ipAddress: request.ip || null,
            userAgent: request.headers?.['user-agent'] || null,
            metadata: {
              requiredRoles,
              endpoint: `${request.method || ''} ${request.route?.path || ''}`,
            },
          })
          .catch(() => {});
      }
      return true;
    }

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException(ErrorMessages.permission.ACCESS_DENIED);
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(ErrorMessages.permission.INSUFFICIENT_ROLE);
    }

    return true;
  }
}
