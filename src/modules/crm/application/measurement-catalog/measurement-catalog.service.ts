import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { DependencyValidationService } from 'src/modules/governance/application/dependency-validation.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
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
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(MeasurementBodyPartRepository)
    private readonly bodyPartRepository: MeasurementBodyPartRepository,
    @Inject(MeasurementUnitRepository)
    private readonly unitRepository: MeasurementUnitRepository,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(DependencyValidationService)
    private readonly dependencyValidationService: DependencyValidationService,
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
    return this.bodyPartRepository.findListedByTenant(tenantId);
  }

  async listUnits(tenantId: string, actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    return this.unitRepository.findListedByTenant(tenantId);
  }

  async createBodyPart(input: { tenantId: string; displayName: string; actorUserId: string; sortOrder?: number }) {
    await this.tenantService.getById(input.tenantId);
    const normalizedDisplayName = input.displayName.trim();
    if (!normalizedDisplayName) {
      throw new DomainValidationError('O nome da parte do corpo é obrigatório.');
    }

    const code = this.normalizeCode(normalizedDisplayName);
    const existing = await this.bodyPartRepository.findByTenantAndCode(input.tenantId, code);
    if (existing) {
      throw new DomainValidationError(`Já existe a parte do corpo '${normalizedDisplayName}'.`);
    }

    const entity = this.bodyPartRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      code,
      displayName: normalizedDisplayName,
      sortOrder: input.sortOrder ?? 0,
      status: MeasurementCatalogStatus.ACTIVE,
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

  async updateBodyPart(
    id: string,
    input: {
      tenantId: string;
      displayName?: string;
      sortOrder?: number;
      status?: MeasurementCatalogStatus;
      actorUserId: string;
    },
  ) {
    const entity = await this.bodyPartRepository.findById(id);
    if (!entity || entity.tenantId !== input.tenantId) {
      throw new EntityNotFoundError('A parte do corpo não foi encontrada.');
    }

    if (input.displayName !== undefined) {
      const normalizedDisplayName = input.displayName.trim();
      if (!normalizedDisplayName) {
        throw new DomainValidationError('O nome da parte do corpo é obrigatório.');
      }
      const code = this.normalizeCode(normalizedDisplayName);
      const existing = await this.bodyPartRepository.findByTenantAndCode(input.tenantId, code);
      if (existing && existing.id !== entity.id) {
        throw new DomainValidationError(`Já existe a parte do corpo '${normalizedDisplayName}'.`);
      }
      entity.displayName = normalizedDisplayName;
      entity.code = code;
    }

    if (input.sortOrder !== undefined) {
      entity.sortOrder = input.sortOrder;
    }
    if (input.status !== undefined && input.status !== entity.status) {
      if (input.status === MeasurementCatalogStatus.INACTIVE) {
        await this.dependencyValidationService.assertBodyPartCanInactivate(input.tenantId, id);
      }
      entity.status = input.status;
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

  async removeBodyPart(id: string, tenantId: string, actorUserId: string): Promise<void> {
    const entity = await this.bodyPartRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) {
      throw new EntityNotFoundError('A parte do corpo não foi encontrada.');
    }
    await this.dependencyValidationService.assertBodyPartCanDelete(tenantId, id);
    entity.isDeleted = true;
    entity.deletedAt = new Date();
    entity.deletedBy = actorUserId;
    entity.updatedBy = actorUserId;
    await this.bodyPartRepository.save(entity);
    await this.auditService.record({
      tenantId,
      actorUserId,
      entityType: 'measurement_body_part',
      entityId: entity.id,
      action: 'measurement.body_part.deleted',
      eventType: 'crm.write',
      metadata: { code: entity.code },
    });
  }

  async createUnit(input: { tenantId: string; code: string; displayName?: string; actorUserId: string; sortOrder?: number }) {
    await this.tenantService.getById(input.tenantId);
    const code = input.code.trim().toUpperCase();
    if (!code) {
      throw new DomainValidationError('O código da unidade de medida é obrigatório.');
    }

    const existing = await this.unitRepository.findByTenantAndCode(input.tenantId, code);
    if (existing) {
      throw new DomainValidationError(`Já existe a unidade de medida '${code}'.`);
    }

    const entity = this.unitRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      code,
      displayName: input.displayName?.trim() || code,
      sortOrder: input.sortOrder ?? 0,
      status: MeasurementCatalogStatus.ACTIVE,
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

  async updateUnit(
    id: string,
    input: {
      tenantId: string;
      code?: string;
      displayName?: string;
      sortOrder?: number;
      status?: MeasurementCatalogStatus;
      actorUserId: string;
    },
  ) {
    const entity = await this.unitRepository.findById(id);
    if (!entity || entity.tenantId !== input.tenantId) {
      throw new EntityNotFoundError('A unidade de medida não foi encontrada.');
    }

    if (input.code !== undefined) {
      const code = input.code.trim().toUpperCase();
      if (!code) {
        throw new DomainValidationError('O código da unidade de medida é obrigatório.');
      }
      const existing = await this.unitRepository.findByTenantAndCode(input.tenantId, code);
      if (existing && existing.id !== entity.id) {
        throw new DomainValidationError(`Já existe a unidade de medida '${code}'.`);
      }
      entity.code = code;
    }

    if (input.displayName !== undefined) {
      entity.displayName = input.displayName.trim() || entity.code;
    }

    if (input.sortOrder !== undefined) {
      entity.sortOrder = input.sortOrder;
    }
    if (input.status !== undefined && input.status !== entity.status) {
      if (input.status === MeasurementCatalogStatus.INACTIVE) {
        await this.assertUnitIsNotTenantDefault(input.tenantId, entity, 'inativar');
        await this.dependencyValidationService.assertMeasurementUnitCanInactivate(input.tenantId, id);
      }
      entity.status = input.status;
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

  async removeUnit(id: string, tenantId: string, actorUserId: string): Promise<void> {
    const entity = await this.unitRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) {
      throw new EntityNotFoundError('A unidade de medida não foi encontrada.');
    }
    await this.assertUnitIsNotTenantDefault(tenantId, entity, 'excluir');
    await this.dependencyValidationService.assertMeasurementUnitCanDelete(tenantId, id);
    entity.isDeleted = true;
    entity.deletedAt = new Date();
    entity.deletedBy = actorUserId;
    entity.updatedBy = actorUserId;
    await this.unitRepository.save(entity);
    await this.auditService.record({
      tenantId,
      actorUserId,
      entityType: 'measurement_unit',
      entityId: entity.id,
      action: 'measurement.unit.deleted',
      eventType: 'crm.write',
      metadata: { code: entity.code },
    });
  }

  async resolveBodyParts(tenantId: string, bodyPartIds: string[], actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    const uniqueIds = [...new Set(bodyPartIds)];
    const bodyParts = await this.bodyPartRepository.findByIds(tenantId, uniqueIds);
    if (bodyParts.length !== uniqueIds.length) {
      throw new DomainValidationError('Uma ou mais partes do corpo estão inativas ou não pertencem a esta Conta.');
    }
    return bodyParts;
  }

  async resolveUnits(tenantId: string, unitIds: string[], actorUserId: string) {
    await this.ensureTenantDefaults(tenantId, actorUserId);
    const uniqueIds = [...new Set(unitIds)];
    const units = await this.unitRepository.findByIds(tenantId, uniqueIds);
    if (units.length !== uniqueIds.length) {
      throw new DomainValidationError('Uma ou mais unidades de medida estão inativas ou não pertencem a esta Conta.');
    }
    return units;
  }

  async getDefaultUnit(tenantId: string, actorUserId: string): Promise<MeasurementUnitEntity> {
    const tenant = await this.tenantService.getById(tenantId);
    await this.ensureTenantDefaults(tenantId, actorUserId, tenant.defaultMeasurementUnitCode ?? 'CM');
    const defaultUnit = await this.unitRepository.findByTenantAndCode(tenantId, tenant.defaultMeasurementUnitCode ?? 'CM');
    if (!defaultUnit || defaultUnit.status !== MeasurementCatalogStatus.ACTIVE) {
      throw new EntityNotFoundError('A unidade de medida padrão da Conta não está disponível.');
    }
    return defaultUnit;
  }

  private async assertUnitIsNotTenantDefault(
    tenantId: string,
    unit: MeasurementUnitEntity,
    action: 'inativar' | 'excluir',
  ) {
    const tenant = await this.tenantService.getById(tenantId);
    const defaultCode = (tenant.defaultMeasurementUnitCode ?? 'CM').toUpperCase();
    if (unit.code === defaultCode) {
      throw new DomainValidationError(`Não é possível ${action} a unidade padrão da Conta (${defaultCode}).`);
    }
  }

  private async ensureTenantDefaults(tenantId: string, actorUserId: string, defaultUnitCode = 'CM') {
    await this.tenantService.getById(tenantId);
    const [listedBodyParts, listedUnits, existingBodyPartCodes, existingUnitCodes] = await Promise.all([
      this.bodyPartRepository.findListedByTenant(tenantId),
      this.unitRepository.findListedByTenant(tenantId),
      this.bodyPartRepository.findCodesByTenant(tenantId),
      this.unitRepository.findCodesByTenant(tenantId),
    ]);

    const knownBodyPartCodes = new Set(existingBodyPartCodes);
    const missingBodyParts = DEFAULT_BODY_PARTS.filter((item) => !knownBodyPartCodes.has(this.normalizeCode(item)));
    if (missingBodyParts.length > 0) {
      await this.bodyPartRepository.saveMany(
        missingBodyParts.map((item, index) =>
          this.bodyPartRepository.create({
            id: randomUUID(),
            tenantId,
            code: this.normalizeCode(item),
            displayName: item,
            sortOrder: listedBodyParts.length + index + 1,
            status: MeasurementCatalogStatus.ACTIVE,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
          }),
        ),
      );
    }

    const knownUnitCodes = new Set(existingUnitCodes);
    const defaultUnitsToEnsure = Array.from(new Set([...DEFAULT_UNITS, defaultUnitCode.toUpperCase()]));
    const missingUnits = defaultUnitsToEnsure.filter((item) => !knownUnitCodes.has(item));
    if (missingUnits.length > 0) {
      await this.unitRepository.saveMany(
        missingUnits.map((item, index) =>
          this.unitRepository.create({
            id: randomUUID(),
            tenantId,
            code: item,
            displayName: item,
            sortOrder: listedUnits.length + index + 1,
            status: MeasurementCatalogStatus.ACTIVE,
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
