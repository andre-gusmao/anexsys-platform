import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarrantyExecutionStatus } from 'src/shared/domain/enums';
import { WarrantyExecutionEntity } from '../entities/warranty-execution.entity';

export interface WarrantyExecutionSearchFilters {
  branchId?: string;
  serviceOrderId?: string;
  productionOrderId?: string;
  status?: WarrantyExecutionStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class WarrantyExecutionRepository {
  constructor(
    @InjectRepository(WarrantyExecutionEntity)
    private readonly repository: Repository<WarrantyExecutionEntity>,
  ) {}

  create(payload: Partial<WarrantyExecutionEntity>): WarrantyExecutionEntity {
    return this.repository.create(payload);
  }

  async save(entity: WarrantyExecutionEntity): Promise<WarrantyExecutionEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<WarrantyExecutionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async search(tenantId: string, filters: WarrantyExecutionSearchFilters): Promise<WarrantyExecutionEntity[]> {
    const query = this.repository.createQueryBuilder('warranty_execution').where('warranty_execution.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('warranty_execution.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    }
    if (filters.branchId) query.andWhere('warranty_execution.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.serviceOrderId) query.andWhere('warranty_execution.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    if (filters.productionOrderId) query.andWhere('warranty_execution.production_order_id = :productionOrderId', { productionOrderId: filters.productionOrderId });
    if (filters.status) query.andWhere('warranty_execution.status = :status', { status: filters.status });
    return query.orderBy('warranty_execution.opened_at', 'DESC').addOrderBy('warranty_execution.created_at', 'DESC').getMany();
  }
}
