import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementSetEntity } from '../entities/measurement-set.entity';

@Injectable()
export class MeasurementSetRepository {
  constructor(
    @InjectRepository(MeasurementSetEntity)
    private readonly repository: Repository<MeasurementSetEntity>,
  ) {}

  create(payload: Partial<MeasurementSetEntity>): MeasurementSetEntity {
    return this.repository.create(payload);
  }

  async save(entity: MeasurementSetEntity): Promise<MeasurementSetEntity> {
    return this.repository.save(entity);
  }

  async findLatestVersionNumber(tenantId: string, customerId: string): Promise<number> {
    const record = await this.repository.findOne({
      where: { tenantId, customerId },
      order: { versionNo: 'DESC' },
    });

    return record?.versionNo ?? 0;
  }

  async findByCustomer(tenantId: string, customerId: string): Promise<MeasurementSetEntity[]> {
    return this.repository.find({
      where: { tenantId, customerId },
      order: { versionNo: 'DESC', measurementDate: 'DESC', createdAt: 'DESC' },
    });
  }
}
