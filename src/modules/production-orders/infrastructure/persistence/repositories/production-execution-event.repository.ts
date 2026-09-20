import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionExecutionEventEntity } from '../entities/production-execution-event.entity';

@Injectable()
export class ProductionExecutionEventRepository {
  constructor(
    @InjectRepository(ProductionExecutionEventEntity)
    private readonly repository: Repository<ProductionExecutionEventEntity>,
  ) {}

  create(payload: Partial<ProductionExecutionEventEntity>): ProductionExecutionEventEntity {
    return this.repository.create(payload);
  }

  async save(event: ProductionExecutionEventEntity): Promise<ProductionExecutionEventEntity> {
    return this.repository.save(event);
  }

  async findByProductionOrder(productionOrderId: string): Promise<ProductionExecutionEventEntity[]> {
    return this.repository.find({
      where: { productionOrderId },
      order: { eventAt: 'DESC', createdAt: 'DESC' },
    });
  }
}
