import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { WarrantyService } from 'src/modules/warranty/application/warranty/warranty.service';
import { WarrantyAdjustmentStatus } from 'src/shared/domain/enums';

describe('WarrantyService', () => {
  it('rejects warranty adjustments opened outside the allowed period', async () => {
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
            serviceOrder: { id: 'service-order-1', branchId: 'branch-1' },
            items: [{ id: 'item-1' }],
          };
        },
      } as never,
      {} as never,
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
          actualDeliveryDate: '2026-09-01',
          openedAt: '2026-09-20T00:00:00.000Z',
          warrantyPeriodDays: 7,
        }),
      /outside the allowed warranty period/,
    );
  });

  it('creates warranty adjustments with open status inside the allowed period', async () => {
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
            serviceOrder: { id: 'service-order-1', branchId: 'branch-1' },
            items: [{ id: 'item-1' }],
          };
        },
      } as never,
      {} as never,
      {} as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
    );

    const adjustment = await service.createAdjustment({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      serviceOrderItemId: 'item-1',
      adjustmentReason: 'Too loose',
      actualDeliveryDate: '2026-09-20',
      openedAt: '2026-09-22T00:00:00.000Z',
      warrantyPeriodDays: 7,
    });

    assert.equal(adjustment.status, WarrantyAdjustmentStatus.OPEN);
    assert.equal(adjustment.warrantyPeriodDays, 7);
    assert.equal(audits[0]?.action, 'warranty_adjustment.created');
  });
});
