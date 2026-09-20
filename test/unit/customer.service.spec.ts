import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CustomerService } from 'src/modules/crm/application/customer/customer.service';
import { CustomerStatus, CustomerType } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

function buildTransactionDataSource() {
  return {
    async transaction(callback: (manager: any) => Promise<unknown>) {
      const manager = {
        create(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
        async save(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
        async findOne() {
          return null;
        },
      };

      return callback(manager);
    },
  };
}

describe('CustomerService', () => {
  it('creates a customer, primary contact, interaction, and audit entry', async () => {
    const auditCalls: Array<Record<string, unknown>> = [];
    const service = new CustomerService(
      buildTransactionDataSource() as never,
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      {} as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async record(payload: Record<string, unknown>) { auditCalls.push(payload); } } as never,
    );

    const customer = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerType: CustomerType.PERSON,
      fullName: ' Maria Silva ',
      mobilePhone: '(11) 99888-7766',
      cpf: '123.456.789-01',
      postalCode: '12345-678',
      email: ' Maria@Example.com ',
      birthDate: '1990-05-20',
      observations: 'VIP',
      actorUserId: 'actor-1',
    });

    assert.equal(customer.legalName, 'Maria Silva');
    assert.equal(customer.phone, '11998887766');
    assert.equal(customer.cpfCnpj, '12345678901');
    assert.equal(customer.email, 'maria@example.com');
    assert.equal(customer.postalCode, '12345678');
    assert.equal(customer.status, CustomerStatus.ACTIVE);
    assert.equal(auditCalls[0]?.action, 'customer.created');
  });

  it('rejects future birth dates', async () => {
    const service = new CustomerService(
      buildTransactionDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          fullName: 'Maria Silva',
          mobilePhone: '(11) 99888-7766',
          birthDate: '2999-01-01',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });

  it('deactivates a customer through update status changes', async () => {
    const auditCalls: Array<Record<string, unknown>> = [];
    const customer = {
      id: 'customer-1',
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerType: CustomerType.PERSON,
      legalName: 'Maria Silva',
      tradeName: null,
      cpfCnpj: null,
      email: 'maria@example.com',
      phone: '11998887766',
      birthDate: null,
      observations: null,
      postalCode: null,
      status: CustomerStatus.ACTIVE,
    };
    const service = new CustomerService(
      {
        async transaction(callback: (manager: any) => Promise<unknown>) {
          const manager = {
            async save(_entity: unknown, payload: Record<string, unknown>) {
              return payload;
            },
            async findOne() {
              return {
                contactName: 'Maria Silva',
                email: 'maria@example.com',
                phone: '11998887766',
                updatedBy: 'actor-1',
              };
            },
            create(_entity: unknown, payload: Record<string, unknown>) {
              return payload;
            },
          };

          return callback(manager);
        },
      } as never,
      { async findById() { return customer; } } as never,
      {} as never,
      {} as never,
      {} as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async record(payload: Record<string, unknown>) { auditCalls.push(payload); } } as never,
    );

    const updated = await service.update('customer-1', 'tenant-1', {
      status: CustomerStatus.INACTIVE,
      actorUserId: 'actor-1',
    });

    assert.equal(updated.status, CustomerStatus.INACTIVE);
    assert.equal(auditCalls[0]?.action, 'customer.deactivated');
  });
});
