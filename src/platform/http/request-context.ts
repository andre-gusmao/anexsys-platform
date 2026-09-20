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

function normalize(value: string | string[] | null | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function getRequestContext(request: PlatformRequest): RequestContextState {
  return request.requestContext;
}

export function resolveTenantId(request: PlatformRequest): string | null {
  return (
    normalize(request.params?.tenantId) ??
    normalize(request.requestContext.requestedTenantId) ??
    normalize(request.requestContext.authenticatedPrincipal?.tenantId) ??
    null
  );
}

export function resolveBranchId(request: PlatformRequest): string | null {
  return (
    normalize(request.params?.branchId) ??
    normalize(request.requestContext.requestedBranchId) ??
    normalize(request.requestContext.authenticatedPrincipal?.effectiveBranchIds?.[0]) ??
    null
  );
}
