import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { SmartConciergeQueueStatus } from 'src/shared/domain/enums';
import { SmartConciergeCheckInEntity } from '../entities/smart-concierge-check-in.entity';

export interface SmartConciergeQueueFilters {
  branchId?: string;
  status?: SmartConciergeQueueStatus;
  q?: string;
  accessibleBranchIds: string[];
}

@Injectable()
export class SmartConciergeCheckInRepository {
  constructor(@InjectRepository(SmartConciergeCheckInEntity) private readonly repository: Repository<SmartConciergeCheckInEntity>) {}

  create(payload: Partial<SmartConciergeCheckInEntity>): SmartConciergeCheckInEntity { return this.repository.create(payload); }
  async save(entity: SmartConciergeCheckInEntity): Promise<SmartConciergeCheckInEntity> { return this.repository.save(entity); }
  async findById(id: string): Promise<SmartConciergeCheckInEntity | null> { return this.repository.findOne({ where: { id } }); }
  async search(tenantId: string, filters: SmartConciergeQueueFilters): Promise<SmartConciergeCheckInEntity[]> {
    const query = this.repository.createQueryBuilder('check_in').where('check_in.tenant_id = :tenantId', { tenantId });
    if (filters.accessibleBranchIds.length === 0) query.andWhere('1=0');
    else query.andWhere('check_in.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    if (filters.branchId) query.andWhere('check_in.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.status) query.andWhere('check_in.status = :status', { status: filters.status });
    if (filters.q?.trim()) {
      const normalized = `%${filters.q.trim().toLowerCase()}%`;
      query.andWhere(new Brackets((qb) => {
        qb.where("LOWER(COALESCE(check_in.identification_value, '')) LIKE :normalized", { normalized })
          .orWhere("LOWER(COALESCE(check_in.notes, '')) LIKE :normalized", { normalized })
          .orWhere("COALESCE(check_in.service_order_id::text, '') LIKE :normalized", { normalized });
      }));
    }
    return query.orderBy('check_in.created_at', 'DESC').getMany();
  }
}
