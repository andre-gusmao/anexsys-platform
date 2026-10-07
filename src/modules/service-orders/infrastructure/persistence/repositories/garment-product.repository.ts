import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { GarmentProductEntity } from '../entities/garment-product.entity';

@Injectable()
export class GarmentProductRepository {
  constructor(
    @InjectRepository(GarmentProductEntity)
    private readonly repository: Repository<GarmentProductEntity>,
  ) {}

  create(payload: Partial<GarmentProductEntity>): GarmentProductEntity {
    return this.repository.create(payload);
  }

  async save(entity: GarmentProductEntity): Promise<GarmentProductEntity> {
    return this.repository.save(entity);
  }

  async saveMany(entities: GarmentProductEntity[]): Promise<GarmentProductEntity[]> {
    return this.repository.save(entities);
  }

  async findById(id: string): Promise<GarmentProductEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findListedByTenant(tenantId: string): Promise<GarmentProductEntity[]> {
    return this.repository.find({ where: { tenantId, isDeleted: false }, order: { sortOrder: 'ASC', displayName: 'ASC' } });
  }

  async findActiveByTenant(tenantId: string): Promise<GarmentProductEntity[]> {
    return this.repository.find({
      where: { tenantId, isDeleted: false, status: MeasurementCatalogStatus.ACTIVE },
      order: { sortOrder: 'ASC', displayName: 'ASC' },
    });
  }

  async findCodesByTenant(tenantId: string): Promise<string[]> {
    const rows = await this.repository.find({ where: { tenantId }, select: { code: true } });
    return rows.map((row) => row.code);
  }

  async findByTenantAndCode(tenantId: string, code: string): Promise<GarmentProductEntity | null> {
    return this.repository.findOne({ where: { tenantId, code, isDeleted: false } });
  }

  async findByIds(tenantId: string, ids: string[]): Promise<GarmentProductEntity[]> {
    if (ids.length === 0) return [];
    return this.repository.find({
      where: { tenantId, id: In(ids), isDeleted: false, status: MeasurementCatalogStatus.ACTIVE },
    });
  }
}
