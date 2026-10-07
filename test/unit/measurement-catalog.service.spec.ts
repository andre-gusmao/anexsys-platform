import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MeasurementCatalogService } from 'src/modules/crm/application/measurement-catalog/measurement-catalog.service';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';

function createService(
  repos: {
    bodyParts?: object;
    units?: object;
    assertBodyPartCanInactivate?: () => Promise<void>;
    assertBodyPartCanDelete?: () => Promise<void>;
    assertMeasurementUnitCanInactivate?: () => Promise<void>;
    assertMeasurementUnitCanDelete?: () => Promise<void>;
    defaultMeasurementUnitCode?: string;
  } = {},
) {
  return new MeasurementCatalogService(
    {
      async getById() {
        return { id: 'tenant-1', defaultMeasurementUnitCode: repos.defaultMeasurementUnitCode ?? 'CM' };
      },
    } as never,
    {
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
      },
      async saveMany(payload: unknown[]) {
        return payload;
      },
      async findById() {
        return null;
      },
      async findListedByTenant() {
        return [];
      },
      async findActiveByTenant() {
        return [];
      },
      async findCodesByTenant() {
        return [];
      },
      async findByTenantAndCode() {
        return null;
      },
      async findByIds() {
        return [];
      },
      ...repos.bodyParts,
    } as never,
    {
      create(payload: Record<string, unknown>) {
        return payload;
      },
      async save(payload: Record<string, unknown>) {
        return payload;
      },
      async saveMany(payload: unknown[]) {
        return payload;
      },
      async findById() {
        return null;
      },
      async findListedByTenant() {
        return [];
      },
      async findActiveByTenant() {
        return [];
      },
      async findCodesByTenant() {
        return [];
      },
      async findByTenantAndCode() {
        return null;
      },
      async findByIds() {
        return [];
      },
      ...repos.units,
    } as never,
    { async record() {} } as never,
    {
      async assertBodyPartCanInactivate() {
        await repos.assertBodyPartCanInactivate?.();
      },
      async assertBodyPartCanDelete() {
        await repos.assertBodyPartCanDelete?.();
      },
      async assertMeasurementUnitCanInactivate() {
        await repos.assertMeasurementUnitCanInactivate?.();
      },
      async assertMeasurementUnitCanDelete() {
        await repos.assertMeasurementUnitCanDelete?.();
      },
    } as never,
  );
}

describe('MeasurementCatalogService', () => {
  it('inactivates a body part when no customer measurement uses it', async () => {
    let asserted = false;
    const saved: Record<string, unknown>[] = [];
    const service = createService({
      bodyParts: {
        async findById() {
          return {
            id: 'bp-1',
            tenantId: 'tenant-1',
            code: 'TESTA',
            displayName: 'Testa',
            status: MeasurementCatalogStatus.ACTIVE,
          };
        },
        async save(payload: Record<string, unknown>) {
          saved.push(payload);
          return payload;
        },
      },
      async assertBodyPartCanInactivate() {
        asserted = true;
      },
    });

    const updated = await service.updateBodyPart('bp-1', {
      tenantId: 'tenant-1',
      status: MeasurementCatalogStatus.INACTIVE,
      actorUserId: 'actor-1',
    });

    assert.equal(asserted, true);
    assert.equal(updated.status, MeasurementCatalogStatus.INACTIVE);
    assert.equal(saved[0]?.status, MeasurementCatalogStatus.INACTIVE);
  });

  it('blocks body part inactivation when dependency validation fails', async () => {
    const service = createService({
      bodyParts: {
        async findById() {
          return {
            id: 'bp-1',
            tenantId: 'tenant-1',
            code: 'BUSTO',
            displayName: 'Busto',
            status: MeasurementCatalogStatus.ACTIVE,
          };
        },
      },
      async assertBodyPartCanInactivate() {
        throw new DomainValidationError('Parte do corpo vinculada a 2 medições de clientes.');
      },
    });

    await assert.rejects(
      () =>
        service.updateBodyPart('bp-1', {
          tenantId: 'tenant-1',
          status: MeasurementCatalogStatus.INACTIVE,
          actorUserId: 'actor-1',
        }),
      DomainValidationError,
    );
  });

  it('soft-deletes a body part after dependency validation', async () => {
    const saved: Record<string, unknown>[] = [];
    const service = createService({
      bodyParts: {
        async findById() {
          return {
            id: 'bp-1',
            tenantId: 'tenant-1',
            code: 'TESTA',
            displayName: 'Testa',
            status: MeasurementCatalogStatus.ACTIVE,
            isDeleted: false,
          };
        },
        async save(payload: Record<string, unknown>) {
          saved.push(payload);
          return payload;
        },
      },
    });

    await service.removeBodyPart('bp-1', 'tenant-1', 'actor-1');
    assert.equal(saved[0]?.isDeleted, true);
  });

  it('does not recreate a default body part that was excluded', async () => {
    const created: unknown[] = [];
    const service = createService({
      bodyParts: {
        async findListedByTenant() {
          return [];
        },
        async findCodesByTenant() {
          return ['BUSTO', 'CINTURA', 'QUADRIL', 'OMBRO', 'PESCOCO', 'MANGA', 'PUNHO', 'COMPRIMENTO'];
        },
        async saveMany(payload: unknown[]) {
          created.push(...payload);
          return payload;
        },
      },
      units: {
        async findListedByTenant() {
          return [{ code: 'CM' }];
        },
        async findCodesByTenant() {
          return ['CM', 'MM', 'M', 'POL'];
        },
      },
    });

    await service.listBodyParts('tenant-1', 'actor-1');
    assert.equal(created.length, 0);
  });

  it('rejects inactivating the tenant default measurement unit', async () => {
    const service = createService({
      units: {
        async findById() {
          return {
            id: 'unit-1',
            tenantId: 'tenant-1',
            code: 'CM',
            displayName: 'CM',
            status: MeasurementCatalogStatus.ACTIVE,
          };
        },
      },
    });

    await assert.rejects(
      () =>
        service.updateUnit('unit-1', {
          tenantId: 'tenant-1',
          status: MeasurementCatalogStatus.INACTIVE,
          actorUserId: 'actor-1',
        }),
      /unidade padrão da Conta/,
    );
  });
});
