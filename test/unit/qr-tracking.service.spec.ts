import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ProductionOrderStatus, QrScanType } from 'src/shared/domain/enums';
import { QrTrackingService } from 'src/modules/production-orders/application/qr-tracking/qr-tracking.service';

describe('QrTrackingService', () => {
  it('records accepted diary scans against the active production-order QR code', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const savedEvents: Array<Record<string, unknown>> = [];
    const service = new QrTrackingService(
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async save(payload: Record<string, unknown>) {
          savedEvents.push(payload);
          return payload;
        },
        async search() {
          return [];
        },
      } as never,
      {
        async getActiveQrCodeByValue() {
          return {
            id: 'qr-1',
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            productionOrderId: 'production-1',
            isActive: true,
          };
        },
        async getById() {
          return {
            id: 'production-1',
            tenantId: 'tenant-1',
            branchId: 'branch-1',
            status: ProductionOrderStatus.IN_PROGRESS,
          };
        },
        assertBranchAccess() {},
        async recordDiaryEntry() {
          return {
            id: 'production-1',
            status: ProductionOrderStatus.IN_PROGRESS,
          };
        },
      } as never,
      { async assertResourceBranchAccess() {}, async assertAssignableToBranch() {}, async getById() { return { id: 'resource-1' }; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); } } as never,
    );

    const scanned = await service.scan('tenant-1', {
      actorUserId: 'user-1',
      accessibleBranchIds: ['branch-1'],
      codeValue: 'PO-QR-1',
      scanType: QrScanType.UPDATE_DIARY,
      diaryEntry: 'Piece moved to finishing',
      deviceInfo: 'mobile',
    });

    assert.equal(scanned.productionOrder.status, ProductionOrderStatus.IN_PROGRESS);
    assert.equal(scanned.qrEvent.scanResult, 'accepted');
    assert.equal(savedEvents[0]?.scanType, QrScanType.UPDATE_DIARY);
    assert.equal(audits[0]?.action, 'production_order.qr.scanned');
  });
});
