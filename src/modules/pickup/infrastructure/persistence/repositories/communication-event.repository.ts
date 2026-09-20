import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunicationEventEntity } from '../entities/communication-event.entity';

@Injectable()
export class CommunicationEventRepository {
  constructor(@InjectRepository(CommunicationEventEntity) private readonly repository: Repository<CommunicationEventEntity>) {}
  create(payload: Partial<CommunicationEventEntity>): CommunicationEventEntity { return this.repository.create(payload); }
  async save(entity: CommunicationEventEntity): Promise<CommunicationEventEntity> { return this.repository.save(entity); }
  async findByServiceOrder(serviceOrderId: string): Promise<CommunicationEventEntity[]> {
    return this.repository.find({ where: { serviceOrderId }, order: { sentAt: 'DESC', createdAt: 'DESC' } });
  }
}
