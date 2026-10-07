import { Inject, ForbiddenException, Injectable } from '@nestjs/common';
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
import { AtelierCatalogService } from '../atelier-catalog/atelier-catalog.service';
import { currentClockTime, normalizeClockTime } from '../delivery-date/clock-time';
import { DeliveryDateService } from '../delivery-date/delivery-date.service';
import { DEFAULT_MAX_PIECES_PER_BAG, formatServiceOrderNo, nextVersionSuffix, withVersionSuffix } from './service-order-version';
import { ServiceOrderEntity } from '../../infrastructure/persistence/entities/service-order.entity';
import { ServiceOrderItemEntity } from '../../infrastructure/persistence/entities/service-order-item.entity';
import { ServiceOrderItemRepository } from '../../infrastructure/persistence/repositories/service-order-item.repository';
import {
  ServiceOrderRepository,
  ServiceOrderSearchFilters,
} from '../../infrastructure/persistence/repositories/service-order.repository';

export const MAX_SERVICE_ORDER_ITEMS = DEFAULT_MAX_PIECES_PER_BAG;

@Injectable()
export class ServiceOrderService {
  constructor(
    @Inject(DataSource)
    private readonly dataSource: DataSource,
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
    @Inject(ServiceOrderItemRepository)
    private readonly serviceOrderItemRepository: ServiceOrderItemRepository,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(CustomerService)
    private readonly customerService: CustomerService,
    @Inject(IdentityService)
    private readonly identityService: IdentityService,
    @Inject(DeliveryDateService)
    private readonly deliveryDateService: DeliveryDateService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
    @Inject(AtelierCatalogService)
    private readonly atelierCatalogService: AtelierCatalogService,
  ) {}

  async create(dto: CreateServiceOrderDto): Promise<{ serviceOrder: ServiceOrderEntity; items: ServiceOrderItemEntity[] }> {
    const tenant = await this.tenantService.getById(dto.tenantId);
    const maxPiecesPerBag = tenant.maxPiecesPerBag ?? DEFAULT_MAX_PIECES_PER_BAG;
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

    this.assertItemCount(dto.items.length, maxPiecesPerBag);

    const openedAt = dto.deliveryCommitmentSourceAt ? new Date(dto.deliveryCommitmentSourceAt) : new Date();
    const deliveryCommitmentSourceAt = dto.deliveryCommitmentSourceAt ? new Date(dto.deliveryCommitmentSourceAt) : openedAt;
    const suggestedDelivery = await this.deliveryDateService.suggestDelivery(
      dto.tenantId,
      dto.branchId,
      deliveryCommitmentSourceAt,
      { deliveryType: dto.deliveryType, itemCount: dto.items.length },
    );
    const promisedDeliveryDate = dto.promisedDeliveryDate ?? suggestedDelivery.promisedDeliveryDate;
    const promisedDeliveryTime =
      normalizeClockTime(dto.promisedDeliveryTime) ?? currentClockTime(openedAt);

    const normalizedItems: Array<Awaited<ReturnType<ServiceOrderService['resolveCatalogFields']>>> = [];
    for (const item of dto.items) {
      normalizedItems.push(await this.resolveCatalogFields(dto.tenantId, dto.actorUserId, this.normalizeItemInput(item)));
    }
    const normalizedDiscountValue = dto.discountValue ?? 0;
    const normalizedSurchargeValue = dto.deliverySurchargeValue ?? 0;
    const orderTotals = this.calculateOrderTotal(normalizedItems, normalizedDiscountValue, dto.deliverySurchargeMethod ?? null, normalizedSurchargeValue);
    const orderId = randomUUID();
    const groupSeq = await this.serviceOrderRepository.nextGroupSeq(dto.tenantId);

    const serviceOrder = this.serviceOrderRepository.create({
      id: orderId,
      tenantId: dto.tenantId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      workflowDefinitionId: null,
      currentStatusDefinitionId: null,
      orderNo: formatServiceOrderNo(groupSeq),
      groupId: orderId,
      groupSeq,
      versionSuffix: null,
      bagClosed: false,
      openedAt,
      deliveryCommitmentSourceAt,
      promisedDeliveryDate,
      promisedDeliveryTime,
      actualPickupDate: dto.actualPickupDate ?? null,
      actualDeliveryDate: dto.actualDeliveryDate ?? null,
      actualDeliveryTime: null,
      paymentTermsDays: dto.paymentTermsDays ?? 0,
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
          productId: item.productId,
          serviceId: item.serviceId,
          description: item.description,
          complement: item.complement,
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

  async getPrintView(tenantId: string, serviceOrderId: string) {
    const details = await this.getDetails(tenantId, serviceOrderId);
    const items = details.items
      .filter((item) => item.status !== ServiceOrderItemStatus.CANCELLED && !item.isDeleted)
      .map((item) => {
        const quantity = Number(item.quantity);
        const unitPrice = item.unitPrice === null ? null : Number(item.unitPrice);
        const discountValue = Number(item.discountValue ?? 0);
        const subtotal = unitPrice === null ? null : Math.max(quantity * unitPrice - discountValue, 0);
        return {
          id: item.id,
          itemNo: item.itemNo,
          productName: item.itemType,
          serviceName: item.description,
          complement: item.complement,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountValue: item.discountValue,
          subtotal: subtotal === null ? null : this.formatMoney(subtotal),
        };
      });

    return {
      documentType: 'service_order' as const,
      serviceOrderId: details.serviceOrder.id,
      orderNo: details.serviceOrder.orderNo,
      status: details.serviceOrder.status,
      openedAt: details.serviceOrder.openedAt,
      promisedDeliveryDate: details.serviceOrder.promisedDeliveryDate,
      promisedDeliveryTime: details.serviceOrder.promisedDeliveryTime,
      deliveryType: details.serviceOrder.deliveryType,
      customer: {
        id: details.customer.id,
        legalName: details.customer.legalName,
        phone: details.customer.phone,
        email: details.customer.email,
      },
      items,
      totalValue: details.serviceOrder.totalValue,
      customerNotes: details.serviceOrder.customerNotes,
    };
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

    const groupId = serviceOrder.groupId ?? serviceOrder.id;
    const groupVersions = await this.serviceOrderRepository.findByGroupId(tenantId, groupId);
    const tenant = await this.tenantService.getById(tenantId);

    return {
      serviceOrder,
      items,
      customer,
      commercialResponsible,
      technicalMeasurementResponsible: technicalResponsible,
      productionTechnician: null,
      qualityReviewer: null,
      history: auditTrail,
      timeline: [...auditTrail].reverse(),
      groupVersions: groupVersions.map((order) => ({
        id: order.id,
        orderNo: order.orderNo,
        versionSuffix: order.versionSuffix,
      })),
      maxPiecesPerBag: tenant.maxPiecesPerBag ?? DEFAULT_MAX_PIECES_PER_BAG,
    };
  }

  async getBagSettings(tenantId: string) {
    const tenant = await this.tenantService.getById(tenantId);
    return { maxPiecesPerBag: tenant.maxPiecesPerBag ?? DEFAULT_MAX_PIECES_PER_BAG };
  }

  async previewNextOrderNo(tenantId: string) {
    await this.tenantService.getById(tenantId);
    const groupSeq = await this.serviceOrderRepository.nextGroupSeq(tenantId);
    return { orderNo: formatServiceOrderNo(groupSeq) };
  }

  async spawnNextVersion(tenantId: string, sourceServiceOrderId: string, actorUserId: string) {
    const source = await this.getById(sourceServiceOrderId, tenantId);
    if (!source.bagClosed) {
      throw new DomainValidationError('Feche a sacola antes de abrir a próxima versão.');
    }
    const groupId = source.groupId ?? source.id;
    const siblings = await this.serviceOrderRepository.findByGroupId(tenantId, groupId);
    const members = siblings.length > 0 ? siblings : [source];
    const root = members.find((order) => !order.versionSuffix) ?? source;
    const groupSeq = source.groupSeq ?? root.groupSeq ?? (await this.serviceOrderRepository.nextGroupSeq(tenantId));
    const versionSuffix = nextVersionSuffix(members.map((order) => order.versionSuffix));
    const orderNo = withVersionSuffix(root.orderNo, versionSuffix);

    const nextId = randomUUID();
    const nextOrder = this.serviceOrderRepository.create({
      id: nextId,
      tenantId: source.tenantId,
      branchId: source.branchId,
      customerId: source.customerId,
      workflowDefinitionId: source.workflowDefinitionId,
      currentStatusDefinitionId: null,
      orderNo,
      groupId,
      groupSeq,
      versionSuffix,
      bagClosed: false,
      openedAt: new Date(),
      deliveryCommitmentSourceAt: source.deliveryCommitmentSourceAt,
      promisedDeliveryDate: source.promisedDeliveryDate,
      promisedDeliveryTime: source.promisedDeliveryTime,
      actualPickupDate: null,
      actualDeliveryDate: null,
      actualDeliveryTime: null,
      paymentTermsDays: source.paymentTermsDays,
      deliveryType: source.deliveryType,
      operationalPriority: source.operationalPriority,
      commercialResponsibleActorId: source.commercialResponsibleActorId,
      technicalMeasurementResponsibleActorId: source.technicalMeasurementResponsibleActorId,
      deliverySurchargeMethod: source.deliverySurchargeMethod,
      deliverySurchargeValue: source.deliverySurchargeValue,
      commercialNotes: source.commercialNotes,
      customerNotes: source.customerNotes,
      status: ServiceOrderStatus.OPEN,
      totalValue: null,
      discountValue: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    const saved = await this.serviceOrderRepository.save(nextOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.version.spawned',
      eventType: 'service_order.write',
      metadata: { sourceServiceOrderId, orderNo: saved.orderNo, versionSuffix },
    });

    return this.getDetails(tenantId, saved.id);
  }

  async closeBag(tenantId: string, serviceOrderId: string, actorUserId: string) {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Ordens de serviço canceladas não podem fechar sacola.');
    }
    if (serviceOrder.bagClosed) {
      throw new DomainValidationError('Esta sacola já está fechada. Use Abrir sacola se precisar corrigir.');
    }

    const items = (await this.serviceOrderItemRepository.findByServiceOrder(serviceOrderId)).filter(
      (item) => item.status !== ServiceOrderItemStatus.CANCELLED && !item.isDeleted,
    );
    if (items.length === 0) {
      throw new DomainValidationError('Inclua pelo menos uma peça antes de fechar a sacola.');
    }

    serviceOrder.bagClosed = true;
    serviceOrder.updatedBy = actorUserId;
    const saved = await this.serviceOrderRepository.save(serviceOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.bag.closed',
      eventType: 'service_order.write',
      metadata: { orderNo: saved.orderNo, itemCount: items.length },
    });

    return this.getDetails(tenantId, saved.id);
  }

  async reopenBag(tenantId: string, serviceOrderId: string, actorUserId: string) {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);
    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Ordens de serviço canceladas não podem reabrir sacola.');
    }
    if (!serviceOrder.bagClosed) {
      throw new DomainValidationError('Esta sacola já está aberta.');
    }

    serviceOrder.bagClosed = false;
    serviceOrder.updatedBy = actorUserId;
    const saved = await this.serviceOrderRepository.save(serviceOrder);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId,
      entityType: 'service_order',
      entityId: saved.id,
      action: 'service_order.bag.reopened',
      eventType: 'service_order.write',
      metadata: { orderNo: saved.orderNo },
    });

    return this.getDetails(tenantId, saved.id);
  }

  async previewDelivery(
    tenantId: string,
    input: { branchId: string; deliveryType?: DeliveryType; itemCount?: number; sourceAt?: string },
  ) {
    await this.tenantService.getById(tenantId);
    const branch = await this.branchService.getById(input.branchId);
    if (branch.tenantId !== tenantId) {
      throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    return this.deliveryDateService.suggestDelivery(
      tenantId,
      input.branchId,
      input.sourceAt ? new Date(input.sourceAt) : new Date(),
      { deliveryType: input.deliveryType, itemCount: input.itemCount },
    );
  }

  async update(serviceOrderId: string, tenantId: string, dto: UpdateServiceOrderDto): Promise<ServiceOrderEntity> {
    const serviceOrder = await this.getById(serviceOrderId, tenantId);

    if (serviceOrder.status === ServiceOrderStatus.CANCELLED) {
      throw new DomainValidationError('Cancelled service orders cannot be edited.');
    }
    this.assertHeaderWritableWhenBagClosed(serviceOrder, dto);

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

    const shouldRecalculate =
      dto.promisedDeliveryDate === undefined &&
      (dto.deliveryCommitmentSourceAt !== undefined || dto.deliveryType !== undefined);
    if (dto.deliveryCommitmentSourceAt !== undefined) {
      serviceOrder.deliveryCommitmentSourceAt = new Date(dto.deliveryCommitmentSourceAt);
    }
    if (dto.actualPickupDate !== undefined) {
      serviceOrder.actualPickupDate = dto.actualPickupDate;
    }
    if (dto.actualDeliveryDate !== undefined) {
      serviceOrder.actualDeliveryDate = dto.actualDeliveryDate;
    }
    if (dto.actualDeliveryTime !== undefined) {
      serviceOrder.actualDeliveryTime = normalizeClockTime(dto.actualDeliveryTime);
    }
    if (dto.paymentTermsDays !== undefined) {
      serviceOrder.paymentTermsDays = dto.paymentTermsDays;
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

    if (dto.promisedDeliveryDate !== undefined) {
      serviceOrder.promisedDeliveryDate = dto.promisedDeliveryDate;
    }
    if (dto.promisedDeliveryTime !== undefined) {
      serviceOrder.promisedDeliveryTime = normalizeClockTime(dto.promisedDeliveryTime);
    }
    if (shouldRecalculate) {
      const suggestedDelivery = await this.deliveryDateService.suggestDelivery(
        tenantId,
        serviceOrder.branchId,
        serviceOrder.deliveryCommitmentSourceAt,
        { deliveryType: serviceOrder.deliveryType },
      );
      serviceOrder.promisedDeliveryDate = suggestedDelivery.promisedDeliveryDate;
      serviceOrder.promisedDeliveryTime = normalizeClockTime(suggestedDelivery.promisedDeliveryTime);
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
        actualPickupDate: saved.actualPickupDate,
        actualDeliveryDate: saved.actualDeliveryDate,
        paymentTermsDays: saved.paymentTermsDays,
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
    this.assertBagOpen(serviceOrder);

    const openItems = (await this.serviceOrderItemRepository.findByServiceOrder(dto.serviceOrderId)).filter(
      (existing) => existing.status !== ServiceOrderItemStatus.CANCELLED && !existing.isDeleted,
    );
    const tenant = await this.tenantService.getById(dto.tenantId);
    this.assertItemCount(openItems.length + 1, tenant.maxPiecesPerBag ?? DEFAULT_MAX_PIECES_PER_BAG);

    const item = await this.resolveCatalogFields(dto.tenantId, dto.actorUserId, this.normalizeItemInput(dto));
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
            productId: item.productId,
            serviceId: item.serviceId,
            description: item.description,
            complement: item.complement,
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
    this.assertBagOpen(serviceOrder);

    const catalog = await this.resolveCatalogFields(tenantId, dto.actorUserId, {
      itemType: dto.itemType?.trim() || item.itemType,
      description: dto.description?.trim() || item.description,
      quantity: 1,
      unitPrice: dto.unitPrice === undefined ? (item.unitPrice === null ? null : Number(item.unitPrice)) : dto.unitPrice,
      discountValue: dto.discountValue === undefined ? Number(item.discountValue ?? 0) : dto.discountValue ?? 0,
      deliveryType: dto.deliveryType === undefined ? item.deliveryType : dto.deliveryType,
      operationalPriority:
        dto.operationalPriority === undefined ? item.operationalPriority : dto.operationalPriority?.trim() || null,
      productId: dto.productId === undefined ? item.productId : dto.productId,
      serviceId: dto.serviceId === undefined ? item.serviceId : dto.serviceId,
      complement: dto.complement === undefined ? item.complement : dto.complement?.trim() || null,
    });
    item.itemType = catalog.itemType;
    item.productId = catalog.productId;
    item.serviceId = catalog.serviceId;
    item.description = catalog.description;
    item.complement = catalog.complement;
    item.quantity = this.formatQuantity(catalog.quantity);
    item.unitPrice = catalog.unitPrice === null ? null : this.formatMoney(catalog.unitPrice);
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
    const suggestedDelivery = await this.deliveryDateService.suggestDelivery(
      tenantId,
      serviceOrder.branchId,
      serviceOrder.deliveryCommitmentSourceAt,
      { deliveryType: serviceOrder.deliveryType },
    );
    serviceOrder.promisedDeliveryDate = suggestedDelivery.promisedDeliveryDate;
    serviceOrder.promisedDeliveryTime = normalizeClockTime(suggestedDelivery.promisedDeliveryTime);
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

  private normalizeItemInput(
    item: Pick<
      CreateServiceOrderItemInputDto,
      'itemType' | 'description' | 'quantity' | 'unitPrice' | 'discountValue' | 'deliveryType' | 'operationalPriority' | 'productId' | 'serviceId' | 'complement'
    >,
  ) {
    return {
      itemType: item.itemType.trim(),
      description: item.description.trim(),
      quantity: 1,
      unitPrice: item.unitPrice ?? null,
      discountValue: item.discountValue ?? 0,
      deliveryType: item.deliveryType ?? null,
      operationalPriority: item.operationalPriority?.trim() || null,
      productId: item.productId ?? null,
      serviceId: item.serviceId ?? null,
      complement: item.complement?.trim() || null,
    };
  }

  private async resolveCatalogFields(
    tenantId: string,
    actorUserId: string,
    item: ReturnType<ServiceOrderService['normalizeItemInput']>,
  ) {
    let itemType = item.itemType;
    let description = item.description;
    let unitPrice = item.unitPrice;
    const productId = item.productId;
    const serviceId = item.serviceId;

    if (productId) {
      const product = await this.atelierCatalogService.resolveActiveProduct(tenantId, productId, actorUserId);
      itemType = product.displayName;
    }
    if (serviceId) {
      const service = await this.atelierCatalogService.resolveActiveService(tenantId, serviceId, actorUserId);
      description = service.displayName;
      if (unitPrice === null && service.defaultPrice !== null) {
        unitPrice = Number(service.defaultPrice);
      }
    }

    if (!itemType) {
      throw new DomainValidationError('Cada peça precisa de um produto.');
    }
    if (!description) {
      throw new DomainValidationError('Cada peça precisa de um serviço.');
    }

    return {
      ...item,
      itemType,
      description,
      unitPrice,
      productId,
      serviceId,
    };
  }

  private assertBagOpen(serviceOrder: ServiceOrderEntity): void {
    if (serviceOrder.bagClosed) {
      throw new DomainValidationError(
        'Esta sacola já está fechada. Use Abrir sacola se precisar corrigir.',
      );
    }
  }

  private assertHeaderWritableWhenBagClosed(
    serviceOrder: ServiceOrderEntity,
    dto: UpdateServiceOrderDto,
  ): void {
    if (!serviceOrder.bagClosed) {
      return;
    }

    const allowedWhenClosed = new Set([
      'actualPickupDate',
      'actualDeliveryDate',
      'actualDeliveryTime',
      'actorUserId',
    ]);
    const blocked = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key)
      .filter((key) => !allowedWhenClosed.has(key));
    if (blocked.length > 0) {
      throw new DomainValidationError(
        'Esta sacola já está fechada. Use Abrir sacola se precisar corrigir.',
      );
    }
  }

  private assertItemCount(itemCount: number, maxPiecesPerBag = DEFAULT_MAX_PIECES_PER_BAG) {
    if (itemCount > maxPiecesPerBag) {
      throw new DomainValidationError(
        `Esta versão da OS aceita no máximo ${maxPiecesPerBag} peças. Feche a sacola para abrir a próxima versão.`,
      );
    }
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
