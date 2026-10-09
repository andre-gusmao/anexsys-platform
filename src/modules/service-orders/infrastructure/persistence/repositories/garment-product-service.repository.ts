import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { GarmentProductServiceEntity } from '../entities/garment-product-service.entity';

@Injectable()
export class GarmentProductServiceRepository {
  constructor(
    @InjectRepository(GarmentProductServiceEntity)
    private readonly repository: Repository<GarmentProductServiceEntity>,
  ) {}

  create(payload: Partial<GarmentProductServiceEntity>): GarmentProductServiceEntity {
    return this.repository.create(payload);
  }

  async save(entity: GarmentProductServiceEntity): Promise<GarmentProductServiceEntity> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<GarmentProductServiceEntity | null> {
    return this.repository.findOne({ where: { id, isDeleted: false } });
  }

  async findListedByTenant(tenantId: string): Promise<GarmentProductServiceEntity[]> {
    return this.repository.find({
      where: { tenantId, isDeleted: false },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findActiveByProduct(tenantId: string, productId: string): Promise<GarmentProductServiceEntity[]> {
    return this.repository.find({
      where: { tenantId, productId, isDeleted: false, status: MeasurementCatalogStatus.ACTIVE },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  async findByProductAndService(
    tenantId: string,
    productId: string,
    serviceId: string,
  ): Promise<GarmentProductServiceEntity | null> {
    return this.repository.findOne({
      where: { tenantId, productId, serviceId, isDeleted: false },
    });
  }

  async findActiveByProductAndService(
    tenantId: string,
    productId: string,
    serviceId: string,
  ): Promise<GarmentProductServiceEntity | null> {
    return this.repository.findOne({
      where: {
        tenantId,
        productId,
        serviceId,
        isDeleted: false,
        status: MeasurementCatalogStatus.ACTIVE,
      },
    });
  }
}
