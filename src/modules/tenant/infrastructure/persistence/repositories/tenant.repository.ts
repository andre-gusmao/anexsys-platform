import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from '../entities/tenant.entity';

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
  ) {}

  create(payload: Partial<TenantEntity>): TenantEntity {
    return this.repository.create(payload);
  }

  async save(tenant: TenantEntity): Promise<TenantEntity> {
    return this.repository.save(tenant);
  }

  async findAll(): Promise<TenantEntity[]> {
    return this.repository.find({ order: { displayName: 'ASC' } });
  }

  async findById(id: string): Promise<TenantEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<TenantEntity | null> {
    return this.repository.findOne({ where: { code } });
  }
}
