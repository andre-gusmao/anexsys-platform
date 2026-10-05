import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DigitalApprovalDecision } from 'src/shared/domain/enums';
import { DigitalApprovalEntity } from '../entities/digital-approval.entity';

@Injectable()
export class DigitalApprovalRepository {
  constructor(@InjectRepository(DigitalApprovalEntity) private readonly repository: Repository<DigitalApprovalEntity>) {}
  create(payload: Partial<DigitalApprovalEntity>): DigitalApprovalEntity { return this.repository.create(payload); }
  async save(entity: DigitalApprovalEntity): Promise<DigitalApprovalEntity> { return this.repository.save(entity); }
  async findByPickupAuthorization(pickupAuthorizationId: string): Promise<DigitalApprovalEntity[]> {
    return this.repository.find({ where: { pickupAuthorizationId }, order: { createdAt: 'DESC' } });
  }
  async findByServiceOrderIds(serviceOrderIds: string[]): Promise<DigitalApprovalEntity[]> {
    if (serviceOrderIds.length === 0) return [];
    return this.repository.find({ where: { serviceOrderId: In(serviceOrderIds) }, order: { requestedAt: 'DESC', createdAt: 'DESC' } });
  }
  async findPendingByPickupAuthorization(pickupAuthorizationId: string): Promise<DigitalApprovalEntity | null> {
    return this.repository.findOne({ where: { pickupAuthorizationId, decision: DigitalApprovalDecision.PENDING }, order: { createdAt: 'DESC' } });
  }
  async findByLinkToken(approvalLinkToken: string): Promise<DigitalApprovalEntity | null> {
    return this.repository.findOne({ where: { approvalLinkToken } });
  }
  async findById(id: string): Promise<DigitalApprovalEntity | null> {
    return this.repository.findOne({ where: { id } });
  }
}
