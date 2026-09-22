import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MeasurementUnitEntity } from '../entities/measurement-unit.entity';

@Injectable()
export class MeasurementUnitRepository {
  constructor(
    @InjectRepository(MeasurementUnitEntity)
    private readonly repository: Repository<MeasurementUnitEntity>,
  ) {}

  create(payload: Partial<MeasurementUnitEntity>): MeasurementUnitEntity {
    return this.repository.create(payload);
  }

  async save(entity: MeasurementUnitEntity): Promise<MeasurementUnitEntity> {
    return this.repository.save(entity);
  }

  async saveMany(entities: MeasurementUnitEntity[]): Promise<MeasurementUnitEntity[]> {
    return this.repository.save(entities);
  }

  async findById(id: string): Promise<MeasurementUnitEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findActiveByTenant(tenantId: string): Promise<MeasurementUnitEntity[]> {
    return this.repository.find({ where: { tenantId, isDeleted: false }, order: { sortOrder: 'ASC', code: 'ASC' } });
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<MeasurementUnitEntity | null> {
    return this.repository.findOne({ where: { tenantId, code, isDeleted: false } });
  }

  async findByIds(tenantId: string, ids: string[]): Promise<MeasurementUnitEntity[]> {
    if (ids.length === 0) return [];
    return this.repository.find({ where: { tenantId, id: In(ids), isDeleted: false } });
  }
}
