import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { DeliveryType, ProductionOrderVersionReason } from 'src/shared/domain/enums';

function buildService(audits: Array<Record<string, unknown>> = []) {
  return new ProductionOrderService(
    {} as never,
    {
      async findById(id: string) {
        return {
          id,
          tenantId: 'tenant-1',
          branchId: 'branch-1',
          serviceOrderId: 'service-order-1',
          productionNo: 'PO-1',
          productionType: 'base',
          deliveryType: DeliveryType.STANDARD,
          operationalPriority: 'normal',
          customerDeliveryTargetDate: '2026-10-01',
          internalProductionDeadline: null,
          internalQualityDeadline: null,
          plannedQuantity: '2.0000',
          producedQuantity: '0.0000',
          scheduledStartAt: null,
          scheduledEndAt: null,
          instructions: 'Base instructions',
          pieceDescription: 'Blue Shirt',
          measurementsSnapshot: null,
          observations: null,
          status: 'open',
          isDeleted: false,
        };
      },
    } as never,
    {
      async findByProductionOrder() {
        return [{ serviceOrderItemId: 'item-1' }, { serviceOrderItemId: 'item-2' }];
      },
    } as never,
    {
      async findLatestVersionNumber() {
        return 1;
      },
      async deactivateActiveVersions() {},
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
      },
      async findByProductionOrder() {
        return [];
      },
    } as never,
    {
      async findByProductionOrder() {
        return [];
      },
      async findCurrentPrimaryByProductionOrder() {
        return null;
      },
      async findByResource() {
        return [];
      },
    } as never,
    {
      async findActiveByProductionOrder() {
        return null;
      },
      async findByCodeValue() {
        return null;
      },
      async findLatestByProductionOrder() {
        return null;
      },
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
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
          serviceOrder: { id: 'service-order-1', branchId: 'branch-1' },
          customer: { id: 'customer-1', legalName: 'Customer One' },
          items: [],
        };
      },
      assertBranchAccess() {},
      async getById() {
        return { id: 'service-order-1', tenantId: 'tenant-1' };
      },
    } as never,
    { async listByCustomer() { return { latestByLabel: [] }; } } as never,
    { async assertAssignableToBranch() {}, async getById() { return { id: 'resource-1' }; } } as never,
    { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
  );
}

describe('ProductionOrderService corrective versioning', () => {
  it('requires affected items for corrective versions', async () => {
    const service = buildService();

    await assert.rejects(
      () =>
        service.createVersion('production-1', 'tenant-1', {
          actorUserId: 'user-1',
          versionReason: ProductionOrderVersionReason.REWORK,
          changeSummary: 'Fix seam alignment',
        }),
      /affected Service Order items/,
    );
  });

  it('deduplicates affected items when creating corrective versions', async () => {
    const audits: Array<Record<string, any>> = [];
    const service = buildService(audits);

    const version = await service.createVersion('production-1', 'tenant-1', {
      actorUserId: 'user-1',
      versionReason: ProductionOrderVersionReason.REWORK,
      changeSummary: 'Fix seam alignment',
      affectedServiceOrderItemIds: ['item-1', 'item-1', 'item-2'],
    });

    assert.deepEqual(version.affectedServiceOrderItemIds, ['item-1', 'item-2']);
    assert.equal(version.versionNo, 2);
    assert.deepEqual(audits[0]?.metadata?.affectedServiceOrderItemIds, ['item-1', 'item-2']);
  });
});
