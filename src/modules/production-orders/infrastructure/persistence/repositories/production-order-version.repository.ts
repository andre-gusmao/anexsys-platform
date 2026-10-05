import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrderVersionEntity } from '../entities/production-order-version.entity';

@Injectable()
export class ProductionOrderVersionRepository {
  constructor(
    @InjectRepository(ProductionOrderVersionEntity)
    private readonly repository: Repository<ProductionOrderVersionEntity>,
  ) {}

  create(payload: Partial<ProductionOrderVersionEntity>): ProductionOrderVersionEntity {
    return this.repository.create(payload);
  }

  async save(version: ProductionOrderVersionEntity): Promise<ProductionOrderVersionEntity> {
    return this.repository.save(version);
  }

  async findByProductionOrder(productionOrderId: string): Promise<ProductionOrderVersionEntity[]> {
    return this.repository.find({
      where: { productionOrderId },
      order: { versionNo: 'DESC', createdAt: 'DESC' },
    });
  }

  async findActiveByProductionOrder(productionOrderId: string): Promise<ProductionOrderVersionEntity | null> {
    return this.repository.findOne({
      where: { productionOrderId, isActive: true },
      order: { versionNo: 'DESC' },
    });
  }

  async findLatestVersionNumber(productionOrderId: string): Promise<number> {
    const version = await this.repository.findOne({
      where: { productionOrderId },
      order: { versionNo: 'DESC' },
    });

    return version?.versionNo ?? 1;
  }

  async deactivateActiveVersions(productionOrderId: string, actorUserId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(ProductionOrderVersionEntity)
      .set({ isActive: false, updatedBy: actorUserId })
      .where('production_order_id = :productionOrderId', { productionOrderId })
      .andWhere('is_active = true')
      .execute();
  }
}
