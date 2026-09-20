import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { MeasurementService } from 'src/modules/crm/application/measurement/measurement.service';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  DeliveryType,
  OperationalAssignmentRole,
  ProductionOrderStatus,
  ProductionOrderVersionReason,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CompleteProductionOrderDto } from '../../contracts/dto/complete-production-order.dto';
import { CreateProductionOrderVersionDto } from '../../contracts/dto/create-production-order-version.dto';
import { PauseProductionOrderDto } from '../../contracts/dto/pause-production-order.dto';
import { ScheduleProductionOrderDto } from '../../contracts/dto/schedule-production-order.dto';
import { SearchProductionOrdersDto } from '../../contracts/dto/search-production-orders.dto';
import { StartProductionOrderDto } from '../../contracts/dto/start-production-order.dto';
import { UpdateProductionOrderDto } from '../../contracts/dto/update-production-order.dto';
import { ProductionOrderOperationalAssignmentEntity } from '../../infrastructure/persistence/entities/production-order-operational-assignment.entity';
import { ProductionOrderEntity } from '../../infrastructure/persistence/entities/production-order.entity';
import { ProductionOrderItemLinkEntity } from '../../infrastructure/persistence/entities/production-order-item-link.entity';
import { ProductionOrderVersionEntity } from '../../infrastructure/persistence/entities/production-order-version.entity';
import { ProductionOrderItemLinkRepository } from '../../infrastructure/persistence/repositories/production-order-item-link.repository';
import { ProductionOrderOperationalAssignmentRepository } from '../../infrastructure/persistence/repositories/production-order-operational-assignment.repository';
import { ProductionOrderRepository } from '../../infrastructure/persistence/repositories/production-order.repository';
import { ProductionOrderVersionRepository } from '../../infrastructure/persistence/repositories/production-order-version.repository';

@Injectable()
export class ProductionOrderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly productionOrderRepository: ProductionOrderRepository,
    private readonly itemLinkRepository: ProductionOrderItemLinkRepository,
    private readonly versionRepository: ProductionOrderVersionRepository,
    private readonly assignmentRepository: ProductionOrderOperationalAssignmentRepository,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly serviceOrderService: ServiceOrderService,
    private readonly measurementService: MeasurementService,
    private readonly operationalResourceService: OperationalResourceService,
    private readonly auditService: AuditService,
  ) {}

  async generateFromServiceOrder(input: {
    tenantId: string;
    serviceOrderId: string;
    actorUserId: string;
    accessibleBranchIds: string[];
  }) {
    const serviceOrderDetails = await this.serviceOrderService.getDetails(input.tenantId, input.serviceOrderId);
    this.serviceOrderService.assertBranchAccess(serviceOrderDetails.serviceOrder, input.accessibleBranchIds);
    if (serviceOrderDetails.serviceOrder.status === 'cancelled') {
      throw new DomainValidationError('Cancelled Service Orders cannot generate Production Orders.');
    }

    const existing = await this.productionOrderRepository.findByServiceOrder(input.serviceOrderId);
    if (existing) {
      throw new DomainValidationError('This Service Order already has a primary Production Order.');
    }
    if (serviceOrderDetails.items.length === 0) {
      throw new DomainValidationError('Production Orders require at least one Service Order item.');
    }

    const measurements = await this.measurementService.listByCustomer(input.tenantId, serviceOrderDetails.customer.id);
    const measurementsSnapshot = this.buildMeasurementsSnapshot(measurements.latestByLabel);
    const plannedQuantity = serviceOrderDetails.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    const pieceDescription = serviceOrderDetails.items.map((item) => item.description).join(', ');

    const order = this.productionOrderRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId,
      branchId: serviceOrderDetails.serviceOrder.branchId,
      serviceOrderId: input.serviceOrderId,
      workflowDefinitionId: null,
      currentStatusDefinitionId: null,
      productionNo: this.generateProductionNo(),
      productionType: 'base',
      deliveryType: serviceOrderDetails.serviceOrder.deliveryType,
      operationalPriority: serviceOrderDetails.serviceOrder.operationalPriority,
      customerDeliveryTargetDate: serviceOrderDetails.serviceOrder.promisedDeliveryDate,
      internalProductionDeadline: null,
      internalQualityDeadline: null,
      plannedQuantity: this.formatQuantity(plannedQuantity),
      producedQuantity: this.formatQuantity(0),
      scheduledStartAt: null,
      scheduledEndAt: null,
      instructions: serviceOrderDetails.serviceOrder.commercialNotes,
      pieceDescription,
      measurementsSnapshot,
      observations: serviceOrderDetails.serviceOrder.customerNotes,
      status: ProductionOrderStatus.OPEN,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: input.actorUserId,
      updatedBy: input.actorUserId,
    });

    const linkPayloads = serviceOrderDetails.items.map((item, index) =>
      this.itemLinkRepository.create({
        id: randomUUID(),
        tenantId: input.tenantId,
        productionOrderId: order.id,
        serviceOrderItemId: item.id,
        isPrimaryScope: index === 0,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      }),
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.save(ProductionOrderEntity, manager.create(ProductionOrderEntity, order));
      await manager.save(
        ProductionOrderItemLinkEntity,
        linkPayloads.map((link) => manager.create(ProductionOrderItemLinkEntity, link)),
      );
    });

    await this.auditService.record({
      tenantId: input.tenantId,
      branchId: order.branchId,
      actorUserId: input.actorUserId,
      entityType: 'production_order',
      entityId: order.id,
      action: 'production_order.generated',
      eventType: 'production.write',
      metadata: { serviceOrderId: input.serviceOrderId, productionNo: order.productionNo },
    });

    return this.getDetails(input.tenantId, order.id);
  }

  async search(tenantId: string, filters: SearchProductionOrdersDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) {
        throw new DomainValidationError('Branch must belong to the same tenant.');
      }
    }
    if (filters.serviceOrderId) {
      await this.serviceOrderService.getById(filters.serviceOrderId, tenantId);
    }
    if (filters.operationalResourceId) {
      await this.operationalResourceService.getById(filters.operationalResourceId, tenantId);
    }

    return this.productionOrderRepository.search(tenantId, filters);
  }

  async getById(productionOrderId: string, tenantId: string): Promise<ProductionOrderEntity> {
    const order = await this.productionOrderRepository.findById(productionOrderId);
    if (!order || order.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Production Order '${productionOrderId}' was not found.`);
    }
    return order;
  }

  async getDetails(tenantId: string, productionOrderId: string) {
    const order = await this.getById(productionOrderId, tenantId);
    const serviceOrderDetails = await this.serviceOrderService.getDetails(tenantId, order.serviceOrderId);
    const [links, versions, assignments, history] = await Promise.all([
      this.itemLinkRepository.findByProductionOrder(order.id),
      this.versionRepository.findByProductionOrder(order.id),
      this.assignmentRepository.findByProductionOrder(order.id),
      this.auditService.listByEntity(tenantId, 'production_order', order.id, 200),
    ]);
    const linkedItemIds = new Set(links.map((link) => link.serviceOrderItemId));
    const linkedItems = serviceOrderDetails.items.filter((item) => linkedItemIds.has(item.id));

    return {
      productionOrder: order,
      serviceOrder: serviceOrderDetails.serviceOrder,
      customer: serviceOrderDetails.customer,
      items: linkedItems,
      itemLinks: links,
      versions,
      assignments,
      history,
      timeline: [...history].reverse(),
    };
  }

  async update(productionOrderId: string, tenantId: string, dto: UpdateProductionOrderDto): Promise<ProductionOrderEntity> {
    const order = await this.getById(productionOrderId, tenantId);
    this.assertMutable(order);

    if (dto.deliveryType !== undefined) {
      order.deliveryType = dto.deliveryType;
    }
    if (dto.operationalPriority !== undefined) {
      order.operationalPriority = dto.operationalPriority?.trim() || null;
    }
    if (dto.customerDeliveryTargetDate !== undefined) {
      order.customerDeliveryTargetDate = dto.customerDeliveryTargetDate;
    }
    if (dto.internalProductionDeadline !== undefined) {
      order.internalProductionDeadline = dto.internalProductionDeadline ?? null;
    }
    if (dto.internalQualityDeadline !== undefined) {
      order.internalQualityDeadline = dto.internalQualityDeadline ?? null;
    }
    if (dto.plannedQuantity !== undefined) {
      order.plannedQuantity = dto.plannedQuantity === null ? null : this.formatQuantity(dto.plannedQuantity);
    }
    if (dto.instructions !== undefined) {
      order.instructions = dto.instructions?.trim() || null;
    }
    if (dto.pieceDescription !== undefined) {
      order.pieceDescription = dto.pieceDescription?.trim() || '';
    }
    if (dto.observations !== undefined) {
      order.observations = dto.observations?.trim() || null;
    }
    order.updatedBy = dto.actorUserId;

    const saved = await this.productionOrderRepository.save(order);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: saved.id,
      action: 'production_order.updated',
      eventType: 'production.write',
      metadata: { status: saved.status, deliveryType: saved.deliveryType },
    });
    return saved;
  }

  async schedule(productionOrderId: string, tenantId: string, dto: ScheduleProductionOrderDto): Promise<ProductionOrderEntity> {
    const order = await this.getById(productionOrderId, tenantId);
    this.assertMutable(order);
    const scheduledStartAt = new Date(dto.scheduledStartAt);
    const scheduledEndAt = dto.scheduledEndAt ? new Date(dto.scheduledEndAt) : null;
    if (scheduledEndAt && scheduledEndAt.getTime() < scheduledStartAt.getTime()) {
      throw new DomainValidationError('Schedule end time must be after the start time.');
    }

    await this.operationalResourceService.assertAssignableToBranch(tenantId, dto.primaryResourceId, order.branchId);
    const participantResourceIds = [...new Set((dto.participantResourceIds ?? []).filter((resourceId) => resourceId !== dto.primaryResourceId))];
    for (const resourceId of participantResourceIds) {
      await this.operationalResourceService.assertAssignableToBranch(tenantId, resourceId, order.branchId);
    }

    const assignedAt = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(ProductionOrderOperationalAssignmentEntity)
        .set({ isCurrent: false, releasedAt: assignedAt, updatedBy: dto.actorUserId })
        .where('production_order_id = :productionOrderId', { productionOrderId })
        .andWhere('is_current = true')
        .execute();

      const assignments = [
        manager.create(ProductionOrderOperationalAssignmentEntity, {
          id: randomUUID(),
          tenantId,
          branchId: order.branchId,
          productionOrderId,
          operationalResourceId: dto.primaryResourceId,
          assignmentRole: OperationalAssignmentRole.PRIMARY,
          assignedAt,
          releasedAt: null,
          isCurrent: true,
          isPrimaryResponsible: true,
          assignmentNotes: dto.assignmentNotes?.trim() || null,
          createdBy: dto.actorUserId,
          updatedBy: dto.actorUserId,
        }),
        ...participantResourceIds.map((resourceId) =>
          manager.create(ProductionOrderOperationalAssignmentEntity, {
            id: randomUUID(),
            tenantId,
            branchId: order.branchId,
            productionOrderId,
            operationalResourceId: resourceId,
            assignmentRole: OperationalAssignmentRole.PARTICIPANT,
            assignedAt,
            releasedAt: null,
            isCurrent: true,
            isPrimaryResponsible: false,
            assignmentNotes: dto.assignmentNotes?.trim() || null,
            createdBy: dto.actorUserId,
            updatedBy: dto.actorUserId,
          }),
        ),
      ];
      await manager.save(ProductionOrderOperationalAssignmentEntity, assignments);

      order.scheduledStartAt = scheduledStartAt;
      order.scheduledEndAt = scheduledEndAt;
      order.status = ProductionOrderStatus.SCHEDULED;
      order.updatedBy = dto.actorUserId;
      await manager.save(ProductionOrderEntity, order);
    });

    await this.auditService.record({
      tenantId,
      branchId: order.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: productionOrderId,
      action: 'production_order.scheduled',
      eventType: 'production.workflow',
      metadata: {
        scheduledStartAt: order.scheduledStartAt,
        scheduledEndAt: order.scheduledEndAt,
        primaryResourceId: dto.primaryResourceId,
        participantResourceIds,
      },
    });

    return this.getById(productionOrderId, tenantId);
  }

  async start(productionOrderId: string, tenantId: string, dto: StartProductionOrderDto): Promise<ProductionOrderEntity> {
    const order = await this.getById(productionOrderId, tenantId);
    if (order.status === ProductionOrderStatus.COMPLETED) {
      throw new DomainValidationError('Completed Production Orders cannot be restarted.');
    }
    if (![ProductionOrderStatus.OPEN, ProductionOrderStatus.SCHEDULED, ProductionOrderStatus.PAUSED].includes(order.status)) {
      throw new DomainValidationError('Production Order cannot be started from the current status.');
    }

    if (dto.operationalResourceId) {
      await this.operationalResourceService.assertAssignableToBranch(tenantId, dto.operationalResourceId, order.branchId);
      const currentPrimary = await this.assignmentRepository.findCurrentPrimaryByProductionOrder(productionOrderId);
      if (!currentPrimary || currentPrimary.operationalResourceId !== dto.operationalResourceId) {
        const startedAt = new Date();
        await this.assignmentRepository.releaseCurrentPrimaryAssignments(productionOrderId, dto.actorUserId, startedAt);
        await this.assignmentRepository.save(
          this.assignmentRepository.create({
            id: randomUUID(),
            tenantId,
            branchId: order.branchId,
            productionOrderId,
            operationalResourceId: dto.operationalResourceId,
            assignmentRole: OperationalAssignmentRole.PRIMARY,
            assignedAt: startedAt,
            releasedAt: null,
            isCurrent: true,
            isPrimaryResponsible: true,
            assignmentNotes: dto.diaryEntry?.trim() || null,
            createdBy: dto.actorUserId,
            updatedBy: dto.actorUserId,
          }),
        );
      }
    }

    const primary = await this.assignmentRepository.findCurrentPrimaryByProductionOrder(productionOrderId);
    if (!primary) {
      throw new DomainValidationError('Production Order must have a current primary Operational Resource before execution starts.');
    }

    order.status = ProductionOrderStatus.IN_PROGRESS;
    order.updatedBy = dto.actorUserId;
    const saved = await this.productionOrderRepository.save(order);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: saved.id,
      action: 'production_order.started',
      eventType: 'production.workflow',
      metadata: {
        operationalResourceId: primary.operationalResourceId,
        diaryEntry: dto.diaryEntry?.trim() || null,
      },
    });
    return saved;
  }

  async pause(productionOrderId: string, tenantId: string, dto: PauseProductionOrderDto): Promise<ProductionOrderEntity> {
    const order = await this.getById(productionOrderId, tenantId);
    if (order.status !== ProductionOrderStatus.IN_PROGRESS) {
      throw new DomainValidationError('Only in-progress Production Orders can be paused.');
    }
    order.status = ProductionOrderStatus.PAUSED;
    order.updatedBy = dto.actorUserId;
    const saved = await this.productionOrderRepository.save(order);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: saved.id,
      action: 'production_order.paused',
      eventType: 'production.workflow',
      metadata: { diaryEntry: dto.diaryEntry?.trim() || null },
    });
    return saved;
  }

  async complete(productionOrderId: string, tenantId: string, dto: CompleteProductionOrderDto): Promise<ProductionOrderEntity> {
    const order = await this.getById(productionOrderId, tenantId);
    if (![ProductionOrderStatus.IN_PROGRESS, ProductionOrderStatus.PAUSED, ProductionOrderStatus.SCHEDULED].includes(order.status)) {
      throw new DomainValidationError('Only scheduled, in-progress, or paused Production Orders can be completed.');
    }

    const completedAt = new Date();
    order.status = ProductionOrderStatus.COMPLETED;
    order.producedQuantity = dto.producedQuantity === null || dto.producedQuantity === undefined
      ? order.plannedQuantity
      : this.formatQuantity(dto.producedQuantity);
    order.updatedBy = dto.actorUserId;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(ProductionOrderEntity, order);
      await manager
        .createQueryBuilder()
        .update(ProductionOrderOperationalAssignmentEntity)
        .set({ isCurrent: false, releasedAt: completedAt, updatedBy: dto.actorUserId })
        .where('production_order_id = :productionOrderId', { productionOrderId })
        .andWhere('is_current = true')
        .execute();
    });

    await this.auditService.record({
      tenantId,
      branchId: order.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: order.id,
      action: 'production_order.completed',
      eventType: 'production.workflow',
      metadata: { producedQuantity: order.producedQuantity, diaryEntry: dto.diaryEntry?.trim() || null },
    });
    return order;
  }

  async createVersion(
    productionOrderId: string,
    tenantId: string,
    dto: CreateProductionOrderVersionDto,
  ): Promise<ProductionOrderVersionEntity> {
    const order = await this.getById(productionOrderId, tenantId);
    const nextVersionNo = Math.max(2, (await this.versionRepository.findLatestVersionNumber(productionOrderId)) + 1);
    const isDraft = dto.isDraft ?? false;
    const isActive = isDraft ? false : dto.activate ?? true;
    if (isActive) {
      await this.versionRepository.deactivateActiveVersions(productionOrderId, dto.actorUserId);
    }

    const version = this.versionRepository.create({
      id: randomUUID(),
      tenantId,
      branchId: order.branchId,
      productionOrderId,
      versionNo: nextVersionNo,
      versionReason: dto.versionReason,
      isActive,
      isDraft,
      productionType: this.mapVersionReasonToProductionType(dto.versionReason),
      deliveryType: dto.deliveryType ?? order.deliveryType,
      operationalPriority: dto.operationalPriority?.trim() || order.operationalPriority,
      changeSummary: dto.changeSummary.trim(),
      plannedQuantity:
        dto.plannedQuantity === undefined || dto.plannedQuantity === null
          ? order.plannedQuantity
          : this.formatQuantity(dto.plannedQuantity),
      scheduledStartAt: dto.scheduledStartAt ? new Date(dto.scheduledStartAt) : order.scheduledStartAt,
      scheduledEndAt: dto.scheduledEndAt ? new Date(dto.scheduledEndAt) : order.scheduledEndAt,
      instructions: dto.instructions?.trim() || order.instructions,
      pieceDescription: dto.pieceDescription?.trim() || order.pieceDescription,
      measurementsSnapshot: order.measurementsSnapshot,
      observations: dto.observations?.trim() || order.observations,
      resourceChangeNotes: dto.resourceChangeNotes?.trim() || null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.versionRepository.save(version);
    await this.auditService.record({
      tenantId,
      branchId: order.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: order.id,
      action: 'production_order.version.created',
      eventType: 'production.write',
      metadata: {
        productionOrderVersionId: saved.id,
        versionNo: saved.versionNo,
        versionReason: saved.versionReason,
        isActive: saved.isActive,
      },
    });
    return saved;
  }

  async listVersions(productionOrderId: string, tenantId: string): Promise<ProductionOrderVersionEntity[]> {
    await this.getById(productionOrderId, tenantId);
    return this.versionRepository.findByProductionOrder(productionOrderId);
  }

  async getPrintView(tenantId: string, productionOrderId: string) {
    const details = await this.getDetails(tenantId, productionOrderId);
    const activeVersion = details.versions.find((version) => version.isActive) ?? null;
    const effectiveDeliveryType = activeVersion?.deliveryType ?? details.productionOrder.deliveryType;
    const effectivePriority = activeVersion?.operationalPriority ?? details.productionOrder.operationalPriority;
    const delivery = this.buildDeliveryBadge(details.productionOrder.customerDeliveryTargetDate);
    const indicators = this.buildPrintIndicators(effectiveDeliveryType, activeVersion?.versionReason ?? null);

    return {
      productionOrderId: details.productionOrder.id,
      productionNo: details.productionOrder.productionNo,
      status: details.productionOrder.status,
      serviceOrder: {
        id: details.serviceOrder.id,
        orderNo: details.serviceOrder.orderNo,
      },
      customer: {
        id: details.customer.id,
        legalName: details.customer.legalName,
      },
      delivery,
      indicators,
      operationalPriority: effectivePriority,
      pieceDescription: activeVersion?.pieceDescription ?? details.productionOrder.pieceDescription,
      instructions: activeVersion?.instructions ?? details.productionOrder.instructions,
      version: activeVersion
        ? {
            id: activeVersion.id,
            versionNo: activeVersion.versionNo,
            versionReason: activeVersion.versionReason,
          }
        : null,
      items: details.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
      })),
    };
  }

  assertBranchAccess(order: ProductionOrderEntity, accessibleBranchIds: string[]): void {
    if (!accessibleBranchIds.includes(order.branchId)) {
      throw new DomainValidationError('Requested production order is outside the authenticated branch scope.');
    }
  }

  private assertMutable(order: ProductionOrderEntity): void {
    if (order.status === ProductionOrderStatus.COMPLETED) {
      throw new DomainValidationError('Completed Production Orders cannot be edited.');
    }
  }

  private buildMeasurementsSnapshot(
    records: Array<{ measurementLabel: string; measurementData: Record<string, unknown>; versionNo: number; measuredAt: Date }>,
  ) {
    if (records.length === 0) {
      return null;
    }

    return Object.fromEntries(
      records.map((record) => [
        record.measurementLabel,
        {
          ...record.measurementData,
          versionNo: record.versionNo,
          measuredAt: record.measuredAt.toISOString(),
        },
      ]),
    );
  }

  private buildDeliveryBadge(date: string) {
    const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][Number(date.slice(5, 7)) - 1];
    return {
      date,
      dayNumber: date.slice(8, 10),
      month,
    };
  }

  private buildPrintIndicators(deliveryType: DeliveryType, versionReason: ProductionOrderVersionReason | null): string[] {
    const indicators: string[] = [];
    if (deliveryType === DeliveryType.EXPRESS) {
      indicators.push('[ EXPRESS ]');
    }
    if (deliveryType === DeliveryType.PRIORITY) {
      indicators.push('[ PRIORITY ]');
    }
    if (versionReason === ProductionOrderVersionReason.REWORK) {
      indicators.push('[ REWORK ]');
    }
    if (versionReason === ProductionOrderVersionReason.WARRANTY_EXECUTION) {
      indicators.push('[ WARRANTY ]');
    }
    if (versionReason === ProductionOrderVersionReason.CORRECTIVE_PRODUCTION) {
      indicators.push('[ CORRECTIVE ]');
    }
    return indicators;
  }

  private generateProductionNo(): string {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    return `PO-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private formatQuantity(value: number): string {
    return value.toFixed(4);
  }

  private mapVersionReasonToProductionType(reason: ProductionOrderVersionReason): string {
    switch (reason) {
      case ProductionOrderVersionReason.REWORK:
        return 'rework';
      case ProductionOrderVersionReason.WARRANTY_EXECUTION:
        return 'warranty_execution';
      case ProductionOrderVersionReason.CORRECTIVE_PRODUCTION:
        return 'corrective_production';
      default:
        return 'base';
    }
  }
}
