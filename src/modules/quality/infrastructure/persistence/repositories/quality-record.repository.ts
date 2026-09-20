import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityReleaseDecision } from 'src/shared/domain/enums';
import { QualityRecordEntity } from '../entities/quality-record.entity';

export interface QualityRecordSearchFilters {
  branchId?: string;
  productionOrderId?: string;
  serviceOrderItemId?: string;
  releaseDecision?: QualityReleaseDecision;
  accessibleBranchIds: string[];
}

@Injectable()
export class QualityRecordRepository {
  constructor(
    @InjectRepository(QualityRecordEntity)
    private readonly repository: Repository<QualityRecordEntity>,
  ) {}

  create(payload: Partial<QualityRecordEntity>): QualityRecordEntity {
    return this.repository.create(payload);
  }

  async save(entity: QualityRecordEntity): Promise<QualityRecordEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<QualityRecordEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByProductionOrder(productionOrderId: string): Promise<QualityRecordEntity[]> {
    return this.repository.find({ where: { productionOrderId }, order: { inspectionAt: 'DESC', createdAt: 'DESC' } });
  }

  async search(tenantId: string, filters: QualityRecordSearchFilters): Promise<QualityRecordEntity[]> {
    const query = this.repository.createQueryBuilder('quality_record').where('quality_record.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('quality_record.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    }
    if (filters.branchId) query.andWhere('quality_record.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.productionOrderId) query.andWhere('quality_record.production_order_id = :productionOrderId', { productionOrderId: filters.productionOrderId });
    if (filters.serviceOrderItemId) query.andWhere('quality_record.service_order_item_id = :serviceOrderItemId', { serviceOrderItemId: filters.serviceOrderItemId });
    if (filters.releaseDecision) query.andWhere('quality_record.release_decision = :releaseDecision', { releaseDecision: filters.releaseDecision });
    return query.orderBy('quality_record.inspection_at', 'DESC').addOrderBy('quality_record.created_at', 'DESC').getMany();
  }
}
