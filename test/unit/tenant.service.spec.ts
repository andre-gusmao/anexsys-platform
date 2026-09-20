import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { TenantStatus } from 'src/shared/domain/enums';

describe('TenantService', () => {
  it('creates an active tenant with normalized code and writes audit', async () => {
    const auditCalls: Array<Record<string, unknown>> = [];
    const tenantRepository = {
      async findByCode() {
        return null;
      },
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
      },
    };
    const auditService = {
      async record(payload: Record<string, unknown>) {
        auditCalls.push(payload);
      },
    };
    const service = new TenantService(tenantRepository as never, auditService as never);

    const tenant = await service.create({
      code: ' atelier ',
      legalName: 'Atelier Ltda',
      displayName: 'Atelier',
      actorUserId: '312bf1b5-801b-45dc-8528-b24af8a9edb9',
    });

    assert.equal(tenant.code, 'ATELIER');
    assert.equal(tenant.status, TenantStatus.ACTIVE);
    assert.equal(auditCalls[0]?.action, 'tenant.created');
  });
});
