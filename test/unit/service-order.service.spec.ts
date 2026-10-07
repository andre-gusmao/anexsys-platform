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
      {} as never,
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

  it('stores the promised delivery time as HH:MM when the suggestion includes seconds', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; } } as never,
      { async findByServiceOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-14', promisedDeliveryTime: '18:00:00' }; } } as never,
      { async record() {}, async listByEntity() { return []; } } as never,
      {} as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      branchId: 'branch-1',
      customerId: 'customer-1',
      actorUserId: 'user-1',
      promisedDeliveryTime: '18:00:00',
      items: [{ itemType: 'uniform', description: 'Calça', quantity: 1, unitPrice: 40 }],
    });

    assert.equal(created.serviceOrder.promisedDeliveryTime, '18:00');
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
      {} as never,
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

  it('prints the service order with values and keeps internal notes out', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { async findById() { return { id: 'so-1', tenantId: 'tenant-1', customerId: 'customer-1', commercialResponsibleActorId: 'user-1', technicalMeasurementResponsibleActorId: 'user-1', orderNo: 'OS-1', status: 'open', openedAt: '2026-10-07T10:00:00.000Z', promisedDeliveryDate: '2026-10-14', promisedDeliveryTime: '18:00', deliveryType: DeliveryType.STANDARD, totalValue: '90.00', customerNotes: 'Garantia 90 dias', commercialNotes: 'nao imprimir' }; } } as never,
      { async findByServiceOrder() { return [{ id: 'item-1', itemNo: 1, itemType: 'Calça', description: 'Bainha', complement: 'Barra 4 cm', quantity: '1', unitPrice: '90.00', discountValue: '0.00', status: 'open', isDeleted: false }]; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', legalName: 'Maria Silva', phone: '11988887777', email: 'maria@test.com' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-14', promisedDeliveryTime: '18:00' }; } } as never,
      { async listByEntity() { return []; } } as never,
      {} as never,
    );

    const printView = await service.getPrintView('tenant-1', 'so-1');
    assert.equal(printView.orderNo, 'OS-1');
    assert.equal(printView.totalValue, '90.00');
    assert.equal(printView.items[0]?.subtotal, '90.00');
    assert.equal(printView.customerNotes, 'Garantia 90 dias');
    assert.equal('commercialNotes' in printView, false);
  });

  it('rejects more than five pieces on a service order', async () => {
    const service = new ServiceOrderService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'customer-1', tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
      { async getById() { return { id: 'user-1', tenantId: 'tenant-1', status: UserStatus.ACTIVE }; } } as never,
      { async suggestDelivery() { return { promisedDeliveryDate: '2026-10-01', promisedDeliveryTime: '18:00' }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          customerId: 'customer-1',
          actorUserId: 'user-1',
          items: Array.from({ length: 6 }, (_, index) => ({
            itemType: `Peca ${index + 1}`,
            description: 'Bainha',
            quantity: 1,
          })),
        }),
      DomainValidationError,
    );
  });
});
