import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PlatformRequest, resolveTenantId } from 'src/platform/http/request-context';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const principalTenantId = request.requestContext?.authenticatedPrincipal?.tenantId ?? null;
    const tenantId = resolveTenantId(request) ?? principalTenantId;
    const bypass = !tenantId;

    return TenantContext.run({ tenantId, bypass }, () => next.handle());
  }
}
