import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { CreateProductionOrderVersionDto } from 'src/modules/production-orders/contracts/dto/create-production-order-version.dto';
import { ProductionOrderOperationalAssignmentRepository } from 'src/modules/production-orders/infrastructure/persistence/repositories/production-order-operational-assignment.repository';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { ProductionOrderVersionReason, ReworkCaseStatus } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { AssignReworkCaseDto } from '../../contracts/dto/assign-rework-case.dto';
import { CloseReworkCaseDto } from '../../contracts/dto/close-rework-case.dto';
import { CreateReworkCaseDto } from '../../contracts/dto/create-rework-case.dto';
import { SearchReworkCasesDto } from '../../contracts/dto/search-rework-cases.dto';
import { UpdateReworkCaseDto } from '../../contracts/dto/update-rework-case.dto';
import { ReworkCaseEntity } from '../../infrastructure/persistence/entities/rework-case.entity';
import { ReworkCaseRepository } from '../../infrastructure/persistence/repositories/rework-case.repository';

@Injectable()
export class ReworkService {
  constructor(
    @Inject(ReworkCaseRepository)
    private readonly reworkCaseRepository: ReworkCaseRepository,
    @Inject(ProductionOrderService)
    private readonly productionOrderService: ProductionOrderService,
    @Inject(ProductionOrderOperationalAssignmentRepository)
    private readonly assignmentRepository: ProductionOrderOperationalAssignmentRepository,
    @Inject(OperationalResourceService)
    private readonly operationalResourceService: OperationalResourceService,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(ServiceOrderService)
    private readonly serviceOrderService: ServiceOrderService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async search(tenantId: string, filters: SearchReworkCasesDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (filters.productionOrderId) {
      await this.productionOrderService.getById(filters.productionOrderId, tenantId);
    }
    return this.reworkCaseRepository.search(tenantId, filters);
  }

  async getById(reworkCaseId: string, tenantId: string): Promise<ReworkCaseEntity> {
    const entity = await this.reworkCaseRepository.findById(reworkCaseId);
    if (!entity || entity.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Rework Case '${reworkCaseId}' was not found.`);
    }
    return entity;
  }

  async getDetails(tenantId: string, reworkCaseId: string) {
    const entity = await this.getById(reworkCaseId, tenantId);
    const productionOrder = await this.productionOrderService.getById(entity.productionOrderId, tenantId);
    const history = await this.auditService.listByEntity(tenantId, 'rework_case', entity.id, 200);
    return {
      reworkCase: entity,
      productionOrder,
      attribution: this.buildAttribution(entity),
      history,
      timeline: [...history].reverse(),
    };
  }

  async create(dto: CreateReworkCaseDto): Promise<ReworkCaseEntity> {
    const productionOrderDetails = await this.productionOrderService.getDetails(dto.tenantId, dto.productionOrderId);
    const linkedItemIds = new Set(productionOrderDetails.items.map((item) => item.id));
    if (dto.affectedServiceOrderItemIds.length === 0) {
      throw new DomainValidationError('Rework requires at least one affected Service Order item.');
    }
    for (const itemId of dto.affectedServiceOrderItemIds) {
      if (!linkedItemIds.has(itemId)) {
        throw new DomainValidationError('Rework items must belong to the linked Production Order.');
      }
    }
    if (dto.correctiveOperationalResourceId) {
      await this.operationalResourceService.assertAssignableToBranch(dto.tenantId, dto.correctiveOperationalResourceId, productionOrderDetails.productionOrder.branchId);
    }

    const originalAssignment = await this.assignmentRepository.findCurrentPrimaryByProductionOrder(dto.productionOrderId);
    const createdVersion = await this.productionOrderService.createVersion(dto.productionOrderId, dto.tenantId, {
      actorUserId: dto.actorUserId,
      versionReason: ProductionOrderVersionReason.REWORK,
      changeSummary: dto.reworkReason,
      activate: true,
      isDraft: false,
      resourceChangeNotes: dto.assignmentNotes ?? null,
      affectedServiceOrderItemIds: dto.affectedServiceOrderItemIds,
    } as CreateProductionOrderVersionDto);

    const entity = this.reworkCaseRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: productionOrderDetails.productionOrder.branchId,
      productionOrderId: dto.productionOrderId,
      productionOrderVersionId: createdVersion.id,
      serviceOrderItemIds: [...new Set(dto.affectedServiceOrderItemIds)],
      qualityRecordId: dto.qualityRecordId ?? null,
      customerRejectionId: dto.customerRejectionId ?? null,
      originalOperationalResourceId: originalAssignment?.operationalResourceId ?? null,
      correctiveOperationalResourceId: dto.correctiveOperationalResourceId ?? null,
      reworkReason: dto.reworkReason.trim(),
      assignmentNotes: dto.assignmentNotes?.trim() || null,
      closedAt: null,
      openedAt: dto.openedAt ? new Date(dto.openedAt) : new Date(),
      status: dto.correctiveOperationalResourceId ? ReworkCaseStatus.ASSIGNED : ReworkCaseStatus.OPEN,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.reworkCaseRepository.save(entity);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'rework_case',
      entityId: saved.id,
      action: 'rework_case.created',
      eventType: 'quality.write',
      metadata: {
        productionOrderId: saved.productionOrderId,
        productionOrderVersionId: saved.productionOrderVersionId,
        originalOperationalResourceId: saved.originalOperationalResourceId,
        correctiveOperationalResourceId: saved.correctiveOperationalResourceId,
        serviceOrderItemIds: saved.serviceOrderItemIds,
      },
    });
    return saved;
  }

  async update(reworkCaseId: string, tenantId: string, dto: UpdateReworkCaseDto): Promise<ReworkCaseEntity> {
    const entity = await this.getById(reworkCaseId, tenantId);
    if (entity.status === ReworkCaseStatus.CLOSED) {
      throw new DomainValidationError('Closed rework cases cannot be edited.');
    }
    if (dto.reworkReason !== undefined) entity.reworkReason = dto.reworkReason.trim();
    if (dto.assignmentNotes !== undefined) entity.assignmentNotes = dto.assignmentNotes?.trim() || null;
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.reworkCaseRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'rework_case',
      entityId: saved.id,
      action: 'rework_case.updated',
      eventType: 'quality.write',
      metadata: { status: saved.status },
    });
    return saved;
  }

  async assign(reworkCaseId: string, tenantId: string, dto: AssignReworkCaseDto, reassign = false): Promise<ReworkCaseEntity> {
    const entity = await this.getById(reworkCaseId, tenantId);
    if (entity.status === ReworkCaseStatus.CLOSED) {
      throw new DomainValidationError('Closed rework cases cannot be assigned.');
    }
    await this.operationalResourceService.assertAssignableToBranch(tenantId, dto.correctiveOperationalResourceId, entity.branchId);
    entity.correctiveOperationalResourceId = dto.correctiveOperationalResourceId;
    entity.assignmentNotes = dto.assignmentNotes?.trim() || null;
    entity.status = ReworkCaseStatus.ASSIGNED;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.reworkCaseRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'rework_case',
      entityId: saved.id,
      action: reassign ? 'rework_case.reassigned' : 'rework_case.assigned',
      eventType: 'quality.workflow',
      metadata: { correctiveOperationalResourceId: saved.correctiveOperationalResourceId },
    });
    return saved;
  }

  async close(reworkCaseId: string, tenantId: string, dto: CloseReworkCaseDto): Promise<ReworkCaseEntity> {
    const entity = await this.getById(reworkCaseId, tenantId);
    entity.status = ReworkCaseStatus.CLOSED;
    entity.closedAt = new Date();
    entity.updatedBy = dto.actorUserId;
    const saved = await this.reworkCaseRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'rework_case',
      entityId: saved.id,
      action: 'rework_case.closed',
      eventType: 'quality.workflow',
      metadata: { closureNotes: dto.closureNotes?.trim() || null },
    });
    return saved;
  }

  async getAttribution(reworkCaseId: string, tenantId: string) {
    return this.buildAttribution(await this.getById(reworkCaseId, tenantId));
  }

  private buildAttribution(entity: ReworkCaseEntity) {
    return {
      originalOperationalResourceId: entity.originalOperationalResourceId,
      correctiveOperationalResourceId: entity.correctiveOperationalResourceId,
      qualityPenaltyOperationalResourceId: entity.originalOperationalResourceId,
      productionCreditOperationalResourceId: entity.correctiveOperationalResourceId,
      correctiveResourceReceivesQualityPenalty: false,
    };
  }
}
