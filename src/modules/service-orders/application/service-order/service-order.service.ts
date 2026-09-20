import { ForbiddenException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, QueryFailedError } from 'typeorm';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { CustomerService } from 'src/modules/crm/application/customer/customer.service';
import { IdentityService } from 'src/modules/identity/application/identity/identity.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  DeliveryType,
  ServiceOrderItemStatus,
  ServiceOrderStatus,
  SurchargeMethod,
  UserStatus,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CreateServiceOrderDto, CreateServiceOrderItemInputDto } from '../../contracts/dto/create-service-order.dto';
import { CreateServiceOrderItemDto } from '../../contracts/dto/create-service-order-item.dto';
import { SearchServiceOrdersDto } from '../../contracts/dto/search-service-orders.dto';
import { UpdateServiceOrderDto } from '../../contracts/dto/update-service-order.dto';
import { UpdateServiceOrderItemDto } from '../../contracts/dto/update-service-order-item.dto';
import { DeliveryDateService } from '../delivery-date/delivery-date.service';
import { ServiceOrderEntity } from '../../infrastructure/persistence/entities/service-order.entity';
import { ServiceOrderItemEntity } from '../../infrastructure/persistence/entities/service-order-item.entity';
import { ServiceOrderItemRepository } from '../../infrastructure/persistence/repositories/service-order-item.repository';
import {
  ServiceOrderRepository,
  ServiceOrderSearchFilters,
} from '../../infrastructure/persistence/repositories/service-order.repository';

@Injectable()
export class ServiceOrderService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly serviceOrderRepository: ServiceOrderRepository,
    private readonly serviceOrderItemRepository: ServiceOrderItemRepository,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly customerService: CustomerService,
    private readonly identityService: IdentityService,
    private readonly deliveryDateService: DeliveryDateService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateServiceOrderDto): Promise<{ serviceOrder: ServiceOrderEntity; items: ServiceOrderItemEntity[] }> {
    await this.tenantService.getById(dto.tenantId);
    const branch = await this.branchService.getById(dto.branchId);
    if (branch.tenantId !== dto.tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant as the service order.');
    }

    const customer = await this.customerService.getById(dto.customerId, dto.tenantId);
    this.assertCustomerBranchCompatibility(customer.branchId, dto.branchId);

    const commercialResponsibleActorId = dto.commercialResponsibleActorId ?? dto.actorUserId;
    const technicalMeasurementResponsibleActorId = dto.technicalMeasurementResponsibleActorId ?? commercialResponsibleActorId;
    await this.assertResponsibleActor(dto.tenantId, commercialResponsibleActorId, 'Commercial Responsible');
    await this.assertResponsibleActor(
      dto.tenantId,
      technicalMeasurementResponsibleActorId,
      'Technical Measurement Responsible',
    );

    const openedAt = dto.deliveryCommitmentSourceAt ? new Date(dto.deliveryCommitmentSourceAt) : new Date();
    const deliveryCommitmentSourceAt = dto.deliveryCommitmentSourceAt ? new Date(dto.deliveryCommitmentSourceAt) : openedAt;
    const promisedDeliveryDate = await this.deliveryDateService.suggestDeliveryDate(
      dto.tenantId,
      dto.branchId,
      deliveryCommitmentSourceAt,
    );

    const normalizedItems = dto.items.map((item) => this.normalizeItemInput(item));
    const normalizedDiscountValue = dto.discountValue ?? 0;
    const normalizedSurchargeValue = dto.deliverySurchargeValue ?? 0;
    const orderTotals = this.calculateOrderTotal(normalizedItems, normalizedDiscountValue, dto.deliverySurchargeMethod ?? null, normalizedSurchargeValue);

    const serviceOrder = this.serviceOrderRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      workflowDefinitionId: null,
      currentStatusDefinitionId: null,
      orderNo: this.generateOrderNo(),
      openedAt,
      deliveryCommitmentSourceAt,
      promisedDeliveryDate,
      deliveryType: dto.deliveryType ?? DeliveryType.STANDARD,
      operationalPriority: dto.operationalPriority?.trim() || null,
      commercialResponsibleActorId,
      technicalMeasurementResponsibleActorId,
      deliverySurchargeMethod: dto.deliverySurchargeMethod ?? null,
      deliverySurchargeValue: dto.deliverySurchargeMethod ? this.formatMoney(normalizedSurchargeValue) : null,
      commercialNotes: dto.commercialNotes?.trim() || null,
      customerNotes: dto.customerNotes?.trim() || null,
      status: ServiceOrderStatus.OPEN,
      totalValue: orderTotals,
      discountValue: dto.discountValue !== undefined ? this.formatMoney(normalizedDiscountValue) : null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });

    const saved = await this.dataSource.transaction(async (manager) => {
      const persistedOrder = manager.create(ServiceOrderEntity, serviceOrder);
      await manager.save(ServiceOrderEntity, persistedOrder);

      const persistedItems: ServiceOrderItemEntity[] = [];
      for (const [index, item] of normalizedItems.entries()) {
        const serviceOrderItem = manager.create(ServiceOrderItemEntity, {
          id: randomUUID(),
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          serviceOrderId: persistedOrder.id,
          itemNo: index + 1,
          itemType: item.itemType,
          description: item.description,
          quantity: this.formatQuantity(item.quantity),
          unitPrice: item.unitPrice === null ? null : this.formatMoney(item.unitPrice),
          discountValue: this.formatMoney(item.discountValue),
          deliveryType: item.deliveryType,
          operationalPriority: item.operationalPriority,
          status: ServiceOrderItemStatus.OPEN,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdBy: dto.actorUserId,
          updatedBy: dto.actorUserId,
        });
        await manager.save(ServiceOrderItemEntity, serviceOrderItem);
        persistedItems.push(serviceOrderItem);
      }

      return { persistedOrder, persistedItems };
    });

    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'service_order',
      entityId: saved.persistedOrder.id,
      action: 'service_order.created',
      eventType: 'service_order.write',
      metadata: {
        orderNo: saved.persistedOrder.orderNo,
        customerId: dto.customerId,
        itemCount: saved.persistedItems.length,
        deliveryType: saved.persistedOrder.deliveryType,
      },
    });

    await Promise.all(
      saved.persistedItems.map((item) =>
        this.auditService.record({
          tenantId: dto.tenantId,
          branchId: dto.branchId,
          actorUserId: dto.actorUserId,
          entityType: 'service_order',
          entityId: saved.persistedOrder.id,
          action: 'service_order.item.created',
          eventType: 'service_order.write',
          metadata: {
            serviceOrderId: saved.persistedOrder.id,
            itemId: item.id,
            itemNo: item.itemNo,
            description: item.description,
          },
        }),
      ),
    );

    return { serviceOrder: saved.persistedOrder, items: saved.persistedItems };
  }

  async search(tenantId: string, filters: ServiceOrderSearchFilters): Promise<ServiceOrderEntity[]> {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) {
        throw new DomainValidationError('Branch must belong to the same tenant.');
      }
    }
    if (filters.customerId) {
      await this.customerService.getById(filters.customerId, tenantId);
    }

    return this.serviceOrderRepository.search(tenantId, filters);
  }

  async getById(id: string, tenantId: string): Promise<ServiceOrderEntity> {
    const serviceOrder = await this.serviceOrderRepository.findById(id);
    if (!serviceOrder || serviceOrder.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Service Order '${id}' was not found.`);
    }

    return serviceOrder;
  }

  async getDetails(tenantId: string, serviceOrderId: string) {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    const [items, customer, commercialResponsible, technicalResponsible, auditTrail] = await Promise.all([
      this.serviceOrderItemRepository.findByServiceOrder(serviceOrderId),
      this.customerService.getById(serviceOrder.customerId, tenantId),
      this.identityService.getById(serviceOrder.commercialResponsibleActorId),
      this.identityService.getById(serviceOrder.technicalMeasurementResponsibleActorId),
      this.auditService.listByEntity(tenantId, 'service_order', serviceOrderId, 200),
    ]);

    return {
      serviceOrder,
      items,
      customer,
      commercialResponsible,
      technicalMeasurementResponsible: technicalResponsible,
      history: auditTrail,
      timeline: [...auditTrail].reverse(),
    };
  }

  async update(serviceOrderId: string, tenantId: string, dto: UpdateServiceOrderDto): Promise<ServiceOrderEntity> {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);

    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Cancelled service orders cannot be edited.');
    }

    if (dto.customerId) {
      const customer = await this.customerService.getById(dto.customerId, tenantId);
      this.assertCustomerBranchCompatibility(customer.branchId, serviceOrder.branchId);
      serviceOrder.customerId = dto.customerId;
    }

    if (dto.commercialResponsibleActorId) {
      await this.assertResponsibleActor(tenantId, dto.commercialResponsibleActorId, 'Commercial Responsible');
      serviceOrder.commercialResponsibleActorId = dto.commercialResponsibleActorId;
    }

    if (dto.technicalMeasurementResponsibleActorId) {
      await this.assertResponsibleActor(
        tenantId,
        dto.technicalMeasurementResponsibleActorId,
        'Technical Measurement Responsible',
      );
      serviceOrder.technicalMeasurementResponsibleActorId = dto.technicalMeasurementResponsibleActorId;
    }

    const shouldRecalculate = dto.deliveryCommitmentSourceAt !== undefined;
    if (dto.deliveryCommitmentSourceAt !== undefined) {
      serviceOrder.deliveryCommitmentSourceAt = new Date(dto.deliveryCommitmentSourceAt);
    }
    if (dto.deliveryType !== undefined) {
      serviceOrder.deliveryType = dto.deliveryType;
    }
    if (dto.operationalPriority !== undefined) {
      serviceOrder.operationalPriority = dto.operationalPriority?.trim() || null;
    }
    if (dto.deliverySurchargeMethod !== undefined) {
      serviceOrder.deliverySurchargeMethod = dto.deliverySurchargeMethod;
    }
    if (dto.deliverySurchargeValue !== undefined) {
      serviceOrder.deliverySurchargeValue = dto.deliverySurchargeValue === null ? null : this.formatMoney(dto.deliverySurchargeValue);
    }
    if (dto.discountValue !== undefined) {
      serviceOrder.discountValue = dto.discountValue === null ? null : this.formatMoney(dto.discountValue);
    }
    if (dto.commercialNotes !== undefined) {
      serviceOrder.commercialNotes = dto.commercialNotes?.trim() || null;
    }
    if (dto.customerNotes !== undefined) {
      serviceOrder.customerNotes = dto.customerNotes?.trim() || null;
    }

    if (shouldRecalculate) {
      serviceOrder.promisedDeliveryDate = await this.deliveryDateService.suggestDeliveryDate(
        tenantId,
        serviceOrder.branchId,
        serviceOrder.deliveryCommitmentSourceAt,
      );
    }

    const items = await this.serviceOrderItemRepository.findByServiceOrder(serviceOrderId);
    serviceOrder.totalValue = this.calculateOrderTotal(
      items.map((item) => this.normalizePersistedItem(item)),
      Number(serviceOrder.discountValue ?? 0),
      serviceOrder.deliverySurchargeMethod,
      Number(serviceOrder.deliverySurchargeValue ?? 0),
    );
    serviceOrder.updatedBy = dto.actorUserId;

    const saved = await this.serviceOrderRepository.save(serviceOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.updated',
      eventType: 'service_order.write',
      metadata: {
        deliveryType: saved.deliveryType,
        promisedDeliveryDate: saved.promisedDeliveryDate,
      },
    });

    return saved;
  }

  async addItem(dto: CreateServiceOrderItemDto): Promise<ServiceOrderItemEntity> {
    const serviceOrder = await this.getById(dto.serviceOrderId, dto.tenantId);
    if (serviceOrder.branchId !== dto.branchId) {
      throw new DomainValidationError('Service Order item branch must match the parent Service Order branch.');
    }
    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Cancelled service orders cannot receive new items.');
    }

    const item = this.normalizeItemInput(dto);
    let savedItem: ServiceOrderItemEntity | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        savedItem = await this.dataSource.transaction(async (manager) => {
          await manager
            .createQueryBuilder(ServiceOrderEntity, 'serviceOrder')
            .setLock('pessimistic_write')
            .where('serviceOrder.id = :serviceOrderId', { serviceOrderId: dto.serviceOrderId })
            .getOneOrFail();

          const result = await manager
            .createQueryBuilder(ServiceOrderItemEntity, 'item')
            .select('COALESCE(MAX(item.item_no), 0)', 'maxItemNo')
            .where('item.service_order_id = :serviceOrderId', { serviceOrderId: dto.serviceOrderId })
            .getRawOne<{ maxItemNo: string }>();
          const nextItemNo = Number(result?.maxItemNo ?? 0) + 1;

          const serviceOrderItem = manager.create(ServiceOrderItemEntity, {
            id: randomUUID(),
            tenantId: dto.tenantId,
            branchId: dto.branchId,
            serviceOrderId: dto.serviceOrderId,
            itemNo: nextItemNo,
            itemType: item.itemType,
            description: item.description,
            quantity: this.formatQuantity(item.quantity),
            unitPrice: item.unitPrice === null ? null : this.formatMoney(item.unitPrice),
            discountValue: this.formatMoney(item.discountValue),
            deliveryType: item.deliveryType,
            operationalPriority: item.operationalPriority,
            status: ServiceOrderItemStatus.OPEN,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            createdBy: dto.actorUserId,
            updatedBy: dto.actorUserId,
          });
          return manager.save(ServiceOrderItemEntity, serviceOrderItem);
        });
        break;
      } catch (error: any) {
        if (attempt < 2 && error instanceof QueryFailedError && error.driverError?.constraint === 'uq_service_order_items_order_item_no') {
          continue;
        }
        throw error;
      }
    }
    if (!savedItem) {
      throw new DomainValidationError('Unable to allocate a unique Service Order item number.');
    }

    await this.recalculateTotal(serviceOrder, dto.actorUserId);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'service_order',
      entityId: dto.serviceOrderId,
      action: 'service_order.item.created',
      eventType: 'service_order.write',
      metadata: {
        serviceOrderId: dto.serviceOrderId,
        itemId: savedItem.id,
        itemNo: savedItem.itemNo,
      },
    });

    return savedItem;
  }

  async updateItem(
    serviceOrderId: string,
    itemId: string,
    tenantId: string,
    dto: UpdateServiceOrderItemDto,
  ): Promise<ServiceOrderItemEntity> {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    const item = await this.serviceOrderItemRepository.findById(itemId);
    if (!item || item.serviceOrderId !== serviceOrderId || item.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Service Order Item '${itemId}' was not found.`);
    }
    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Cancelled service orders cannot be edited.');
    }

    item.itemType = dto.itemType?.trim() || item.itemType;
    item.description = dto.description?.trim() || item.description;
    item.quantity = dto.quantity === undefined ? item.quantity : this.formatQuantity(dto.quantity);
    item.unitPrice = dto.unitPrice === undefined ? item.unitPrice : dto.unitPrice === null ? null : this.formatMoney(dto.unitPrice);
    item.discountValue =
      dto.discountValue === undefined ? item.discountValue : dto.discountValue === null ? null : this.formatMoney(dto.discountValue);
    item.deliveryType = dto.deliveryType === undefined ? item.deliveryType : dto.deliveryType;
    item.operationalPriority = dto.operationalPriority === undefined ? item.operationalPriority : dto.operationalPriority?.trim() || null;
    item.status = dto.status ?? item.status;
    item.updatedBy = dto.actorUserId;

    const saved = await this.serviceOrderItemRepository.save(item);
    await this.recalculateTotal(serviceOrder, dto.actorUserId);
    await this.auditService.record({
      tenantId,
      branchId: serviceOrder.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'service_order',
      entityId: serviceOrderId,
      action: 'service_order.item.updated',
      eventType: 'service_order.write',
      metadata: {
        serviceOrderId,
        itemId,
        status: saved.status,
      },
    });

    return saved;
  }

  async approve(serviceOrderId: string, tenantId: string, actorUserId: string): Promise<ServiceOrderEntity> {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Cancelled service orders cannot be approved.');
    }
    if (serviceOrder.status !== ServiceOrderStatus.OPEN) {
      throw new DomainValidationError('Only open service orders can be approved.');
    }
    serviceOrder.status = ServiceOrderStatus.APPROVED;
    serviceOrder.updatedBy = actorUserId;
    const saved = await this.serviceOrderRepository.save(serviceOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.approved',
      eventType: 'service_order.workflow',
      metadata: { status: saved.status },
    });
    return saved;
  }

  async cancel(serviceOrderId: string, tenantId: string, actorUserId: string): Promise<ServiceOrderEntity> {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Service order is already cancelled.');
    }
    serviceOrder.status = ServiceOrderStatus.CANCELLED;
    serviceOrder.updatedBy = actorUserId;
    const saved = await this.serviceOrderRepository.save(serviceOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.cancelled',
      eventType: 'service_order.workflow',
      metadata: { status: saved.status },
    });
    return saved;
  }

  async recalculateDeliveryDate(serviceOrderId: string, tenantId: string, actorUserId: string): Promise<ServiceOrderEntity> {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    serviceOrder.promisedDeliveryDate = await this.deliveryDateService.suggestDeliveryDate(
      tenantId,
      serviceOrder.branchId,
      serviceOrder.deliveryCommitmentSourceAt,
    );
    serviceOrder.updatedBy = actorUserId;
    const saved = await this.serviceOrderRepository.save(serviceOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.delivery_date.recalculated',
      eventType: 'service_order.workflow',
      metadata: { promisedDeliveryDate: saved.promisedDeliveryDate },
    });
    return saved;
  }

  async getTimeline(serviceOrderId: string, tenantId: string) {
    await this.getById(serviceOrderId, tenantId);
    const auditTrail = await this.auditService.listByEntity(tenantId, 'service_order', serviceOrderId, 200);
    return [...auditTrail].reverse();
  }

  assertBranchAccess(serviceOrder: ServiceOrderEntity, accessibleBranchIds: string[]): void {
    if (!accessibleBranchIds.includes(serviceOrder.branchId)) {
      throw new ForbiddenException('Requested service order is outside the authenticated branch scope.');
    }
  }

  private async recalculateTotal(serviceOrder: ServiceOrderEntity, actorUserId: string): Promise<void> {
    const items = await this.serviceOrderItemRepository.findByServiceOrder(serviceOrder.id);
    serviceOrder.totalValue = this.calculateOrderTotal(
      items.map((item) => this.normalizePersistedItem(item)),
      Number(serviceOrder.discountValue ?? 0),
      serviceOrder.deliverySurchargeMethod,
      Number(serviceOrder.deliverySurchargeValue ?? 0),
    );
    serviceOrder.updatedBy = actorUserId;
    await this.serviceOrderRepository.save(serviceOrder);
  }

  private normalizeItemInput(item: Pick<CreateServiceOrderItemInputDto, 'itemType' | 'description' | 'quantity' | 'unitPrice' | 'discountValue' | 'deliveryType' | 'operationalPriority'>) {
    return {
      itemType: item.itemType.trim(),
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? null,
      discountValue: item.discountValue ?? 0,
      deliveryType: item.deliveryType ?? null,
      operationalPriority: item.operationalPriority?.trim() || null,
    };
  }

  private normalizePersistedItem(item: ServiceOrderItemEntity) {
    return {
      itemType: item.itemType,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: item.unitPrice === null ? null : Number(item.unitPrice),
      discountValue: Number(item.discountValue ?? 0),
      deliveryType: item.deliveryType,
      operationalPriority: item.operationalPriority,
    };
  }

  private calculateOrderTotal(
    items: Array<{ quantity: number; unitPrice: number | null; discountValue: number }>,
    orderDiscountValue: number,
    surchargeMethod: SurchargeMethod | null,
    surchargeValue: number,
  ): string | null {
    const baseLines = items.map((item) => {
      if (item.unitPrice === null) {
        return null;
      }
      return item.quantity * item.unitPrice - item.discountValue;
    });

    if (baseLines.every((value) => value === null) && orderDiscountValue === 0 && surchargeValue === 0) {
      return null;
    }

    const subtotal = baseLines.reduce<number>((acc, value) => acc + (value ?? 0), 0);
    let total = subtotal - orderDiscountValue;
    if (surchargeMethod === SurchargeMethod.FIXED) {
      total += surchargeValue;
    } else if (surchargeMethod === SurchargeMethod.PERCENTAGE) {
      total += subtotal * (surchargeValue / 100);
    }

    return this.formatMoney(Math.max(total, 0));
  }

  private formatMoney(value: number): string {
    return value.toFixed(2);
  }

  private formatQuantity(value: number): string {
    return value.toFixed(4);
  }

  private generateOrderNo(): string {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    return `SO-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async assertResponsibleActor(tenantId: string, actorId: string, label: string): Promise<void> {
    const actor = await this.identityService.getById(actorId);
    if (actor.tenantId !== tenantId) {
      throw new DomainValidationError(`${label} must belong to the same tenant.`);
    }
    if (actor.status !== UserStatus.ACTIVE) {
      throw new DomainValidationError(`${label} must be an active user.`);
    }
  }

  private assertCustomerBranchCompatibility(customerBranchId: string | null, branchId: string): void {
    if (customerBranchId && customerBranchId !== branchId) {
      throw new DomainValidationError('Branch-scoped customers must use the same branch as the Service Order.');
    }
  }
}
