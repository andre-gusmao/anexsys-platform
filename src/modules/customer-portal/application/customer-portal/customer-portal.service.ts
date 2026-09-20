import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { CustomerService } from 'src/modules/crm/application/customer/customer.service';
import { CustodyService } from 'src/modules/custody/application/custody/custody.service';
import { FinanceService } from 'src/modules/finance/application/finance/finance.service';
import { PickupService } from 'src/modules/pickup/application/pickup/pickup.service';
import { CommunicationEventRepository } from 'src/modules/pickup/infrastructure/persistence/repositories/communication-event.repository';
import { DigitalApprovalRepository } from 'src/modules/pickup/infrastructure/persistence/repositories/digital-approval.repository';
import { PickupAuthorizationRepository } from 'src/modules/pickup/infrastructure/persistence/repositories/pickup-authorization.repository';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { ServiceOrderRepository } from 'src/modules/service-orders/infrastructure/persistence/repositories/service-order.repository';
import { WarrantyService } from 'src/modules/warranty/application/warranty/warranty.service';
import {
  CommunicationDeliveryStatus,
  CommunicationDirection,
  DigitalApprovalDecision,
  DigitalApprovalType,
  InteractionChannel,
  PickupAuthorizationPath,
  PickupAuthorizationStatus,
  PickupCredentialType,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CustomerPortalProfileEntity } from '../../infrastructure/persistence/entities/customer-portal-profile.entity';
import { CustomerPortalProfileRepository } from '../../infrastructure/persistence/repositories/customer-portal-profile.repository';
import { StatusVisibilityMappingRepository } from '../../infrastructure/persistence/repositories/status-visibility-mapping.repository';

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly customerPortalProfileRepository: CustomerPortalProfileRepository,
    private readonly statusVisibilityMappingRepository: StatusVisibilityMappingRepository,
    private readonly customerService: CustomerService,
    private readonly serviceOrderService: ServiceOrderService,
    private readonly serviceOrderRepository: ServiceOrderRepository,
    private readonly digitalApprovalRepository: DigitalApprovalRepository,
    private readonly communicationEventRepository: CommunicationEventRepository,
    private readonly pickupAuthorizationRepository: PickupAuthorizationRepository,
    private readonly pickupService: PickupService,
    private readonly custodyService: CustodyService,
    private readonly warrantyService: WarrantyService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
  ) {}

  async linkCustomerProfile(params: {
    tenantId: string;
    actorUserId: string;
    customerId: string;
    userId: string;
    customerCode?: string;
    vipFlag?: boolean;
    preferredChannel?: InteractionChannel;
  }) {
    await this.customerService.getById(params.customerId, params.tenantId);
    let profile = await this.customerPortalProfileRepository.findByUserId(params.userId);
    if (profile && profile.tenantId !== params.tenantId) {
      throw new DomainValidationError('Portal user is outside the tenant scope.');
    }
    if (!profile) {
      profile = this.customerPortalProfileRepository.create({
        id: randomUUID(),
        tenantId: params.tenantId,
        customerId: params.customerId,
        userId: params.userId,
        customerCode: params.customerCode?.trim() || null,
        vipFlag: params.vipFlag ?? false,
        preferredChannel: params.preferredChannel ?? null,
        lastLoginAt: null,
        createdBy: params.actorUserId,
        updatedBy: params.actorUserId,
      });
    } else {
      profile.customerId = params.customerId;
      profile.customerCode = params.customerCode === undefined ? profile.customerCode : params.customerCode?.trim() || null;
      profile.vipFlag = params.vipFlag ?? profile.vipFlag;
      profile.preferredChannel = params.preferredChannel ?? profile.preferredChannel;
      profile.updatedBy = params.actorUserId;
    }
    const saved = await this.customerPortalProfileRepository.save(profile);
    await this.ensureDefaultStatusMappings(params.tenantId, params.actorUserId);
    await this.auditService.record({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      entityType: 'customer_portal_profile',
      entityId: saved.id,
      action: 'customer_portal.profile_linked',
      eventType: 'customer_portal.write',
      metadata: { customerId: saved.customerId, userId: saved.userId, customerCode: saved.customerCode, vipFlag: saved.vipFlag },
    });
    return saved;
  }

  async getAuthenticatedProfile(tenantId: string, userId: string) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    if (!profile.lastLoginAt) {
      profile.lastLoginAt = new Date();
      profile.updatedBy = userId;
      await this.customerPortalProfileRepository.save(profile);
    }
    const customer = await this.customerService.getById(profile.customerId, tenantId);
    return {
      profile: this.toProfileSummary(profile),
      customer: this.toCustomerSummary(customer),
    };
  }

  async updateAuthenticatedProfile(tenantId: string, userId: string, payload: { fullName?: string; mobilePhone?: string; email?: string; preferredChannel?: InteractionChannel; }) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    const customer = await this.customerService.update(profile.customerId, tenantId, {
      fullName: payload.fullName,
      mobilePhone: payload.mobilePhone,
      email: payload.email,
      actorUserId: userId,
    });
    if (payload.preferredChannel !== undefined) {
      profile.preferredChannel = payload.preferredChannel;
      profile.updatedBy = userId;
      await this.customerPortalProfileRepository.save(profile);
    }
    return {
      profile: this.toProfileSummary(profile),
      customer: this.toCustomerSummary(customer),
    };
  }

  async listOrders(tenantId: string, userId: string, accessibleBranchIds: string[]) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    const orders = await this.serviceOrderRepository.search(tenantId, {
      customerId: profile.customerId,
      accessibleBranchIds,
    });
    return Promise.all(orders.map((order) => this.buildOrderSummary(tenantId, order.id)));
  }

  async getOrderDetails(tenantId: string, userId: string, serviceOrderId: string) {
    await this.assertPortalOwnership(tenantId, userId, serviceOrderId);
    const details = await this.serviceOrderService.getDetails(tenantId, serviceOrderId);
    const [location, financeSummary, approvals, pickupAuthorizations, warrantyAdjustments, warrantyExecutions] = await Promise.all([
      this.custodyService.getServiceOrderLocation(tenantId, serviceOrderId),
      this.financeService.getFinancialSummary(tenantId, serviceOrderId),
      this.digitalApprovalRepository.findByServiceOrderIds([serviceOrderId]),
      this.pickupAuthorizationRepository.search(tenantId, { serviceOrderId, accessibleBranchIds: [details.serviceOrder.branchId] }),
      this.warrantyService.searchAdjustments(tenantId, { serviceOrderId, accessibleBranchIds: [details.serviceOrder.branchId] } as any),
      this.warrantyService.searchExecutions(tenantId, { serviceOrderId, accessibleBranchIds: [details.serviceOrder.branchId] } as any),
    ]);
    const summary = await this.buildOrderSummary(tenantId, serviceOrderId);
    return {
      ...summary,
      items: details.items.map((item) => ({ itemNo: item.itemNo, description: item.description, quantity: item.quantity, status: item.status })),
      approvals: approvals.map((approval) => this.toApprovalSummary(approval)),
      pickupAuthorizations: pickupAuthorizations.map((authorization) => ({
        id: authorization.id,
        authorizedPersonName: authorization.authorizedPersonName,
        authorizationPath: authorization.authorizationPath,
        validUntil: authorization.validUntil,
        status: authorization.status,
      })),
      warranty: {
        adjustments: warrantyAdjustments.map((item: any) => ({ id: item.id, status: item.status, openedAt: item.openedAt })),
        executions: warrantyExecutions.map((item: any) => ({ id: item.id, status: item.status, openedAt: item.openedAt, resolvedAt: item.resolvedAt })),
      },
      pickupReadiness: {
        hasActiveAuthorization: pickupAuthorizations.some((item) => [PickupAuthorizationStatus.PENDING, PickupAuthorizationStatus.APPROVED].includes(item.status)),
        currentLocation: location.location ? { id: location.location.id, displayLabel: location.location.displayLabel } : null,
        deliveryBlocked: financeSummary.deliveryBlocked,
      },
    };
  }

  async listHistory(tenantId: string, userId: string, accessibleBranchIds: string[]) {
    return this.listOrders(tenantId, userId, accessibleBranchIds);
  }

  async listApprovals(tenantId: string, userId: string, accessibleBranchIds: string[]) {
    const orders = await this.listOrders(tenantId, userId, accessibleBranchIds);
    const serviceOrderIds = orders.map((item) => item.serviceOrderId);
    const approvals = await this.digitalApprovalRepository.findByServiceOrderIds(serviceOrderIds);
    return approvals.map((approval) => this.toApprovalSummary(approval));
  }

  async createApprovalRequest(params: {
    tenantId: string;
    actorUserId: string;
    serviceOrderId: string;
    channel: InteractionChannel;
    title?: string;
    messageSummary: string;
    requestContext?: Record<string, unknown>;
  }) {
    const details = await this.serviceOrderService.getDetails(params.tenantId, params.serviceOrderId);
    const profile = await this.customerPortalProfileRepository.findByCustomerId(details.serviceOrder.customerId);
    const approval = this.digitalApprovalRepository.create({
      id: randomUUID(),
      tenantId: params.tenantId,
      branchId: details.serviceOrder.branchId,
      serviceOrderId: params.serviceOrderId,
      productionOrderId: null,
      productionOrderVersionId: null,
      pickupAuthorizationId: null,
      approvalType: DigitalApprovalType.SERVICE_ORDER_APPROVAL,
      requestChannel: params.channel,
      approvalLinkToken: randomUUID(),
      requestedAt: new Date(),
      decision: DigitalApprovalDecision.PENDING,
      decidedAt: null,
      decidedBy: null,
      decisionNotes: null,
      evidencePayload: params.requestContext ?? null,
      createdBy: params.actorUserId,
      updatedBy: params.actorUserId,
    });
    const communication = this.communicationEventRepository.create({
      id: randomUUID(),
      tenantId: params.tenantId,
      branchId: details.serviceOrder.branchId,
      customerId: details.customer.id,
      serviceOrderId: params.serviceOrderId,
      channel: params.channel,
      direction: CommunicationDirection.OUTBOUND,
      subject: params.title?.trim() || 'Approval request',
      messageSummary: params.messageSummary.trim(),
      sentAt: new Date(),
      deliveryStatus: CommunicationDeliveryStatus.SENT,
      payloadSnapshot: { approvalLinkToken: approval.approvalLinkToken, portalProfileId: profile?.id ?? null },
      createdBy: params.actorUserId,
      updatedBy: params.actorUserId,
    });
    const [savedApproval, savedCommunication] = await Promise.all([
      this.digitalApprovalRepository.save(approval),
      this.communicationEventRepository.save(communication),
    ]);
    await this.auditService.record({
      tenantId: params.tenantId,
      branchId: details.serviceOrder.branchId,
      actorUserId: params.actorUserId,
      entityType: 'digital_approval',
      entityId: savedApproval.id,
      action: 'digital_approval.requested',
      eventType: 'customer_portal.approval',
      metadata: { serviceOrderId: params.serviceOrderId, communicationEventId: savedCommunication.id, channel: params.channel },
    });
    return this.toApprovalSummary(savedApproval);
  }

  async approve(tenantId: string, userId: string, approvalId: string, decision: DigitalApprovalDecision, notes?: string, channel: InteractionChannel = InteractionChannel.PORTAL) {
    const approval = await this.digitalApprovalRepository.findById(approvalId);
    if (!approval || approval.tenantId != tenantId || !approval.serviceOrderId) throw new EntityNotFoundError(`Digital Approval '${approvalId}' was not found.`);
    await this.assertPortalOwnership(tenantId, userId, approval.serviceOrderId);
    if (approval.decision !== DigitalApprovalDecision.PENDING) {
      throw new DomainValidationError('Digital Approval already has a final decision.');
    }
    approval.decision = decision;
    approval.decidedAt = new Date();
    approval.decidedBy = userId;
    approval.decisionNotes = notes?.trim() || null;
    approval.evidencePayload = { ...(approval.evidencePayload ?? {}), responseChannel: channel };
    approval.updatedBy = userId;
    const saved = await this.digitalApprovalRepository.save(approval);
    await this.auditService.record({
      tenantId,
      branchId: approval.branchId,
      actorUserId: userId,
      entityType: 'digital_approval',
      entityId: approval.id,
      action: decision === DigitalApprovalDecision.APPROVED ? 'digital_approval.approved' : 'digital_approval.rejected',
      eventType: 'customer_portal.approval',
      metadata: { serviceOrderId: approval.serviceOrderId, channel },
    });
    return this.toApprovalSummary(saved);
  }

  async decideByLinkToken(tenantId: string, userId: string, linkToken: string, decision: DigitalApprovalDecision, notes?: string) {
    const approval = await this.digitalApprovalRepository.findByLinkToken(linkToken);
    if (!approval) throw new EntityNotFoundError(`Digital Approval link '${linkToken}' was not found.`);
    return this.approve(tenantId, userId, approval.id, decision, notes, InteractionChannel.PORTAL);
  }

  async listPickupAuthorizations(tenantId: string, userId: string, accessibleBranchIds: string[]) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    const orders = await this.serviceOrderRepository.search(tenantId, { customerId: profile.customerId, accessibleBranchIds });
    const results = await Promise.all(
      orders.map((order) => this.pickupAuthorizationRepository.search(tenantId, { serviceOrderId: order.id, accessibleBranchIds: [order.branchId] })),
    );
    return results.flat().map((authorization) => ({
      id: authorization.id,
      serviceOrderId: authorization.serviceOrderId,
      authorizedPersonName: authorization.authorizedPersonName,
      authorizationPath: authorization.authorizationPath,
      validFrom: authorization.validFrom,
      validUntil: authorization.validUntil,
      status: authorization.status,
    }));
  }

  async createPickupAuthorization(params: {
    tenantId: string;
    actorUserId: string;
    userId: string;
    serviceOrderId: string;
    authorizedPersonName: string;
    authorizedPersonDocument?: string;
    authorizationPath: PickupAuthorizationPath;
    validFrom?: string;
    validUntil: string;
    requireRemoteApproval?: boolean;
    credentialType?: PickupCredentialType;
    expiresAt?: string;
  }) {
    await this.assertPortalOwnership(params.tenantId, params.userId, params.serviceOrderId);
    const authorization = await this.pickupService.createPickupAuthorization({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      serviceOrderId: params.serviceOrderId,
      authorizedPersonName: params.authorizedPersonName,
      authorizedPersonDocument: params.authorizedPersonDocument,
      authorizationPath: params.authorizationPath,
      validFrom: params.validFrom,
      validUntil: params.validUntil,
      requireRemoteApproval: params.requireRemoteApproval,
    });
    let credential: unknown = null;
    if (params.credentialType) {
      if (!params.expiresAt) throw new DomainValidationError('Credential generation requires expiresAt.');
      const dto = { tenantId: params.tenantId, actorUserId: params.actorUserId, pickupAuthorizationId: authorization.id, expiresAt: params.expiresAt };
      if (params.credentialType === PickupCredentialType.TOKEN) credential = await this.pickupService.issuePickupToken(dto);
      if (params.credentialType === PickupCredentialType.QR_CODE) credential = await this.pickupService.issuePickupQrCode(dto);
      if (params.credentialType === PickupCredentialType.TEMPORARY_CODE) credential = await this.pickupService.issueTemporaryPickupCode(dto);
    }
    return { authorization, credential };
  }

  async revokePickupAuthorization(tenantId: string, userId: string, pickupAuthorizationId: string) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    const authorization = await this.pickupService.getPickupAuthorizationById(tenantId, pickupAuthorizationId);
    const serviceOrder = await this.serviceOrderService.getById(authorization.serviceOrderId, tenantId);
    if (serviceOrder.customerId !== profile.customerId) throw new UnauthorizedException('Pickup Authorization is outside the customer scope.');
    return this.pickupService.cancelPickupAuthorization(tenantId, pickupAuthorizationId, userId);
  }

  async listWarrantyCases(tenantId: string, userId: string, accessibleBranchIds: string[]) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    const orders = await this.serviceOrderRepository.search(tenantId, { customerId: profile.customerId, accessibleBranchIds });
    const serviceOrderIds = orders.map((order) => order.id);
    const [adjustments, executions] = await Promise.all([
      Promise.all(serviceOrderIds.map((id) => this.warrantyService.searchAdjustments(tenantId, { serviceOrderId: id, accessibleBranchIds } as any))).then((items) => items.flat()),
      Promise.all(serviceOrderIds.map((id) => this.warrantyService.searchExecutions(tenantId, { serviceOrderId: id, accessibleBranchIds } as any))).then((items) => items.flat()),
    ]);
    return {
      adjustments: adjustments.map((item: any) => ({ id: item.id, serviceOrderId: item.serviceOrderId, status: item.status, openedAt: item.openedAt })),
      executions: executions.map((item: any) => ({ id: item.id, serviceOrderId: item.serviceOrderId, status: item.status, openedAt: item.openedAt, resolvedAt: item.resolvedAt })),
    };
  }

  async createWarrantyRequest(params: {
    tenantId: string;
    userId: string;
    actorUserId: string;
    serviceOrderId: string;
    serviceOrderItemId?: string;
    adjustmentReason: string;
    openedAt?: string;
  }) {
    await this.assertPortalOwnership(params.tenantId, params.userId, params.serviceOrderId);
    return this.warrantyService.createAdjustment({
      tenantId: params.tenantId,
      actorUserId: params.actorUserId,
      serviceOrderId: params.serviceOrderId,
      serviceOrderItemId: params.serviceOrderItemId,
      adjustmentReason: params.adjustmentReason,
      openedAt: params.openedAt,
    });
  }

  async listStatusMappings(tenantId: string, actorUserId: string) {
    await this.ensureDefaultStatusMappings(tenantId, actorUserId);
    return this.statusVisibilityMappingRepository.findByTenant(tenantId);
  }

  async buildOrderSummary(tenantId: string, serviceOrderId: string) {
    const details = await this.serviceOrderService.getDetails(tenantId, serviceOrderId);
    const [location, approvals, financeSummary, warrantyAdjustments, warrantyExecutions, pickupAuthorizations] = await Promise.all([
      this.custodyService.getServiceOrderLocation(tenantId, serviceOrderId),
      this.digitalApprovalRepository.findByServiceOrderIds([serviceOrderId]),
      this.financeService.getFinancialSummary(tenantId, serviceOrderId),
      this.warrantyService.searchAdjustments(tenantId, { serviceOrderId, accessibleBranchIds: [details.serviceOrder.branchId] } as any),
      this.warrantyService.searchExecutions(tenantId, { serviceOrderId, accessibleBranchIds: [details.serviceOrder.branchId] } as any),
      this.pickupAuthorizationRepository.search(tenantId, { serviceOrderId, accessibleBranchIds: [details.serviceOrder.branchId] }),
    ]);
    const internalStatusName = this.resolveOrderInternalStatus({
      serviceOrderStatus: details.serviceOrder.status,
      pickupAuthorizations,
      warrantyAdjustments,
      warrantyExecutions,
    });
    const statusMapping = await this.resolveStatusMapping(tenantId, internalStatusName);
    return {
      serviceOrderId: details.serviceOrder.id,
      orderNo: details.serviceOrder.orderNo,
      openedAt: details.serviceOrder.openedAt,
      promisedDeliveryDate: details.serviceOrder.promisedDeliveryDate,
      deliveryType: details.serviceOrder.deliveryType,
      pickupReady: pickupAuthorizations.some((item) => item.status === PickupAuthorizationStatus.APPROVED),
      approvalPending: approvals.some((item) => item.decision === DigitalApprovalDecision.PENDING),
      approvalCompleted: approvals.filter((item) => item.decision !== DigitalApprovalDecision.PENDING).length,
      currentStatus: { internalName: internalStatusName, externalName: statusMapping.externalName, customerVisible: statusMapping.customerVisibility },
      storageLocation: location.location ? { id: location.location.id, displayLabel: location.location.displayLabel } : null,
      warrantyOpen: warrantyAdjustments.some((item: any) => item.status !== 'resolved') || warrantyExecutions.some((item: any) => item.status !== 'resolved'),
      financialPendingIssues: financeSummary.outstandingBalance !== '0.00',
    };
  }

  private async getPortalProfileOrFail(tenantId: string, userId: string): Promise<CustomerPortalProfileEntity> {
    const profile = await this.customerPortalProfileRepository.findByUserId(userId);
    if (!profile || profile.tenantId !== tenantId) {
      throw new UnauthorizedException('Customer Portal access is not provisioned for this user.');
    }
    return profile;
  }

  private async assertPortalOwnership(tenantId: string, userId: string, serviceOrderId: string) {
    const profile = await this.getPortalProfileOrFail(tenantId, userId);
    const serviceOrder = await this.serviceOrderService.getById(serviceOrderId, tenantId);
    if (serviceOrder.customerId !== profile.customerId) {
      throw new UnauthorizedException('Service Order is outside the customer scope.');
    }
    return serviceOrder;
  }

  private async ensureDefaultStatusMappings(tenantId: string, actorUserId: string) {
    const defaults = [
      ['open', 'In Service'],
      ['approved', 'In Progress'],
      ['cancelled', 'Cancelled'],
      ['pickup_ready', 'Ready for Pickup'],
      ['pickup_completed', 'Picked Up'],
      ['warranty_open', 'Warranty In Analysis'],
      ['warranty_resolved', 'Warranty Resolved'],
      ['quality_rejected', 'In Final Adjustment'],
    ] as const;
    for (const [internalName, externalName] of defaults) {
      const existing = await this.statusVisibilityMappingRepository.findByTenantAndInternalName(tenantId, internalName);
      if (existing) continue;
      await this.statusVisibilityMappingRepository.save(this.statusVisibilityMappingRepository.create({
        id: randomUUID(),
        tenantId,
        internalName,
        externalName,
        customerVisibility: true,
        operationalVisibility: true,
        managementVisibility: true,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      }));
    }
  }

  private async resolveStatusMapping(tenantId: string, internalName: string) {
    const mapping = await this.statusVisibilityMappingRepository.findByTenantAndInternalName(tenantId, internalName);
    if (mapping) return mapping;
    await this.ensureDefaultStatusMappings(tenantId, '00000000-0000-0000-0000-000000000000');
    return (await this.statusVisibilityMappingRepository.findByTenantAndInternalName(tenantId, internalName)) ?? {
      internalName,
      externalName: 'In Progress',
      customerVisibility: true,
      operationalVisibility: true,
      managementVisibility: true,
    };
  }

  private resolveOrderInternalStatus(params: { serviceOrderStatus: string; pickupAuthorizations: Array<{ status: PickupAuthorizationStatus }>; warrantyAdjustments: any[]; warrantyExecutions: any[]; }) {
    if (params.pickupAuthorizations.some((item) => item.status === PickupAuthorizationStatus.COMPLETED)) return 'pickup_completed';
    if (params.pickupAuthorizations.some((item) => item.status === PickupAuthorizationStatus.APPROVED)) return 'pickup_ready';
    if (params.warrantyAdjustments.some((item) => item.status !== 'resolved') || params.warrantyExecutions.some((item) => item.status !== 'resolved')) return 'warranty_open';
    return String(params.serviceOrderStatus).toLowerCase();
  }

  private toApprovalSummary(approval: any) {
    return {
      id: approval.id,
      serviceOrderId: approval.serviceOrderId,
      approvalType: approval.approvalType,
      requestChannel: approval.requestChannel,
      approvalLinkToken: approval.approvalLinkToken,
      requestedAt: approval.requestedAt,
      decision: approval.decision,
      decidedAt: approval.decidedAt,
      decisionNotes: approval.decisionNotes,
      evidence: approval.evidencePayload,
    };
  }

  private toProfileSummary(profile: CustomerPortalProfileEntity) {
    return {
      id: profile.id,
      customerId: profile.customerId,
      userId: profile.userId,
      customerCode: profile.customerCode,
      vipFlag: profile.vipFlag,
      preferredChannel: profile.preferredChannel,
      lastLoginAt: profile.lastLoginAt,
    };
  }

  private toCustomerSummary(customer: any) {
    return {
      id: customer.id,
      legalName: customer.legalName,
      email: customer.email,
      phone: customer.phone,
      cpfCnpj: customer.cpfCnpj,
    };
  }
}
