import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { CustomerService } from 'src/modules/crm/application/customer/customer.service';
import { CustodyService } from 'src/modules/custody/application/custody/custody.service';
import { FinanceService } from 'src/modules/finance/application/finance/finance.service';
import { PickupService } from 'src/modules/pickup/application/pickup/pickup.service';
import { CommunicationEventRepository } from 'src/modules/pickup/infrastructure/persistence/repositories/communication-event.repository';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { ServiceOrderRepository } from 'src/modules/service-orders/infrastructure/persistence/repositories/service-order.repository';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { WarrantyService } from 'src/modules/warranty/application/warranty/warranty.service';
import {
  CommunicationDeliveryStatus,
  CommunicationDirection,
  CustomerIdentificationMethod,
  InteractionChannel,
  SmartConciergeQueueStatus,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CustomerPortalProfileRepository } from 'src/modules/customer-portal/infrastructure/persistence/repositories/customer-portal-profile.repository';
import { SmartConciergeCheckInRepository } from '../../infrastructure/persistence/repositories/smart-concierge-check-in.repository';

@Injectable()
export class SmartConciergeService {
  constructor(
    @Inject(SmartConciergeCheckInRepository)
    private readonly checkInRepository: SmartConciergeCheckInRepository,
    @Inject(CommunicationEventRepository)
    private readonly communicationEventRepository: CommunicationEventRepository,
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(CustomerService)
    private readonly customerService: CustomerService,
    @Inject(CustomerPortalProfileRepository)
    private readonly customerPortalProfileRepository: CustomerPortalProfileRepository,
    @Inject(ServiceOrderRepository)
    private readonly serviceOrderRepository: ServiceOrderRepository,
    @Inject(ServiceOrderService)
    private readonly serviceOrderService: ServiceOrderService,
    @Inject(PickupService)
    private readonly pickupService: PickupService,
    @Inject(CustodyService)
    private readonly custodyService: CustodyService,
    @Inject(WarrantyService)
    private readonly warrantyService: WarrantyService,
    @Inject(FinanceService)
    private readonly financeService: FinanceService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async getQueue(tenantId: string, filters: { branchId?: string; status?: SmartConciergeQueueStatus; q?: string; accessibleBranchIds: string[]; }) {
    const checkIns = await this.checkInRepository.search(tenantId, filters);
    return Promise.all(checkIns.map((item) => this.getCheckInDetails(tenantId, item.id)));
  }

  async createCheckIn(params: {
    tenantId: string;
    actorUserId: string;
    branchId: string;
    customerId?: string;
    serviceOrderId?: string;
    pickupAuthorizationId?: string;
    identificationMethod: CustomerIdentificationMethod;
    identificationValue?: string;
    notes?: string;
  }) {
    await this.tenantService.getById(params.tenantId);
    const branch = await this.branchService.getById(params.branchId);
    if (branch.tenantId !== params.tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    const lookup = await this.resolveReferences(params.tenantId, branch.id, params.identificationMethod, params.identificationValue ?? null, params.customerId ?? null, params.serviceOrderId ?? null, params.pickupAuthorizationId ?? null);
    const entity = this.checkInRepository.create({
      id: randomUUID(),
      tenantId: params.tenantId,
      branchId: branch.id,
      customerId: lookup.customerId,
      serviceOrderId: lookup.serviceOrderId,
      pickupAuthorizationId: lookup.pickupAuthorizationId,
      attendantUserId: params.actorUserId,
      identificationMethod: params.identificationMethod,
      identificationValue: params.identificationValue?.trim() || null,
      status: SmartConciergeQueueStatus.WAITING,
      calledAt: null,
      serviceStartedAt: null,
      serviceCompletedAt: null,
      notes: params.notes?.trim() || null,
      createdBy: params.actorUserId,
      updatedBy: params.actorUserId,
    });
    const saved = await this.checkInRepository.save(entity);
    await this.auditService.record({
      tenantId: params.tenantId,
      branchId: branch.id,
      actorUserId: params.actorUserId,
      entityType: 'smart_concierge_check_in',
      entityId: saved.id,
      action: 'smart_concierge.check_in_created',
      eventType: 'smart_concierge.write',
      metadata: { serviceOrderId: saved.serviceOrderId, customerId: saved.customerId, pickupAuthorizationId: saved.pickupAuthorizationId, status: saved.status },
    });
    return this.getCheckInDetails(params.tenantId, saved.id);
  }

  async getCheckInDetails(tenantId: string, checkInId: string) {
    const checkIn = await this.checkInRepository.findById(checkInId);
    if (!checkIn || checkIn.tenantId !== tenantId) throw new EntityNotFoundError(`Smart Concierge check-in '${checkInId}' was not found.`);
    const customer = checkIn.customerId ? await this.customerService.getById(checkIn.customerId, tenantId) : null;
    const serviceOrder = checkIn.serviceOrderId ? await this.serviceOrderService.getById(checkIn.serviceOrderId, tenantId) : null;
    const [location, pickupAuthorization, financeSummary, warrantyAdjustments, warrantyExecutions, portalProfile, relatedOrders] = await Promise.all([
      checkIn.serviceOrderId ? this.custodyService.getServiceOrderLocation(tenantId, checkIn.serviceOrderId) : Promise.resolve(null),
      checkIn.pickupAuthorizationId ? this.pickupService.getPickupAuthorizationById(tenantId, checkIn.pickupAuthorizationId) : Promise.resolve(null),
      checkIn.serviceOrderId ? this.financeService.getFinancialSummary(tenantId, checkIn.serviceOrderId) : Promise.resolve(null),
      checkIn.serviceOrderId && serviceOrder ? this.warrantyService.searchAdjustments(tenantId, { serviceOrderId: checkIn.serviceOrderId, accessibleBranchIds: [serviceOrder.branchId] } as any) : Promise.resolve([]),
      checkIn.serviceOrderId && serviceOrder ? this.warrantyService.searchExecutions(tenantId, { serviceOrderId: checkIn.serviceOrderId, accessibleBranchIds: [serviceOrder.branchId] } as any) : Promise.resolve([]),
      customer ? this.customerPortalProfileRepository.findByCustomerId(customer.id) : Promise.resolve(null),
      customer ? this.serviceOrderRepository.search(tenantId, { customerId: customer.id, accessibleBranchIds: serviceOrder ? [serviceOrder.branchId] : [checkIn.branchId] }) : Promise.resolve([]),
    ]);
    return {
      checkIn,
      customer: customer ? { id: customer.id, legalName: customer.legalName, phone: customer.phone, cpfCnpj: customer.cpfCnpj } : null,
      portal: portalProfile ? { customerCode: portalProfile.customerCode, vipFlag: portalProfile.vipFlag, lastVisit: portalProfile.lastLoginAt } : null,
      serviceOrder: serviceOrder ? { id: serviceOrder.id, orderNo: serviceOrder.orderNo, status: serviceOrder.status, promisedDeliveryDate: serviceOrder.promisedDeliveryDate, deliveryType: serviceOrder.deliveryType } : null,
      openServiceOrders: relatedOrders.filter((order) => order.status !== 'cancelled').map((order) => ({ id: order.id, orderNo: order.orderNo, status: order.status })),
      readyServiceOrders: relatedOrders.filter((order) => order.actualDeliveryDate || order.actualPickupDate).map((order) => ({ id: order.id, orderNo: order.orderNo })),
      warrantyCases: [...(warrantyAdjustments as any[]), ...(warrantyExecutions as any[])].map((item: any) => ({ id: item.id, status: item.status })),
      financialPendingIssues: financeSummary ? financeSummary.outstandingBalance !== '0.00' : false,
      pickupAuthorization: pickupAuthorization ? { id: pickupAuthorization.id, status: pickupAuthorization.status, authorizedPersonName: pickupAuthorization.authorizedPersonName } : null,
      storageLocation: location?.location ? { id: location.location.id, displayLabel: location.location.displayLabel } : null,
    };
  }

  async handoff(params: {
    tenantId: string;
    actorUserId: string;
    checkInId: string;
    status: SmartConciergeQueueStatus;
    attendantUserId?: string;
    notes?: string;
  }) {
    const checkIn = await this.checkInRepository.findById(params.checkInId);
    if (!checkIn || checkIn.tenantId !== params.tenantId) throw new EntityNotFoundError(`Smart Concierge check-in '${params.checkInId}' was not found.`);
    checkIn.status = params.status;
    checkIn.attendantUserId = params.attendantUserId ?? params.actorUserId;
    checkIn.notes = params.notes?.trim() || checkIn.notes;
    if (params.status === SmartConciergeQueueStatus.CALLED) checkIn.calledAt = new Date();
    if (params.status === SmartConciergeQueueStatus.IN_SERVICE && !checkIn.serviceStartedAt) checkIn.serviceStartedAt = new Date();
    if ([SmartConciergeQueueStatus.COMPLETED, SmartConciergeQueueStatus.NO_SHOW].includes(params.status)) checkIn.serviceCompletedAt = new Date();
    checkIn.updatedBy = params.actorUserId;
    const saved = await this.checkInRepository.save(checkIn);
    await this.auditService.record({
      tenantId: params.tenantId,
      branchId: saved.branchId,
      actorUserId: params.actorUserId,
      entityType: 'smart_concierge_check_in',
      entityId: saved.id,
      action: 'smart_concierge.handoff',
      eventType: 'smart_concierge.workflow',
      metadata: { status: saved.status, attendantUserId: saved.attendantUserId },
    });
    return this.getCheckInDetails(params.tenantId, saved.id);
  }

  async sendNotification(params: {
    tenantId: string;
    actorUserId: string;
    branchId?: string;
    customerId?: string;
    serviceOrderId?: string;
    channel: InteractionChannel;
    subject?: string;
    messageSummary: string;
  }) {
    if (params.branchId) {
      const branch = await this.branchService.getById(params.branchId);
      if (branch.tenantId !== params.tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    const event = this.communicationEventRepository.create({
      id: randomUUID(),
      tenantId: params.tenantId,
      branchId: params.branchId ?? null,
      customerId: params.customerId ?? null,
      serviceOrderId: params.serviceOrderId ?? null,
      channel: params.channel,
      direction: CommunicationDirection.OUTBOUND,
      subject: params.subject?.trim() || null,
      messageSummary: params.messageSummary.trim(),
      sentAt: new Date(),
      deliveryStatus: CommunicationDeliveryStatus.SENT,
      payloadSnapshot: { source: 'smart_concierge' },
      createdBy: params.actorUserId,
      updatedBy: params.actorUserId,
    });
    const saved = await this.communicationEventRepository.save(event);
    await this.auditService.record({
      tenantId: params.tenantId,
      branchId: saved.branchId,
      actorUserId: params.actorUserId,
      entityType: 'communication_event',
      entityId: saved.id,
      action: 'smart_concierge.notification_sent',
      eventType: 'notification.write',
      metadata: { channel: saved.channel, serviceOrderId: saved.serviceOrderId, customerId: saved.customerId },
    });
    return saved;
  }

  private async resolveReferences(
    tenantId: string,
    branchId: string,
    identificationMethod: CustomerIdentificationMethod,
    identificationValue: string | null,
    customerId: string | null,
    serviceOrderId: string | null,
    pickupAuthorizationId: string | null,
  ) {
    let resolvedCustomerId = customerId;
    let resolvedServiceOrderId = serviceOrderId;
    let resolvedPickupAuthorizationId = pickupAuthorizationId;
    if (resolvedPickupAuthorizationId) {
      const authorization = await this.pickupService.getPickupAuthorizationById(tenantId, resolvedPickupAuthorizationId);
      resolvedServiceOrderId = authorization.serviceOrderId;
    }
    if (resolvedServiceOrderId) {
      const serviceOrder = await this.serviceOrderService.getById(resolvedServiceOrderId, tenantId);
      resolvedCustomerId = serviceOrder.customerId;
    }
    if (!resolvedCustomerId && identificationValue) {
      if (identificationMethod === CustomerIdentificationMethod.CUSTOMER_CODE) {
        const profile = await this.customerPortalProfileRepository.findByCustomerCode(tenantId, identificationValue.trim());
        resolvedCustomerId = profile?.customerId ?? null;
      }
      if (!resolvedCustomerId) {
        const customers = await this.customerService.search(tenantId, { q: identificationValue, branchId, accessibleBranchIds: [branchId] } as any);
        resolvedCustomerId = customers[0]?.id ?? null;
      }
      if (!resolvedServiceOrderId && identificationMethod === CustomerIdentificationMethod.QR_CODE) {
        const pickupAuthorizations = await this.pickupService.searchPickupAuthorizations(tenantId, { accessibleBranchIds: [branchId] } as any);
        const pickupAuthorization = pickupAuthorizations.find((item) => item.id === identificationValue);
        if (pickupAuthorization) {
          resolvedPickupAuthorizationId = pickupAuthorization.id;
          resolvedServiceOrderId = pickupAuthorization.serviceOrderId;
        }
      }
    }
    if (!resolvedCustomerId && !resolvedServiceOrderId) {
      throw new DomainValidationError('Check-in requires a resolvable customer, Service Order, or Pickup Authorization.');
    }
    return { customerId: resolvedCustomerId, serviceOrderId: resolvedServiceOrderId, pickupAuthorizationId: resolvedPickupAuthorizationId };
  }
}
