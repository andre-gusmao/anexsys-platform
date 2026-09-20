import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerContactEntity } from '../entities/customer-contact.entity';

@Injectable()
export class CustomerContactRepository {
  constructor(
    @InjectRepository(CustomerContactEntity)
    private readonly repository: Repository<CustomerContactEntity>,
  ) {}

  create(payload: Partial<CustomerContactEntity>): CustomerContactEntity {
    return this.repository.create(payload);
  }

  async save(contact: CustomerContactEntity): Promise<CustomerContactEntity> {
    return this.repository.save(contact);
  }

  async findByCustomer(tenantId: string, customerId: string): Promise<CustomerContactEntity[]> {
    return this.repository.find({
      where: { tenantId, customerId, isDeleted: false },
      order: { isPrimary: 'DESC', contactName: 'ASC' },
    });
  }

  async findPrimaryByCustomer(tenantId: string, customerId: string): Promise<CustomerContactEntity | null> {
    return this.repository.findOne({
      where: { tenantId, customerId, isPrimary: true, isDeleted: false },
    });
  }
}
