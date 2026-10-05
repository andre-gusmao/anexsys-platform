import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { MeasurementBodyPartEntity } from '../../infrastructure/persistence/entities/measurement-body-part.entity';
import { MeasurementUnitEntity } from '../../infrastructure/persistence/entities/measurement-unit.entity';
import { MeasurementBodyPartRepository } from '../../infrastructure/persistence/repositories/measurement-body-part.repository';
import { MeasurementUnitRepository } from '../../infrastructure/persistence/repositories/measurement-unit.repository';

const DEFAULT_BODY_PARTS = [
  'Busto',
  'Cintura',
  'Quadril',
  'Ombro',
  'Pescoço',
  'Manga',
  'Punho',
  'Comprimento',
] as const;

const DEFAULT_UNITS = ['CM', 'MM', 'M', 'POL'] as const;

@Injectable()
export class MeasurementCatalogService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly bodyPartRepository: MeasurementBodyPartRepository,
    private readonly unitRepository: MeasurementUnitRepository,
    private readonly auditService: AuditService,
  ) {}

  async getCatalog(tenantId: string, actorUserId: string) {
    const tenant = await this.tenantService.getById(tenantId);
    await this.ensureTenantDefaults(tenantId, actorUserId, tenant.defaultMeasurementUnitCode ?? 'CM');

    const [bodyParts, units] = await Promise.all([
      this.bodyPartRepository.findActiveByTenant(tenantId),
      this.unitRepository.findActiveByTenant(tenantId),
    ]);

    const defaultUnitCode = tenant.defaultMeasurementUnitCode ?? 'CM';
    const defaultUnit = units.find((unit) => unit.code === defaultUnitCode) ?? null;

    return {
      bodyParts,
      units,
      defaultUnitCode,
      defaultUnitId: defaultUnit?.id ?? null,
    };
  }

  async listBodyParts(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.bodyPartRepository.findActiveByTenant(tenantId);
  }

  async listUnits(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.unitRepository.findActiveByTenant(tenantId);
  }

  async createBodyPart(input: { tenantId: string; displayName: string; actorUserId: string; sortOrder?: number }) {
    await this.tenantService.getById(input.tenantId);
    const normalizedDisplayName = input.displayName.trim();
    if (!normalizedDisplayName) {
      throw new DomainValidationError('Body part display name is required.');
    }

    const code = this.normalizeCode(normalizedDisplayName);
    const existing = await this.bodyPartRepository.findByTenantAndCode(input.tenantId, code);
    if (existing) {
      throw new DomainValidationError(`Body part '${normalizedDisplayName}' already exists.`);
    }

    const entity = this.bodyPartRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      code,
      displayName: normalizedDisplayName,
      sortOrder: input.sortOrder ?? 0,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    });

    const saved = await this.bodyPartRepository.save(entity);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'measurement_body_part',
      entityId: saved.id,
      action: 'measurement.body_part.created',
      eventType: 'crm.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async updateBodyPart(id: string, input: { tenantId: string; displayName?: string; sortOrder?: number; actorUserId: string }) {
    const entity = await this.bodyPartRepository.findById(id);
    if (!entity || entity.tenantId !== input.tenantId) {
      throw new EntityNotFoundError(`Body part '${id}' was not found.`);
    }

    if (input.displayName !== undefined) {
      const normalizedDisplayName = input.displayName.trim();
      if (!normalizedDisplayName) {
        throw new DomainValidationError('Body part display name is required.');
      }
      const code = this.normalizeCode(normalizedDisplayName);
      const existing = await this.bodyPartRepository.findByTenantAndCode(input.tenantId, code);
      if (existing && existing.id !== entity.id) {
        throw new DomainValidationError(`Body part '${normalizedDisplayName}' already exists.`);
      }
      entity.displayName = normalizedDisplayName;
      entity.code = code;
    }

    if (input.sortOrder !== undefined) {
      entity.sortOrder = input.sortOrder;
    }
    entity.updatedBy = input.actorUserId;

    const saved = await this.bodyPartRepository.save(entity);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'measurement_body_part',
      entityId: saved.id,
      action: 'measurement.body_part.updated',
      eventType: 'crm.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async createUnit(input: { tenantId: string; code: string; displayName?: string; actorUserId: string; sortOrder?: number }) {
    await this.tenantService.getById(input.tenantId);
    const code = input.code.trim().toUpperCase();
    if (!code) {
      throw new DomainValidationError('Measurement unit code is required.');
    }

    const existing = await this.unitRepository.findByTenantAndCode(input.tenantId, code);
    if (existing) {
      throw new DomainValidationError(`Measurement unit '${code}' already exists.`);
    }

    const entity = this.unitRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      code,
      displayName: input.displayName?.trim() || code,
      sortOrder: input.sortOrder ?? 0,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    });

    const saved = await this.unitRepository.save(entity);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'measurement_unit',
      entityId: saved.id,
      action: 'measurement.unit.created',
      eventType: 'crm.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async updateUnit(id: string, input: { tenantId: string; code?: string; displayName?: string; sortOrder?: number; actorUserId: string }) {
    const entity = await this.unitRepository.findById(id);
    if (!entity || entity.tenantId !== input.tenantId) {
      throw new EntityNotFoundError(`Measurement unit '${id}' was not found.`);
    }

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      if (!code) {
        throw new DomainValidationError('Measurement unit code is required.');
      }
      const existing = await this.unitRepository.findByTenantAndCode(input.tenantId, code);
      if (existing && existing.id !== entity.id) {
        throw new DomainValidationError(`Measurement unit '${code}' already exists.`);
      }
      entity.code = code;
    }

    if (input.displayName !== undefined) {
      entity.displayName = input.displayName.trim() || entity.code;
    }

    if (input.sortOrder !== undefined) {
      entity.sortOrder = input.sortOrder;
    }
    entity.updatedBy = input.actorUserId;

    const saved = await this.unitRepository.save(entity);
    await this.auditService.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      entityType: 'measurement_unit',
      entityId: saved.id,
      action: 'measurement.unit.updated',
      eventType: 'crm.write',
      metadata: { code: saved.code },
    });

    return saved;
  }

  async resolveBodyParts(tenantId: string, bodyPartIds: string[], actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    const bodyParts = await this.bodyPartRepository.findByIds(tenantId, bodyPartIds);
    if (bodyParts.length !== bodyPartIds.length) {
      throw new DomainValidationError('One or more body parts are invalid for the tenant context.');
    }
    return bodyParts;
  }

  async resolveUnits(tenantId: string, unitIds: string[], actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    const units = await this.unitRepository.findByIds(tenantId, unitIds);
    if (units.length !== unitIds.length) {
      throw new DomainValidationError('One or more measurement units are invalid for the tenant context.');
    }
    return units;
  }

  async getDefaultUnit(tenantId: string, actorUserId: string): Promise<MeasurementUnitEntity> {
    const tenant = await this.tenantService.getById(tenantId);
    await this.ensureTenantDefaults(tenantId, actorUserId, tenant.defaultMeasurementUnitCode ?? 'CM');
    const defaultUnit = await this.unitRepository.findByTenantAndCode(tenantId, tenant.defaultMeasurementUnitCode ?? 'CM');
    if (!defaultUnit) {
      throw new EntityNotFoundError(`Default measurement unit '${tenant.defaultMeasurementUnitCode ?? 'CM'}' was not found.`);
    }
    return defaultUnit;
  }

  private async ensureTenantDefaults(tenantId: string, actorUserId: string, defaultUnitCode = 'CM') {
    await this.tenantService.getById(tenantId);
    const [bodyParts, units] = await Promise.all([
      this.bodyPartRepository.findActiveByTenant(tenantId),
      this.unitRepository.findActiveByTenant(tenantId),
    ]);

    const existingBodyPartCodes = new Set(bodyParts.map((item) => item.code));
    const missingBodyParts = DEFAULT_BODY_PARTS.filter((item) => !existingBodyPartCodes.has(this.normalizeCode(item)));
    if (missingBodyParts.length > 0) {
      await this.bodyPartRepository.saveMany(
        missingBodyParts.map((item, index) =>
          this.bodyPartRepository.create({
            id: randomUUID(),
            tenantId,
            code: this.normalizeCode(item),
            displayName: item,
            sortOrder: bodyParts.length + index + 1,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
          }),
        ),
      );
    }

    const existingUnitCodes = new Set(units.map((item) => item.code));
    const defaultUnitsToEnsure = Array.from(new Set([...DEFAULT_UNITS, defaultUnitCode.toUpperCase()]));
    const missingUnits = defaultUnitsToEnsure.filter((item) => !existingUnitCodes.has(item));
    if (missingUnits.length > 0) {
      await this.unitRepository.saveMany(
        missingUnits.map((item, index) =>
          this.unitRepository.create({
            id: randomUUID(),
            tenantId,
            code: item,
            displayName: item,
            sortOrder: units.length + index + 1,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
          }),
        ),
      );
    }
  }

  private normalizeCode(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
  }
}
