import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementRecordEntity } from '../entities/measurement-record.entity';

@Injectable()
export class MeasurementRecordRepository {
  constructor(
    @InjectRepository(MeasurementRecordEntity)
    private readonly repository: Repository<MeasurementRecordEntity>,
  ) {}

  create(payload: Partial<MeasurementRecordEntity>): MeasurementRecordEntity {
    return this.repository.create(payload);
  }

  async save(record: MeasurementRecordEntity): Promise<MeasurementRecordEntity> {
    return this.repository.save(record);
  }

  async findByCustomer(tenantId: string, customerId: string): Promise<MeasurementRecordEntity[]> {
    return this.repository.find({
      where: { tenantId, customerId, isDeleted: false },
      order: { measuredAt: 'DESC', measurementLabel: 'ASC', versionNo: 'DESC' },
    });
  }

  async findLatestVersionNumber(tenantId: string, customerId: string, measurementLabel: string): Promise<number> {
    const record = await this.repository.findOne({
      where: { tenantId, customerId, measurementLabel, isDeleted: false },
      order: { versionNo: 'DESC' },
    });

    return record?.versionNo ?? 0;
  }
}
