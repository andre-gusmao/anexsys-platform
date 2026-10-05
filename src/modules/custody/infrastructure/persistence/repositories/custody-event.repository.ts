import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustodyEventStage } from 'src/shared/domain/enums';
import { CustodyEventEntity } from '../entities/custody-event.entity';

export interface CustodyEventSearchFilters {
  branchId?: string;
  serviceOrderId?: string;
  productionOrderId?: string;
  pickupAuthorizationId?: string;
  eventStage?: CustodyEventStage;
  accessibleBranchIds: string[];
}

@Injectable()
export class CustodyEventRepository {
  constructor(@InjectRepository(CustodyEventEntity) private readonly repository: Repository<CustodyEventEntity>) {}
  create(payload: Partial<CustodyEventEntity>): CustodyEventEntity { return this.repository.create(payload); }
  async save(entity: CustodyEventEntity): Promise<CustodyEventEntity> { return this.repository.save(entity); }
  async findById(id: string): Promise<CustodyEventEntity | null> { return this.repository.findOne({ where: { id } }); }
  async search(tenantId: string, filters: CustodyEventSearchFilters): Promise<CustodyEventEntity[]> {
    const query = this.repository.createQueryBuilder('custody_event').where('custody_event.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) query.andWhere('1 = 0');
    else query.andWhere('custody_event.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    if (filters.branchId) query.andWhere('custody_event.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.serviceOrderId) query.andWhere('custody_event.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    if (filters.productionOrderId) query.andWhere('custody_event.production_order_id = :productionOrderId', { productionOrderId: filters.productionOrderId });
    if (filters.pickupAuthorizationId) query.andWhere('custody_event.pickup_authorization_id = :pickupAuthorizationId', { pickupAuthorizationId: filters.pickupAuthorizationId });
    if (filters.eventStage) query.andWhere('custody_event.event_stage = :eventStage', { eventStage: filters.eventStage });
    return query.orderBy('custody_event.event_at', 'DESC').addOrderBy('custody_event.created_at', 'DESC').getMany();
  }
  async findByServiceOrder(serviceOrderId: string): Promise<CustodyEventEntity[]> {
    return this.repository.find({ where: { serviceOrderId }, order: { eventAt: 'DESC', createdAt: 'DESC' } });
  }
}
