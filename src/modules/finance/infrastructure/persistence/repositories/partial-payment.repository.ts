import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PartialPaymentEntity } from '../entities/partial-payment.entity';

@Injectable()
export class PartialPaymentRepository {
  constructor(
    @InjectRepository(PartialPaymentEntity)
    private readonly repository: Repository<PartialPaymentEntity>,
  ) {}

  create(payload: Partial<PartialPaymentEntity>): PartialPaymentEntity {
    return this.repository.create(payload);
  }

  async save(entity: PartialPaymentEntity): Promise<PartialPaymentEntity> {
    return this.repository.save(entity);
  }

  async saveMany(entities: PartialPaymentEntity[]): Promise<PartialPaymentEntity[]> {
    return this.repository.save(entities);
  }

  async findByPaymentRecord(paymentRecordId: string): Promise<PartialPaymentEntity[]> {
    return this.repository.find({ where: { paymentRecordId }, order: { allocatedAt: 'ASC', createdAt: 'ASC' } });
  }

  async findByServiceOrder(serviceOrderId: string): Promise<PartialPaymentEntity[]> {
    return this.repository.find({ where: { serviceOrderId }, order: { allocatedAt: 'ASC', createdAt: 'ASC' } });
  }
}
