import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WarrantyService } from 'src/modules/warranty/application/warranty/warranty.service';
import { WarrantyAdjustmentStatus, WarrantyStartSource } from 'src/shared/domain/enums';

describe('WarrantyService', () => {
  it('rejects warranty adjustments when the service order has no actual pickup or delivery date', async () => {
    const service = new WarrantyService(
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        async getDetails() {
          return {
            serviceOrder: { id: 'service-order-1', branchId: 'branch-1', actualPickupDate: null, actualDeliveryDate: null },
            items: [{ id: 'item-1' }],
          };
        },
      } as never,
      { async getById() { return { id: 'tenant-1', warrantyAdjustmentPeriodDays: 7, warrantyExecutionPeriodDays: 7 }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.createAdjustment({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          serviceOrderId: 'service-order-1',
          serviceOrderItemId: 'item-1',
          adjustmentReason: 'Too short',
          openedAt: '2026-09-20T00:00:00.000Z',
        }),
      /actual pickup date or actual delivery date/,
    );
  });

  it('creates warranty adjustments with pickup-based warranty start and tenant-configured period', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const service = new WarrantyService(
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        async getDetails() {
          return {
            serviceOrder: {
              id: 'service-order-1',
              branchId: 'branch-1',
              actualPickupDate: '2026-09-20',
              actualDeliveryDate: '2026-09-18',
            },
            items: [{ id: 'item-1' }],
          };
        },
      } as never,
      { async getById() { return { id: 'tenant-1', warrantyAdjustmentPeriodDays: 10, warrantyExecutionPeriodDays: 14 }; } } as never,
      {} as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
    );

    const adjustment = await service.createAdjustment({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      serviceOrderItemId: 'item-1',
      adjustmentReason: 'Too loose',
      openedAt: '2026-09-22T00:00:00.000Z',
    });

    assert.equal(adjustment.status, WarrantyAdjustmentStatus.OPEN);
    assert.equal(adjustment.warrantyStartDate, '2026-09-20');
    assert.equal(adjustment.warrantyStartSource, WarrantyStartSource.PICKUP);
    assert.equal(adjustment.warrantyPeriodDays, 10);
    assert.equal(audits[0]?.action, 'warranty_adjustment.created');
  });

  it('rejects warranty adjustments opened outside the tenant-configured period', async () => {
    const service = new WarrantyService(
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          return payload;
        },
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {
        async getDetails() {
          return {
            serviceOrder: { id: 'service-order-1', branchId: 'branch-1', actualPickupDate: null, actualDeliveryDate: '2026-09-01' },
            items: [{ id: 'item-1' }],
          };
        },
      } as never,
      { async getById() { return { id: 'tenant-1', warrantyAdjustmentPeriodDays: 7, warrantyExecutionPeriodDays: 14 }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.createAdjustment({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          serviceOrderId: 'service-order-1',
          serviceOrderItemId: 'item-1',
          adjustmentReason: 'Too short',
          openedAt: '2026-09-20T00:00:00.000Z',
        }),
      /outside the allowed warranty period/,
    );
  });
});
