import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleEntity } from '../entities/tenant-module.entity';

@Injectable()
export class TenantModuleRepository {
  constructor(
    @InjectRepository(TenantModuleEntity)
    private readonly repository: Repository<TenantModuleEntity>,
  ) {}

  create(payload: Partial<TenantModuleEntity>): TenantModuleEntity {
    return this.repository.create(payload);
  }

  async save(module: TenantModuleEntity): Promise<TenantModuleEntity> {
    return this.repository.save(module);
  }

  async saveMany(rows: TenantModuleEntity[]): Promise<TenantModuleEntity[]> {
    return this.repository.save(rows);
  }

  async findByTenant(tenantId: string): Promise<TenantModuleEntity[]> {
    return this.repository.find({ where: { tenantId }, order: { displayName: 'ASC' } });
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<TenantModuleEntity | null> {
    return this.repository.findOne({ where: { tenantId, code } });
  }
}
