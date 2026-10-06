import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CompanyService } from 'src/modules/company/application/company/company.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

function createService(repository: object = {}) {
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
        return { ...payload, id: 'company-1' };
      },
      ...repository,
    } as never,
    { async getById() { return { id: 'tenant-1', legalName: 'Atelie', displayName: 'Atelie' }; } } as never,
    { async record() {} } as never,
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
});
