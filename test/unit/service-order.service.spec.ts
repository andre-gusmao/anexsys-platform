import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeliveryType, UserStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';

function buildDataSource() {
  return {
    async transaction(callback: (manager: any) => Promise<unknown>) {
      const manager = {
        create(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
        async save(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
      };
      return callback(manager);
    },
  };
}

describe('ServiceOrderService', () => {
  it('creates a service order with default commercial responsibility and calculated totals', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; }, async suggestDeliveryDate() { return '2026-10-01'; } } as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      deliveryType: DeliveryType.PRIORITY,
      deliverySurchargeMethod: 'fixed' as never,
      deliverySurchargeValue: 15,
      discountValue: 5,
      items: [
        { itemType: 'uniform', description: 'Jacket', quantity: 2, unitPrice: 50, discountValue: 10 },
      ],
    });

    assert.equal(created.serviceOrder.commercialResponsibleActorId, 'user-1');
    assert.equal(created.serviceOrder.promisedDeliveryDate, '2026-10-01');
    assert.equal(created.serviceOrder.promisedDeliveryTime, '18:00');
    assert.equal(created.items[0]?.itemType, 'uniform');
    assert.equal(created.items[0]?.description, 'Jacket');
    assert.equal(created.items[0]?.discountValue, '10.00');
    assert.equal(audits[0]?.action, 'service_order.created');
  });

  it('normalizes service order items before persistence and total calculation', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; }, async suggestDeliveryDate() { return '2026-10-01'; } } as never,
      { async record() {}, async listByEntity() { return []; } } as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      items: [
        { itemType: '  uniform  ', description: '  Jacket  ', quantity: 2, unitPrice: undefined, discountValue: undefined, deliveryType: undefined, operationalPriority: '   ' },
      ],
    });

    assert.equal(created.items[0]?.itemType, 'uniform');
    assert.equal(created.items[0]?.description, 'Jacket');
    assert.equal(created.items[0]?.unitPrice, null);
    assert.equal(created.items[0]?.discountValue, '0.00');
    assert.equal(created.items[0]?.deliveryType, null);
    assert.equal(created.items[0]?.operationalPriority, null);
    assert.equal(created.serviceOrder.totalValue, null);
  });

  it('rejects a branch-scoped customer from another branch', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-2' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; }, async suggestDeliveryDate() { return '2026-10-01'; } } as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          customerId: 'customer-1',
          actorUserId: 'user-1',
          items: [{ itemType: 'uniform', description: 'Jacket', quantity: 1 }],
        }),
      DomainValidationError,
    );
  });
});
