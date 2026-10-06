import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { CompanyService } from 'src/modules/company/application/company/company.service';
import { CompanyRepository } from 'src/modules/company/infrastructure/persistence/repositories/company.repository';

describe('CompanyService decorator metadata', () => {
  it('declares CompanyRepository as an explicit inject token at index 0', async () => {
    await import('src/modules/branch/application/branch/branch.service');
    const injected = (Reflect.getMetadata('self:paramtypes', CompanyService) ?? []) as Array<{
      index: number;
      param: { name?: string } | undefined;
    }>;
    const first = injected.find((item) => item.index === 0);
    assert.equal(first?.param, CompanyRepository);
  });
});
