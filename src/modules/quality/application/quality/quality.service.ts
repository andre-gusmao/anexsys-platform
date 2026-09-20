import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { ProductionOrderService } from 'src/modules/production-orders/application/production-order/production-order.service';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  CustomerRejectionStatus,
  QualityInspectionResult,
  QualityReleaseDecision,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { ReworkService } from 'src/modules/rework/application/rework/rework.service';
import { WarrantyService } from 'src/modules/warranty/application/warranty/warranty.service';
import { CreateCustomerRejectionDto } from '../../contracts/dto/create-customer-rejection.dto';
import { CreateQualityRecordDto } from '../../contracts/dto/create-quality-record.dto';
import { QualityDecisionDto } from '../../contracts/dto/quality-decision.dto';
import { RequestReworkFromQualityDto } from '../../contracts/dto/request-rework-from-quality.dto';
import { RequestWarrantyExecutionFromQualityDto } from '../../contracts/dto/request-warranty-execution-from-quality.dto';
import { SearchCustomerRejectionsDto } from '../../contracts/dto/search-customer-rejections.dto';
import { SearchQualityRecordsDto } from '../../contracts/dto/search-quality-records.dto';
import { UpdateCustomerRejectionDto } from '../../contracts/dto/update-customer-rejection.dto';
import { UpdateQualityDefectDto } from '../../contracts/dto/update-quality-record.dto';
import { UpdateQualityRecordDto } from '../../contracts/dto/update-quality-record.dto';
import { CustomerRejectionEntity } from '../../infrastructure/persistence/entities/customer-rejection.entity';
import { QualityRecordEntity } from '../../infrastructure/persistence/entities/quality-record.entity';
import { CustomerRejectionRepository } from '../../infrastructure/persistence/repositories/customer-rejection.repository';
import { QualityRecordRepository } from '../../infrastructure/persistence/repositories/quality-record.repository';

@Injectable()
export class QualityService {
  constructor(
    private readonly qualityRecordRepository: QualityRecordRepository,
    private readonly customerRejectionRepository: CustomerRejectionRepository,
    private readonly productionOrderService: ProductionOrderService,
    private readonly serviceOrderService: ServiceOrderService,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly auditService: AuditService,
    private readonly reworkService: ReworkService,
    private readonly warrantyService: WarrantyService,
  ) {}

  async searchRecords(tenantId: string, filters: SearchQualityRecordsDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (filters.productionOrderId) await this.productionOrderService.getById(filters.productionOrderId, tenantId);
    return this.qualityRecordRepository.search(tenantId, filters);
  }

  async getRecordById(id: string, tenantId: string): Promise<QualityRecordEntity> {
    const entity = await this.qualityRecordRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) throw new EntityNotFoundError(`Quality Record '${id}' was not found.`);
    return entity;
  }

  async getRecordDetails(tenantId: string, id: string) {
    const record = await this.getRecordById(id, tenantId);
    const productionOrder = await this.productionOrderService.getById(record.productionOrderId, tenantId);
    const history = await this.auditService.listByEntity(tenantId, 'quality_record', record.id, 200);
    return {
      qualityRecord: record,
      qualityStatus: record.releaseDecision,
      productionOrder,
      history,
      timeline: [...history].reverse(),
    };
  }

  async createRecord(dto: CreateQualityRecordDto): Promise<QualityRecordEntity> {
    const details = await this.productionOrderService.getDetails(dto.tenantId, dto.productionOrderId);
    if (dto.serviceOrderItemId && !details.items.some((item) => item.id === dto.serviceOrderItemId)) {
      throw new DomainValidationError('Quality item scope must belong to the linked Production Order.');
    }
    const entity = this.qualityRecordRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: details.productionOrder.branchId,
      productionOrderId: dto.productionOrderId,
      serviceOrderItemId: dto.serviceOrderItemId ?? null,
      workflowDefinitionId: null,
      currentStatusDefinitionId: null,
      qualityResponsibleActorId: dto.actorUserId,
      inspectionType: dto.inspectionType,
      inspectionResult: QualityInspectionResult.PENDING,
      inspectionAt: dto.inspectionAt ? new Date(dto.inspectionAt) : new Date(),
      releaseDecision: QualityReleaseDecision.PENDING,
      defects: this.mapDefects(dto.defects),
      notes: dto.notes?.trim() || null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.qualityRecordRepository.save(entity);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'quality_record',
      entityId: saved.id,
      action: 'quality_record.created',
      eventType: 'quality.write',
      metadata: { productionOrderId: saved.productionOrderId, serviceOrderItemId: saved.serviceOrderItemId },
    });
    return saved;
  }

  async updateRecord(id: string, tenantId: string, dto: UpdateQualityRecordDto): Promise<QualityRecordEntity> {
    const entity = await this.getRecordById(id, tenantId);
    if (entity.releaseDecision === QualityReleaseDecision.APPROVED) {
      throw new DomainValidationError('Approved quality records cannot be edited.');
    }
    if (dto.serviceOrderItemId !== undefined) {
      const details = await this.productionOrderService.getDetails(tenantId, entity.productionOrderId);
      if (dto.serviceOrderItemId && !details.items.some((item) => item.id === dto.serviceOrderItemId)) {
        throw new DomainValidationError('Quality item scope must belong to the linked Production Order.');
      }
      entity.serviceOrderItemId = dto.serviceOrderItemId ?? null;
    }
    if (dto.inspectionType !== undefined) entity.inspectionType = dto.inspectionType;
    if (dto.inspectionResult !== undefined) entity.inspectionResult = dto.inspectionResult;
    if (dto.inspectionAt !== undefined) entity.inspectionAt = dto.inspectionAt ? new Date(dto.inspectionAt) : entity.inspectionAt;
    if (dto.defects !== undefined) entity.defects = this.mapDefects(dto.defects);
    if (dto.notes !== undefined) entity.notes = dto.notes?.trim() || null;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.qualityRecordRepository.save(entity);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'quality_record',
      entityId: saved.id,
      action: 'quality_record.updated',
      eventType: 'quality.write',
      metadata: { releaseDecision: saved.releaseDecision, inspectionResult: saved.inspectionResult },
    });
    return saved;
  }

  private mapDefects(
    defects:
      | Array<{
          description: string;
          category: string;
          severity: string;
        }>
      | UpdateQualityDefectDto[]
      | undefined
      | null,
  ): Array<Record<string, unknown>> | null {
    if (!defects?.length) return null;
    return defects.map((defect) => ({
      description: defect.description,
      category: defect.category,
      severity: defect.severity,
    }));
  }

  async approve(id: string, tenantId: string, dto: QualityDecisionDto): Promise<QualityRecordEntity> {
    const entity = await this.getRecordById(id, tenantId);
    entity.inspectionResult = QualityInspectionResult.PASSED;
    entity.releaseDecision = QualityReleaseDecision.APPROVED;
    entity.qualityResponsibleActorId = dto.actorUserId;
    entity.notes = dto.notes?.trim() || entity.notes;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.qualityRecordRepository.save(entity);
    await this.auditService.record({ tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'quality_record', entityId: saved.id, action: 'quality_record.approved', eventType: 'quality.workflow', metadata: {} });
    return saved;
  }

  async reject(id: string, tenantId: string, dto: QualityDecisionDto): Promise<QualityRecordEntity> {
    const entity = await this.getRecordById(id, tenantId);
    entity.inspectionResult = QualityInspectionResult.FAILED;
    entity.releaseDecision = QualityReleaseDecision.REJECTED;
    entity.qualityResponsibleActorId = dto.actorUserId;
    entity.notes = dto.notes?.trim() || entity.notes;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.qualityRecordRepository.save(entity);
    await this.auditService.record({ tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'quality_record', entityId: saved.id, action: 'quality_record.rejected', eventType: 'quality.workflow', metadata: {} });
    return saved;
  }

  async requestRework(id: string, tenantId: string, dto: RequestReworkFromQualityDto) {
    const entity = await this.getRecordById(id, tenantId);
    entity.inspectionResult = QualityInspectionResult.FAILED;
    entity.releaseDecision = QualityReleaseDecision.REWORK_REQUESTED;
    entity.qualityResponsibleActorId = dto.actorUserId;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.qualityRecordRepository.save(entity);
    const reworkCase = await this.reworkService.create({
      tenantId,
      actorUserId: dto.actorUserId,
      productionOrderId: saved.productionOrderId,
      affectedServiceOrderItemIds: dto.affectedServiceOrderItemIds,
      reworkReason: dto.reworkReason,
      correctiveOperationalResourceId: dto.correctiveOperationalResourceId ?? null,
      assignmentNotes: dto.assignmentNotes ?? null,
      qualityRecordId: saved.id,
    });
    await this.auditService.record({ tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'quality_record', entityId: saved.id, action: 'quality_record.rework.requested', eventType: 'quality.workflow', metadata: { reworkCaseId: reworkCase.id } });
    return { qualityRecord: saved, reworkCase };
  }

  async requestWarrantyExecution(id: string, tenantId: string, dto: RequestWarrantyExecutionFromQualityDto) {
    const entity = await this.getRecordById(id, tenantId);
    const productionOrder = await this.productionOrderService.getById(entity.productionOrderId, tenantId);
    entity.inspectionResult = QualityInspectionResult.FAILED;
    entity.releaseDecision = QualityReleaseDecision.WARRANTY_EXECUTION_REQUESTED;
    entity.qualityResponsibleActorId = dto.actorUserId;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.qualityRecordRepository.save(entity);
    const warrantyExecution = await this.warrantyService.createExecution({
      tenantId,
      actorUserId: dto.actorUserId,
      serviceOrderId: productionOrder.serviceOrderId,
      productionOrderId: productionOrder.id,
      affectedServiceOrderItemIds: dto.affectedServiceOrderItemIds,
      executionReason: dto.executionReason,
      actualDeliveryDate: dto.actualDeliveryDate,
      correctiveOperationalResourceId: dto.correctiveOperationalResourceId ?? null,
      warrantyPeriodDays: dto.warrantyPeriodDays ?? 7,
      qualityRecordId: saved.id,
    });
    await this.auditService.record({ tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'quality_record', entityId: saved.id, action: 'quality_record.warranty_execution.requested', eventType: 'quality.workflow', metadata: { warrantyExecutionId: warrantyExecution.id } });
    return { qualityRecord: saved, warrantyExecution };
  }

  async listByProductionOrder(tenantId: string, productionOrderId: string) {
    await this.productionOrderService.getById(productionOrderId, tenantId);
    return this.qualityRecordRepository.findByProductionOrder(productionOrderId);
  }

  async searchRejections(tenantId: string, filters: SearchCustomerRejectionsDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (filters.serviceOrderId) await this.serviceOrderService.getById(filters.serviceOrderId, tenantId);
    return this.customerRejectionRepository.search(tenantId, filters);
  }

  async getRejectionById(id: string, tenantId: string): Promise<CustomerRejectionEntity> {
    const entity = await this.customerRejectionRepository.findById(id);
    if (!entity || entity.tenantId !== tenantId) throw new EntityNotFoundError(`Customer Rejection '${id}' was not found.`);
    return entity;
  }

  async getRejectionDetails(tenantId: string, id: string) {
    const rejection = await this.getRejectionById(id, tenantId);
    const serviceOrder = await this.serviceOrderService.getById(rejection.serviceOrderId, tenantId);
    const history = await this.auditService.listByEntity(tenantId, 'customer_rejection', rejection.id, 200);
    return { customerRejection: rejection, serviceOrder, history, timeline: [...history].reverse() };
  }

  async createRejection(dto: CreateCustomerRejectionDto): Promise<CustomerRejectionEntity> {
    const serviceOrderDetails = await this.serviceOrderService.getDetails(dto.tenantId, dto.serviceOrderId);
    if (!serviceOrderDetails.items.some((item) => item.id === dto.serviceOrderItemId)) {
      throw new DomainValidationError('Customer rejection item must belong to the referenced Service Order.');
    }
    const entity = this.customerRejectionRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: serviceOrderDetails.serviceOrder.branchId,
      serviceOrderId: dto.serviceOrderId,
      serviceOrderItemId: dto.serviceOrderItemId,
      qualityRecordId: dto.qualityRecordId ?? null,
      reportedQuantity: dto.reportedQuantity === undefined || dto.reportedQuantity === null ? null : dto.reportedQuantity.toFixed(4),
      rejectionReason: dto.rejectionReason.trim(),
      severity: dto.severity ?? null,
      resolutionType: dto.resolutionType ?? null,
      notes: dto.notes?.trim() || null,
      reportedAt: dto.reportedAt ? new Date(dto.reportedAt) : new Date(),
      status: CustomerRejectionStatus.OPEN,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.customerRejectionRepository.save(entity);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'customer_rejection', entityId: saved.id, action: 'customer_rejection.created', eventType: 'quality.write', metadata: { serviceOrderId: saved.serviceOrderId, serviceOrderItemId: saved.serviceOrderItemId, resolutionType: saved.resolutionType } });
    return saved;
  }

  async updateRejection(id: string, tenantId: string, dto: UpdateCustomerRejectionDto): Promise<CustomerRejectionEntity> {
    const entity = await this.getRejectionById(id, tenantId);
    if (dto.reportedQuantity !== undefined) entity.reportedQuantity = dto.reportedQuantity === null ? null : dto.reportedQuantity.toFixed(4);
    if (dto.rejectionReason !== undefined) entity.rejectionReason = dto.rejectionReason.trim();
    if (dto.severity !== undefined) entity.severity = dto.severity;
    if (dto.resolutionType !== undefined) entity.resolutionType = dto.resolutionType;
    if (dto.notes !== undefined) entity.notes = dto.notes?.trim() || null;
    if (dto.status !== undefined) entity.status = dto.status;
    entity.updatedBy = dto.actorUserId;
    const saved = await this.customerRejectionRepository.save(entity);
    await this.auditService.record({ tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'customer_rejection', entityId: saved.id, action: 'customer_rejection.updated', eventType: 'quality.write', metadata: { status: saved.status, resolutionType: saved.resolutionType } });
    return saved;
  }
}
