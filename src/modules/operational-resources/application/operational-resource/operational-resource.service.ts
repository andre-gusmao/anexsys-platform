import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { ProductionOrderOperationalAssignmentRepository } from 'src/modules/production-orders/infrastructure/persistence/repositories/production-order-operational-assignment.repository';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CreateOperationalResourceDto } from '../../contracts/dto/create-operational-resource.dto';
import { UpdateOperationalResourceAvailabilityDto } from '../../contracts/dto/update-operational-resource-availability.dto';
import { UpdateOperationalResourceDto } from '../../contracts/dto/update-operational-resource.dto';
import { OperationalResourceBranchScopeEntity } from '../../infrastructure/persistence/entities/operational-resource-branch-scope.entity';
import { OperationalResourceEntity } from '../../infrastructure/persistence/entities/operational-resource.entity';
import { OperationalResourceBranchScopeRepository } from '../../infrastructure/persistence/repositories/operational-resource-branch-scope.repository';
import {
  OperationalResourceRepository,
  OperationalResourceSearchFilters,
} from '../../infrastructure/persistence/repositories/operational-resource.repository';

@Injectable()
export class OperationalResourceService {
  constructor(
    @Inject(DataSource)
    private readonly dataSource: DataSource,
    @Inject(OperationalResourceRepository)
    private readonly operationalResourceRepository: OperationalResourceRepository,
    @Inject(OperationalResourceBranchScopeRepository)
    private readonly branchScopeRepository: OperationalResourceBranchScopeRepository,
    @Inject(ProductionOrderOperationalAssignmentRepository)
    private readonly assignmentRepository: ProductionOrderOperationalAssignmentRepository,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateOperationalResourceDto): Promise<OperationalResourceEntity> {
    await this.tenantService.getById(dto.tenantId);
    await this.assertBranchesBelongToTenant(dto.tenantId, [dto.homeBranchId ?? undefined, ...(dto.branchScopeBranchIds ?? [])]);
    this.assertAvailabilityWindow(dto.availableFrom ?? null, dto.availableUntil ?? null);

    const resource = this.operationalResourceRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      homeBranchId: dto.homeBranchId ?? null,
      resourceType: dto.resourceType,
      displayName: dto.displayName.trim(),
      documentNo: dto.documentNo?.trim() || null,
      phone: dto.phone?.trim() || null,
      email: dto.email?.trim().toLowerCase() || null,
      skillProfile: this.normalizeSkills(dto.skills),
      qualificationNotes: dto.qualificationNotes?.trim() || null,
      availabilityStatus: dto.availabilityStatus ?? OperationalAvailabilityStatus.AVAILABLE,
      availableFrom: dto.availableFrom ?? null,
      availableUntil: dto.availableUntil ?? null,
      availabilityNotes: dto.availabilityNotes?.trim() || null,
      status: OperationalResourceStatus.ACTIVE,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const branchScopeBranchIds = this.normalizeBranchScopeBranchIds(dto.homeBranchId ?? null, dto.branchScopeBranchIds ?? []);
    const today = this.today();

    const saved = await this.dataSource.transaction(async (manager) => {
      const persisted = await manager.save(OperationalResourceEntity, manager.create(OperationalResourceEntity, resource));
      if (branchScopeBranchIds.length > 0) {
        await manager.save(
          OperationalResourceBranchScopeEntity,
          branchScopeBranchIds.map((branchId) =>
            manager.create(OperationalResourceBranchScopeEntity, {
              id: randomUUID(),
              tenantId: dto.tenantId,
              operationalResourceId: persisted.id,
              branchId,
              validFrom: today,
              validTo: null,
              scopeRole: null,
              createdBy: dto.actorUserId,
              updatedBy: dto.actorUserId,
            }),
          ),
        );
      }
      return persisted;
    });

    await this.auditService.record({
      tenantId: saved.tenantId,
      branchId: saved.homeBranchId,
      actorUserId: dto.actorUserId,
      entityType: 'operational_resource',
      entityId: saved.id,
      action: 'operational_resource.created',
      eventType: 'production.write',
      metadata: { resourceType: saved.resourceType, availabilityStatus: saved.availabilityStatus },
    });

    return saved;
  }

  async search(tenantId: string, filters: OperationalResourceSearchFilters): Promise<OperationalResourceEntity[]> {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) {
        throw new DomainValidationError('Branch must belong to the same tenant.');
      }
    }
    return this.operationalResourceRepository.search(tenantId, filters);
  }

  async getById(resourceId: string, tenantId: string): Promise<OperationalResourceEntity> {
    const resource = await this.operationalResourceRepository.findById(resourceId);
    if (!resource || resource.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Operational Resource '${resourceId}' was not found.`);
    }
    return resource;
  }

  async getDetails(tenantId: string, resourceId: string) {
    const resource = await this.getById(resourceId, tenantId);
    const [branchScopes, assignments, history] = await Promise.all([
      this.branchScopeRepository.findByResource(resourceId),
      this.assignmentRepository.findByResource(tenantId, resourceId),
      this.auditService.listByEntity(tenantId, 'operational_resource', resourceId, 200),
    ]);

    return {
      resource,
      branchScopes,
      assignments,
      history,
      timeline: [...history].reverse(),
    };
  }

  async update(resourceId: string, tenantId: string, dto: UpdateOperationalResourceDto): Promise<OperationalResourceEntity> {
    const resource = await this.getById(resourceId, tenantId);
    const scopeBranchIds = dto.branchScopeBranchIds?.map((value) => value) ?? undefined;
    await this.assertBranchesBelongToTenant(tenantId, [dto.homeBranchId ?? undefined, ...(scopeBranchIds ?? [])]);
    this.assertAvailabilityWindow(dto.availableFrom ?? null, dto.availableUntil ?? null);

    if (dto.homeBranchId !== undefined) {
      resource.homeBranchId = dto.homeBranchId ?? null;
    }
    if (dto.resourceType !== undefined) {
      resource.resourceType = dto.resourceType;
    }
    if (dto.displayName !== undefined) {
      resource.displayName = dto.displayName.trim();
    }
    if (dto.documentNo !== undefined) {
      resource.documentNo = dto.documentNo?.trim() || null;
    }
    if (dto.phone !== undefined) {
      resource.phone = dto.phone?.trim() || null;
    }
    if (dto.email !== undefined) {
      resource.email = dto.email?.trim().toLowerCase() || null;
    }
    if (dto.qualificationNotes !== undefined) {
      resource.qualificationNotes = dto.qualificationNotes?.trim() || null;
    }
    if (dto.status !== undefined) {
      resource.status = dto.status;
    }
    if (dto.availabilityStatus !== undefined) {
      resource.availabilityStatus = dto.availabilityStatus;
    }
    if (dto.availableFrom !== undefined) {
      resource.availableFrom = dto.availableFrom ?? null;
    }
    if (dto.availableUntil !== undefined) {
      resource.availableUntil = dto.availableUntil ?? null;
    }
    if (dto.availabilityNotes !== undefined) {
      resource.availabilityNotes = dto.availabilityNotes?.trim() || null;
    }
    resource.updatedBy = dto.actorUserId;

    const saved = await this.dataSource.transaction(async (manager) => {
      const persisted = await manager.save(OperationalResourceEntity, resource);
      if (scopeBranchIds) {
        await this.syncBranchScopes(
          manager,
          persisted.id,
          tenantId,
          persisted.homeBranchId,
          scopeBranchIds,
          dto.actorUserId,
        );
      }
      return persisted;
    });

    await this.auditService.record({
      tenantId,
      branchId: saved.homeBranchId,
      actorUserId: dto.actorUserId,
      entityType: 'operational_resource',
      entityId: saved.id,
      action: 'operational_resource.updated',
      eventType: 'production.write',
      metadata: { status: saved.status },
    });

    return saved;
  }

  async addSkills(resourceId: string, tenantId: string, skills: string[], actorUserId: string): Promise<OperationalResourceEntity> {
    const resource = await this.getById(resourceId, tenantId);
    const mergedSkills = this.mergeSkills(resource.skillProfile, skills);
    resource.skillProfile = mergedSkills;
    resource.updatedBy = actorUserId;
    const saved = await this.operationalResourceRepository.save(resource);
    await this.auditService.record({
      tenantId,
      branchId: saved.homeBranchId,
      actorUserId,
      entityType: 'operational_resource',
      entityId: saved.id,
      action: 'operational_resource.skills.updated',
      eventType: 'production.write',
      metadata: { skills: mergedSkills },
    });
    return saved;
  }

  async updateAvailability(
    resourceId: string,
    tenantId: string,
    dto: UpdateOperationalResourceAvailabilityDto,
  ): Promise<OperationalResourceEntity> {
    const resource = await this.getById(resourceId, tenantId);
    this.assertAvailabilityWindow(dto.availableFrom ?? null, dto.availableUntil ?? null);
    resource.availabilityStatus = dto.availabilityStatus;
    resource.availableFrom = dto.availableFrom ?? null;
    resource.availableUntil = dto.availableUntil ?? null;
    resource.availabilityNotes = dto.availabilityNotes?.trim() || null;
    resource.updatedBy = dto.actorUserId;
    const saved = await this.operationalResourceRepository.save(resource);
    await this.auditService.record({
      tenantId,
      branchId: saved.homeBranchId,
      actorUserId: dto.actorUserId,
      entityType: 'operational_resource',
      entityId: saved.id,
      action: 'operational_resource.availability.updated',
      eventType: 'production.write',
      metadata: {
        availabilityStatus: saved.availabilityStatus,
        availableFrom: saved.availableFrom,
        availableUntil: saved.availableUntil,
      },
    });
    return saved;
  }

  async listAssignments(tenantId: string, resourceId: string) {
    await this.getById(resourceId, tenantId);
    return this.assignmentRepository.findByResource(tenantId, resourceId);
  }

  async assertAssignableToBranch(tenantId: string, resourceId: string, branchId: string): Promise<OperationalResourceEntity> {
    const resource = await this.getById(resourceId, tenantId);
    if (resource.status !== OperationalResourceStatus.ACTIVE) {
      throw new DomainValidationError('Operational Resource must be active.');
    }
    if (resource.availabilityStatus === OperationalAvailabilityStatus.UNAVAILABLE) {
      throw new DomainValidationError('Operational Resource is not available.');
    }
    const currentScopes = await this.branchScopeRepository.findCurrentByResource(resourceId);
    const visibleBranchIds = new Set<string>();
    if (resource.homeBranchId) {
      visibleBranchIds.add(resource.homeBranchId);
    }
    for (const scope of currentScopes) {
      visibleBranchIds.add(scope.branchId);
    }
    if (!visibleBranchIds.has(branchId)) {
      throw new DomainValidationError('Operational Resource is outside the requested production branch scope.');
    }
    return resource;
  }

  async assertResourceBranchAccess(resourceId: string, tenantId: string, accessibleBranchIds: string[]): Promise<void> {
    const resource = await this.getById(resourceId, tenantId);
    const currentScopes = await this.branchScopeRepository.findCurrentByResource(resourceId);
    const visibleBranchIds = new Set<string>();
    if (resource.homeBranchId) {
      visibleBranchIds.add(resource.homeBranchId);
    }
    for (const scope of currentScopes) {
      visibleBranchIds.add(scope.branchId);
    }
    if (![...visibleBranchIds].some((branchId) => accessibleBranchIds.includes(branchId))) {
      throw new DomainValidationError('Requested operational resource is outside the authenticated branch scope.');
    }
  }

  private async syncBranchScopes(
    manager: EntityManager,
    resourceId: string,
    tenantId: string,
    homeBranchId: string | null,
    branchScopeBranchIds: string[],
    actorUserId: string,
  ): Promise<void> {
    const existingScopes = await manager
      .createQueryBuilder(OperationalResourceBranchScopeEntity, 'scope')
      .where('scope.operational_resource_id = :resourceId', { resourceId })
      .andWhere('scope.valid_from <= CURRENT_DATE')
      .andWhere('(scope.valid_to IS NULL OR scope.valid_to > CURRENT_DATE)')
      .orderBy('scope.valid_from', 'ASC')
      .addOrderBy('scope.created_at', 'ASC')
      .getMany();
    const desiredBranchIds = new Set(this.normalizeBranchScopeBranchIds(homeBranchId, branchScopeBranchIds));
    const today = this.today();

    for (const scope of existingScopes) {
      if (!desiredBranchIds.has(scope.branchId)) {
        scope.validTo = today;
        scope.updatedBy = actorUserId;
        await manager.save(OperationalResourceBranchScopeEntity, scope);
      }
    }

    const existingBranchIds = new Set(existingScopes.map((scope) => scope.branchId));
    const missingScopes: OperationalResourceBranchScopeEntity[] = [];
    for (const branchId of desiredBranchIds) {
      if (!existingBranchIds.has(branchId)) {
        missingScopes.push(
          manager.create(OperationalResourceBranchScopeEntity, {
            id: randomUUID(),
            tenantId,
            operationalResourceId: resourceId,
            branchId,
            validFrom: today,
            validTo: null,
            scopeRole: null,
            createdBy: actorUserId,
            updatedBy: actorUserId,
          }),
        );
      }
    }

    if (missingScopes.length > 0) {
      await manager.save(OperationalResourceBranchScopeEntity, missingScopes);
    }
  }

  private async assertBranchesBelongToTenant(tenantId: string, branchIds: Array<string | undefined>): Promise<void> {
    for (const branchId of new Set(branchIds.filter((value): value is string => Boolean(value)))) {
      const branch = await this.branchService.getById(branchId);
      if (branch.tenantId !== tenantId) {
        throw new DomainValidationError('Branch must belong to the same tenant.');
      }
    }
  }

  private normalizeSkills(skills?: string[]): string[] | null {
    const normalized = [...new Set((skills ?? []).map((skill) => skill.trim().toLowerCase()).filter(Boolean))].sort();
    return normalized.length > 0 ? normalized : null;
  }

  private mergeSkills(existing: string[] | null, input: string[]): string[] {
    const merged = new Set<string>(existing ?? []);
    for (const skill of this.normalizeSkills(input) ?? []) {
      merged.add(skill);
    }
    return [...merged].sort();
  }

  private assertAvailabilityWindow(availableFrom: string | null, availableUntil: string | null): void {
    if (availableFrom && availableUntil && availableUntil < availableFrom) {
      throw new DomainValidationError('Availability end date must be the same as or after the start date.');
    }
  }

  private normalizeBranchScopeBranchIds(homeBranchId: string | null, branchScopeBranchIds: string[]): string[] {
    return [...new Set([...(homeBranchId ? [homeBranchId] : []), ...branchScopeBranchIds])];
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
