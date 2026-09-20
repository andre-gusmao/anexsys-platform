import type { Request } from 'express';

export interface AuthenticatedPrincipal {
  userId: string;
  tenantId: string;
  branchIds: string[];
  tokenPermissions: string[];
  effectivePermissions: string[];
  effectiveBranchIds: string[];
}

export interface RequestContextState {
  authToken: string | null;
  requestedTenantId: string | null;
  requestedBranchId: string | null;
  authenticatedPrincipal?: AuthenticatedPrincipal;
}

export interface PlatformRequest extends Request {
  requestContext: RequestContextState;
}

export function getRequestContext(request: PlatformRequest): RequestContextState {
  return request.requestContext;
}

export function resolveTenantId(request: PlatformRequest): string | null {
  return (
    request.params?.tenantId ??
    request.requestContext.requestedTenantId ??
    request.requestContext.authenticatedPrincipal?.tenantId ??
    null
  );
}

export function resolveBranchId(request: PlatformRequest): string | null {
  return (
    request.params?.branchId ??
    request.requestContext.requestedBranchId ??
    request.requestContext.authenticatedPrincipal?.effectiveBranchIds?.[0] ??
    null
  );
}
