import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReworkCaseStatus } from 'src/shared/domain/enums';
import { ReworkCaseEntity } from '../entities/rework-case.entity';

export interface ReworkCaseSearchFilters {
  branchId?: string;
  productionOrderId?: string;
  status?: ReworkCaseStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class ReworkCaseRepository {
  constructor(
    @InjectRepository(ReworkCaseEntity)
    private readonly repository: Repository<ReworkCaseEntity>,
  ) {}

  create(payload: Partial<ReworkCaseEntity>): ReworkCaseEntity {
    return this.repository.create(payload);
  }

  async save(entity: ReworkCaseEntity): Promise<ReworkCaseEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<ReworkCaseEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async search(tenantId: string, filters: ReworkCaseSearchFilters): Promise<ReworkCaseEntity[]> {
    const query = this.repository.createQueryBuilder('rework_case').where('rework_case.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('rework_case.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    }
    if (filters.branchId) query.andWhere('rework_case.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.productionOrderId) query.andWhere('rework_case.production_order_id = :productionOrderId', { productionOrderId: filters.productionOrderId });
    if (filters.status) query.andWhere('rework_case.status = :status', { status: filters.status });
    return query.orderBy('rework_case.opened_at', 'DESC').addOrderBy('rework_case.created_at', 'DESC').getMany();
  }
}
