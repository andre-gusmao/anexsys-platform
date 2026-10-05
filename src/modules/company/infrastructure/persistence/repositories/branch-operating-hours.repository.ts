import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchOperatingHoursEntity } from '../entities/branch-operating-hours.entity';

@Injectable()
export class BranchOperatingHoursRepository {
  constructor(
    @InjectRepository(BranchOperatingHoursEntity)
    private readonly repository: Repository<BranchOperatingHoursEntity>,
  ) {}

  create(payload: Partial<BranchOperatingHoursEntity>): BranchOperatingHoursEntity {
    return this.repository.create(payload);
  }

  async saveMany(rows: BranchOperatingHoursEntity[]): Promise<BranchOperatingHoursEntity[]> {
    return this.repository.save(rows);
  }

  async findByBranch(tenantId: string, branchId: string): Promise<BranchOperatingHoursEntity[]> {
    return this.repository.find({ where: { tenantId, branchId }, order: { weekday: 'ASC' } });
  }

  async deleteByBranch(tenantId: string, branchId: string): Promise<void> {
    await this.repository.delete({ tenantId, branchId });
  }
}
