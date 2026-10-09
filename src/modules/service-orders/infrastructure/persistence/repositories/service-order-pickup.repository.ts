import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
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

  async findIdsWithPhoto(serviceOrderIds: string[]): Promise<string[]> {
    if (serviceOrderIds.length === 0) {
      return [];
    }
    const rows = await this.repository.find({
      where: { serviceOrderId: In(serviceOrderIds), isDeleted: false, photoBase64: Not(IsNull()) },
      select: { serviceOrderId: true },
    });
    return [...new Set(rows.map((row) => row.serviceOrderId))];
  }
}
