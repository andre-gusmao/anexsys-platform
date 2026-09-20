import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlatformRequest, resolveBranchId, resolveTenantId } from './request-context';

export const CurrentRequest = createParamDecorator((_: unknown, context: ExecutionContext): PlatformRequest => {
  return context.switchToHttp().getRequest<PlatformRequest>();
});

export const CurrentUserId = createParamDecorator((_: unknown, context: ExecutionContext): string | null => {
  const request = context.switchToHttp().getRequest<PlatformRequest>();
  return request.requestContext.authenticatedPrincipal?.userId ?? null;
});

export const CurrentTenantId = createParamDecorator((_: unknown, context: ExecutionContext): string | null => {
  const request = context.switchToHttp().getRequest<PlatformRequest>();
  return resolveTenantId(request);
});

export const CurrentBranchId = createParamDecorator((_: unknown, context: ExecutionContext): string | null => {
  const request = context.switchToHttp().getRequest<PlatformRequest>();
  return resolveBranchId(request);
});
