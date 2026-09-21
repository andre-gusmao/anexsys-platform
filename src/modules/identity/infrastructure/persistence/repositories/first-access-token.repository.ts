import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirstAccessTokenEntity } from '../entities/first-access-token.entity';

@Injectable()
export class FirstAccessTokenRepository {
  constructor(
    @InjectRepository(FirstAccessTokenEntity)
    private readonly repository: Repository<FirstAccessTokenEntity>,
  ) {}

  create(payload: Partial<FirstAccessTokenEntity>): FirstAccessTokenEntity {
    return this.repository.create(payload);
  }

  async save(token: FirstAccessTokenEntity): Promise<FirstAccessTokenEntity> {
    return this.repository.save(token);
  }

  async findById(id: string): Promise<FirstAccessTokenEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findActiveByTokenHash(tokenHash: string): Promise<FirstAccessTokenEntity | null> {
    return this.repository
      .createQueryBuilder('token')
      .where('token.token_hash = :tokenHash', { tokenHash })
      .andWhere('token.consumed_at IS NULL')
      .andWhere('token.revoked_at IS NULL')
      .orderBy('token.created_at', 'DESC')
      .getOne();
  }

  async revokeActiveByUserId(userId: string, actorUserId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(FirstAccessTokenEntity)
      .set({ revokedAt: new Date(), updatedAt: new Date(), updatedBy: actorUserId })
      .where('user_id = :userId', { userId })
      .andWhere('consumed_at IS NULL')
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}
