import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationalResourceBranchScopeEntity } from '../entities/operational-resource-branch-scope.entity';

@Injectable()
export class OperationalResourceBranchScopeRepository {
  constructor(
    @InjectRepository(OperationalResourceBranchScopeEntity)
    private readonly repository: Repository<OperationalResourceBranchScopeEntity>,
  ) {}

  create(payload: Partial<OperationalResourceBranchScopeEntity>): OperationalResourceBranchScopeEntity {
    return this.repository.create(payload);
  }

  async save(scope: OperationalResourceBranchScopeEntity): Promise<OperationalResourceBranchScopeEntity> {
    return this.repository.save(scope);
  }

  async saveMany(
    scopes: OperationalResourceBranchScopeEntity[],
  ): Promise<OperationalResourceBranchScopeEntity[]> {
    return this.repository.save(scopes);
  }

  async findByResource(resourceId: string): Promise<OperationalResourceBranchScopeEntity[]> {
    return this.repository.find({
      where: { operationalResourceId: resourceId },
      order: { validFrom: 'ASC', createdAt: 'ASC' },
    });
  }

  async findCurrentByResource(resourceId: string): Promise<OperationalResourceBranchScopeEntity[]> {
    return this.repository
      .createQueryBuilder('scope')
      .where('scope.operational_resource_id = :resourceId', { resourceId })
      .andWhere('(scope.valid_to IS NULL OR scope.valid_to >= CURRENT_DATE)')
      .orderBy('scope.valid_from', 'ASC')
      .addOrderBy('scope.created_at', 'ASC')
      .getMany();
  }
}
