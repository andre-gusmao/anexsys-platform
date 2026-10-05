import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
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
        async save(entityOrPayload: unknown, maybePayload?: unknown) {
          return maybePayload ?? entityOrPayload;
        },
        createQueryBuilder() {
          return {
            where() { return this; },
            andWhere() { return this; },
            orderBy() { return this; },
            addOrderBy() { return this; },
            async getMany() { return []; },
          };
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

  it('updates availability fields through the generic update flow', async () => {
    const audits: Array<Record<string, unknown>> = [];
    const resource = {
      id: 'resource-1',
      tenantId: 'tenant-1',
      homeBranchId: 'branch-1',
      resourceType: OperationalResourceType.EMPLOYEE,
      displayName: 'Maria',
      documentNo: null,
      phone: null,
      email: null,
      qualificationNotes: null,
      availabilityStatus: OperationalAvailabilityStatus.AVAILABLE,
      availableFrom: null,
      availableUntil: null,
      availabilityNotes: null,
      status: OperationalResourceStatus.ACTIVE,
      updatedBy: null,
    };

    const service = new OperationalResourceService(
      buildDataSource() as never,
      {
        async findById() {
          return resource;
        },
        async save(payload: Record<string, unknown>) { return payload; },
      } as never,
      { async findCurrentByResource() { return []; }, async save() {}, async saveMany() {} } as never,
      { async findByResource() { return []; } } as never,
      { async getById() { return { id: 'tenant-1' }; } } as never,
      { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
      { async record(payload: Record<string, unknown>) { audits.push(payload); }, async listByEntity() { return []; } } as never,
    );

    const updated = await service.update('resource-1', 'tenant-1', {
      actorUserId: 'user-1',
      availabilityStatus: OperationalAvailabilityStatus.UNAVAILABLE,
      availableFrom: '2026-10-10',
      availableUntil: '2026-10-12',
      availabilityNotes: '  Assigned to urgent job  ',
    });

    assert.equal(updated.availabilityStatus, OperationalAvailabilityStatus.UNAVAILABLE);
    assert.equal(updated.availableFrom, '2026-10-10');
    assert.equal(updated.availableUntil, '2026-10-12');
    assert.equal(updated.availabilityNotes, 'Assigned to urgent job');
    assert.equal(audits[0]?.action, 'operational_resource.updated');
  });
});
