import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CustodyService } from 'src/modules/custody/application/custody/custody.service';
import { CustodyEventStage, StorageLocationStatus } from 'src/shared/domain/enums';

function createCustodyFixture() {
  const locations: Array<Record<string, any>> = [];
  const assignments: Array<Record<string, any>> = [];
  const bagContexts: Array<Record<string, any>> = [];
  const custodyEvents: Array<Record<string, any>> = [];
  const cctvReferences: Array<Record<string, any>> = [];
  const cameraSnapshots: Array<Record<string, any>> = [];
  const audits: Array<Record<string, any>> = [];
  const manager = {
    async findOne(entity: { name: string }, options: { where: Record<string, any> }) {
      const where = options.where;
      if (entity.name === 'StorageLocationAssignmentEntity') {
        return assignments.find((item) => Object.entries(where).every(([key, value]) => item[key] === value)) ?? null;
      }
      if (entity.name === 'PhysicalBagSupportContextEntity') {
        return bagContexts.find((item) => Object.entries(where).every(([key, value]) => item[key] === value)) ?? null;
      }
      return null;
    },
    create<T extends Record<string, any>>(_entity: { name: string }, payload: T) {
      return { createdAt: new Date(), updatedAt: new Date(), ...payload };
    },
    async save(entity: { name: string }, payload: Record<string, any>) {
      const collections: Record<string, Array<Record<string, any>>> = {
        StorageLocationAssignmentEntity: assignments,
        PhysicalBagSupportContextEntity: bagContexts,
        CustodyEventEntity: custodyEvents,
        CameraSnapshotEntity: cameraSnapshots,
        CctvReferenceEntity: cctvReferences,
        AuditEventEntity: audits,
      };
      const collection = collections[entity.name];
      if (!collection) return payload;
      const index = collection.findIndex((item) => item.id === payload.id);
      if (index >= 0) collection[index] = payload;
      else collection.push(payload);
      return payload;
    },
  };

  const service = new CustodyService(
    { async transaction(callback: (manager: typeof manager) => Promise<unknown>) { return callback(manager); } } as never,
    { async getById() { return { id: 'tenant-1' }; } } as never,
    { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
    {
      async getById(serviceOrderId: string) { return { id: serviceOrderId, tenantId: 'tenant-1', branchId: 'branch-1' }; },
    } as never,
    {
      async getById(productionOrderId: string) { return { id: productionOrderId, tenantId: 'tenant-1', branchId: 'branch-1', serviceOrderId: 'service-order-1' }; },
    } as never,
    { async getById() { return { id: 'resource-1', tenantId: 'tenant-1' }; } } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        const index = locations.findIndex((item) => item.id === entity.id);
        if (index >= 0) locations[index] = entity;
        else locations.push(entity);
        return entity;
      },
      async findById(id: string) { return locations.find((item) => item.id === id) ?? null; },
      async findByHierarchy(_tenantId: string, branchId: string, area: string | null, corridor: string | null, rowCode: string | null, shelfCode: string | null, cabinetCode: string | null, drawerCode: string | null) {
        return locations.find((item) => item.branchId === branchId && item.area === area && item.corridor === corridor && item.rowCode === rowCode && item.shelfCode === shelfCode && item.cabinetCode === cabinetCode && item.drawerCode === drawerCode && !item.isDeleted) ?? null;
      },
      async search() { return locations; },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        const index = assignments.findIndex((item) => item.id === entity.id);
        if (index >= 0) assignments[index] = entity;
        else assignments.push(entity);
        return entity;
      },
      async findCurrentByServiceOrder(serviceOrderId: string) { return assignments.find((item) => item.serviceOrderId === serviceOrderId && item.isCurrent) ?? null; },
      async findHistoryByServiceOrder(serviceOrderId: string) { return assignments.filter((item) => item.serviceOrderId === serviceOrderId).sort((a, b) => b.assignedAt.getTime() - a.assignedAt.getTime()); },
      async findById(id: string) { return assignments.find((item) => item.id === id) ?? null; },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        const index = bagContexts.findIndex((item) => item.id === entity.id);
        if (index >= 0) bagContexts[index] = entity;
        else bagContexts.push(entity);
        return entity;
      },
      async findCurrentByServiceOrder(serviceOrderId: string) { return bagContexts.find((item) => item.serviceOrderId === serviceOrderId && item.inUse) ?? null; },
      async findByServiceOrder(serviceOrderId: string) { return bagContexts.filter((item) => item.serviceOrderId === serviceOrderId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) {
        custodyEvents.push(entity);
        return entity;
      },
      async findById(id: string) { return custodyEvents.find((item) => item.id === id) ?? null; },
      async search() { return custodyEvents; },
      async findByServiceOrder(serviceOrderId: string) { return custodyEvents.filter((item) => item.serviceOrderId === serviceOrderId); },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) { cctvReferences.push(entity); return entity; },
      async findByCustodyEvent(custodyEventId: string) { return cctvReferences.filter((item) => item.custodyEventId === custodyEventId); },
    } as never,
    {
      create(payload: Record<string, any>) { return { createdAt: new Date(), updatedAt: new Date(), ...payload }; },
      async save(entity: Record<string, any>) { cameraSnapshots.push(entity); return entity; },
      async findByCustodyEvent(custodyEventId: string) { return cameraSnapshots.filter((item) => item.custodyEventId === custodyEventId); },
    } as never,
    {
      async record(payload: Record<string, any>) { audits.push(payload); },
    } as never,
  );

  return { service, locations, assignments, bagContexts, custodyEvents, cctvReferences, cameraSnapshots, audits };
}

describe('CustodyService', () => {
  it('creates storage locations and preserves current assignment plus bag support context', async () => {
    const { service, assignments, bagContexts, custodyEvents } = createCustodyFixture();

    const location = await service.createStorageLocation({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      branchId: 'branch-1',
      rowCode: 'A',
      shelfCode: '03',
      status: StorageLocationStatus.ACTIVE,
    });

    const assigned = await service.assignStorageLocation({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      storageLocationId: location.id,
      assignmentReason: 'Ready for pickup',
      bagLabel: 'Support Bag 1',
      bagInUse: true,
    });

    assert.equal(assigned.location?.displayLabel, 'Row A / Shelf 03');
    assert.equal(assignments.length, 1);
    assert.equal(assignments[0].isCurrent, true);
    assert.equal(bagContexts.length, 1);
    assert.equal(bagContexts[0].bagLabel, 'Support Bag 1');
    assert.equal(custodyEvents.length, 1);
    assert.equal(custodyEvents[0].eventStage, CustodyEventStage.STORAGE);
  });

  it('preserves historical bag context per assignment and supports explicit bag clearing', async () => {
    const { service, assignments, bagContexts } = createCustodyFixture();

    const firstLocation = await service.createStorageLocation({ tenantId: 'tenant-1', actorUserId: 'user-1', branchId: 'branch-1', rowCode: 'A', shelfCode: '01' });
    const secondLocation = await service.createStorageLocation({ tenantId: 'tenant-1', actorUserId: 'user-1', branchId: 'branch-1', rowCode: 'A', shelfCode: '02' });

    await service.assignStorageLocation({ tenantId: 'tenant-1', actorUserId: 'user-1', serviceOrderId: 'service-order-1', storageLocationId: firstLocation.id, bagLabel: 'Bag-A', bagInUse: true });
    await service.assignStorageLocation({ tenantId: 'tenant-1', actorUserId: 'user-2', serviceOrderId: 'service-order-1', storageLocationId: secondLocation.id, bagLabel: '', bagNotes: '', bagInUse: false });

    const current = await service.getServiceOrderLocation('tenant-1', 'service-order-1');
    const history = await service.listServiceOrderLocationHistory('tenant-1', 'service-order-1');

    assert.equal(assignments.length, 2);
    assert.equal(assignments[0].isCurrent, false);
    assert.equal(assignments[1].isCurrent, true);
    assert.equal(current.currentAssignment?.storageLocationId, secondLocation.id);
    assert.equal(current.bagSupportContext?.inUse, false);
    assert.equal(history.length, 2);
    assert.equal(history[0].bagSupportContext?.inUse, false);
    assert.equal(history[0].bagSupportContext?.bagLabel, null);
    assert.equal(history[1].bagSupportContext?.bagLabel, 'Bag-A');
    assert.equal(bagContexts.length, 2);
  });

  it('records pickup custody evidence with snapshots and CCTV references', async () => {
    const { service, locations, cameraSnapshots, cctvReferences } = createCustodyFixture();
    locations.push({ id: 'location-1', tenantId: 'tenant-1', branchId: 'branch-1', area: null, corridor: null, rowCode: 'B', shelfCode: '01', cabinetCode: null, drawerCode: null, displayLabel: 'Row B / Shelf 01', status: StorageLocationStatus.ACTIVE, isDeleted: false });

    const event = await service.recordCustodyEvent({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      branchId: 'branch-1',
      serviceOrderId: 'service-order-1',
      operationalResourceId: 'resource-1',
      storageLocationId: 'location-1',
      eventStage: CustodyEventStage.PICKUP,
      evidenceSummary: { authorizationMethod: 'token' },
      cameraSnapshots: [{ sourceLabel: 'camera-1', referenceUri: 'snapshot://1' }],
      cctvReferences: [{ sourceLabel: 'cctv-1', referenceUri: 'cctv://1' }],
    });

    const details = await service.getCustodyEventById('tenant-1', event.id);

    assert.equal(details.custodyEvent.eventStage, CustodyEventStage.PICKUP);
    assert.equal(cameraSnapshots.length, 1);
    assert.equal(cctvReferences.length, 1);
    assert.equal(details.cameraSnapshots[0].referenceUri, 'snapshot://1');
    assert.equal(details.cctvReferences[0].sourceLabel, 'cctv-1');
  });

  it('derives service-order lineage from production-order-only events and rejects mismatched lineage', async () => {
    const { service, locations } = createCustodyFixture();
    locations.push({ id: 'location-1', tenantId: 'tenant-1', branchId: 'branch-1', area: null, corridor: null, rowCode: 'C', shelfCode: '01', cabinetCode: null, drawerCode: null, displayLabel: 'Row C / Shelf 01', status: StorageLocationStatus.ACTIVE, isDeleted: false });

    const productionOnly = await service.recordCustodyEvent({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      branchId: 'branch-1',
      productionOrderId: 'production-order-1',
      storageLocationId: 'location-1',
      eventStage: CustodyEventStage.PRODUCTION_TRANSFER,
    });

    assert.equal(productionOnly.serviceOrderId, 'service-order-1');

    await assert.rejects(
      () =>
        service.recordCustodyEvent({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          branchId: 'branch-1',
          serviceOrderId: 'service-order-x',
          productionOrderId: 'production-order-1',
          storageLocationId: 'location-1',
          eventStage: CustodyEventStage.PRODUCTION_TRANSFER,
        }),
      /same Service Order lineage/,
    );
  });
});
