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

export function normalizeRequestValue(value: string | string[] | null | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    return raw ?? null;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const lowered = trimmed.toLowerCase();
  if (lowered === 'undefined' || lowered === 'null') {
    return null;
  }

  return trimmed;
}

export function buildRequestContext(request: Request): RequestContextState {
  const authHeader = typeof request.header === 'function' ? request.header('authorization') : request.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

  const requestedTenantId = normalizeRequestValue(
    typeof request.header === 'function' ? request.header('x-tenant-id') : request.headers['x-tenant-id'],
  );
  const requestedBranchId = normalizeRequestValue(
    typeof request.header === 'function' ? request.header('x-branch-id') : request.headers['x-branch-id'],
  );

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
  return (
    normalizeRequestValue(request.params?.tenantId) ??
    normalizeRequestValue(requestContext.requestedTenantId) ??
    normalizeRequestValue(requestContext.authenticatedPrincipal?.tenantId) ??
    null
  );
}

export function resolveBranchId(request: PlatformRequest): string | null {
  const requestContext = ensureRequestContext(request);
  return normalizeRequestValue(request.params?.branchId) ?? normalizeRequestValue(requestContext.requestedBranchId) ?? null;
}
