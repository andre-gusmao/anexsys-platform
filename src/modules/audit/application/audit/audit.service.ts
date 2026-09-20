import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditEventEntity } from '../../infrastructure/persistence/entities/audit-event.entity';
import { AuditEventRepository } from '../../infrastructure/persistence/repositories/audit-event.repository';

export interface AuditWriteInput {
  tenantId?: string | null;
  branchId?: string | null;
  actorUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  eventType: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly auditEventRepository: AuditEventRepository) {}

  async record(input: AuditWriteInput): Promise<void> {
    const event = this.auditEventRepository.create({
      id: randomUUID(),
      tenantId: input.tenantId ?? null,
      branchId: input.branchId ?? null,
      actorUserId: input.actorUserId ?? null,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      action: input.action,
      eventType: input.eventType,
      metadata: input.metadata ?? {},
      occurredAt: new Date(),
    });

    await this.auditEventRepository.save(event);
  }

  async listByEntity(tenantId: string, entityType: string, entityId: string, limit: number = 50): Promise<AuditEventEntity[]> {
    return this.auditEventRepository.findByEntity(tenantId, entityType, entityId, limit);
  }
}
