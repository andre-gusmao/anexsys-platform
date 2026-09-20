import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialExceptionEntity } from '../entities/financial-exception.entity';

@Injectable()
export class FinancialExceptionRepository {
  constructor(
    @InjectRepository(FinancialExceptionEntity)
    private readonly repository: Repository<FinancialExceptionEntity>,
  ) {}

  create(payload: Partial<FinancialExceptionEntity>): FinancialExceptionEntity {
    return this.repository.create(payload);
  }

  async save(entity: FinancialExceptionEntity): Promise<FinancialExceptionEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<FinancialExceptionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
