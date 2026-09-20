import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FiscalService } from 'src/modules/fiscal/application/fiscal/fiscal.service';
import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';

function createFiscalFixture() {
  const fiscalDocuments: Array<Record<string, any>> = [];
  const audits: Array<Record<string, any>> = [];
  const serviceOrder = {
    id: 'service-order-1',
    branchId: 'branch-1',
    customerId: 'customer-1',
  };
  const items = [
    { id: 'item-1', itemNo: 1, description: 'Executive Shirt' },
    { id: 'item-2', itemNo: 2, description: 'Formal Pants' },
  ];

  const fiscalDocumentRepository = {
    create(payload: Record<string, any>) {
      return { createdAt: new Date(), updatedAt: new Date(), ...payload };
    },
    async save(entity: Record<string, any>) {
      const index = fiscalDocuments.findIndex((item) => item.id === entity.id);
      if (index >= 0) fiscalDocuments[index] = entity;
      else fiscalDocuments.push(entity);
      return entity;
    },
    async findById(id: string) {
      return fiscalDocuments.find((item) => item.id === id) ?? null;
    },
    async findByTenantBranchTypeAndDocumentNo(tenantId: string, branchId: string, documentType: string, documentNo: string) {
      return fiscalDocuments.find((item) => item.tenantId === tenantId && item.branchId === branchId && item.documentType === documentType && item.documentNo === documentNo) ?? null;
    },
    async search(_tenantId: string, filters: Record<string, any>) {
      return fiscalDocuments.filter((item) => {
        if (filters.branchId && item.branchId !== filters.branchId) return false;
        if (filters.serviceOrderId && item.serviceOrderId !== filters.serviceOrderId) return false;
        if (filters.serviceOrderItemId && item.serviceOrderItemId !== filters.serviceOrderItemId) return false;
        if (filters.documentType && item.documentType !== filters.documentType) return false;
        if (filters.status && item.status !== filters.status) return false;
        return (filters.accessibleBranchIds ?? []).includes(item.branchId);
      });
    },
  };

  const auditService = {
    async record(payload: Record<string, any>) {
      audits.push({ occurredAt: new Date(), ...payload });
    },
    async listByEntity(tenantId: string, entityType: string, entityId: string) {
      return audits.filter((audit) => audit.tenantId === tenantId && audit.entityType === entityType && audit.entityId === entityId);
    },
  };

  const service = new FiscalService(
    fiscalDocumentRepository as never,
    {
      async getById(serviceOrderId: string) {
        return { ...serviceOrder, id: serviceOrderId };
      },
      async getDetails() {
        return { serviceOrder: { ...serviceOrder }, items: items.map((item) => ({ ...item })) };
      },
    } as never,
    { async getById() { return { id: 'tenant-1' }; } } as never,
    { async getById() { return { id: 'branch-1', tenantId: 'tenant-1' }; } } as never,
    auditService as never,
  );

  return { service, fiscalDocuments, audits };
}

describe('FiscalService', () => {
  it('creates draft fiscal documents and exposes event timeline details', async () => {
    const { service } = createFiscalFixture();

    const created = await service.createFiscalDocument({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      serviceOrderItemId: 'item-1',
      documentType: FiscalDocumentType.NFSE,
      documentNo: 'NFSE-1001',
      grossAmount: 50,
    });
    const details = await service.getFiscalDocumentDetails('tenant-1', created.id);

    assert.equal(created.status, FiscalDocumentStatus.DRAFT);
    assert.equal(created.documentType, FiscalDocumentType.NFSE);
    assert.equal(created.documentNo, 'NFSE-1001');
    assert.equal(details.fiscalStatus, FiscalDocumentStatus.DRAFT);
    assert.equal(details.fiscalEvents.length, 1);
    assert.equal(details.timeline.length, 1);
    assert.equal(details.serviceOrderItem?.id, 'item-1');
  });

  it('rejects item-scoped fiscal documents when the item is not part of the service order', async () => {
    const { service } = createFiscalFixture();

    await assert.rejects(
      () =>
        service.createFiscalDocument({
          tenantId: 'tenant-1',
          actorUserId: 'user-1',
          serviceOrderId: 'service-order-1',
          serviceOrderItemId: 'item-x',
          documentType: FiscalDocumentType.NFE,
          documentNo: 'NFE-1002',
        }),
      /must belong to the referenced Service Order/,
    );
  });

  it('issues and cancels fiscal documents while recording cancellation records', async () => {
    const { service } = createFiscalFixture();

    const created = await service.createFiscalDocument({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      documentType: FiscalDocumentType.CREDIT_DOCUMENT,
      documentNo: 'CRD-1003',
    });
    const issued = await service.issueFiscalDocument(created.id, 'tenant-1', {
      actorUserId: 'user-2',
      issuedAt: '2026-09-20T10:00:00.000Z',
      grossAmount: 15,
      providerStatus: 'authorized',
      providerReferenceNo: 'provider-1',
    });
    assert.equal(issued.status, FiscalDocumentStatus.ISSUED);
    const cancelled = await service.cancelFiscalDocument(created.id, 'tenant-1', {
      actorUserId: 'user-3',
      reason: 'Customer reversal approved',
      providerStatus: 'cancelled',
    });
    const details = await service.getFiscalDocumentDetails('tenant-1', created.id);

    assert.equal(cancelled.status, FiscalDocumentStatus.CANCELLED);
    assert.equal(details.cancellationRecords.length, 1);
    assert.equal(details.cancellationRecords[0]?.metadata?.reason, 'Customer reversal approved');
  });

  it('syncs fiscal status and keeps provider trace in audit history', async () => {
    const { service } = createFiscalFixture();

    const created = await service.createFiscalDocument({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      serviceOrderId: 'service-order-1',
      documentType: FiscalDocumentType.DEBIT_DOCUMENT,
      documentNo: 'DBT-1004',
    });
    const synced = await service.syncFiscalStatus(created.id, 'tenant-1', {
      actorUserId: 'user-2',
      status: FiscalDocumentStatus.ERROR,
      providerStatus: 'rejected',
      providerReferenceNo: 'provider-2',
      notes: 'Rejected by provider',
    });
    const details = await service.getFiscalDocumentDetails('tenant-1', created.id);

    assert.equal(synced.status, FiscalDocumentStatus.ERROR);
    assert.equal(details.fiscalEvents.length, 2);
    assert.equal(details.fiscalEvents[1]?.metadata?.providerStatus, 'rejected');
    assert.equal(details.timeline[0]?.action, 'fiscal_document.status_synced');
  });
});
