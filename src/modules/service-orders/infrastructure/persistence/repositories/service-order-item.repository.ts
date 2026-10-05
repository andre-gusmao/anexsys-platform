import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrderItemEntity } from '../entities/service-order-item.entity';

@Injectable()
export class ServiceOrderItemRepository {
  constructor(
    @InjectRepository(ServiceOrderItemEntity)
    private readonly repository: Repository<ServiceOrderItemEntity>,
  ) {}

  create(payload: Partial<ServiceOrderItemEntity>): ServiceOrderItemEntity {
    return this.repository.create(payload);
  }

  async save(item: ServiceOrderItemEntity): Promise<ServiceOrderItemEntity> {
    return this.repository.save(item);
  }

  async findById(id: string): Promise<ServiceOrderItemEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findByServiceOrder(serviceOrderId: string): Promise<ServiceOrderItemEntity[]> {
    return this.repository.find({
      where: { serviceOrderId, isDeleted: false },
      order: { itemNo: 'ASC', createdAt: 'ASC' },
    });
  }

  async findNextItemNo(serviceOrderId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('item')
      .select('COALESCE(MAX(item.item_no), 0)', 'maxItemNo')
      .where('item.service_order_id = :serviceOrderId', { serviceOrderId })
      .getRawOne<{ maxItemNo: string }>();

    return Number(result?.maxItemNo ?? 0) + 1;
  }
}
