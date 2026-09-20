import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MeasurementService } from 'src/modules/crm/application/measurement/measurement.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

describe('MeasurementService', () => {
  it('creates versioned measurement records and audit events', async () => {
    const auditCalls: Array<Record<string, unknown>> = [];
    const service = new MeasurementService(
      {
        async transaction(callback: (manager: any) => Promise<unknown>) {
          const manager = {
            create(_entity: unknown, payload: Record<string, unknown>) {
              return payload;
            },
            async save(_entity: unknown, payload: Record<string, unknown>) {
              return payload;
            },
          };
          return callback(manager);
        },
      } as never,
      { async getById() { return { id: 'customer-1', legalName: 'Maria Silva', branchId: 'branch-1' }; } } as never,
      {
        create(payload: Record<string, unknown>) {
          return payload;
        },
        async findLatestVersionNumber(_tenantId: string, _customerId: string, label: string) {
          return label === 'weight' ? 1 : 0;
        },
      } as never,
      { async record(payload: Record<string, unknown>) { auditCalls.push(payload); } } as never,
    );

    const records = await service.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      weight: 72,
      height: 178,
      customMeasurements: [{ label: 'Waist', value: 88, unit: 'cm' }],
      actorUserId: 'actor-1',
    });

    assert.equal(records.length, 3);
    assert.equal(records.find((record) => record.measurementLabel === 'weight')?.versionNo, 2);
    assert.equal(records.find((record) => record.measurementLabel === 'height')?.versionNo, 1);
    assert.equal(records.find((record) => record.measurementLabel === 'waist')?.versionNo, 1);
    assert.equal(auditCalls.length, 3);
  });

  it('rejects empty measurement payloads', async () => {
    const service = new MeasurementService(
      {} as never,
      { async getById() { return { id: 'customer-1', legalName: 'Maria Silva', branchId: null }; } } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          customerId: 'customer-1',
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });
});
