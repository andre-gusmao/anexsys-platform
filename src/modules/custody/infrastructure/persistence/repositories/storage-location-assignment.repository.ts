import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocationAssignmentEntity } from '../entities/storage-location-assignment.entity';

@Injectable()
export class StorageLocationAssignmentRepository {
  constructor(@InjectRepository(StorageLocationAssignmentEntity) private readonly repository: Repository<StorageLocationAssignmentEntity>) {}
  create(payload: Partial<StorageLocationAssignmentEntity>): StorageLocationAssignmentEntity { return this.repository.create(payload); }
  async save(entity: StorageLocationAssignmentEntity): Promise<StorageLocationAssignmentEntity> { return this.repository.save(entity); }
  async findCurrentByServiceOrder(serviceOrderId: string): Promise<StorageLocationAssignmentEntity | null> {
    return this.repository.findOne({ where: { serviceOrderId, isCurrent: true }, order: { assignedAt: 'DESC', createdAt: 'DESC' } });
  }
  async findHistoryByServiceOrder(serviceOrderId: string): Promise<StorageLocationAssignmentEntity[]> {
    return this.repository.find({ where: { serviceOrderId }, order: { assignedAt: 'DESC', createdAt: 'DESC' } });
  }
  async findById(id: string): Promise<StorageLocationAssignmentEntity | null> { return this.repository.findOne({ where: { id } }); }
}
