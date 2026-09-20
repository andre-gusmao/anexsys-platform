import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionOrderItemLinkEntity } from '../entities/production-order-item-link.entity';

@Injectable()
export class ProductionOrderItemLinkRepository {
  constructor(
    @InjectRepository(ProductionOrderItemLinkEntity)
    private readonly repository: Repository<ProductionOrderItemLinkEntity>,
  ) {}

  create(payload: Partial<ProductionOrderItemLinkEntity>): ProductionOrderItemLinkEntity {
    return this.repository.create(payload);
  }

  async save(link: ProductionOrderItemLinkEntity): Promise<ProductionOrderItemLinkEntity> {
    return this.repository.save(link);
  }

  async saveMany(links: ProductionOrderItemLinkEntity[]): Promise<ProductionOrderItemLinkEntity[]> {
    return this.repository.save(links);
  }

  async findByProductionOrder(productionOrderId: string): Promise<ProductionOrderItemLinkEntity[]> {
    return this.repository.find({
      where: { productionOrderId },
      order: { createdAt: 'ASC' },
    });
  }
}
