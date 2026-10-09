import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CompanyService } from 'src/modules/company/application/company/company.service';
import { CompanyStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

function createService(repository: object = {}, deps: { assertCompanyCanInactivate?: () => Promise<void>; assertCompanyCanDelete?: () => Promise<void> } = {}) {
  return new CompanyService(
    {
      async findByTenantAndCnpj() {
        return null;
      },
      async findByTenant() {
        return [];
      },
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return { ...payload, id: payload.id ?? 'company-1' };
      },
      ...repository,
    } as never,
    { async getById() { return { id: 'tenant-1', legalName: 'Atelie', displayName: 'Atelie' }; } } as never,
    { async record() {} } as never,
    {
      async assertCompanyCanInactivate() {
        await deps.assertCompanyCanInactivate?.();
      },
      async assertCompanyCanDelete() {
        await deps.assertCompanyCanDelete?.();
      },
    } as never,
  );
}

describe('CompanyService', () => {
  it('creates a default company without talking to BranchService', async () => {
    const company = await createService().create({
      tenantId: 'tenant-1',
      legalName: 'Atelie Iza Gusmao',
      tradeName: 'Atelie',
      actorUserId: 'actor-1',
    });

    assert.equal(company.isDefault, true);
    assert.equal(company.status, CompanyStatus.ACTIVE);
    assert.equal(company.legalName, 'Atelie Iza Gusmao');
  });

  it('rejects a CNPJ that does not have 14 digits', async () => {
    await assert.rejects(
      () =>
        createService({
          async findByTenant() {
            return [];
          },
        }).create({
          tenantId: 'tenant-1',
          legalName: 'Atelie',
          cnpj: '123',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });

  it('rejects a CNPJ with an invalid checksum', async () => {
    await assert.rejects(
      () =>
        createService({
          async findByTenant() {
            return [];
          },
        }).create({
          tenantId: 'tenant-1',
          legalName: 'Atelie',
          cnpj: '11.111.111/1111-11',
          actorUserId: 'actor-1',
        }),
      (error: unknown) => error instanceof DomainValidationError && /CNPJ informado é inválido/.test(error.message),
    );
  });

  it('blocks inactivating the last active empresa', async () => {
    await assert.rejects(
      () =>
        createService({
          async findById() {
            return { id: 'company-1', tenantId: 'tenant-1', legalName: 'Atelier A', status: CompanyStatus.ACTIVE };
          },
          async findByTenant() {
            return [{ id: 'company-1', status: CompanyStatus.ACTIVE }];
          },
        }).update('company-1', 'tenant-1', { status: CompanyStatus.INACTIVE, actorUserId: 'actor-1' }),
      (error: unknown) =>
        error instanceof DomainValidationError && /pelo menos uma Empresa ativa/.test(error.message),
    );
  });

  it('inactivates an empresa when another active one remains', async () => {
    const saved: Array<Record<string, unknown>> = [];
    const company = await createService({
      async findById() {
        return { id: 'company-2', tenantId: 'tenant-1', legalName: 'Atelier B', status: CompanyStatus.ACTIVE };
      },
      async findByTenant() {
        return [
          { id: 'company-1', status: CompanyStatus.ACTIVE },
          { id: 'company-2', status: CompanyStatus.ACTIVE },
        ];
      },
      async save(payload: Record<string, unknown>) {
        saved.push(payload);
        return payload;
      },
    }).update('company-2', 'tenant-1', { status: CompanyStatus.INACTIVE, actorUserId: 'actor-1' });

    assert.equal(company.status, CompanyStatus.INACTIVE);
    assert.equal(saved[0]?.status, CompanyStatus.INACTIVE);
  });

  it('deletes an inactive empresa without the last-active guard', async () => {
    const saved: Array<Record<string, unknown>> = [];
    await createService({
      async findById() {
        return { id: 'company-2', tenantId: 'tenant-1', legalName: 'Atelier B', status: CompanyStatus.INACTIVE };
      },
      async findByTenant() {
        return [
          { id: 'company-1', status: CompanyStatus.ACTIVE },
          { id: 'company-2', status: CompanyStatus.INACTIVE },
        ];
      },
      async save(payload: Record<string, unknown>) {
        saved.push(payload);
        return payload;
      },
    }).remove('company-2', 'tenant-1', 'actor-1');

    assert.equal(saved[0]?.isDeleted, true);
  });
});
