import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OperationalAvailabilityStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';

function buildDataSource() {
  return {
    async transaction(callback: (manager: any) => Promise<unknown>) {
      const manager = {
        create(_entity: unknown, payload: Record<string, unknown>) {
          return payload;
        },
        async save(_entity: unknown, payload: unknown) {
          return payload;
        },
      };
      return callback(manager);
    },
  };
}

describe('OperationalResourceService', () => {
  it('creates an operational resource with normalized skills and default availability', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const service = new OperationalResourceService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; }, async save(payload: Record<string, unknown>) { return payload; } } as never,
      { async findCurrentByResource() { return []; }, async findByResource() { return []; } } as never,
      { async findByResource() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
    );

    const created = await service.create({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      homeBranchId: 'branch-1',
      resourceType: OperationalResourceType.EMPLOYEE,
      displayName: '  Maria  ',
      skills: [' Sewing ', 'sewing', ' Finishing '],
    });

    assert.equal(created.displayName, 'Maria');
    assert.deepEqual(created.skillProfile, ['finishing', 'sewing']);
    assert.equal(created.availabilityStatus, OperationalAvailabilityStatus.AVAILABLE);
    assert.equal(audits[0]?.action, 'operational_resource.created');
  });

  it('rejects invalid availability windows', async () => {
    const service = new OperationalResourceService(
      buildDataSource() as never,
      { create(payload: Record<string, unknown>) { return payload; } } as never,
      {} as never,
      {} as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      {} as never,
    );

    await assert.rejects(
      () =>
        service.create({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          homeBranchId: 'branch-1',
          resourceType: OperationalResourceType.EMPLOYEE,
          displayName: 'Maria',
          availableFrom: '2026-10-10',
          availableUntil: '2026-10-09',
        }),
      DomainValidationError,
    );
  });
});
