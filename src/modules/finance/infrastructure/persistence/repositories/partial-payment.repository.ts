import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  async findByPaymentRecord(paymentRecordId: string, manager?: EntityManager): Promise<PartialPaymentEntity[]> {
    return (manager ?? this.repository.manager).getRepository(PartialPaymentEntity).find({ where: { paymentRecordId }, order: { allocatedAt: 'ASC', createdAt: 'ASC' } });
  }

  async findByServiceOrder(serviceOrderId: string, manager?: EntityManager): Promise<PartialPaymentEntity[]> {
    return (manager ?? this.repository.manager).getRepository(PartialPaymentEntity).find({ where: { serviceOrderId }, order: { allocatedAt: 'ASC', createdAt: 'ASC' } });
  }

  async saveManyInTransaction(entities: PartialPaymentEntity[], manager: EntityManager): Promise<PartialPaymentEntity[]> {
    return manager.getRepository(PartialPaymentEntity).save(entities);
  }
}
