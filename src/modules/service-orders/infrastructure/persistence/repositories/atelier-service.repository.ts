import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { AtelierServiceEntity } from '../entities/atelier-service.entity';

@Injectable()
export class AtelierServiceRepository {
  constructor(
    @InjectRepository(AtelierServiceEntity)
    private readonly repository: Repository<AtelierServiceEntity>,
  ) {}

  create(payload: Partial<AtelierServiceEntity>): AtelierServiceEntity {
    return this.repository.create(payload);
  }

  async save(entity: AtelierServiceEntity): Promise<AtelierServiceEntity> {
    return this.repository.save(entity);
  }

  async saveMany(entities: AtelierServiceEntity[]): Promise<AtelierServiceEntity[]> {
    return this.repository.save(entities);
  }

  async findById(id: string): Promise<AtelierServiceEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findListedByTenant(tenantId: string): Promise<AtelierServiceEntity[]> {
    return this.repository.find({ where: { tenantId, isDeleted: false }, order: { sortOrder: 'ASC', displayName: 'ASC' } });
  }

  async findActiveByTenant(tenantId: string): Promise<AtelierServiceEntity[]> {
    return this.repository.find({
      where: { tenantId, isDeleted: false, status: MeasurementCatalogStatus.ACTIVE },
      order: { sortOrder: 'ASC', displayName: 'ASC' },
    });
  }

  async findCodesByTenant(tenantId: string): Promise<string[]> {
    const rows = await this.repository.find({ where: { tenantId }, select: { code: true } });
    return rows.map((row) => row.code);
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<AtelierServiceEntity | null> {
    return this.repository.findOne({ where: { tenantId, code, isDeleted: false } });
  }

  async findByIds(tenantId: string, ids: string[]): Promise<AtelierServiceEntity[]> {
    if (ids.length === 0) return [];
    return this.repository.find({
      where: { tenantId, id: In(ids), isDeleted: false, status: MeasurementCatalogStatus.ACTIVE },
    });
  }
}
