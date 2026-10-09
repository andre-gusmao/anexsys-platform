import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { AuditEventRepository } from 'src/modules/audit/infrastructure/persistence/repositories/audit-event.repository';
import { BranchesController } from 'src/modules/branch/http/branches.controller';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { CompaniesController } from 'src/modules/company/http/companies.controller';
import { CompanyService } from 'src/modules/company/application/company/company.service';
import { CustomersController } from 'src/modules/crm/http/customers.controller';
import { CustomerService } from 'src/modules/crm/application/customer/customer.service';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';

function injectedTokens(target: object) {
  return (Reflect.getMetadata('self:paramtypes', target) ?? []) as Array<{
    index: number;
    param: unknown;
  }>;
}

describe('login path decorator metadata', () => {
  it('declares explicit inject tokens used after password login', async () => {
    await import('src/modules/branch/application/branch/branch.service');

    const audit = injectedTokens(AuditService);
    const dependencies = injectedTokens(DependencyValidationService);
    const companies = injectedTokens(CompaniesController);
    const branches = injectedTokens(BranchesController);
    const customers = injectedTokens(CustomersController);

    assert.equal(audit.find((item) => item.index === 0)?.param, AuditEventRepository);
    assert.equal(dependencies.find((item) => item.index === 0)?.param, DataSource);
    assert.equal(companies.find((item) => item.index === 0)?.param, CompanyService);
    assert.equal(branches.find((item) => item.index === 0)?.param, BranchService);
    assert.equal(customers.find((item) => item.index === 0)?.param, CustomerService);
  });
});
