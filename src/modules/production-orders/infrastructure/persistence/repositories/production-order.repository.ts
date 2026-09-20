import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { ProductionOrderStatus, ProductionOrderVersionReason } from 'src/shared/domain/enums';
import { ProductionOrderEntity } from '../entities/production-order.entity';

export interface ProductionOrderSearchFilters {
  q?: string;
  branchId?: string;
  serviceOrderId?: string;
  operationalResourceId?: string;
  status?: ProductionOrderStatus;
  versionReason?: ProductionOrderVersionReason;
  accessibleBranchIds: string[];
}

@Injectable()
export class ProductionOrderRepository {
  constructor(
    @InjectRepository(ProductionOrderEntity)
    private readonly repository: Repository<ProductionOrderEntity>,
  ) {}

  create(payload: Partial<ProductionOrderEntity>): ProductionOrderEntity {
    return this.repository.create(payload);
  }

  async save(order: ProductionOrderEntity): Promise<ProductionOrderEntity> {
    return this.repository.save(order);
  }

  async findById(id: string): Promise<ProductionOrderEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findByServiceOrder(serviceOrderId: string): Promise<ProductionOrderEntity | null> {
    return this.repository.findOne({ where: { serviceOrderId, isDeleted: false } });
  }

  async search(tenantId: string, filters: ProductionOrderSearchFilters): Promise<ProductionOrderEntity[]> {
    const query = this.repository
      .createQueryBuilder('production_order')
      .leftJoin('service_orders', 'service_order', 'service_order.id = production_order.service_order_id')
      .leftJoin(
        'production_order_versions',
        'active_version',
        'active_version.production_order_id = production_order.id AND active_version.is_active = true',
      )
      .where('production_order.tenant_id = :tenantId', { tenantId })
      .andWhere('production_order.is_deleted = false');

    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('production_order.branch_id IN (:...accessibleBranchIds)', {
        accessibleBranchIds: filters.accessibleBranchIds,
      });
    }

    if (filters.branchId) {
      query.andWhere('production_order.branch_id = :branchId', { branchId: filters.branchId });
    }
    if (filters.serviceOrderId) {
      query.andWhere('production_order.service_order_id = :serviceOrderId', { serviceOrderId: filters.serviceOrderId });
    }
    if (filters.status) {
      query.andWhere('production_order.status = :status', { status: filters.status });
    }
    if (filters.versionReason) {
      query.andWhere('active_version.version_reason = :versionReason', { versionReason: filters.versionReason });
    }
    if (filters.operationalResourceId) {
      query.andWhere(
        `EXISTS (
          SELECT 1
          FROM production_order_operational_assignments assignment
          WHERE assignment.production_order_id = production_order.id
            AND assignment.operational_resource_id = :operationalResourceId
            AND assignment.is_current = true
        )`,
        { operationalResourceId: filters.operationalResourceId },
      );
    }

    if (filters.q?.trim()) {
      const normalizedQuery = `%${filters.q.trim().toLowerCase()}%`;
      query.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            .where('LOWER(production_order.production_no) LIKE :normalizedQuery', { normalizedQuery })
            .orWhere("LOWER(COALESCE(production_order.piece_description, '')) LIKE :normalizedQuery", { normalizedQuery })
            .orWhere("LOWER(COALESCE(production_order.instructions, '')) LIKE :normalizedQuery", { normalizedQuery })
            .orWhere('LOWER(service_order.order_no) LIKE :normalizedQuery', { normalizedQuery });
        }),
      );
    }

    return query.orderBy('production_order.created_at', 'DESC').getMany();
  }
}
