import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupAuthorizationStatus } from 'src/shared/domain/enums';
import { PickupAuthorizationEntity } from '../entities/pickup-authorization.entity';

export interface PickupAuthorizationSearchFilters {
  branchId?: string;
  serviceOrderId?: string;
  status?: PickupAuthorizationStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class PickupAuthorizationRepository {
  constructor(@InjectRepository(PickupAuthorizationEntity) private readonly repository: Repository<PickupAuthorizationEntity>) {}

  create(payload: Partial<PickupAuthorizationEntity>): PickupAuthorizationEntity {
    return this.repository.create(payload);
  }

  async save(entity: PickupAuthorizationEntity): Promise<PickupAuthorizationEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<PickupAuthorizationEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async search(tenantId: string, filters: PickupAuthorizationSearchFilters): Promise<PickupAuthorizationEntity[]> {
    const query = this.repository.createQueryBuilder('pickup_authorization').where('pickup_authorization.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) query.andWhere('1 = 0');
    else query.andWhere('pickup_authorization.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    if (filters.branchId) query.andWhere('pickup_authorization.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.serviceOrderId) query.andWhere('pickup_authorization.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    if (filters.status) query.andWhere('pickup_authorization.status = :status', { status: filters.status });
    return query.orderBy('pickup_authorization.valid_from', 'DESC').addOrderBy('pickup_authorization.created_at', 'DESC').getMany();
  }
}
