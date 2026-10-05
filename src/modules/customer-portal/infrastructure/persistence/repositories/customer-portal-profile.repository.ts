import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerPortalProfileEntity } from '../entities/customer-portal-profile.entity';

@Injectable()
export class CustomerPortalProfileRepository {
  constructor(@InjectRepository(CustomerPortalProfileEntity) private readonly repository: Repository<CustomerPortalProfileEntity>) {}

  create(payload: Partial<CustomerPortalProfileEntity>): CustomerPortalProfileEntity { return this.repository.create(payload); }
  async save(entity: CustomerPortalProfileEntity): Promise<CustomerPortalProfileEntity> { return this.repository.save(entity); }
  async findByUserId(userId: string): Promise<CustomerPortalProfileEntity | null> { return this.repository.findOne({ where: { userId } }); }
  async findByCustomerId(customerId: string): Promise<CustomerPortalProfileEntity | null> { return this.repository.findOne({ where: { customerId } }); }
  async findByCustomerCode(tenantId: string, customerCode: string): Promise<CustomerPortalProfileEntity | null> { return this.repository.findOne({ where: { tenantId, customerCode } }); }
}
