import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupQrCodeEntity } from '../entities/pickup-qr-code.entity';

@Injectable()
export class PickupQrCodeRepository {
  constructor(@InjectRepository(PickupQrCodeEntity) private readonly repository: Repository<PickupQrCodeEntity>) {}
  create(payload: Partial<PickupQrCodeEntity>): PickupQrCodeEntity { return this.repository.create(payload); }
  async save(entity: PickupQrCodeEntity): Promise<PickupQrCodeEntity> { return this.repository.save(entity); }
  async findByAuthorization(pickupAuthorizationId: string): Promise<PickupQrCodeEntity[]> {
    return this.repository.find({ where: { pickupAuthorizationId }, order: { issuedAt: 'DESC', createdAt: 'DESC' } });
  }
  async findByAuthorizationAndValue(pickupAuthorizationId: string, codeValue: string): Promise<PickupQrCodeEntity | null> {
    return this.repository.findOne({ where: { pickupAuthorizationId, codeValue } });
  }
}
