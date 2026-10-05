import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CctvReferenceEntity } from '../entities/cctv-reference.entity';

@Injectable()
export class CctvReferenceRepository {
  constructor(@InjectRepository(CctvReferenceEntity) private readonly repository: Repository<CctvReferenceEntity>) {}
  create(payload: Partial<CctvReferenceEntity>): CctvReferenceEntity { return this.repository.create(payload); }
  async save(entity: CctvReferenceEntity): Promise<CctvReferenceEntity> { return this.repository.save(entity); }
  async findByCustodyEvent(custodyEventId: string): Promise<CctvReferenceEntity[]> {
    return this.repository.find({ where: { custodyEventId }, order: { capturedAt: 'ASC', createdAt: 'ASC' } });
  }
}
