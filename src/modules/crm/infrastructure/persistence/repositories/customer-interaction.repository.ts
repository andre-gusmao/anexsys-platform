import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerInteractionEntity } from '../entities/customer-interaction.entity';

@Injectable()
export class CustomerInteractionRepository {
  constructor(
    @InjectRepository(CustomerInteractionEntity)
    private readonly repository: Repository<CustomerInteractionEntity>,
  ) {}

  create(payload: Partial<CustomerInteractionEntity>): CustomerInteractionEntity {
    return this.repository.create(payload);
  }

  async save(interaction: CustomerInteractionEntity): Promise<CustomerInteractionEntity> {
    return this.repository.save(interaction);
  }

  async findByCustomer(tenantId: string, customerId: string): Promise<CustomerInteractionEntity[]> {
    return this.repository.find({
      where: { tenantId, customerId },
      order: { occurredAt: 'DESC', createdAt: 'DESC' },
    });
  }
}
