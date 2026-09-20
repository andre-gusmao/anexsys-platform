import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchEntity } from '../entities/branch.entity';

@Injectable()
export class BranchRepository {
  constructor(
    @InjectRepository(BranchEntity)
    private readonly repository: Repository<BranchEntity>,
  ) {}

  create(payload: Partial<BranchEntity>): BranchEntity {
    return this.repository.create(payload);
  }

  async save(branch: BranchEntity): Promise<BranchEntity> {
    return this.repository.save(branch);
  }

  async findById(id: string): Promise<BranchEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenant(tenantId: string): Promise<BranchEntity[]> {
    return this.repository.find({ where: { tenantId }, order: { displayName: 'ASC' } });
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<BranchEntity | null> {
    return this.repository.findOne({ where: { tenantId, code } });
  }

  async findChildren(parentBranchId: string): Promise<BranchEntity[]> {
    return this.repository.find({ where: { parentBranchId }, order: { displayName: 'ASC' } });
  }
}
