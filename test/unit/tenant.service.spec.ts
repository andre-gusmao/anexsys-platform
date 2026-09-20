import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { TenantStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

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

  it('rejects duplicate tenant code on update', async () => {
    const tenantRepository = {
      async findById(id: string) {
        assert.equal(id, 'tenant-1');
        return { id: 'tenant-1', code: 'TENANT1', legalName: 'Tenant 1', displayName: 'Tenant 1' };
      },
      async findByCode(code: string) {
        assert.equal(code, 'TENANT2');
        return { id: 'tenant-2', code: 'TENANT2' };
      },
    };
    const service = new TenantService(tenantRepository as never, {} as never);

    await assert.rejects(
      () => service.update('tenant-1', { code: 'tenant2', actorUserId: 'actor-1' }),
      DomainValidationError,
    );
  });
});
