import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CameraSnapshotEntity } from '../entities/camera-snapshot.entity';

@Injectable()
export class CameraSnapshotRepository {
  constructor(@InjectRepository(CameraSnapshotEntity) private readonly repository: Repository<CameraSnapshotEntity>) {}
  create(payload: Partial<CameraSnapshotEntity>): CameraSnapshotEntity { return this.repository.create(payload); }
  async save(entity: CameraSnapshotEntity): Promise<CameraSnapshotEntity> { return this.repository.save(entity); }
  async findByCustodyEvent(custodyEventId: string): Promise<CameraSnapshotEntity[]> {
    return this.repository.find({ where: { custodyEventId }, order: { capturedAt: 'ASC', createdAt: 'ASC' } });
  }
}
