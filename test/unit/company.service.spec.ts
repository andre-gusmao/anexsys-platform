import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CompanyService } from 'src/modules/company/application/company/company.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

describe('CompanyService', () => {
  it('creates a default company and asks for a default branch', async () => {
    const createdBranches: Array<Record<string, unknown>> = [];
    const service = new CompanyService(
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
      } as never,
      { async getById() { return { id: 'tenant-1', legalName: 'Atelie', displayName: 'Atelie' }; } } as never,
      {
        async listByCompany() {
          return [];
        },
        async create(payload: Record<string, unknown>) {
          createdBranches.push(payload);
          return payload;
        },
      } as never,
      { async record() {} } as never,
    );

    const company = await service.create({
      tenantId: 'tenant-1',
      legalName: 'Atelie Iza Gusmao',
      tradeName: 'Atelie',
      actorUserId: 'actor-1',
    });

    assert.equal(company.isDefault, true);
    assert.equal(createdBranches[0]?.code, 'MATRIZ');
    assert.equal(createdBranches[0]?.isDefault, true);
  });

  it('rejects a CNPJ that does not have 14 digits', async () => {
    const service = new CompanyService(
      {
        async findByTenant() {
          return [];
        },
      } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      {} as never,
      { async record() {} } as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          legalName: 'Atelie',
          cnpj: '123',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });
});
