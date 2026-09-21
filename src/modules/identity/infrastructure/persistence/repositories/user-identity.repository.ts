import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatus } from 'src/shared/domain/enums';
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

  async findActiveByEmail(email: string): Promise<UserIdentityEntity[]> {
    return this.repository.find({
      where: { email: email.toLowerCase(), status: UserStatus.ACTIVE },
      order: { tenantId: 'ASC', displayName: 'ASC' },
    });
  }

  async findByEmail(email: string): Promise<UserIdentityEntity[]> {
    return this.repository.find({
      where: { email: email.toLowerCase() },
      order: { tenantId: 'ASC', displayName: 'ASC' },
    });
  }

  async findByTenant(tenantId: string): Promise<UserIdentityEntity[]> {
    return this.repository.find({ where: { tenantId }, order: { displayName: 'ASC' } });
  }
}
