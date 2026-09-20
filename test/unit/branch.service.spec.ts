import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

describe('BranchService', () => {
  it('normalizes branch codes on create', async () => {
    const createdPayloads: Array<Record<string, unknown>> = [];
    const branchRepository = {
      create(payload: Record<string, unknown>) {
        createdPayloads.push(payload);
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
      },
      async findById() {
        return null;
      },
    };
    const tenantService = { async getById() { return { id: 'tenant-a' }; } };
    const auditService = { async record() {} };
    const service = new BranchService(
      branchRepository as never,
      tenantService as never,
      auditService as never,
    );

    const branch = await service.create({
      tenantId: 'tenant-a',
      code: ' br-01 ',
      legalName: 'Branch 01',
      displayName: 'Branch 01',
      actorUserId: 'actor-1',
    });

    assert.equal(branch.code, 'BR-01');
    assert.equal(createdPayloads[0]?.code, 'BR-01');
  });

  it('rejects a parent branch from a different tenant', async () => {
    const branchRepository = {
      async findById() {
        return { id: 'parent-1', tenantId: 'tenant-b' };
      },
    };
    const tenantService = { async getById() { return { id: 'tenant-a' }; } };
    const auditService = { async record() {} };
    const service = new BranchService(
      branchRepository as never,
      tenantService as never,
      auditService as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-a',
          code: 'BR01',
          legalName: 'Branch 01',
          displayName: 'Branch 01',
          parentBranchId: 'parent-1',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });
});
