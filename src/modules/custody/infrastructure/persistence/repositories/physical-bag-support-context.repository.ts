import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhysicalBagSupportContextEntity } from '../entities/physical-bag-support-context.entity';

@Injectable()
export class PhysicalBagSupportContextRepository {
  constructor(@InjectRepository(PhysicalBagSupportContextEntity) private readonly repository: Repository<PhysicalBagSupportContextEntity>) {}
  create(payload: Partial<PhysicalBagSupportContextEntity>): PhysicalBagSupportContextEntity { return this.repository.create(payload); }
  async save(entity: PhysicalBagSupportContextEntity): Promise<PhysicalBagSupportContextEntity> { return this.repository.save(entity); }
  async findCurrentByServiceOrder(serviceOrderId: string): Promise<PhysicalBagSupportContextEntity | null> {
    return this.repository.findOne({ where: { serviceOrderId, inUse: true }, order: { updatedAt: 'DESC', createdAt: 'DESC' } });
  }
}
