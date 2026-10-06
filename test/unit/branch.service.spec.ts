import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

function extraDeps() {
  return {
    companyService: {
      async getOrCreateDefault() {
        return { id: 'company-1' };
      },
      async getById(id?: string) {
        return { id: id ?? 'company-1', tenantId: 'tenant-a' };
      },
    },
    hoursService: {
      async seedDefaults() {
        return [];
      },
    },
  };
}

describe('BranchService', () => {
  it('normalizes branch codes on create', async () => {
    const createdPayloads: Array<Record<string, unknown>> = [];
    const extras = extraDeps();
    const branchRepository = {
      async findByCompanyAndCode() {
        return null;
      },
      async findByCompany() {
        return [];
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
      extras.companyService as never,
      extras.hoursService as never,
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
    assert.equal(createdPayloads[0]?.companyId, 'company-1');
    assert.equal(createdPayloads[0]?.isDefault, true);
    assert.equal(createdPayloads[0]?.parentBranchId, null);
  });

  it('rejects duplicate branch code on update', async () => {
    const extras = extraDeps();
    const branchRepository = {
      async findById(id: string) {
        if (id === 'branch-1') {
          return { id: 'branch-1', tenantId: 'tenant-a', companyId: 'company-1', code: 'BR-01', legalName: 'A', displayName: 'A', parentBranchId: null };
        }
        return null;
      },
      async findByCompanyAndCode() {
        return { id: 'branch-2', tenantId: 'tenant-a', companyId: 'company-1', code: 'BR-02' };
      },
    };
    const service = new BranchService(
      branchRepository as never,
      {} as never,
      {} as never,
      {} as never,
      extras.companyService as never,
      extras.hoursService as never,
    );

    await assert.rejects(
      () => service.update('branch-1', { code: 'br-02', actorUserId: 'actor-1' }),
      DomainValidationError,
    );
  });

  it('rejects Filial pai because the parent is the Empresa', async () => {
    const extras = extraDeps();
    const tenantService = { async getById() { return { id: 'tenant-a' }; } };
    const service = new BranchService(
      {
        async findByCompanyAndCode() {
          return null;
        },
        async findById() {
          return { id: 'branch-1', tenantId: 'tenant-a', companyId: 'company-1', code: 'BR-01', parentBranchId: null };
        },
      } as never,
      tenantService as never,
      {} as never,
      {} as never,
      extras.companyService as never,
      extras.hoursService as never,
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
      (error: unknown) => error instanceof DomainValidationError && /Empresa/.test(error.message),
    );

    await assert.rejects(
      () => service.update('branch-1', { parentBranchId: 'parent-1', actorUserId: 'actor-1' }),
      (error: unknown) => error instanceof DomainValidationError && /Empresa/.test(error.message),
    );
  });

  it('blocks branch deactivation when dependency validation fails', async () => {
    const extras = extraDeps();
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
      extras.companyService as never,
      extras.hoursService as never,
    );

    await assert.rejects(() => service.deactivate('branch-1', 'actor-1'), DomainValidationError);
  });

  it('lists filiais of one empresa after checking it belongs to the conta', async () => {
    const extras = extraDeps();
    const service = new BranchService(
      {
        async findByCompany(tenantId: string, companyId: string) {
          return [{ id: 'branch-a', tenantId, companyId }];
        },
      } as never,
      {} as never,
      { async record() {} } as never,
      { async assertBranchCanDeactivate() {} } as never,
      extras.companyService as never,
      extras.hoursService as never,
    );

    const listed = await service.listByCompany('tenant-a', 'company-1');
    assert.equal(listed[0]?.companyId, 'company-1');
  });

  it('creates the default Matriz filial when the empresa has none', async () => {
    const extras = extraDeps();
    const createdPayloads: Array<Record<string, unknown>> = [];
    const service = new BranchService(
      {
        async findByCompany() {
          return [];
        },
        async findByCompanyAndCode() {
          return null;
        },
        create(payload: Record<string, unknown>) {
          createdPayloads.push(payload);
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      { async getById() { return { id: 'tenant-a' }; } } as never,
      { async record() {} } as never,
      { async assertBranchCanDeactivate() {} } as never,
      extras.companyService as never,
      extras.hoursService as never,
    );

    const branch = await service.ensureDefaultBranchForCompany({
      tenantId: 'tenant-a',
      companyId: 'company-1',
      legalName: 'Atelie Iza Gusmao',
      actorUserId: 'actor-1',
    });

    assert.equal(branch.code, 'MATRIZ');
    assert.equal(createdPayloads[0]?.isDefault, true);
    assert.equal(createdPayloads[0]?.companyId, 'company-1');
  });

  it('allows the same MATRIZ code in another empresa of the same conta', async () => {
    const extras = extraDeps();
    extras.companyService.getById = async (id?: string) => ({ id: id ?? 'company-2', tenantId: 'tenant-a' });
    const createdPayloads: Array<Record<string, unknown>> = [];
    const service = new BranchService(
      {
        async findByCompany() {
          return [];
        },
        async findByCompanyAndCode(_tenantId: string, companyId: string) {
          if (companyId === 'company-1') {
            return { id: 'branch-matriz-a', tenantId: 'tenant-a', companyId: 'company-1', code: 'MATRIZ' };
          }
          return null;
        },
        create(payload: Record<string, unknown>) {
          createdPayloads.push(payload);
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      { async getById() { return { id: 'tenant-a' }; } } as never,
      { async record() {} } as never,
      { async assertBranchCanDeactivate() {} } as never,
      extras.companyService as never,
      extras.hoursService as never,
    );

    const branch = await service.ensureDefaultBranchForCompany({
      tenantId: 'tenant-a',
      companyId: 'company-2',
      legalName: 'Atelier B',
      actorUserId: 'actor-1',
    });

    assert.equal(branch.code, 'MATRIZ');
    assert.equal(createdPayloads[0]?.companyId, 'company-2');
  });

  it('retries the default Matriz with a unique code when the tenant still blocks MATRIZ', async () => {
    const extras = extraDeps();
    extras.companyService.getById = async (id?: string) => ({ id: id ?? 'company-2', tenantId: 'tenant-a' });
    const createdPayloads: Array<Record<string, unknown>> = [];
    const service = new BranchService(
      {
        async findByCompany() {
          return [];
        },
        async findByCompanyAndCode() {
          return null;
        },
        create(payload: Record<string, unknown>) {
          createdPayloads.push(payload);
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          if (payload.code === 'MATRIZ') {
            throw Object.assign(new Error('duplicate key'), {
              code: '23505',
              driverError: { code: '23505', constraint: 'uq_branches_tenant_code' },
            });
          }
          return payload;
        },
      } as never,
      { async getById() { return { id: 'tenant-a' }; } } as never,
      { async record() {} } as never,
      { async assertBranchCanDeactivate() {} } as never,
      extras.companyService as never,
      extras.hoursService as never,
    );

    const branch = await service.ensureDefaultBranchForCompany({
      tenantId: 'tenant-a',
      companyId: 'aa11bb22-cc33-4455-6677-8899aabbccdd',
      legalName: 'Atelier C',
      actorUserId: 'actor-1',
    });

    assert.equal(branch.code, 'MATRIZ-AA11BB');
    assert.equal(createdPayloads[1]?.companyId, 'aa11bb22-cc33-4455-6677-8899aabbccdd');
  });
});
