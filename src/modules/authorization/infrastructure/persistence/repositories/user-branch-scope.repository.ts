import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchScopeType } from 'src/shared/domain/enums';
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

  async findByUserId(tenantId: string, userId: string): Promise<UserBranchScopeEntity[]> {
    return this.repository.find({ where: { tenantId, userId } });
  }

  async findByUserBranchAndScope(
    tenantId: string,
    userId: string,
    branchId: string,
    scopeType: BranchScopeType,
  ): Promise<UserBranchScopeEntity | null> {
    return this.repository.findOne({ where: { tenantId, userId, branchId, scopeType } });
  }
}
