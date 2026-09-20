import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserIdentityEntity } from '../entities/user-identity.entity';

@Injectable()
export class UserIdentityRepository {
  constructor(
    @InjectRepository(UserIdentityEntity)
    private readonly repository: Repository<UserIdentityEntity>,
  ) {}

  create(payload: Partial<UserIdentityEntity>): UserIdentityEntity {
    return this.repository.create(payload);
  }

  async save(user: UserIdentityEntity): Promise<UserIdentityEntity> {
    return this.repository.save(user);
  }

  async findById(id: string): Promise<UserIdentityEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByTenantAndEmail(tenantId: string, email: string): Promise<UserIdentityEntity | null> {
    return this.repository.findOne({
      where: {
        tenantId,
        email: email.toLowerCase(),
      },
    });
  }
}
