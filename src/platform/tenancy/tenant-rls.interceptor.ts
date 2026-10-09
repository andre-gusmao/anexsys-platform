import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { isPublicHttpPath } from 'src/platform/auth/public.decorator';
import { PlatformRequest, resolveTenantId } from 'src/platform/http/request-context';
import { TenantContext } from './tenant-context';

@Injectable()
export class TenantRlsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const principalTenantId = request.requestContext?.authenticatedPrincipal?.tenantId ?? null;
    const tenantId = resolveTenantId(request) ?? principalTenantId;
    const publicPath = isPublicHttpPath(request.originalUrl ?? request.url);
    const bypass = publicPath || !tenantId;

    return new Observable((subscriber) => {
      const subscription = TenantContext.run({ tenantId: publicPath ? null : tenantId, bypass }, () =>
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        }),
      );
      return () => subscription.unsubscribe();
    });
  }
}
