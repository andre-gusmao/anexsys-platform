import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrderOperationalAssignmentEntity } from '../entities/production-order-operational-assignment.entity';

@Injectable()
export class ProductionOrderOperationalAssignmentRepository {
  constructor(
    @InjectRepository(ProductionOrderOperationalAssignmentEntity)
    private readonly repository: Repository<ProductionOrderOperationalAssignmentEntity>,
  ) {}

  create(payload: Partial<ProductionOrderOperationalAssignmentEntity>): ProductionOrderOperationalAssignmentEntity {
    return this.repository.create(payload);
  }

  async save(assignment: ProductionOrderOperationalAssignmentEntity): Promise<ProductionOrderOperationalAssignmentEntity> {
    return this.repository.save(assignment);
  }

  async saveMany(
    assignments: ProductionOrderOperationalAssignmentEntity[],
  ): Promise<ProductionOrderOperationalAssignmentEntity[]> {
    return this.repository.save(assignments);
  }

  async findByProductionOrder(productionOrderId: string): Promise<ProductionOrderOperationalAssignmentEntity[]> {
    return this.repository.find({
      where: { productionOrderId },
      order: { assignedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findCurrentByProductionOrder(productionOrderId: string): Promise<ProductionOrderOperationalAssignmentEntity[]> {
    return this.repository.find({
      where: { productionOrderId, isCurrent: true },
      order: { assignedAt: 'ASC', createdAt: 'ASC' },
    });
  }

  async findCurrentPrimaryByProductionOrder(
    productionOrderId: string,
  ): Promise<ProductionOrderOperationalAssignmentEntity | null> {
    return this.repository.findOne({
      where: { productionOrderId, isCurrent: true, isPrimaryResponsible: true },
      order: { assignedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByResource(tenantId: string, resourceId: string): Promise<ProductionOrderOperationalAssignmentEntity[]> {
    return this.repository.find({
      where: { tenantId, operationalResourceId: resourceId },
      order: { assignedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async releaseCurrentAssignments(productionOrderId: string, actorUserId: string, releasedAt: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(ProductionOrderOperationalAssignmentEntity)
      .set({ isCurrent: false, releasedAt, updatedBy: actorUserId })
      .where('production_order_id = :productionOrderId', { productionOrderId })
      .andWhere('is_current = true')
      .execute();
  }

  async releaseCurrentPrimaryAssignments(productionOrderId: string, actorUserId: string, releasedAt: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(ProductionOrderOperationalAssignmentEntity)
      .set({ isCurrent: false, releasedAt, updatedBy: actorUserId })
      .where('production_order_id = :productionOrderId', { productionOrderId })
      .andWhere('is_current = true')
      .andWhere('is_primary_responsible = true')
      .execute();
  }
}
