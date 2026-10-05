import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';
import { FiscalDocumentEntity } from '../entities/fiscal-document.entity';

export interface FiscalDocumentSearchFilters {
  branchId?: string;
  serviceOrderId?: string;
  serviceOrderItemId?: string;
  documentType?: FiscalDocumentType;
  status?: FiscalDocumentStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class FiscalDocumentRepository {
  constructor(
    @InjectRepository(FiscalDocumentEntity)
    private readonly repository: Repository<FiscalDocumentEntity>,
  ) {}

  create(payload: Partial<FiscalDocumentEntity>): FiscalDocumentEntity {
    return this.repository.create(payload);
  }

  async save(entity: FiscalDocumentEntity): Promise<FiscalDocumentEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FiscalDocumentEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenantBranchTypeAndDocumentNo(
    tenantId: string,
    branchId: string,
    documentType: FiscalDocumentType,
    documentNo: string,
  ): Promise<FiscalDocumentEntity | null> {
    return this.repository.findOne({ where: { tenantId, branchId, documentType, documentNo } });
  }

  async search(tenantId: string, filters: FiscalDocumentSearchFilters): Promise<FiscalDocumentEntity[]> {
    const query = this.repository.createQueryBuilder('fiscal_document').where('fiscal_document.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('fiscal_document.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    }
    if (filters.branchId) query.andWhere('fiscal_document.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.serviceOrderId) query.andWhere('fiscal_document.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    if (filters.serviceOrderItemId) query.andWhere('fiscal_document.service_order_item_id = :serviceOrderItemId', { serviceOrderItemId: filters.serviceOrderItemId });
    if (filters.documentType) query.andWhere('fiscal_document.document_type = :documentType', { documentType: filters.documentType });
    if (filters.status) query.andWhere('fiscal_document.status = :status', { status: filters.status });
    return query.orderBy('COALESCE(fiscal_document.issued_at, fiscal_document.created_at)', 'DESC').addOrderBy('fiscal_document.created_at', 'DESC').getMany();
  }
}
