import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionStatus } from 'src/shared/domain/enums';
import { UserSessionEntity } from '../entities/user-session.entity';

@Injectable()
export class UserSessionRepository {
  constructor(
    @InjectRepository(UserSessionEntity)
    private readonly repository: Repository<UserSessionEntity>,
  ) {}

  create(payload: Partial<UserSessionEntity>): UserSessionEntity {
    return this.repository.create(payload);
  }

  async save(session: UserSessionEntity): Promise<UserSessionEntity> {
    return this.repository.save(session);
  }

  async findActiveById(sessionId: string): Promise<UserSessionEntity | null> {
    return this.repository.findOne({ where: { id: sessionId, status: SessionStatus.ACTIVE } });
  }

  async rotateRefreshToken(params: {
    sessionId: string;
    expectedRefreshTokenHash: string;
    refreshTokenHash: string;
    expiresAt: Date;
    updatedBy: string;
  }): Promise<boolean> {
    const result = await this.repository.update(
      {
        id: params.sessionId,
        status: SessionStatus.ACTIVE,
        refreshTokenHash: params.expectedRefreshTokenHash,
      },
      {
        refreshTokenHash: params.refreshTokenHash,
        lastUsedAt: new Date(),
        expiresAt: params.expiresAt,
        updatedAt: new Date(),
        updatedBy: params.updatedBy,
      },
    );

    return (result.affected ?? 0) === 1;
  }
}
