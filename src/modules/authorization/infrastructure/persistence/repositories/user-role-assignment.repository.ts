import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserRoleAssignmentEntity } from '../entities/user-role-assignment.entity';

@Injectable()
export class UserRoleAssignmentRepository {
  constructor(
    @InjectRepository(UserRoleAssignmentEntity)
    private readonly repository: Repository<UserRoleAssignmentEntity>,
  ) {}

  create(payload: Partial<UserRoleAssignmentEntity>): UserRoleAssignmentEntity {
    return this.repository.create(payload);
  }

  async save(assignment: UserRoleAssignmentEntity): Promise<UserRoleAssignmentEntity> {
    return this.repository.save(assignment);
  }

  async findActiveByUserId(tenantId: string, userId: string): Promise<UserRoleAssignmentEntity[]> {
    return this.repository.find({
      where: {
        tenantId,
        userId,
        revokedAt: IsNull(),
      },
    });
  }
}
