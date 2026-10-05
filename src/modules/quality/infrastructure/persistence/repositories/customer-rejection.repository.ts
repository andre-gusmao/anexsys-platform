import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRejectionStatus } from 'src/shared/domain/enums';
import { CustomerRejectionEntity } from '../entities/customer-rejection.entity';

export interface CustomerRejectionSearchFilters {
  branchId?: string;
  serviceOrderId?: string;
  serviceOrderItemId?: string;
  status?: CustomerRejectionStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class CustomerRejectionRepository {
  constructor(
    @InjectRepository(CustomerRejectionEntity)
    private readonly repository: Repository<CustomerRejectionEntity>,
  ) {}

  create(payload: Partial<CustomerRejectionEntity>): CustomerRejectionEntity {
    return this.repository.create(payload);
  }

  async save(entity: CustomerRejectionEntity): Promise<CustomerRejectionEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<CustomerRejectionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async search(tenantId: string, filters: CustomerRejectionSearchFilters): Promise<CustomerRejectionEntity[]> {
    const query = this.repository.createQueryBuilder('customer_rejection').where('customer_rejection.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('customer_rejection.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    }
    if (filters.branchId) query.andWhere('customer_rejection.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.serviceOrderId) query.andWhere('customer_rejection.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    if (filters.serviceOrderItemId) query.andWhere('customer_rejection.service_order_item_id = :serviceOrderItemId', { serviceOrderItemId: filters.serviceOrderItemId });
    if (filters.status) query.andWhere('customer_rejection.status = :status', { status: filters.status });
    return query.orderBy('customer_rejection.reported_at', 'DESC').addOrderBy('customer_rejection.created_at', 'DESC').getMany();
  }
}
