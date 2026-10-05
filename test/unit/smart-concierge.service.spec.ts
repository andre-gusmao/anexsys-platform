import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SmartConciergeService } from 'src/modules/smart-concierge/application/smart-concierge/smart-concierge.service';
import { CustomerIdentificationMethod, InteractionChannel, SmartConciergeQueueStatus } from 'src/shared/domain/enums';

function createService() {
  const checkIns: any[] = [];
  const communications: any[] = [];
  const audits: any[] = [];

  const service = new SmartConciergeService(
    {
      create(payload: any) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: any) {
        const index = checkIns.findIndex((item) => item.id === entity.id);
        if (index >= 0) checkIns[index] = entity;
        else checkIns.push(entity);
        return entity;
      },
      async findById(id: string) { return checkIns.find((item) => item.id === id) ?? null; },
      async search() { return checkIns; },
    } as never,
    {
      create(payload: any) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: any) { communications.push(entity); return entity; },
    } as never,
    { async getById() { return { id: 'tenant-1' }; } } as never,
    { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
    {
      async getById(id: string) { return { id, legalName: 'Queue Customer', phone: '11999990000', cpfCnpj: '12345678901' }; },
      async search() { return [{ id: 'customer-1', legalName: 'Queue Customer', phone: '11999990000', cpfCnpj: '12345678901' }]; },
    } as never,
    { async findByCustomerId() { return { customerCode: 'CUST-001', vipFlag: true, lastLoginAt: new Date('2026-09-20T10:00:00.000Z') }; }, async findByCustomerCode() { return { customerId: 'customer-1' }; } } as never,
    { async search() { return [{ id: 'service-order-1', orderNo: 'SO-1', status: 'open', branchId: 'branch-1', openedAt: new Date(), promisedDeliveryDate: '2099-10-10', actualPickupDate: null, actualDeliveryDate: null }]; } } as never,
    { async getById() { return { id: 'service-order-1', customerId: 'customer-1', branchId: 'branch-1', orderNo: 'SO-1', status: 'open', promisedDeliveryDate: '2099-10-10', deliveryType: 'Standard' }; } } as never,
    { async getPickupAuthorizationById() { return { id: 'pickup-1', serviceOrderId: 'service-order-1', status: 'approved', authorizedPersonName: 'Courier' }; }, async searchPickupAuthorizations() { return []; } } as never,
    { async getServiceOrderLocation() { return { location: { id: 'location-1', displayLabel: 'Row A / Shelf 03' } }; } } as never,
    { async searchAdjustments() { return []; }, async searchExecutions() { return []; } } as never,
    { async getFinancialSummary() { return { outstandingBalance: '10.00' }; } } as never,
    { async record(payload: any) { audits.push(payload); } } as never,
  );

  return { service, checkIns, communications, audits };
}

describe('SmartConciergeService', () => {
  it('creates a waiting check-in and completes a handoff transition', async () => {
    const { service, checkIns, audits } = createService();

    const created = await service.createCheckIn({
      tenantId: 'tenant-1',
      actorUserId: 'attendant-1',
      branchId: 'branch-1',
      identificationMethod: CustomerIdentificationMethod.PHONE,
      identificationValue: '11999990000',
      notes: 'Customer arrived for pickup',
    });

    assert.equal(created.checkIn.status, SmartConciergeQueueStatus.WAITING);
    assert.equal(checkIns.length, 1);

    const handedOff = await service.handoff({
      tenantId: 'tenant-1',
      actorUserId: 'attendant-1',
      checkInId: created.checkIn.id,
      status: SmartConciergeQueueStatus.COMPLETED,
      notes: 'Pickup handed off',
    });

    assert.equal(handedOff.checkIn.status, SmartConciergeQueueStatus.COMPLETED);
    assert.equal(audits.length >= 2, true);
  });

  it('records concierge notifications', async () => {
    const { service, communications } = createService();
    await service.sendNotification({
      tenantId: 'tenant-1',
      actorUserId: 'attendant-1',
      branchId: 'branch-1',
      channel: InteractionChannel.WHATSAPP,
      messageSummary: 'Your order is ready.',
    });
    assert.equal(communications.length, 1);
  });
});
