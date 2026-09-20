import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PickupService } from 'src/modules/pickup/application/pickup/pickup.service';
import { DigitalApprovalDecision, InteractionChannel, PickupAuthorizationPath, PickupAuthorizationStatus, PickupCredentialType, StorageLocationStatus } from 'src/shared/domain/enums';

function createPickupFixture() {
  const authorizations: Array<Record<string, any>> = [];
  const tokens: Array<Record<string, any>> = [];
  const qrCodes: Array<Record<string, any>> = [];
  const temporaryCodes: Array<Record<string, any>> = [];
  const communications: Array<Record<string, any>> = [];
  const approvals: Array<Record<string, any>> = [];
  const custodyEvents: Array<Record<string, any>> = [];
  const audits: Array<Record<string, any>> = [];

  const service = new PickupService(
    { async getById() { return { id: 'tenant-1' }; } } as never,
    { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
    { async getById(serviceOrderId: string) { return { id: serviceOrderId, tenantId: 'tenant-1', branchId: 'branch-1' }; } } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        const index = authorizations.findIndex((item) => item.id === entity.id);
        if (index >= 0) authorizations[index] = entity;
        else authorizations.push(entity);
        return entity;
      },
      async findById(id: string) { return authorizations.find((item) => item.id === id) ?? null; },
      async search() { return authorizations; },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        const index = tokens.findIndex((item) => item.id === entity.id);
        if (index >= 0) tokens[index] = entity;
        else tokens.push(entity);
        return entity;
      },
      async findByAuthorization(pickupAuthorizationId: string) { return tokens.filter((item) => item.pickupAuthorizationId === pickupAuthorizationId); },
      async findByAuthorizationAndValue(pickupAuthorizationId: string, tokenValue: string) { return tokens.find((item) => item.pickupAuthorizationId === pickupAuthorizationId && item.tokenValue === tokenValue) ?? null; },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) { qrCodes.push(entity); return entity; },
      async findByAuthorization(pickupAuthorizationId: string) { return qrCodes.filter((item) => item.pickupAuthorizationId === pickupAuthorizationId); },
      async findByAuthorizationAndValue(pickupAuthorizationId: string, codeValue: string) { return qrCodes.find((item) => item.pickupAuthorizationId === pickupAuthorizationId && item.codeValue === codeValue) ?? null; },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) { temporaryCodes.push(entity); return entity; },
      async findByAuthorization(pickupAuthorizationId: string) { return temporaryCodes.filter((item) => item.pickupAuthorizationId === pickupAuthorizationId); },
      async findByAuthorizationAndValue(pickupAuthorizationId: string, codeValue: string) { return temporaryCodes.find((item) => item.pickupAuthorizationId === pickupAuthorizationId && item.codeValue === codeValue) ?? null; },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) { communications.push(entity); return entity; },
      async findByServiceOrder(serviceOrderId: string) { return communications.filter((item) => item.serviceOrderId === serviceOrderId); },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        const index = approvals.findIndex((item) => item.id === entity.id);
        if (index >= 0) approvals[index] = entity;
        else approvals.push(entity);
        return entity;
      },
      async findByPickupAuthorization(pickupAuthorizationId: string) { return approvals.filter((item) => item.pickupAuthorizationId === pickupAuthorizationId); },
      async findPendingByPickupAuthorization(pickupAuthorizationId: string) { return approvals.find((item) => item.pickupAuthorizationId === pickupAuthorizationId && item.decision === 'pending') ?? null; },
      async findById(id: string) { return approvals.find((item) => item.id === id) ?? null; },
    } as never,
    {
      async getServiceOrderLocation() {
        return { serviceOrder: { id: 'service-order-1' }, currentAssignment: { id: 'assignment-1' }, location: { id: 'location-1', displayLabel: 'Row A / Shelf 03', status: StorageLocationStatus.ACTIVE }, bagSupportContext: null };
      },
      async recordCustodyEvent(payload: Record<string, any>) {
        const event = { id: `custody-${custodyEvents.length + 1}`, ...payload };
        custodyEvents.push(event);
        return event;
      },
    } as never,
    { async record(payload: Record<string, any>) { audits.push(payload); } } as never,
  );

  return { service, authorizations, tokens, communications, approvals, custodyEvents, audits };
}

describe('PickupService', () => {
  it('runs remote approval workflow and completes pickup with a token', async () => {
    const { service, authorizations, tokens, approvals, communications, custodyEvents } = createPickupFixture();

    const authorization = await service.createPickupAuthorization({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      authorizedPersonName: 'Maria Courier',
      authorizationPath: PickupAuthorizationPath.COURIER,
      validUntil: '2099-09-30T18:00:00.000Z',
      requireRemoteApproval: true,
    });

    assert.equal(authorization.status, PickupAuthorizationStatus.PENDING);

    const requested = await service.requestRemoteApproval({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      pickupAuthorizationId: authorization.id,
      channel: InteractionChannel.WHATSAPP,
    });
    assert.equal(communications.length, 1);
    assert.equal(requested.approval.decision, DigitalApprovalDecision.PENDING);

    const decided = await service.decideRemoteApproval({
      tenantId: 'tenant-1',
      actorUserId: 'customer-actor-1',
      pickupAuthorizationId: authorization.id,
      approvalId: requested.approval.id,
      decision: DigitalApprovalDecision.APPROVED,
      channel: InteractionChannel.WHATSAPP,
    });
    assert.equal(decided.authorization.status, PickupAuthorizationStatus.APPROVED);

    const token = await service.issuePickupToken({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      pickupAuthorizationId: authorization.id,
      value: 'TOKEN-123',
      expiresAt: '2099-09-30T19:00:00.000Z',
    });
    assert.equal(token.tokenValue, 'TOKEN-123');

    const completed = await service.completePickupAuthorization({
      tenantId: 'tenant-1',
      actorUserId: 'user-2',
      pickupAuthorizationId: authorization.id,
      authorizationMethod: PickupCredentialType.TOKEN,
      credentialValue: 'TOKEN-123',
      notes: 'Released to approved courier',
      cameraSnapshots: [{ sourceLabel: 'camera-1', referenceUri: 'snapshot://pickup-1' }],
      cctvReferences: [{ sourceLabel: 'cctv-1', referenceUri: 'cctv://pickup-1' }],
    });

    assert.equal(completed.authorization.status, PickupAuthorizationStatus.COMPLETED);
    assert.equal(tokens[0].status, 'used');
    assert.equal(tokens[0].usedAt instanceof Date, true);
    assert.equal(custodyEvents.length, 1);
    assert.equal(custodyEvents[0].eventStage, 'pickup');
    assert.equal(custodyEvents[0].cameraSnapshots.length, 1);
    assert.equal(authorizations.length, 1);
    assert.equal(approvals.length, 1);
  });

  it('rejects remote-approval completion without an approved approval decision', async () => {
    const { service } = createPickupFixture();

    const authorization = await service.createPickupAuthorization({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      authorizedPersonName: 'Third Party',
      authorizationPath: PickupAuthorizationPath.THIRD_PARTY,
      validUntil: '2099-10-01T10:00:00.000Z',
      requireRemoteApproval: true,
    });
    const requested = await service.requestRemoteApproval({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      pickupAuthorizationId: authorization.id,
      channel: InteractionChannel.EMAIL,
    });

    await assert.rejects(
      () =>
        service.completePickupAuthorization({
          tenantId: 'tenant-1',
          actorUserId: 'user-2',
          pickupAuthorizationId: authorization.id,
          authorizationMethod: PickupCredentialType.REMOTE_APPROVAL,
          approvalId: requested.approval.id,
        }),
      /must be approved/,
    );
  });
});
