import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserCredentialEntity } from '../entities/user-credential.entity';

@Injectable()
export class UserCredentialRepository {
  constructor(
    @InjectRepository(UserCredentialEntity)
    private readonly repository: Repository<UserCredentialEntity>,
  ) {}

  create(payload: Partial<UserCredentialEntity>): UserCredentialEntity {
    return this.repository.create(payload);
  }

  async save(credential: UserCredentialEntity): Promise<UserCredentialEntity> {
    return this.repository.save(credential);
  }

  async findByUserId(userId: string): Promise<UserCredentialEntity | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async findByUserIds(userIds: string[]): Promise<UserCredentialEntity[]> {
    if (userIds.length === 0) return [];
    return this.repository.find({ where: { userId: In(userIds) } });
  }
}
