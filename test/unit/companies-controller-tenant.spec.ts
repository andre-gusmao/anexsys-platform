import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { CompaniesController } from 'src/modules/company/http/companies.controller';
import type { PlatformRequest } from 'src/platform/http/request-context';

function requestWithPrincipal(tenantId?: string): PlatformRequest {
  return {
    requestContext: {
      authToken: 'token',
      requestedTenantId: tenantId ?? null,
      requestedBranchId: null,
      ...(tenantId
        ? {
            authenticatedPrincipal: {
              userId: 'user-1',
              tenantId,
              sessionId: 'session-1',
              branchIds: [],
              tokenPermissions: [],
              effectivePermissions: ['companies.read'],
              effectiveBranchIds: [],
              communities: [],
            },
          }
        : {}),
    },
  } as PlatformRequest;
}

describe('CompaniesController tenant fallback', () => {
  it('lists companies using the JWT tenant when the header is blank', async () => {
    const listed: string[] = [];
    const controller = new CompaniesController({
      async listByTenant(tenantId: string) {
        listed.push(tenantId);
        return [];
      },
    } as never);

    await controller.list('', requestWithPrincipal('tenant-from-jwt'));

    assert.deepEqual(listed, ['tenant-from-jwt']);
  });

  it('rejects the list when neither the header nor the JWT has a tenant', async () => {
    const controller = new CompaniesController({
      async listByTenant() {
        return [];
      },
    } as never);

    await assert.rejects(() => controller.list('  ', requestWithPrincipal()), (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.match(String((error as BadRequestException).message), /contexto da Conta/i);
      return true;
    });
  });
});
