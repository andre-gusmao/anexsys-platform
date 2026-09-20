import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';
import { OperationalResourceEntity } from '../entities/operational-resource.entity';

export interface OperationalResourceSearchFilters {
  q?: string;
  branchId?: string;
  resourceType?: OperationalResourceType;
  status?: OperationalResourceStatus;
  availabilityStatus?: OperationalAvailabilityStatus;
  accessibleBranchIds: string[];
}

@Injectable()
export class OperationalResourceRepository {
  constructor(
    @InjectRepository(OperationalResourceEntity)
    private readonly repository: Repository<OperationalResourceEntity>,
  ) {}

  create(payload: Partial<OperationalResourceEntity>): OperationalResourceEntity {
    return this.repository.create(payload);
  }

  async save(resource: OperationalResourceEntity): Promise<OperationalResourceEntity> {
    return this.repository.save(resource);
  }

  async findById(id: string): Promise<OperationalResourceEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async search(tenantId: string, filters: OperationalResourceSearchFilters): Promise<OperationalResourceEntity[]> {
    const query = this.repository
      .createQueryBuilder('resource')
      .leftJoin(
        'operational_resource_branch_scopes',
        'scope',
        "scope.operational_resource_id = resource.id AND (scope.valid_to IS NULL OR scope.valid_to >= CURRENT_DATE)",
      )
      .where('resource.tenant_id = :tenantId', { tenantId })
      .andWhere('resource.is_deleted = false');

    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere(
        new Brackets((branchQuery) => {
          branchQuery
            .where('resource.home_branch_id IN (:...accessibleBranchIds)', {
              accessibleBranchIds: filters.accessibleBranchIds,
            })
            .orWhere('scope.branch_id IN (:...accessibleBranchIds)', {
              accessibleBranchIds: filters.accessibleBranchIds,
            });
        }),
      );
    }

    if (filters.branchId) {
      query.andWhere(
        new Brackets((branchQuery) => {
          branchQuery
            .where('resource.home_branch_id = :branchId', { branchId: filters.branchId })
            .orWhere('scope.branch_id = :branchId', { branchId: filters.branchId });
        }),
      );
    }
    if (filters.resourceType) {
      query.andWhere('resource.resource_type = :resourceType', { resourceType: filters.resourceType });
    }
    if (filters.status) {
      query.andWhere('resource.status = :status', { status: filters.status });
    }
    if (filters.availabilityStatus) {
      query.andWhere('resource.availability_status = :availabilityStatus', {
        availabilityStatus: filters.availabilityStatus,
      });
    }
    if (filters.q?.trim()) {
      const normalizedQuery = `%${filters.q.trim().toLowerCase()}%`;
      query.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            .where('LOWER(resource.display_name) LIKE :normalizedQuery', { normalizedQuery })
            .orWhere("LOWER(COALESCE(resource.document_no, '')) LIKE :normalizedQuery", { normalizedQuery })
            .orWhere("LOWER(COALESCE(resource.email, '')) LIKE :normalizedQuery", { normalizedQuery });
        }),
      );
    }

    return query.distinct(true).orderBy('resource.display_name', 'ASC').getMany();
  }
}
