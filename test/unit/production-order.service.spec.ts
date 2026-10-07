import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeliveryType, ProductionOrderVersionReason } from 'src/shared/domain/enums';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';

function buildDataSource() {
  return {
    async transaction(callback: (manager: any) => Promise<unknown>) {
      const manager = {
        create(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
        async save(_entity: unknown, payload: unknown) {
          return payload;
        },
        createQueryBuilder() {
          return {
            update() {
              return this;
            },
            set() {
              return this;
            },
            where() {
              return this;
            },
            andWhere() {
              return this;
            },
            execute: async () => undefined,
          };
        },
      };
      return callback(manager);
    },
  };
}

describe('ProductionOrderService', () => {
  it('generates a production order with an active QR code and measurement snapshot', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const service = new ProductionOrderService(
      buildDataSource() as never,
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
        async findByServiceOrder() {
          return null;
        },
        async findById(id: string) {
          return {
            id,
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            serviceOrderId: 'service-order-1',
            productionNo: 'PO-1',
            productionType: 'base',
            deliveryType: DeliveryType.PRIORITY,
            operationalPriority: 'rush',
            customerDeliveryTargetDate: '2026-10-01',
            internalProductionDeadline: null,
            internalQualityDeadline: null,
            plannedQuantity: '3.0000',
            producedQuantity: '0.0000',
            scheduledStartAt: null,
            scheduledEndAt: null,
            instructions: 'vip',
            pieceDescription: 'Blue Shirt, Black Pants',
            measurementsSnapshot: { chest: { value: 40 } },
            observations: null,
            status: 'open',
            isDeleted: false,
          };
        },
      } as never,
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async findByProductionOrder() {
          return [{ serviceOrderItemId: 'item-1' }, { serviceOrderItemId: 'item-2' }];
        },
      } as never,
      {
        async findByProductionOrder() {
          return [];
        },
        async findLatestVersionNumber() {
          return 1;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async deactivateActiveVersions() {},
      } as never,
      {
        async findByProductionOrder() {
          return [];
        },
        async findCurrentPrimaryByProductionOrder() {
          return null;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async releaseCurrentPrimaryAssignments() {},
        async findByResource() {
          return [];
        },
      } as never,
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async findActiveByProductionOrder() {
          return { id: 'qr-1', productionOrderId: 'generated-order', reissueNo: 1, codeValue: 'PO-QR-1', isActive: true };
        },
        async findByCodeValue() {
          return null;
        },
        async findLatestByProductionOrder() {
          return null;
        },
      } as never,
      {
        async findByProductionOrder() {
          return [];
        },
      } as never,
      {
        async findByProductionOrder() {
          return [];
        },
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      {
        async getDetails() {
          return {
            serviceOrder: {
              id: 'service-order-1',
              branchId: 'branch-1',
              status: 'approved',
              deliveryType: DeliveryType.PRIORITY,
              operationalPriority: 'rush',
              promisedDeliveryDate: '2026-10-01',
              commercialNotes: 'vip',
              customerNotes: null,
              orderNo: 'SO-1',
            },
            customer: { id: 'customer-1', legalName: 'Customer One' },
            items: [
              { id: 'item-1', description: 'Blue Shirt', quantity: '2.0000', itemType: 'shirt' },
              { id: 'item-2', description: 'Black Pants', quantity: '1.0000', itemType: 'pants' },
            ],
          };
        },
        assertBranchAccess() {},
        async getById() { return { id: 'service-order-1', tenantId: 'tenant-1' }; },
      } as never,
      {
        async listByCustomer() {
          return {
            latestByLabel: [
              {
                measurementLabel: 'chest',
                measurementData: { value: 40, unit: 'cm' },
                versionNo: 2,
                measuredAt: new Date('2026-09-20T10:00:00.000Z'),
              },
            ],
          };
        },
      } as never,
      { async assertAssignableToBranch() {}, async getById() { return { id: 'resource-1' }; } } as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
    );

    const created = await service.generateFromServiceOrder({
      tenantId: 'tenant-1',
      serviceOrderId: 'service-order-1',
      actorUserId: 'user-1',
      accessibleBranchIds: ['branch-1'],
    });

    assert.equal(created.productionOrder.serviceOrderId, 'service-order-1');
    assert.equal(created.items.length, 2);
    assert.equal(created.productionOrder.customerDeliveryTargetDate, '2026-10-01');
    assert.equal(created.productionOrder.measurementsSnapshot.chest.value, 40);
    assert.equal(created.activeQrCode.codeValue, 'PO-QR-1');
    assert.equal(audits[0]?.action, 'production_order.generated');
    assert.equal(audits[1]?.action, 'production_order.qr.issued');
  });

  it('builds a financially clean print view with delivery badges and version indicators', async () => {
    const service = new ProductionOrderService(
      buildDataSource() as never,
      {
        async findById() {
          return {
            id: 'production-1',
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            serviceOrderId: 'service-order-1',
            productionNo: 'PO-1',
            productionType: 'base',
            deliveryType: DeliveryType.EXPRESS,
            operationalPriority: 'rush',
            customerDeliveryTargetDate: '2026-10-05',
            internalProductionDeadline: null,
            internalQualityDeadline: null,
            plannedQuantity: '3.0000',
            producedQuantity: '0.0000',
            scheduledStartAt: null,
            scheduledEndAt: null,
            instructions: 'Use clean thread',
            pieceDescription: 'Blue Shirt',
            measurementsSnapshot: null,
            observations: null,
            status: 'in_progress',
            isDeleted: false,
          };
        },
      } as never,
      { async findByProductionOrder() { return [{ serviceOrderItemId: 'item-1' }]; } } as never,
      {
        async findByProductionOrder() {
          return [
            {
              id: 'version-1',
              versionNo: 2,
              isActive: true,
              versionReason: ProductionOrderVersionReason.REWORK,
              deliveryType: DeliveryType.EXPRESS,
              operationalPriority: 'rush',
              pieceDescription: 'Blue Shirt',
              instructions: 'Use clean thread',
            },
          ];
        },
      } as never,
      { async findByProductionOrder() { return []; } } as never,
      { async findActiveByProductionOrder() { return null; } } as never,
      { async findByProductionOrder() { return []; } } as never,
      { async findByProductionOrder() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      {
        async getDetails() {
          return {
            serviceOrder: { id: 'service-order-1', orderNo: 'SO-1' },
            customer: { id: 'customer-1', legalName: 'Customer One' },
            items: [{ id: 'item-1', itemType: 'shirt', description: 'Blue Shirt', complement: 'Punho esquerdo', quantity: '2.0000', unitPrice: '80.00' }],
          };
        },
      } as never,
      {} as never,
      {} as never,
      { async listByEntity() { return []; } } as never,
    );

    const printView = await service.getPrintView('tenant-1', 'production-1');
    assert.equal(printView.delivery.dayNumber, '05');
    assert.equal(printView.delivery.month, 'OCT');
    assert.equal(printView.indicators.includes('[ EXPRESS ]'), true);
    assert.equal(printView.indicators.includes('[ REWORK ]'), true);
    assert.equal('totalValue' in printView, false);
    assert.equal('discountValue' in printView, false);
    assert.equal('unitPrice' in printView.items[0], false);
    assert.equal(printView.items[0]?.complement, 'Punho esquerdo');
  });
});
