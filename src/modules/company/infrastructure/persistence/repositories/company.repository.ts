import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from '../entities/company.entity';

@Injectable()
export class CompanyRepository {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repository: Repository<CompanyEntity>,
  ) {}

  create(payload: Partial<CompanyEntity>): CompanyEntity {
    return this.repository.create(payload);
  }

  async save(company: CompanyEntity): Promise<CompanyEntity> {
    return this.repository.save(company);
  }

  async findById(id: string): Promise<CompanyEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findByTenant(tenantId: string): Promise<CompanyEntity[]> {
    return this.repository.find({ where: { tenantId, isDeleted: false }, order: { legalName: 'ASC' } });
  }

  async findDefaultByTenant(tenantId: string): Promise<CompanyEntity | null> {
    return this.repository.findOne({ where: { tenantId, isDefault: true, isDeleted: false } });
  }

  async findByTenantAndCnpj(tenantId: string, cnpj: string): Promise<CompanyEntity | null> {
    return this.repository.findOne({ where: { tenantId, cnpj, isDeleted: false } });
  }
}
