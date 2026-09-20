import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PermissionRepository {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly repository: Repository<PermissionEntity>,
  ) {}

  create(payload: Partial<PermissionEntity>): PermissionEntity {
    return this.repository.create(payload);
  }

  async save(permission: PermissionEntity): Promise<PermissionEntity> {
    return this.repository.save(permission);
  }

  async findById(id: string): Promise<PermissionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenant(tenantId: string): Promise<PermissionEntity[]> {
    return this.repository.find({ where: { tenantId }, order: { code: 'ASC' } });
  }

  async findByIds(tenantId: string, ids: string[]): Promise<PermissionEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.repository.find({ where: { tenantId, id: In(ids) }, order: { code: 'ASC' } });
  }
}

