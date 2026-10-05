import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarrantyAdjustmentStatus } from 'src/shared/domain/enums';
import { WarrantyAdjustmentEntity } from '../entities/warranty-adjustment.entity';

export interface WarrantyAdjustmentSearchFilters {
  branchId?: string;
  serviceOrderId?: string;
  status?: WarrantyAdjustmentStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class WarrantyAdjustmentRepository {
  constructor(
    @InjectRepository(WarrantyAdjustmentEntity)
    private readonly repository: Repository<WarrantyAdjustmentEntity>,
  ) {}

  create(payload: Partial<WarrantyAdjustmentEntity>): WarrantyAdjustmentEntity {
    return this.repository.create(payload);
  }

  async save(entity: WarrantyAdjustmentEntity): Promise<WarrantyAdjustmentEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<WarrantyAdjustmentEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async search(tenantId: string, filters: WarrantyAdjustmentSearchFilters): Promise<WarrantyAdjustmentEntity[]> {
    const query = this.repository.createQueryBuilder('warranty_adjustment').where('warranty_adjustment.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('warranty_adjustment.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    }
    if (filters.branchId) query.andWhere('warranty_adjustment.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.serviceOrderId) query.andWhere('warranty_adjustment.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    if (filters.status) query.andWhere('warranty_adjustment.status = :status', { status: filters.status });
    return query.orderBy('warranty_adjustment.opened_at', 'DESC').addOrderBy('warranty_adjustment.created_at', 'DESC').getMany();
  }
}
