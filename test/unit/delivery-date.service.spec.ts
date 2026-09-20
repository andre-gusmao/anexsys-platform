import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeliveryDateService } from 'src/modules/service-orders/application/delivery-date/delivery-date.service';

describe('DeliveryDateService', () => {
  it('moves the suggested date to the next valid business day when calendar rules block it', async () => {
    const service = new DeliveryDateService(
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      {
        async findApplicable(_tenantId: string, _branchId: string, calendarDate: string) {
          if (calendarDate === '2026-09-28') {
            return [{ isWorkingDay: false }];
          }
          if (calendarDate === '2026-09-29') {
            return [{ isWorkingDay: false }];
          }
          return [];
        },
      } as never,
    );

    const promised = await service.suggestDeliveryDate('tenant-1', 'branch-1', new Date('2026-09-21T10:00:00.000Z'));
    assert.equal(promised, '2026-09-30');
  });

  it('skips Sundays by default when no calendar override marks them as working', async () => {
    const service = new DeliveryDateService(
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async findApplicable() { return []; } } as never,
    );

    const promised = await service.suggestDeliveryDate('tenant-1', 'branch-1', new Date('2026-09-20T10:00:00.000Z'));
    assert.equal(promised, '2026-09-28');
  });
});
