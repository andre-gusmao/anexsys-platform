import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

describe('BranchService', () => {
  it('normalizes branch codes on create', async () => {
    const createdPayloads: Array<Record<string, unknown>> = [];
    const branchRepository = {
      async findByTenantAndCode() {
        return null;
      },
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
      { async assertBranchCanDeactivate() {} } as never,
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

  it('rejects duplicate branch code on update', async () => {
    const branchRepository = {
      async findById(id: string) {
        if (id === 'branch-1') {
          return { id: 'branch-1', tenantId: 'tenant-a', code: 'BR-01', legalName: 'A', displayName: 'A', parentBranchId: null };
        }
        return null;
      },
      async findByTenantAndCode() {
        return { id: 'branch-2', tenantId: 'tenant-a', code: 'BR-02' };
      },
    };
    const service = new BranchService(branchRepository as never, {} as never, {} as never, {} as never);

    await assert.rejects(
      () => service.update('branch-1', { code: 'br-02', actorUserId: 'actor-1' }),
      DomainValidationError,
    );
  });

  it('rejects setting a branch as its own parent during update', async () => {
    const branchRepository = {
      async findById(id: string) {
        if (id === 'branch-1') {
          return { id: 'branch-1', tenantId: 'tenant-a', code: 'BR-01', legalName: 'A', displayName: 'A', parentBranchId: null };
        }
        return null;
      },
      async findByTenantAndCode() {
        return null;
      },
    };
    const service = new BranchService(branchRepository as never, {} as never, {} as never, {} as never);

    await assert.rejects(
      () => service.update('branch-1', { parentBranchId: 'branch-1', actorUserId: 'actor-1' }),
      DomainValidationError,
    );
  });

  it('rejects a parent branch from a different tenant', async () => {
    const branchRepository = {
      async findByTenantAndCode() {
        return null;
      },
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
      { async assertBranchCanDeactivate() {} } as never,
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

  it('blocks branch deactivation when dependency validation fails', async () => {
    const service = new BranchService(
      {
        async findById() {
          return {
            id: 'branch-1',
            tenantId: 'tenant-a',
            code: 'BR-01',
            legalName: 'A',
            displayName: 'A',
            parentBranchId: null,
            businessCalendarName: null,
            status: 'active',
          };
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      {} as never,
      { async record() {} } as never,
      {
        async assertBranchCanDeactivate() {
          throw new DomainValidationError('Filial vinculada a service orders.');
        },
      } as never,
    );

    await assert.rejects(() => service.deactivate('branch-1', 'actor-1'), DomainValidationError);
  });
});
