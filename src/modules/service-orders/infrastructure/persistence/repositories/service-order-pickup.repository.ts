import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceOrderPickupEntity } from '../entities/service-order-pickup.entity';

@Injectable()
export class ServiceOrderPickupRepository {
  constructor(
    @InjectRepository(ServiceOrderPickupEntity)
    private readonly repository: Repository<ServiceOrderPickupEntity>,
  ) {}

  create(payload: Partial<ServiceOrderPickupEntity>): ServiceOrderPickupEntity {
    return this.repository.create(payload);
  }

  async save(pickup: ServiceOrderPickupEntity): Promise<ServiceOrderPickupEntity> {
    return this.repository.save(pickup);
  }

  async findLatestByServiceOrder(serviceOrderId: string): Promise<ServiceOrderPickupEntity | null> {
    const rows = await this.repository.find({
      where: { serviceOrderId, isDeleted: false },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 1,
    });
    return rows[0] ?? null;
  }
}
