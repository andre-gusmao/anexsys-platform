import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CustomerStatus, CustomerType } from 'src/shared/domain/enums';
import { CustomerEntity } from '../entities/customer.entity';

export interface CustomerSearchFilters {
  q?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
}

@Injectable()
export class CustomerRepository {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repository: Repository<CustomerEntity>,
  ) {}

  create(payload: Partial<CustomerEntity>): CustomerEntity {
    return this.repository.create(payload);
  }

  async save(customer: CustomerEntity): Promise<CustomerEntity> {
    return this.repository.save(customer);
  }

  async findById(id: string): Promise<CustomerEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findByTenantAndDocument(tenantId: string, cpfCnpj: string): Promise<CustomerEntity | null> {
    return this.repository.findOne({
      where: { tenantId, cpfCnpj, isDeleted: false },
    });
  }

  async search(tenantId: string, filters: CustomerSearchFilters): Promise<CustomerEntity[]> {
    const query = this.repository
      .createQueryBuilder('customer')
      .where('customer.tenant_id = :tenantId', { tenantId })
      .andWhere('customer.is_deleted = false');

    if (filters.status) {
      query.andWhere('customer.status = :status', { status: filters.status });
    }

    if (filters.customerType) {
      query.andWhere('customer.customer_type = :customerType', { customerType: filters.customerType });
    }

    if (filters.q?.trim()) {
      const normalizedQuery = `%${filters.q.trim().toLowerCase()}%`;
      query.andWhere(
        new Brackets((searchQuery) => {
          searchQuery
            .where('LOWER(customer.legal_name) LIKE :normalizedQuery', { normalizedQuery })
            .orWhere("LOWER(COALESCE(customer.trade_name, '')) LIKE :normalizedQuery", { normalizedQuery })
            .orWhere("LOWER(COALESCE(customer.email, '')) LIKE :normalizedQuery", { normalizedQuery })
            .orWhere("COALESCE(customer.phone, '') LIKE :normalizedQuery", { normalizedQuery })
            .orWhere("COALESCE(customer.cpf_cnpj, '') LIKE :normalizedQuery", { normalizedQuery });
        }),
      );
    }

    return query.orderBy('customer.legal_name', 'ASC').addOrderBy('customer.created_at', 'DESC').getMany();
  }
}
