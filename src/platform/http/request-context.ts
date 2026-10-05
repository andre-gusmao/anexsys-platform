import type { Request } from 'express';

export interface AuthenticatedPrincipal {
  userId: string;
  tenantId: string;
  sessionId: string;
  branchIds: string[];
  tokenPermissions: string[];
  effectivePermissions: string[];
  effectiveBranchIds: string[];
  communities: string[];
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

export function buildRequestContext(request: Request): RequestContextState {
  const authHeader = typeof request.header === 'function' ? request.header('authorization') : request.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  const requestedTenantId = normalize(
    typeof request.header === 'function' ? request.header('x-tenant-id') : request.headers['x-tenant-id'],
  )?.trim() ?? null;
  const requestedBranchId = normalize(
    typeof request.header === 'function' ? request.header('x-branch-id') : request.headers['x-branch-id'],
  )?.trim() ?? null;

  return {
    authToken: bearerToken && bearerToken.length > 0 ? bearerToken : null,
    requestedTenantId,
    requestedBranchId,
  };
}

export function ensureRequestContext(request: PlatformRequest): RequestContextState {
  request.requestContext ??= buildRequestContext(request);
  return request.requestContext;
}

export function getRequestContext(request: PlatformRequest): RequestContextState {
  return ensureRequestContext(request);
}

export function resolveTenantId(request: PlatformRequest): string | null {
  const requestContext = ensureRequestContext(request);
  return normalize(request.params?.tenantId) ?? normalize(requestContext.requestedTenantId) ?? normalize(requestContext.authenticatedPrincipal?.tenantId) ?? null;
}

export function resolveBranchId(request: PlatformRequest): string | null {
  const requestContext = ensureRequestContext(request);
  return normalize(request.params?.branchId) ?? normalize(requestContext.requestedBranchId) ?? null;
}
