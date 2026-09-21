import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPermissionEntity } from '../entities/community-permission.entity';

@Injectable()
export class CommunityPermissionRepository {
  constructor(
    @InjectRepository(CommunityPermissionEntity)
    private readonly repository: Repository<CommunityPermissionEntity>,
  ) {}

  create(payload: Partial<CommunityPermissionEntity>): CommunityPermissionEntity {
    return this.repository.create(payload);
  }

  async save(link: CommunityPermissionEntity): Promise<CommunityPermissionEntity> {
    return this.repository.save(link);
  }

  async findByCommunityAndPermission(
    tenantId: string,
    communityId: string,
    permissionId: string,
  ): Promise<CommunityPermissionEntity | null> {
    return this.repository.findOne({ where: { tenantId, communityId, permissionId } });
  }

  async findByCommunityIds(tenantId: string, communityIds: string[]): Promise<CommunityPermissionEntity[]> {
    if (communityIds.length === 0) return [];
    return this.repository
      .createQueryBuilder('communityPermission')
      .where('communityPermission.tenant_id = :tenantId', { tenantId })
      .andWhere('communityPermission.community_id IN (:...communityIds)', { communityIds })
      .getMany();
  }
}
