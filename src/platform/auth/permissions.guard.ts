import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';
import { PlatformRequest } from 'src/platform/http/request-context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const effectivePermissions = request.requestContext.authenticatedPrincipal?.effectivePermissions ?? [];

    const missingPermission = requiredPermissions.find((permission) => !effectivePermissions.includes(permission));
    if (missingPermission) {
      throw new ForbiddenException(`Missing required permission '${missingPermission}'.`);
    }

    return true;
  }
}
