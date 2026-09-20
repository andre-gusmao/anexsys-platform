import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { ServiceOrderService } from 'src/modules/service-orders/application/service-order/service-order.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { EntityNotFoundError } from 'src/shared/errors/entity-not-found.error';
import { CancelFiscalDocumentDto } from '../../contracts/dto/cancel-fiscal-document.dto';
import { CreateFiscalDocumentDto } from '../../contracts/dto/create-fiscal-document.dto';
import { IssueFiscalDocumentDto } from '../../contracts/dto/issue-fiscal-document.dto';
import { SearchFiscalDocumentsDto } from '../../contracts/dto/search-fiscal-documents.dto';
import { SyncFiscalDocumentStatusDto } from '../../contracts/dto/sync-fiscal-document-status.dto';
import { FiscalDocumentEntity } from '../../infrastructure/persistence/entities/fiscal-document.entity';
import { FiscalDocumentRepository } from '../../infrastructure/persistence/repositories/fiscal-document.repository';

@Injectable()
export class FiscalService {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly serviceOrderService: ServiceOrderService,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly auditService: AuditService,
  ) {}

  async searchFiscalDocuments(tenantId: string, filters: SearchFiscalDocumentsDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) throw new DomainValidationError('Branch must belong to the same tenant.');
    }
    if (filters.serviceOrderId) await this.serviceOrderService.getById(filters.serviceOrderId, tenantId);
    return this.fiscalDocumentRepository.search(tenantId, filters);
  }

  async getFiscalDocumentById(id: string, tenantId: string): Promise<FiscalDocumentEntity> {
    const fiscalDocument = await this.fiscalDocumentRepository.findById(id);
    if (!fiscalDocument || fiscalDocument.tenantId !== tenantId) {
      throw new EntityNotFoundError(`Fiscal Document '${id}' was not found.`);
    }
    return fiscalDocument;
  }

  async getFiscalDocumentDetails(tenantId: string, fiscalDocumentId: string) {
    const fiscalDocument = await this.getFiscalDocumentById(fiscalDocumentId, tenantId);
    const serviceOrderDetails = await this.serviceOrderService.getDetails(tenantId, fiscalDocument.serviceOrderId);
    const serviceOrderItem = fiscalDocument.serviceOrderItemId
      ? serviceOrderDetails.items.find((item) => item.id === fiscalDocument.serviceOrderItemId) ?? null
      : null;
    const history = await this.auditService.listByEntity(tenantId, 'fiscal_document', fiscalDocument.id, 200);
    const cancellationRecords = history
      .filter((event) => event.action === 'fiscal_document.cancelled' || (event.action === 'fiscal_document.status_synced' && event.metadata?.status === FiscalDocumentStatus.CANCELLED))
      .map((event) => ({ action: event.action, occurredAt: event.occurredAt, actorUserId: event.actorUserId, metadata: event.metadata }));
    return {
      fiscalDocument,
      serviceOrder: serviceOrderDetails.serviceOrder,
      serviceOrderItem,
      fiscalStatus: fiscalDocument.status,
      fiscalEvents: history,
      history,
      timeline: [...history].reverse(),
      cancellationRecords,
    };
  }

  async createFiscalDocument(dto: CreateFiscalDocumentDto): Promise<FiscalDocumentEntity> {
    const details = await this.serviceOrderService.getDetails(dto.tenantId, dto.serviceOrderId);
    const item = dto.serviceOrderItemId ? details.items.find((candidate) => candidate.id === dto.serviceOrderItemId) : null;
    if (dto.serviceOrderItemId && !item) {
      throw new DomainValidationError('Fiscal Document item must belong to the referenced Service Order.');
    }
    await this.assertUniqueDocumentNo(dto.tenantId, details.serviceOrder.branchId, dto.documentType, dto.documentNo);
    const status = dto.status ?? FiscalDocumentStatus.DRAFT;
    if (status === FiscalDocumentStatus.CANCELLED) {
      throw new DomainValidationError('Fiscal Documents cannot be created directly as cancelled.');
    }
    const fiscalDocument = this.fiscalDocumentRepository.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      branchId: details.serviceOrder.branchId,
      serviceOrderId: dto.serviceOrderId,
      serviceOrderItemId: dto.serviceOrderItemId ?? null,
      documentType: dto.documentType,
      documentNo: dto.documentNo.trim(),
      issuedAt: status === FiscalDocumentStatus.ISSUED ? (dto.issuedAt ? new Date(dto.issuedAt) : new Date()) : null,
      status,
      grossAmount: dto.grossAmount === undefined || dto.grossAmount === null ? null : this.formatMoney(dto.grossAmount),
      createdBy: dto.actorUserId,
      updatedBy: dto.actorUserId,
    });
    const saved = await this.fiscalDocumentRepository.save(fiscalDocument);
    await this.auditService.record({
      tenantId: dto.tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'fiscal_document',
      entityId: saved.id,
      action: 'fiscal_document.created',
      eventType: 'fiscal.write',
      metadata: {
        serviceOrderId: saved.serviceOrderId,
        serviceOrderItemId: saved.serviceOrderItemId,
        documentType: saved.documentType,
        documentNo: saved.documentNo,
        status: saved.status,
      },
    });
    return saved;
  }

  async issueFiscalDocument(id: string, tenantId: string, dto: IssueFiscalDocumentDto): Promise<FiscalDocumentEntity> {
    const fiscalDocument = await this.getFiscalDocumentById(id, tenantId);
    if (fiscalDocument.status === FiscalDocumentStatus.CANCELLED) {
      throw new DomainValidationError('Cancelled Fiscal Documents cannot be issued.');
    }
    if (fiscalDocument.status === FiscalDocumentStatus.ISSUED) {
      throw new DomainValidationError('Fiscal Document is already issued.');
    }
    fiscalDocument.status = FiscalDocumentStatus.ISSUED;
    fiscalDocument.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
    if (dto.grossAmount !== undefined) {
      fiscalDocument.grossAmount = dto.grossAmount === null ? null : this.formatMoney(dto.grossAmount);
    }
    fiscalDocument.updatedBy = dto.actorUserId;
    const saved = await this.fiscalDocumentRepository.save(fiscalDocument);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'fiscal_document',
      entityId: saved.id,
      action: 'fiscal_document.issued',
      eventType: 'fiscal.workflow',
      metadata: {
        documentNo: saved.documentNo,
        grossAmount: saved.grossAmount,
        providerStatus: dto.providerStatus?.trim() || null,
        providerReferenceNo: dto.providerReferenceNo?.trim() || null,
      },
    });
    return saved;
  }

  async cancelFiscalDocument(id: string, tenantId: string, dto: CancelFiscalDocumentDto): Promise<FiscalDocumentEntity> {
    const fiscalDocument = await this.getFiscalDocumentById(id, tenantId);
    if (fiscalDocument.status === FiscalDocumentStatus.CANCELLED) {
      throw new DomainValidationError('Fiscal Document is already cancelled.');
    }
    fiscalDocument.status = FiscalDocumentStatus.CANCELLED;
    fiscalDocument.updatedBy = dto.actorUserId;
    const saved = await this.fiscalDocumentRepository.save(fiscalDocument);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'fiscal_document',
      entityId: saved.id,
      action: 'fiscal_document.cancelled',
      eventType: 'fiscal.workflow',
      metadata: {
        reason: dto.reason.trim(),
        providerStatus: dto.providerStatus?.trim() || null,
        status: saved.status,
      },
    });
    return saved;
  }

  async syncFiscalStatus(id: string, tenantId: string, dto: SyncFiscalDocumentStatusDto): Promise<FiscalDocumentEntity> {
    const fiscalDocument = await this.getFiscalDocumentById(id, tenantId);
    if (dto.status === FiscalDocumentStatus.ISSUED && !fiscalDocument.issuedAt) {
      fiscalDocument.issuedAt = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
    }
    if (dto.issuedAt) {
      fiscalDocument.issuedAt = new Date(dto.issuedAt);
    }
    if (dto.grossAmount !== undefined) {
      fiscalDocument.grossAmount = dto.grossAmount === null ? null : this.formatMoney(dto.grossAmount);
    }
    fiscalDocument.status = dto.status;
    fiscalDocument.updatedBy = dto.actorUserId;
    const saved = await this.fiscalDocumentRepository.save(fiscalDocument);
    await this.auditService.record({
      tenantId,
      branchId: saved.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'fiscal_document',
      entityId: saved.id,
      action: 'fiscal_document.status_synced',
      eventType: 'fiscal.sync',
      metadata: {
        status: saved.status,
        providerStatus: dto.providerStatus?.trim() || null,
        providerReferenceNo: dto.providerReferenceNo?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });
    return saved;
  }

  private async assertUniqueDocumentNo(tenantId: string, branchId: string, documentType: FiscalDocumentType, documentNo: string, currentId?: string) {
    const existing = await this.fiscalDocumentRepository.findByTenantBranchTypeAndDocumentNo(tenantId, branchId, documentType, documentNo.trim());
    if (existing && existing.id !== currentId) {
      throw new DomainValidationError(`Fiscal Document number '${documentNo}' already exists for this branch and document type.`);
    }
  }

  private formatMoney(value: number) {
    return value.toFixed(2);
  }
}
