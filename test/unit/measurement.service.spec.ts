import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MeasurementService } from 'src/modules/crm/application/measurement/measurement.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

describe('MeasurementService', () => {
  it('creates versioned measurement sets and audit events', async () => {
    const auditCalls: Array<Record<string, unknown>> = [];
    const savedSets: Array<Record<string, unknown>> = [];
    const savedItems: Array<Record<string, unknown>> = [];

    const service = new MeasurementService(
      {
        async transaction(callback: (manager: any) => Promise<unknown>) {
          const manager = {
            create(_entity: unknown, payload: Record<string, unknown>) {
              return payload;
            },
            async save(entity: unknown, payload: Record<string, unknown> | Record<string, unknown>[]) {
              if (Array.isArray(payload)) {
                savedItems.push(...payload);
                return payload;
              }
              if (String(entity).includes('CustomerInteractionEntity')) {
                return payload;
              }
              const savedPayload = { ...payload, id: 'set-2' };
              savedSets.push(savedPayload);
              return savedPayload;
            },
          };
          return callback(manager);
        },
      } as never,
      { async getById() { return { id: 'customer-1', legalName: 'Maria Silva', branchId: 'branch-1' }; } } as never,
      {
        async findLatestVersionNumber() {
          return 1;
        },
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async findByCustomer() {
          return [
            {
              id: 'set-2',
              tenantId: 'tenant-1',
              customerId: 'customer-1',
              measurementDate: '2026-09-22',
              notes: 'Updated set',
              capturedBy: 'actor-1',
              versionNo: 2,
            },
          ];
        },
      } as never,
      {
        async findByMeasurementSetIds() {
          return [
            {
              id: 'item-1',
              measurementSetId: 'set-2',
              bodyPartId: 'bp-1',
              bodyPartCode: 'CINTURA',
              bodyPartDisplayName: 'Cintura',
              measurementUnitId: 'unit-cm',
              measurementUnitCode: 'CM',
              measurementUnitDisplayName: 'CM',
              measuredValue: '88.000',
              notes: null,
            },
            {
              id: 'item-2',
              measurementSetId: 'set-2',
              bodyPartId: 'bp-2',
              bodyPartCode: 'BUSTO',
              bodyPartDisplayName: 'Busto',
              measurementUnitId: 'unit-cm',
              measurementUnitCode: 'CM',
              measurementUnitDisplayName: 'CM',
              measuredValue: '92.000',
              notes: 'ajustado',
            },
          ];
        },
      } as never,
      {
        async resolveBodyParts() {
          return [
            { id: 'bp-1', code: 'CINTURA', displayName: 'Cintura' },
            { id: 'bp-2', code: 'BUSTO', displayName: 'Busto' },
          ];
        },
        async resolveUnits() {
          return [{ id: 'unit-cm', code: 'CM', displayName: 'CM' }];
        },
        async getDefaultUnit() {
          return { id: 'unit-cm', code: 'CM', displayName: 'CM' };
        },
      } as never,
      { async record(payload: Record<string, unknown>) { auditCalls.push(payload); } } as never,
    );

    const measurementSet = await service.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      measurementDate: '2026-09-22',
      notes: 'Updated set',
      items: [
        { bodyPartId: 'bp-1', unitId: 'unit-cm', value: 88 },
        { bodyPartId: 'bp-2', value: 92, notes: 'ajustado' },
      ],
      actorUserId: 'actor-1',
    });

    assert.equal(savedSets[0]?.versionNo, 2);
    assert.equal(savedItems.length, 2);
    assert.equal(measurementSet.versionNo, 2);
    assert.equal(measurementSet.items[0]?.bodyPartDisplayName, 'Cintura');
    assert.equal(auditCalls.length, 1);
    assert.equal(auditCalls[0]?.action, 'measurement.set.recorded');
  });

  it('rejects duplicate body parts inside the same measurement set', async () => {
    const service = new MeasurementService(
      {} as never,
      { async getById() { return { id: 'customer-1', legalName: 'Maria Silva', branchId: null }; } } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          customerId: 'customer-1',
          items: [
            { bodyPartId: 'bp-1', value: 80 },
            { bodyPartId: 'bp-1', value: 81 },
          ],
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });
});
