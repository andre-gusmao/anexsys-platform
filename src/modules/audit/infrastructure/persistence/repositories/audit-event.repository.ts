import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEventEntity } from '../entities/audit-event.entity';

@Injectable()
export class AuditEventRepository {
  constructor(
    @InjectRepository(AuditEventEntity)
    private readonly repository: Repository<AuditEventEntity>,
  ) {}

  create(payload: Partial<AuditEventEntity>): AuditEventEntity {
    return this.repository.create(payload);
  }

  async save(event: AuditEventEntity): Promise<AuditEventEntity> {
    return this.repository.save(event);
  }
}
