import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CustomerPortalService } from 'src/modules/customer-portal/application/customer-portal/customer-portal.service';
import { DigitalApprovalDecision, DigitalApprovalType, InteractionChannel } from 'src/shared/domain/enums';

function createService() {
  const profiles: any[] = [];
  const mappings: any[] = [];
  const approvals: any[] = [];
  const communications: any[] = [];
  const audits: any[] = [];

  const service = new CustomerPortalService(
    {
      create(payload: any) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: any) {
        const index = profiles.findIndex((item) => item.id === entity.id || item.userId === entity.userId);
        if (index >= 0) profiles[index] = entity;
        else profiles.push(entity);
        return entity;
      },
      async findByUserId(userId: string) { return profiles.find((item) => item.userId === userId) ?? null; },
      async findByCustomerId(customerId: string) { return profiles.find((item) => item.customerId === customerId) ?? null; },
      async findByCustomerCode(tenantId: string, customerCode: string) { return profiles.find((item) => item.tenantId === tenantId && item.customerCode === customerCode) ?? null; },
    } as never,
    {
      create(payload: any) { return payload; },
      async save(entity: any) { mappings.push(entity); return entity; },
      async findByTenant() { return mappings; },
      async findByTenantAndInternalName(tenantId: string, internalName: string) { return mappings.find((item) => item.tenantId === tenantId && item.internalName === internalName) ?? null; },
    } as never,
    {
      async getById(id: string) { return { id, legalName: 'Portal Customer', phone: '11999990000', email: 'portal@test.dev', cpfCnpj: '12345678901' }; },
      async update(id: string) { return { id, legalName: 'Updated Customer', phone: '11999990000', email: 'portal@test.dev', cpfCnpj: '12345678901' }; },
    } as never,
    {
      async getById(id: string) { return { id, customerId: 'customer-1', branchId: 'branch-1', status: 'open', orderNo: 'SO-1', openedAt: new Date(), promisedDeliveryDate: '2099-10-10', deliveryType: 'Standard' }; },
      async getDetails() { return { serviceOrder: { id: 'service-order-1', customerId: 'customer-1', branchId: 'branch-1', status: 'open', orderNo: 'SO-1', openedAt: new Date(), promisedDeliveryDate: '2099-10-10', deliveryType: 'Standard' }, items: [], customer: { id: 'customer-1' } }; },
    } as never,
    { async search() { return [{ id: 'service-order-1', customerId: 'customer-1', branchId: 'branch-1', status: 'open', orderNo: 'SO-1', openedAt: new Date(), promisedDeliveryDate: '2099-10-10', deliveryType: 'Standard' }]; } } as never,
    {
      create(payload: any) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: any) {
        const index = approvals.findIndex((item) => item.id === entity.id);
        if (index >= 0) approvals[index] = entity;
        else approvals.push(entity);
        return entity;
      },
      async findByServiceOrderIds() { return approvals; },
      async findById(id: string) { return approvals.find((item) => item.id === id) ?? null; },
      async findByLinkToken(token: string) { return approvals.find((item) => item.approvalLinkToken === token) ?? null; },
    } as never,
    {
      create(payload: any) { return payload; },
      async save(entity: any) { communications.push(entity); return entity; },
    } as never,
    { async search() { return []; } } as never,
    {
      async createPickupAuthorization() { return { id: 'pickup-1' }; },
      async issuePickupToken() { return { id: 'token-1' }; },
      async issuePickupQrCode() { return { id: 'qr-1' }; },
      async issueTemporaryPickupCode() { return { id: 'tmp-1' }; },
      async getPickupAuthorizationById() { return { id: 'pickup-1', serviceOrderId: 'service-order-1' }; },
      async cancelPickupAuthorization() { return { id: 'pickup-1', status: 'cancelled' }; },
    } as never,
    { async getServiceOrderLocation() { return { location: null }; } } as never,
    { async searchAdjustments() { return []; }, async searchExecutions() { return []; }, async createAdjustment() { return { id: 'warranty-1' }; } } as never,
    { async getFinancialSummary() { return { outstandingBalance: '0.00', deliveryBlocked: false }; } } as never,
    { async record(payload: any) { audits.push(payload); } } as never,
  );

  return { service, profiles, mappings, approvals, communications, audits };
}

describe('CustomerPortalService', () => {
  it('links a portal profile and seeds default status mappings', async () => {
    const { service, profiles, mappings } = createService();
    const profile = await service.linkCustomerProfile({
      tenantId: 'tenant-1',
      actorUserId: 'admin-1',
      customerId: 'customer-1',
      userId: 'portal-user-1',
      customerCode: 'CUST-001',
      vipFlag: true,
      preferredChannel: InteractionChannel.WHATSAPP,
    });

    assert.equal(profile.customerCode, 'CUST-001');
    assert.equal(profile.vipFlag, true);
    assert.equal(profiles.length, 1);
    assert.ok(mappings.some((item) => item.internalName === 'quality_rejected'));
  });

  it('creates and approves a portal-facing digital approval request', async () => {
    const { service, profiles, approvals, communications } = createService();
    await service.linkCustomerProfile({ tenantId: 'tenant-1', actorUserId: 'admin-1', customerId: 'customer-1', userId: 'portal-user-1' });
    profiles[0].lastLoginAt = null;

    const created = await service.createApprovalRequest({
      tenantId: 'tenant-1',
      actorUserId: 'admin-1',
      serviceOrderId: 'service-order-1',
      channel: InteractionChannel.PORTAL,
      title: 'Approve change',
      messageSummary: 'Approve requested changes.',
    });

    assert.equal(created.approvalType, DigitalApprovalType.SERVICE_ORDER_APPROVAL);
    assert.equal(approvals.length, 1);
    assert.equal(communications.length, 1);

    const approved = await service.approve('tenant-1', 'portal-user-1', approvals[0].id, DigitalApprovalDecision.APPROVED, 'Looks good');
    assert.equal(approved.decision, DigitalApprovalDecision.APPROVED);
  });
});
