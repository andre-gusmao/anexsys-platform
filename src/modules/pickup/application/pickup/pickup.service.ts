import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { CustodyService } from 'src/modules/custody/application/custody/custody.service';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  CommunicationDeliveryStatus,
  CommunicationDirection,
  CustodyEventStage,
  DigitalApprovalDecision,
  DigitalApprovalType,
  PickupAuthorizationStatus,
  PickupCredentialStatus,
  PickupCredentialType,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CompletePickupAuthorizationDto } from '../../contracts/dto/complete-pickup-authorization.dto';
import { CreatePickupAuthorizationDto } from '../../contracts/dto/create-pickup-authorization.dto';
import { DecideRemoteApprovalDto } from '../../contracts/dto/decide-remote-approval.dto';
import { IssuePickupCredentialDto } from '../../contracts/dto/issue-pickup-credential.dto';
import { RequestRemoteApprovalDto } from '../../contracts/dto/request-remote-approval.dto';
import { SearchPickupAuthorizationsDto } from '../../contracts/dto/search-pickup-authorizations.dto';
import { CommunicationEventEntity } from '../../infrastructure/persistence/entities/communication-event.entity';
import { DigitalApprovalEntity } from '../../infrastructure/persistence/entities/digital-approval.entity';
import { PickupAuthorizationEntity } from '../../infrastructure/persistence/entities/pickup-authorization.entity';
import { PickupQrCodeEntity } from '../../infrastructure/persistence/entities/pickup-qr-code.entity';
import { PickupTokenEntity } from '../../infrastructure/persistence/entities/pickup-token.entity';
import { TemporaryPickupCodeEntity } from '../../infrastructure/persistence/entities/temporary-pickup-code.entity';
import { CommunicationEventRepository } from '../../infrastructure/persistence/repositories/communication-event.repository';
import { DigitalApprovalRepository } from '../../infrastructure/persistence/repositories/digital-approval.repository';
import { PickupAuthorizationRepository } from '../../infrastructure/persistence/repositories/pickup-authorization.repository';
import { PickupQrCodeRepository } from '../../infrastructure/persistence/repositories/pickup-qr-code.repository';
import { PickupTokenRepository } from '../../infrastructure/persistence/repositories/pickup-token.repository';
import { TemporaryPickupCodeRepository } from '../../infrastructure/persistence/repositories/temporary-pickup-code.repository';

@Injectable()
export class PickupService {
  constructor(
    @Inject(TenantService)
    private readonly tenantService: TenantService,
    @Inject(BranchService)
    private readonly branchService: BranchService,
    @Inject(ServiceOrderService)
    private readonly serviceOrderService: ServiceOrderService,
    @Inject(PickupAuthorizationRepository)
    private readonly pickupAuthorizationRepository: PickupAuthorizationRepository,
    @Inject(PickupTokenRepository)
    private readonly pickupTokenRepository: PickupTokenRepository,
    @Inject(PickupQrCodeRepository)
    private readonly pickupQrCodeRepository: PickupQrCodeRepository,
    @Inject(TemporaryPickupCodeRepository)
    private readonly temporaryPickupCodeRepository: TemporaryPickupCodeRepository,
    @Inject(CommunicationEventRepository)
    private readonly communicationEventRepository: CommunicationEventRepository,
    @Inject(DigitalApprovalRepository)
    private readonly digitalApprovalRepository: DigitalApprovalRepository,
    @Inject(CustodyService)
    private readonly custodyService: CustodyService,
    @Inject(AuditService)
    private readonly auditService: AuditService,
  ) {}

  async searchPickupAuthorizations(tenantId: string, filters: SearchPickupAuthorizationsDto) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    return this.pickupAuthorizationRepository.search(tenantId, filters);
  }

  async createPickupAuthorization(dto: CreatePickupAuthorizationDto): Promise<PickupAuthorizationEntity> {
    const serviceOrder = await this.serviceOrderService.getById(dto.serviceOrderId, dto.tenantId);
    const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
    const validUntil = new Date(dto.validUntil);
    if (validUntil < validFrom) throw new DomainValidationError('Pickup Authorization validUntil must be greater than or equal to validFrom.');
    const entity = this.pickupAuthorizationRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: serviceOrder.branchId,
      serviceOrderId: serviceOrder.id,
      authorizedPersonName: dto.authorizedPersonName.trim(),
      authorizedPersonDocument: dto.authorizedPersonDocument?.trim() || null,
      authorizationPath: dto.authorizationPath,
      validFrom,
      validUntil,
      status: dto.requireRemoteApproval ? PickupAuthorizationStatus.PENDING : PickupAuthorizationStatus.APPROVED,
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.pickupAuthorizationRepository.save(entity);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: saved.branchId, actorUserId: dto.actorUserId, entityType: 'pickup_authorization', entityId: saved.id, action: 'pickup_authorization.created', eventType: 'pickup.write', metadata: { serviceOrderId: saved.serviceOrderId, authorizationPath: saved.authorizationPath, status: saved.status } });
    return saved;
  }

  async getPickupAuthorizationDetails(tenantId: string, pickupAuthorizationId: string) {
    const authorization = await this.getPickupAuthorizationById(tenantId, pickupAuthorizationId);
    const [tokens, qrCodes, temporaryCodes, communications, approvals, currentLocation] = await Promise.all([
      this.pickupTokenRepository.findByAuthorization(authorization.id),
      this.pickupQrCodeRepository.findByAuthorization(authorization.id),
      this.temporaryPickupCodeRepository.findByAuthorization(authorization.id),
      this.communicationEventRepository.findByServiceOrder(authorization.serviceOrderId),
      this.digitalApprovalRepository.findByPickupAuthorization(authorization.id),
      this.custodyService.getServiceOrderLocation(tenantId, authorization.serviceOrderId),
    ]);
    return { authorization, tokens, qrCodes, temporaryCodes, communications, approvals, currentLocation };
  }

  async issuePickupToken(dto: IssuePickupCredentialDto) {
    const authorization = await this.getPickupAuthorizationById(dto.tenantId, dto.pickupAuthorizationId);
    this.assertAuthorizationIsActive(authorization);
    const issuedAt = new Date();
    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt < issuedAt) throw new DomainValidationError('Pickup Token expiresAt must be greater than or equal to issuedAt.');
    const tokenValue = dto.value?.trim() || randomUUID();
    if (await this.pickupTokenRepository.findByAuthorizationAndValue(authorization.id, tokenValue)) throw new DomainValidationError('Pickup Token value must be unique within the authorization.');
    const entity = this.pickupTokenRepository.create({ id: randomUUID(), tenantId: dto.tenantId, pickupAuthorizationId: authorization.id, tokenValue, issuedAt, expiresAt, usedAt: null, status: PickupCredentialStatus.ACTIVE, createdBy: dto.actorUserId, updatedBy: dto.actorUserId });
    const saved = await this.pickupTokenRepository.save(entity as PickupTokenEntity);
    await this.recordCredentialIssuedAudit(dto, authorization, PickupCredentialType.TOKEN, saved.id);
    return saved;
  }

  async issuePickupQrCode(dto: IssuePickupCredentialDto) {
    const authorization = await this.getPickupAuthorizationById(dto.tenantId, dto.pickupAuthorizationId);
    this.assertAuthorizationIsActive(authorization);
    const issuedAt = new Date();
    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt < issuedAt) throw new DomainValidationError('Pickup QR Code expiresAt must be greater than or equal to issuedAt.');
    const codeValue = dto.value?.trim() || `PKQR-${randomUUID()}`;
    if (await this.pickupQrCodeRepository.findByAuthorizationAndValue(authorization.id, codeValue)) throw new DomainValidationError('Pickup QR Code value must be unique within the authorization.');
    const entity = this.pickupQrCodeRepository.create({ id: randomUUID(), tenantId: dto.tenantId, pickupAuthorizationId: authorization.id, codeValue, issuedAt, expiresAt, usedAt: null, status: PickupCredentialStatus.ACTIVE, createdBy: dto.actorUserId, updatedBy: dto.actorUserId });
    const saved = await this.pickupQrCodeRepository.save(entity as PickupQrCodeEntity);
    await this.recordCredentialIssuedAudit(dto, authorization, PickupCredentialType.QR_CODE, saved.id);
    return saved;
  }

  async issueTemporaryPickupCode(dto: IssuePickupCredentialDto) {
    const authorization = await this.getPickupAuthorizationById(dto.tenantId, dto.pickupAuthorizationId);
    this.assertAuthorizationIsActive(authorization);
    const issuedAt = new Date();
    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt < issuedAt) throw new DomainValidationError('Temporary Pickup Code expiresAt must be greater than or equal to issuedAt.');
    const codeValue = dto.value?.trim() || randomUUID().slice(0, 8).toUpperCase();
    if (await this.temporaryPickupCodeRepository.findByAuthorizationAndValue(authorization.id, codeValue)) throw new DomainValidationError('Temporary Pickup Code value must be unique within the authorization.');
    const entity = this.temporaryPickupCodeRepository.create({ id: randomUUID(), tenantId: dto.tenantId, pickupAuthorizationId: authorization.id, codeValue, issuedAt, expiresAt, usedAt: null, status: PickupCredentialStatus.ACTIVE, createdBy: dto.actorUserId, updatedBy: dto.actorUserId });
    const saved = await this.temporaryPickupCodeRepository.save(entity as TemporaryPickupCodeEntity);
    await this.recordCredentialIssuedAudit(dto, authorization, PickupCredentialType.TEMPORARY_CODE, saved.id);
    return saved;
  }

  async requestRemoteApproval(dto: RequestRemoteApprovalDto) {
    const authorization = await this.getPickupAuthorizationById(dto.tenantId, dto.pickupAuthorizationId);
    this.assertAuthorizationIsActive(authorization);
    authorization.status = PickupAuthorizationStatus.PENDING;
    authorization.updatedBy = dto.actorUserId;
    await this.pickupAuthorizationRepository.save(authorization);
    const communication = this.communicationEventRepository.create({
      id: randomUUID(), tenantId: dto.tenantId, branchId: authorization.branchId, customerId: null, serviceOrderId: authorization.serviceOrderId, channel: dto.channel, direction: CommunicationDirection.OUTBOUND, subject: 'Pickup authorization approval request', messageSummary: dto.messageSummary?.trim() || `Person ${authorization.authorizedPersonName} is requesting pickup of Service Order ${authorization.serviceOrderId}.`, sentAt: new Date(), deliveryStatus: CommunicationDeliveryStatus.SENT, payloadSnapshot: { pickupAuthorizationId: authorization.id, authorizedPersonName: authorization.authorizedPersonName }, createdBy: dto.actorUserId, updatedBy: dto.actorUserId,
    });
    const approval = this.digitalApprovalRepository.create({
      id: randomUUID(), tenantId: dto.tenantId, branchId: authorization.branchId, serviceOrderId: null, productionOrderId: null, productionOrderVersionId: null, pickupAuthorizationId: authorization.id, approvalType: DigitalApprovalType.PICKUP_AUTHORIZATION, requestChannel: dto.channel, approvalLinkToken: randomUUID(), requestedAt: new Date(), decision: DigitalApprovalDecision.PENDING, decidedAt: null, decidedBy: null, decisionNotes: null, evidencePayload: { channel: dto.channel }, createdBy: dto.actorUserId, updatedBy: dto.actorUserId,
    });
    const savedCommunication = await this.communicationEventRepository.save(communication as CommunicationEventEntity);
    const savedApproval = await this.digitalApprovalRepository.save(approval as DigitalApprovalEntity);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: authorization.branchId, actorUserId: dto.actorUserId, entityType: 'pickup_authorization', entityId: authorization.id, action: 'pickup_authorization.remote_approval_requested', eventType: 'pickup.approval', metadata: { approvalId: savedApproval.id, communicationEventId: savedCommunication.id, channel: dto.channel } });
    return { authorization, communication: savedCommunication, approval: savedApproval };
  }

  async decideRemoteApproval(dto: DecideRemoteApprovalDto) {
    const authorization = await this.getPickupAuthorizationById(dto.tenantId, dto.pickupAuthorizationId);
    const approval = await this.digitalApprovalRepository.findById(dto.approvalId);
    if (!approval || approval.tenantId !== dto.tenantId || approval.pickupAuthorizationId !== authorization.id) throw new EntityNotFoundError(`Digital Approval '${dto.approvalId}' was not found.`);
    if (approval.decision !== DigitalApprovalDecision.PENDING) throw new DomainValidationError('Digital Approval already has a final decision.');
    if (![DigitalApprovalDecision.APPROVED, DigitalApprovalDecision.REJECTED].includes(dto.decision)) throw new DomainValidationError('Remote approval decisions must be approved or rejected.');
    approval.decision = dto.decision;
    approval.decidedAt = new Date();
    approval.decidedBy = dto.actorUserId ?? null;
    approval.decisionNotes = dto.decisionNotes?.trim() || null;
    approval.evidencePayload = { ...(approval.evidencePayload ?? {}), channel: dto.channel };
    approval.updatedBy = dto.actorUserId ?? authorization.updatedBy;
    const savedApproval = await this.digitalApprovalRepository.save(approval);
    authorization.status = dto.decision === DigitalApprovalDecision.APPROVED ? PickupAuthorizationStatus.APPROVED : PickupAuthorizationStatus.REJECTED;
    authorization.updatedBy = dto.actorUserId ?? authorization.updatedBy;
    const savedAuthorization = await this.pickupAuthorizationRepository.save(authorization);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: authorization.branchId, actorUserId: dto.actorUserId ?? null, entityType: 'pickup_authorization', entityId: authorization.id, action: 'pickup_authorization.remote_approval_decided', eventType: 'pickup.approval', metadata: { approvalId: approval.id, decision: approval.decision, channel: dto.channel } });
    return { authorization: savedAuthorization, approval: savedApproval };
  }

  async completePickupAuthorization(dto: CompletePickupAuthorizationDto) {
    const authorization = await this.getPickupAuthorizationById(dto.tenantId, dto.pickupAuthorizationId);
    if (authorization.status === PickupAuthorizationStatus.REJECTED) throw new DomainValidationError('Rejected Pickup Authorizations cannot be completed.');
    if (authorization.status === PickupAuthorizationStatus.COMPLETED) throw new DomainValidationError('Pickup Authorization has already been completed.');
    if (authorization.validUntil < new Date()) {
      authorization.status = PickupAuthorizationStatus.EXPIRED;
      authorization.updatedBy = dto.actorUserId;
      await this.pickupAuthorizationRepository.save(authorization);
      throw new DomainValidationError('Pickup Authorization is expired.');
    }
    const approval = dto.approvalId ? await this.digitalApprovalRepository.findById(dto.approvalId) : null;
    const evidence = await this.consumeEvidence(authorization, dto, approval);
    const currentLocation = await this.custodyService.getServiceOrderLocation(dto.tenantId, authorization.serviceOrderId);
    const custodyEvent = await this.custodyService.recordCustodyEvent({
      tenantId: dto.tenantId,
      actorUserId: dto.actorUserId,
      branchId: authorization.branchId,
      serviceOrderId: authorization.serviceOrderId,
      pickupAuthorizationId: authorization.id,
      operationalResourceId: dto.operationalResourceId,
      storageLocationId: currentLocation.location?.id ?? undefined,
      eventStage: CustodyEventStage.PICKUP,
      notes: dto.notes,
      evidenceSummary: evidence,
      cameraSnapshots: dto.cameraSnapshots,
      cctvReferences: dto.cctvReferences,
    });
    authorization.status = PickupAuthorizationStatus.COMPLETED;
    authorization.updatedBy = dto.actorUserId;
    const savedAuthorization = await this.pickupAuthorizationRepository.save(authorization);
    await this.auditService.record({ tenantId: dto.tenantId, branchId: authorization.branchId, actorUserId: dto.actorUserId, entityType: 'pickup_authorization', entityId: authorization.id, action: 'pickup_authorization.completed', eventType: 'pickup.write', metadata: { custodyEventId: custodyEvent.id, authorizationMethod: dto.authorizationMethod } });
    return { authorization: savedAuthorization, custodyEvent, evidenceSummary: evidence };
  }

  async getPickupAuthorizationById(tenantId: string, pickupAuthorizationId: string): Promise<PickupAuthorizationEntity> {
    const authorization = await this.pickupAuthorizationRepository.findById(pickupAuthorizationId);
    if (!authorization || authorization.tenantId !== tenantId) throw new EntityNotFoundError(`Pickup Authorization '${pickupAuthorizationId}' was not found.`);
    return authorization;
  }

  async cancelPickupAuthorization(tenantId: string, pickupAuthorizationId: string, actorUserId: string) {
    const authorization = await this.getPickupAuthorizationById(tenantId, pickupAuthorizationId);
    if ([PickupAuthorizationStatus.COMPLETED, PickupAuthorizationStatus.EXPIRED].includes(authorization.status)) {
      throw new DomainValidationError('Pickup Authorization can no longer be cancelled.');
    }
    authorization.status = PickupAuthorizationStatus.CANCELLED;
    authorization.updatedBy = actorUserId;
    const savedAuthorization = await this.pickupAuthorizationRepository.save(authorization);

    const [tokens, qrCodes, temporaryCodes] = await Promise.all([
      this.pickupTokenRepository.findByAuthorization(authorization.id),
      this.pickupQrCodeRepository.findByAuthorization(authorization.id),
      this.temporaryPickupCodeRepository.findByAuthorization(authorization.id),
    ]);

    await Promise.all([
      ...tokens.filter((item) => item.status === PickupCredentialStatus.ACTIVE).map(async (item) => { item.status = PickupCredentialStatus.REVOKED; item.updatedBy = actorUserId; return this.pickupTokenRepository.save(item); }),
      ...qrCodes.filter((item) => item.status === PickupCredentialStatus.ACTIVE).map(async (item) => { item.status = PickupCredentialStatus.REVOKED; item.updatedBy = actorUserId; return this.pickupQrCodeRepository.save(item); }),
      ...temporaryCodes.filter((item) => item.status === PickupCredentialStatus.ACTIVE).map(async (item) => { item.status = PickupCredentialStatus.REVOKED; item.updatedBy = actorUserId; return this.temporaryPickupCodeRepository.save(item); }),
    ]);

    await this.auditService.record({
      tenantId,
      branchId: authorization.branchId,
      actorUserId,
      entityType: 'pickup_authorization',
      entityId: authorization.id,
      action: 'pickup_authorization.cancelled',
      eventType: 'pickup.write',
    });

    return savedAuthorization;
  }

  private assertAuthorizationIsActive(authorization: PickupAuthorizationEntity) {
    if ([PickupAuthorizationStatus.REJECTED, PickupAuthorizationStatus.COMPLETED, PickupAuthorizationStatus.EXPIRED, PickupAuthorizationStatus.CANCELLED].includes(authorization.status)) {
      throw new DomainValidationError('Pickup Authorization is not active.');
    }
  }

  private async recordCredentialIssuedAudit(dto: IssuePickupCredentialDto, authorization: PickupAuthorizationEntity, credentialType: PickupCredentialType, credentialId: string) {
    await this.auditService.record({ tenantId: dto.tenantId, branchId: authorization.branchId, actorUserId: dto.actorUserId, entityType: 'pickup_authorization', entityId: authorization.id, action: 'pickup_authorization.credential_issued', eventType: 'pickup.traceability', metadata: { credentialType, credentialId } });
  }

  private async consumeEvidence(authorization: PickupAuthorizationEntity, dto: CompletePickupAuthorizationDto, approval: DigitalApprovalEntity | null) {
    switch (dto.authorizationMethod) {
      case PickupCredentialType.TOKEN: {
        if (!dto.credentialValue) throw new DomainValidationError('Token-based pickup completion requires credentialValue.');
        const token = await this.pickupTokenRepository.findByAuthorizationAndValue(authorization.id, dto.credentialValue);
        return this.consumeCredential(token, dto.actorUserId, 'Pickup Token', PickupCredentialType.TOKEN);
      }
      case PickupCredentialType.QR_CODE: {
        if (!dto.credentialValue) throw new DomainValidationError('QR-code pickup completion requires credentialValue.');
        const qrCode = await this.pickupQrCodeRepository.findByAuthorizationAndValue(authorization.id, dto.credentialValue);
        return this.consumeCredential(qrCode, dto.actorUserId, 'Pickup QR Code', PickupCredentialType.QR_CODE);
      }
      case PickupCredentialType.TEMPORARY_CODE: {
        if (!dto.credentialValue) throw new DomainValidationError('Temporary-code pickup completion requires credentialValue.');
        const code = await this.temporaryPickupCodeRepository.findByAuthorizationAndValue(authorization.id, dto.credentialValue);
        return this.consumeCredential(code, dto.actorUserId, 'Temporary Pickup Code', PickupCredentialType.TEMPORARY_CODE);
      }
      case PickupCredentialType.REMOTE_APPROVAL: {
        if (!approval || approval.tenantId !== dto.tenantId || approval.pickupAuthorizationId !== authorization.id) throw new DomainValidationError('Remote approval completion requires a matching approvalId.');
        if (approval.decision !== DigitalApprovalDecision.APPROVED) throw new DomainValidationError('Remote approval must be approved before pickup completion.');
        return { authorizationMethod: dto.authorizationMethod, approvalId: approval.id, decision: approval.decision, decidedAt: approval.decidedAt?.toISOString() ?? null };
      }
      default:
        throw new DomainValidationError('Unsupported pickup authorization method.');
    }
  }

  private async consumeCredential<T extends PickupTokenEntity | PickupQrCodeEntity | TemporaryPickupCodeEntity>(
    entity: T | null,
    actorUserId: string,
    label: string,
    authorizationMethod: PickupCredentialType,
  ) {
    if (!entity) throw new EntityNotFoundError(`${label} was not found.`);
    if (entity.status !== PickupCredentialStatus.ACTIVE) throw new DomainValidationError(`${label} is not active.`);
    if (entity.expiresAt < new Date()) {
      entity.status = PickupCredentialStatus.EXPIRED;
      entity.updatedBy = actorUserId;
      await this.saveCredential(entity, authorizationMethod);
      throw new DomainValidationError(`${label} is expired.`);
    }
    entity.status = PickupCredentialStatus.USED;
    entity.usedAt = new Date();
    entity.updatedBy = actorUserId;
    await this.saveCredential(entity, authorizationMethod);
    return { authorizationMethod, credentialId: entity.id, usedAt: entity.usedAt.toISOString() };
  }

  private saveCredential(
    entity: PickupTokenEntity | PickupQrCodeEntity | TemporaryPickupCodeEntity,
    authorizationMethod: PickupCredentialType,
  ) {
    if (authorizationMethod === PickupCredentialType.TOKEN) return this.pickupTokenRepository.save(entity as PickupTokenEntity);
    if (authorizationMethod === PickupCredentialType.QR_CODE) return this.pickupQrCodeRepository.save(entity as PickupQrCodeEntity);
    return this.temporaryPickupCodeRepository.save(entity as TemporaryPickupCodeEntity);
  }
}
