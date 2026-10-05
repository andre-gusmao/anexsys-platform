import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MeasurementBodyPartEntity } from '../entities/measurement-body-part.entity';

@Injectable()
export class MeasurementBodyPartRepository {
  constructor(
    @InjectRepository(MeasurementBodyPartEntity)
    private readonly repository: Repository<MeasurementBodyPartEntity>,
  ) {}

  create(payload: Partial<MeasurementBodyPartEntity>): MeasurementBodyPartEntity {
    return this.repository.create(payload);
  }

  async save(entity: MeasurementBodyPartEntity): Promise<MeasurementBodyPartEntity> {
    return this.repository.save(entity);
  }

  async saveMany(entities: MeasurementBodyPartEntity[]): Promise<MeasurementBodyPartEntity[]> {
    return this.repository.save(entities);
  }

  async findById(id: string): Promise<MeasurementBodyPartEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findActiveByTenant(tenantId: string): Promise<MeasurementBodyPartEntity[]> {
    return this.repository.find({ where: { tenantId, isDeleted: false }, order: { sortOrder: 'ASC', displayName: 'ASC' } });
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<MeasurementBodyPartEntity | null> {
    return this.repository.findOne({ where: { tenantId, code, isDeleted: false } });
  }

  async findByIds(tenantId: string, ids: string[]): Promise<MeasurementBodyPartEntity[]> {
    if (ids.length === 0) return [];
    return this.repository.find({ where: { tenantId, id: In(ids), isDeleted: false } });
  }
}
