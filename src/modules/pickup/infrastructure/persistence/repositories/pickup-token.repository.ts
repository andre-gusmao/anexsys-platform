import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupTokenEntity } from '../entities/pickup-token.entity';

@Injectable()
export class PickupTokenRepository {
  constructor(@InjectRepository(PickupTokenEntity) private readonly repository: Repository<PickupTokenEntity>) {}
  create(payload: Partial<PickupTokenEntity>): PickupTokenEntity { return this.repository.create(payload); }
  async save(entity: PickupTokenEntity): Promise<PickupTokenEntity> { return this.repository.save(entity); }
  async findByAuthorization(pickupAuthorizationId: string): Promise<PickupTokenEntity[]> {
    return this.repository.find({ where: { pickupAuthorizationId }, order: { issuedAt: 'DESC', createdAt: 'DESC' } });
  }
  async findByAuthorizationAndValue(pickupAuthorizationId: string, tokenValue: string): Promise<PickupTokenEntity | null> {
    return this.repository.findOne({ where: { pickupAuthorizationId, tokenValue } });
  }
}
