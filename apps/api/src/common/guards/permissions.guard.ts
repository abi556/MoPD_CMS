import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtUser } from '../../modules/auth/interfaces/jwt-user.interface';
import { hasAllPermissions } from '../../modules/auth/rbac/permission-check';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;
    if (!user || !user.permissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (!hasAllPermissions(user, requiredPermissions)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
