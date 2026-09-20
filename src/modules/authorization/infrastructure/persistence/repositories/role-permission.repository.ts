import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolePermissionEntity } from '../entities/role-permission.entity';

@Injectable()
export class RolePermissionRepository {
  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly repository: Repository<RolePermissionEntity>,
  ) {}

  create(payload: Partial<RolePermissionEntity>): RolePermissionEntity {
    return this.repository.create(payload);
  }

  async save(rolePermission: RolePermissionEntity): Promise<RolePermissionEntity> {
    return this.repository.save(rolePermission);
  }

  async findByRoleIds(roleIds: string[]): Promise<RolePermissionEntity[]> {
    if (roleIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('rolePermission')
      .where('rolePermission.role_id IN (:...roleIds)', { roleIds })
      .getMany();
  }
}
