import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityEntity } from '../entities/community.entity';

@Injectable()
export class CommunityRepository {
  constructor(
    @InjectRepository(CommunityEntity)
    private readonly repository: Repository<CommunityEntity>,
  ) {}

  create(payload: Partial<CommunityEntity>): CommunityEntity {
    return this.repository.create(payload);
  }

  async save(community: CommunityEntity): Promise<CommunityEntity> {
    return this.repository.save(community);
  }

  async findById(id: string): Promise<CommunityEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenant(tenantId: string): Promise<CommunityEntity[]> {
    return this.repository.find({ where: { tenantId }, order: { displayName: 'ASC' } });
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<CommunityEntity | null> {
    return this.repository.findOne({ where: { tenantId, code } });
  }

  async findByIds(tenantId: string, ids: string[]): Promise<CommunityEntity[]> {
    if (ids.length === 0) return [];
    return this.repository
      .createQueryBuilder('community')
      .where('community.tenant_id = :tenantId', { tenantId })
      .andWhere('community.id IN (:...ids)', { ids })
      .orderBy('community.display_name', 'ASC')
      .getMany();
  }
}
