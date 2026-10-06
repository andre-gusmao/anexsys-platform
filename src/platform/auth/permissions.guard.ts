import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ensureRequestContext, PlatformRequest } from 'src/platform/http/request-context';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const requestContext = ensureRequestContext(request);
    const effectivePermissions = requestContext.authenticatedPrincipal?.effectivePermissions;
    if (!effectivePermissions) {
      throw new UnauthorizedException('Authenticated permission context is required.');
    }

    const missingPermission = requiredPermissions.find((permission) => !effectivePermissions.includes(permission));
    if (missingPermission) {
      throw new ForbiddenException(`Missing required permission '${missingPermission}'.`);
    }

    return true;
  }
}
