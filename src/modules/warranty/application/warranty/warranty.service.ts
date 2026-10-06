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
import { ProductionOrderVersionReason, WarrantyAdjustmentStatus, WarrantyExecutionStatus, WarrantyStartSource } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CreateWarrantyAdjustmentDto } from '../../contracts/dto/create-warranty-adjustment.dto';
import { CreateWarrantyExecutionDto } from '../../contracts/dto/create-warranty-execution.dto';
import { ResolveWarrantyExecutionDto } from '../../contracts/dto/resolve-warranty-execution.dto';
import { SearchWarrantyAdjustmentsDto } from '../../contracts/dto/search-warranty-adjustments.dto';
import { SearchWarrantyExecutionsDto } from '../../contracts/dto/search-warranty-executions.dto';
import { UpdateWarrantyAdjustmentDto } from '../../contracts/dto/update-warranty-adjustment.dto';
import { UpdateWarrantyExecutionDto } from '../../contracts/dto/update-warranty-execution.dto';
import { WarrantyAdjustmentEntity } from '../../infrastructure/persistence/entities/warranty-adjustment.entity';
import { WarrantyExecutionEntity } from '../../infrastructure/persistence/entities/warranty-execution.entity';
import { WarrantyAdjustmentRepository } from '../../infrastructure/persistence/repositories/warranty-adjustment.repository';
import { WarrantyExecutionRepository } from '../../infrastructure/persistence/repositories/warranty-execution.repository';

@Injectable()
export class WarrantyService {
  constructor(
    @Inject(WarrantyAdjustmentRepository)
    private readonly warrantyAdjustmentRepository: WarrantyAdjustmentRepository,
    @Inject(WarrantyExecutionRepository)
    private readonly warrantyExecutionRepository: WarrantyExecutionRepository,
    @Inject(ProductionOrderService)
    private readonly productionOrderService: ProductionOrderService,
    @Inject(ProductionOrderOperationalAssignmentRepository)
    private readonly assignmentRepository: ProductionOrderOperationalAssignmentRepository,
    @Inject(OperationalResourceService)
    private readonly operationalResourceService: OperationalResourceService,
    @Inject(ServiceOrderService)
    private readonly serviceOrderService: ServiceOrderService,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async searchAdjustments(tenantId: string, filters: SearchWarrantyAdjustmentsDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (filters.serviceOrderId) await this.serviceOrderService.getById(filters.serviceOrderId, tenantId);
    return this.warrantyAdjustmentRepository.search(tenantId, filters);
  }

  async searchExecutions(tenantId: string, filters: SearchWarrantyExecutionsDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (filters.serviceOrderId) await this.serviceOrderService.getById(filters.serviceOrderId, tenantId);
    if (filters.productionOrderId) await this.productionOrderService.getById(filters.productionOrderId, tenantId);
    return this.warrantyExecutionRepository.search(tenantId, filters);
  }

  async getAdjustmentById(id: string, tenantId: string): Promise<WarrantyAdjustmentEntity> {
    const entity = await this.warrantyAdjustmentRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) throw new EntityNotFoundError(`Warranty Adjustment '${id}' was not found.`);
    return entity;
  }

  async getExecutionById(id: string, tenantId: string): Promise<WarrantyExecutionEntity> {
    const entity = await this.warrantyExecutionRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) throw new EntityNotFoundError(`Warranty Execution '${id}' was not found.`);
    return entity;
  }

  async getAdjustmentDetails(tenantId: string, id: string) {
    const entity = await this.getAdjustmentById(id, tenantId);
    const serviceOrder = await this.serviceOrderService.getById(entity.serviceOrderId, tenantId);
    const history = await this.auditService.listByEntity(tenantId, 'warranty_adjustment', entity.id, 200);
    return { warrantyAdjustment: entity, serviceOrder, history, timeline: [...history].reverse() };
  }

  async getExecutionDetails(tenantId: string, id: string) {
    const entity = await this.getExecutionById(id, tenantId);
    const productionOrder = await this.productionOrderService.getById(entity.productionOrderId, tenantId);
    const history = await this.auditService.listByEntity(tenantId, 'warranty_execution', entity.id, 200);
    return { warrantyExecution: entity, productionOrder, history, timeline: [...history].reverse() };
  }

  async createAdjustment(dto: CreateWarrantyAdjustmentDto): Promise<WarrantyAdjustmentEntity> {
    const tenant = await this.tenantService.getById(dto.tenantId);
    const serviceOrderDetails = await this.serviceOrderService.getDetails(dto.tenantId, dto.serviceOrderId);
    const warrantyStart = this.resolveWarrantyStart(serviceOrderDetails.serviceOrder);
    this.assertWarrantyEligibility(warrantyStart.date, dto.openedAt ?? null, tenant.warrantyAdjustmentPeriodDays);
    if (dto.serviceOrderItemId && !serviceOrderDetails.items.some((item) => item.id === dto.serviceOrderItemId)) {
      throw new DomainValidationError('Warranty Adjustment item must belong to the referenced Service Order.');
    }
    const entity = this.warrantyAdjustmentRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: serviceOrderDetails.serviceOrder.branchId,
      serviceOrderId: dto.serviceOrderId,
      serviceOrderItemId: dto.serviceOrderItemId ?? null,
      customerRejectionId: dto.customerRejectionId ?? null,
      adjustmentReason: dto.adjustmentReason.trim(),
      warrantyStartDate: warrantyStart.date,
      warrantyStartSource: warrantyStart.source,
      warrantyPeriodDays: tenant.warrantyAdjustmentPeriodDays,
      openedAt: dto.openedAt ? new Date(dto.openedAt) : new Date(),
      status: WarrantyAdjustmentStatus.OPEN,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.warrantyAdjustmentRepository.save(entity);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'warranty_adjustment',
      entityId: saved.id,
      action: 'warranty_adjustment.created',
      eventType: 'quality.write',
      metadata: { serviceOrderId: saved.serviceOrderId, serviceOrderItemId: saved.serviceOrderItemId },
    });
    return saved;
  }

  async updateAdjustment(id: string, tenantId: string, dto: UpdateWarrantyAdjustmentDto): Promise<WarrantyAdjustmentEntity> {
    const entity = await this.getAdjustmentById(id, tenantId);
    if (dto.adjustmentReason !== undefined) entity.adjustmentReason = dto.adjustmentReason.trim();
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.warrantyAdjustmentRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'warranty_adjustment',
      entityId: saved.id,
      action: 'warranty_adjustment.updated',
      eventType: 'quality.write',
      metadata: { status: saved.status },
    });
    return saved;
  }

  async createExecution(dto: CreateWarrantyExecutionDto): Promise<WarrantyExecutionEntity> {
    const tenant = await this.tenantService.getById(dto.tenantId);
    const serviceOrderDetails = await this.serviceOrderService.getDetails(dto.tenantId, dto.serviceOrderId);
    const productionOrderDetails = await this.productionOrderService.getDetails(dto.tenantId, dto.productionOrderId);
    this.serviceOrderService.assertBranchAccess(serviceOrderDetails.serviceOrder, [productionOrderDetails.productionOrder.branchId]);
    const warrantyStart = this.resolveWarrantyStart(serviceOrderDetails.serviceOrder);
    this.assertWarrantyEligibility(warrantyStart.date, dto.openedAt ?? null, tenant.warrantyExecutionPeriodDays);
    const linkedItemIds = new Set(productionOrderDetails.items.map((item) => item.id));
    if (dto.affectedServiceOrderItemIds.length === 0) {
      throw new DomainValidationError('Warranty Execution requires at least one affected Service Order item.');
    }
    for (const itemId of dto.affectedServiceOrderItemIds) {
      if (!linkedItemIds.has(itemId)) throw new DomainValidationError('Warranty Execution items must belong to the linked Production Order.');
    }
    if (dto.correctiveOperationalResourceId) {
      await this.operationalResourceService.assertAssignableToBranch(dto.tenantId, dto.correctiveOperationalResourceId, productionOrderDetails.productionOrder.branchId);
    }
    const originalAssignment = await this.assignmentRepository.findCurrentPrimaryByProductionOrder(dto.productionOrderId);
    const createdVersion = await this.productionOrderService.createVersion(dto.productionOrderId, dto.tenantId, {
      actorUserId: dto.actorUserId,
      versionReason: ProductionOrderVersionReason.WARRANTY_EXECUTION,
      changeSummary: dto.executionReason,
      activate: true,
      isDraft: false,
      affectedServiceOrderItemIds: dto.affectedServiceOrderItemIds,
    } as CreateProductionOrderVersionDto);
    const entity = this.warrantyExecutionRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: productionOrderDetails.productionOrder.branchId,
      serviceOrderId: dto.serviceOrderId,
      productionOrderId: dto.productionOrderId,
      productionOrderVersionId: createdVersion.id,
      serviceOrderItemIds: [...new Set(dto.affectedServiceOrderItemIds)],
      customerRejectionId: dto.customerRejectionId ?? null,
      qualityRecordId: dto.qualityRecordId ?? null,
      originalOperationalResourceId: originalAssignment?.operationalResourceId ?? null,
      correctiveOperationalResourceId: dto.correctiveOperationalResourceId ?? null,
      executionReason: dto.executionReason.trim(),
      warrantyStartDate: warrantyStart.date,
      warrantyStartSource: warrantyStart.source,
      warrantyPeriodDays: tenant.warrantyExecutionPeriodDays,
      openedAt: dto.openedAt ? new Date(dto.openedAt) : new Date(),
      resolvedAt: null,
      status: dto.correctiveOperationalResourceId ? WarrantyExecutionStatus.ASSIGNED : WarrantyExecutionStatus.OPEN,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.warrantyExecutionRepository.save(entity);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'warranty_execution',
      entityId: saved.id,
      action: 'warranty_execution.created',
      eventType: 'quality.write',
      metadata: {
        productionOrderId: saved.productionOrderId,
        productionOrderVersionId: saved.productionOrderVersionId,
        correctiveOperationalResourceId: saved.correctiveOperationalResourceId,
        serviceOrderItemIds: saved.serviceOrderItemIds,
      },
    });
    return saved;
  }

  async updateExecution(id: string, tenantId: string, dto: UpdateWarrantyExecutionDto): Promise<WarrantyExecutionEntity> {
    const entity = await this.getExecutionById(id, tenantId);
    if (dto.correctiveOperationalResourceId !== undefined && dto.correctiveOperationalResourceId !== null) {
      await this.operationalResourceService.assertAssignableToBranch(tenantId, dto.correctiveOperationalResourceId, entity.branchId);
      entity.correctiveOperationalResourceId = dto.correctiveOperationalResourceId;
    }
    if (dto.executionReason !== undefined) entity.executionReason = dto.executionReason.trim();
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.warrantyExecutionRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'warranty_execution',
      entityId: saved.id,
      action: 'warranty_execution.updated',
      eventType: 'quality.write',
      metadata: { status: saved.status, correctiveOperationalResourceId: saved.correctiveOperationalResourceId },
    });
    return saved;
  }

  async resolveExecution(id: string, tenantId: string, dto: ResolveWarrantyExecutionDto): Promise<WarrantyExecutionEntity> {
    const entity = await this.getExecutionById(id, tenantId);
    entity.status = WarrantyExecutionStatus.RESOLVED;
    entity.resolvedAt = new Date();
    entity.updatedBy = dto.actorUserId;
    const saved = await this.warrantyExecutionRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'warranty_execution',
      entityId: saved.id,
      action: 'warranty_execution.resolved',
      eventType: 'quality.workflow',
      metadata: { resolutionNotes: dto.resolutionNotes?.trim() || null },
    });
    return saved;
  }

  private assertWarrantyEligibility(warrantyStartDate: string, openedAt: string | null, warrantyPeriodDays: number) {
    const delivery = new Date(`${warrantyStartDate}T00:00:00.000Z`);
    const opened = openedAt ? new Date(openedAt) : new Date();
    const deadline = new Date(delivery);
    deadline.setUTCDate(deadline.getUTCDate() + warrantyPeriodDays);
    if (opened.getTime() < delivery.getTime() || opened.getTime() > deadline.getTime()) {
      throw new DomainValidationError('Warranty case is outside the allowed warranty period.');
    }
  }

  private resolveWarrantyStart(serviceOrder: { actualPickupDate?: string | null; actualDeliveryDate?: string | null }) {
    if (serviceOrder.actualPickupDate) {
      return { date: serviceOrder.actualPickupDate, source: WarrantyStartSource.PICKUP };
    }
    if (serviceOrder.actualDeliveryDate) {
      return { date: serviceOrder.actualDeliveryDate, source: WarrantyStartSource.DELIVERY };
    }
    throw new DomainValidationError('Warranty start requires an actual pickup date or actual delivery date on the Service Order.');
  }
}
