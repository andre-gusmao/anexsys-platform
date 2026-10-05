import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MeasurementSetItemEntity } from '../entities/measurement-set-item.entity';

@Injectable()
export class MeasurementSetItemRepository {
  constructor(
    @InjectRepository(MeasurementSetItemEntity)
    private readonly repository: Repository<MeasurementSetItemEntity>,
  ) {}

  create(payload: Partial<MeasurementSetItemEntity>): MeasurementSetItemEntity {
    return this.repository.create(payload);
  }

  async saveMany(entities: MeasurementSetItemEntity[]): Promise<MeasurementSetItemEntity[]> {
    return this.repository.save(entities);
  }

  async findByMeasurementSetIds(measurementSetIds: string[]): Promise<MeasurementSetItemEntity[]> {
    if (measurementSetIds.length === 0) return [];
    return this.repository.find({
      where: { measurementSetId: In(measurementSetIds) },
      order: { bodyPartDisplayName: 'ASC', createdAt: 'ASC' },
    });
  }
}
