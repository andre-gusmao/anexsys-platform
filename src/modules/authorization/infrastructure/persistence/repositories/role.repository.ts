import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>,
  ) {}

  create(payload: Partial<RoleEntity>): RoleEntity {
    return this.repository.create(payload);
  }

  async save(role: RoleEntity): Promise<RoleEntity> {
    return this.repository.save(role);
  }

  async findById(id: string): Promise<RoleEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenant(tenantId: string): Promise<RoleEntity[]> {
    return this.repository.find({ where: { tenantId }, order: { displayName: 'ASC' } });
  }
}
