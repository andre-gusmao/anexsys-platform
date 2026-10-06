import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRequestContext,
  normalizeRequestValue,
  resolveTenantId,
  type PlatformRequest,
} from 'src/platform/http/request-context';

function requestWith(input: {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  principalTenantId?: string;
}): PlatformRequest {
  const headers = input.headers ?? {};
  return {
    headers,
    header(name: string) {
      return headers[name.toLowerCase()] ?? headers[name];
    },
    params: input.params ?? {},
    requestContext: {
      ...buildRequestContext({
        headers,
        header(name: string) {
          return headers[name.toLowerCase()] ?? headers[name];
        },
      } as never),
      ...(input.principalTenantId
        ? {
            authenticatedPrincipal: {
              userId: 'user-1',
              tenantId: input.principalTenantId,
              sessionId: 'session-1',
              branchIds: [],
              tokenPermissions: [],
              effectivePermissions: [],
              effectiveBranchIds: [],
              communities: [],
            },
          }
        : {}),
    },
  } as PlatformRequest;
}

describe('request-context tenant resolution', () => {
  it('treats blank, undefined and null tenant values as missing', () => {
    assert.equal(normalizeRequestValue(''), null);
    assert.equal(normalizeRequestValue('   '), null);
    assert.equal(normalizeRequestValue('undefined'), null);
    assert.equal(normalizeRequestValue('NULL'), null);
    assert.equal(normalizeRequestValue(['']), null);
    assert.equal(normalizeRequestValue(' tenant-1 '), 'tenant-1');
  });

  it('does not let an empty x-tenant-id header hide the JWT tenant', () => {
    const request = requestWith({
      headers: { 'x-tenant-id': '' },
      principalTenantId: 'tenant-from-jwt',
    });

    assert.equal(resolveTenantId(request), 'tenant-from-jwt');
  });

  it('does not let an empty route param hide the requested tenant', () => {
    const request = requestWith({
      headers: { 'x-tenant-id': 'tenant-from-header' },
      params: { tenantId: '' },
    });

    assert.equal(resolveTenantId(request), 'tenant-from-header');
  });
});
