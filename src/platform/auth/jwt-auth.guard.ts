import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from 'src/modules/authorization/application/authorization/authorization.service';
import { TokenFactoryService } from './token-factory.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PlatformRequest, resolveBranchId, resolveTenantId } from 'src/platform/http/request-context';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenFactoryService: TokenFactoryService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const rawToken = request.requestContext?.authToken;
    if (!rawToken) {
      throw new UnauthorizedException('Authorization bearer token is required.');
    }

    let payload;
    try {
      payload = await this.tokenFactoryService.verifyAccessToken(rawToken);
    } catch {
      throw new UnauthorizedException('JWT access token is invalid.');
    }

    const effectiveAccess = await this.authorizationService.getEffectiveAccessForUser(payload.tenantId, payload.sub);
    const requestedTenantId = resolveTenantId(request);
    if (requestedTenantId && requestedTenantId !== payload.tenantId) {
      throw new ForbiddenException('Requested tenant is outside the authenticated tenant scope.');
    }

    const requestedBranchId = resolveBranchId(request);
    if (requestedBranchId && !effectiveAccess.branchIds.includes(requestedBranchId)) {
      throw new ForbiddenException('Requested branch is outside the authenticated branch scope.');
    }

    request.requestContext.authenticatedPrincipal = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      branchIds: payload.branchIds,
      tokenPermissions: payload.permissions,
      effectivePermissions: effectiveAccess.permissions,
      effectiveBranchIds: effectiveAccess.branchIds,
    };

    if (!request.requestContext.requestedTenantId) {
      request.requestContext.requestedTenantId = payload.tenantId;
    }
    if (!request.requestContext.requestedBranchId && effectiveAccess.branchIds.length === 1) {
      request.requestContext.requestedBranchId = effectiveAccess.branchIds[0];
    }

    return true;
  }
}
