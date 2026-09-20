import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemporaryPickupCodeEntity } from '../entities/temporary-pickup-code.entity';

@Injectable()
export class TemporaryPickupCodeRepository {
  constructor(@InjectRepository(TemporaryPickupCodeEntity) private readonly repository: Repository<TemporaryPickupCodeEntity>) {}
  create(payload: Partial<TemporaryPickupCodeEntity>): TemporaryPickupCodeEntity { return this.repository.create(payload); }
  async save(entity: TemporaryPickupCodeEntity): Promise<TemporaryPickupCodeEntity> { return this.repository.save(entity); }
  async findByAuthorization(pickupAuthorizationId: string): Promise<TemporaryPickupCodeEntity[]> {
    return this.repository.find({ where: { pickupAuthorizationId }, order: { issuedAt: 'DESC', createdAt: 'DESC' } });
  }
  async findByAuthorizationAndValue(pickupAuthorizationId: string, codeValue: string): Promise<TemporaryPickupCodeEntity | null> {
    return this.repository.findOne({ where: { pickupAuthorizationId, codeValue } });
  }
}
