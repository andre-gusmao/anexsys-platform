import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBranchScopeEntity } from '../entities/user-branch-scope.entity';

@Injectable()
export class UserBranchScopeRepository {
  constructor(
    @InjectRepository(UserBranchScopeEntity)
    private readonly repository: Repository<UserBranchScopeEntity>,
  ) {}

  create(payload: Partial<UserBranchScopeEntity>): UserBranchScopeEntity {
    return this.repository.create(payload);
  }

  async save(scope: UserBranchScopeEntity): Promise<UserBranchScopeEntity> {
    return this.repository.save(scope);
  }

  async findByUserId(userId: string): Promise<UserBranchScopeEntity[]> {
    return this.repository.find({ where: { userId } });
  }
}
