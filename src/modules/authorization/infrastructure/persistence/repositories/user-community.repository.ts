import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCommunityEntity } from '../entities/user-community.entity';

@Injectable()
export class UserCommunityRepository {
  constructor(
    @InjectRepository(UserCommunityEntity)
    private readonly repository: Repository<UserCommunityEntity>,
  ) {}

  create(payload: Partial<UserCommunityEntity>): UserCommunityEntity {
    return this.repository.create(payload);
  }

  async save(membership: UserCommunityEntity): Promise<UserCommunityEntity> {
    return this.repository.save(membership);
  }

  async findByUserAndCommunity(
    tenantId: string,
    userId: string,
    communityId: string,
  ): Promise<UserCommunityEntity | null> {
    return this.repository.findOne({ where: { tenantId, userId, communityId } });
  }

  async findByUserId(tenantId: string, userId: string): Promise<UserCommunityEntity[]> {
    return this.repository.find({ where: { tenantId, userId } });
  }
}
