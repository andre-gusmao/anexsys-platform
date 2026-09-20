import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
