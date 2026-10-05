import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrCodeEntity } from '../entities/qr-code.entity';

@Injectable()
export class QrCodeRepository {
  constructor(
    @InjectRepository(QrCodeEntity)
    private readonly repository: Repository<QrCodeEntity>,
  ) {}

  create(payload: Partial<QrCodeEntity>): QrCodeEntity {
    return this.repository.create(payload);
  }

  async save(qrCode: QrCodeEntity): Promise<QrCodeEntity> {
    return this.repository.save(qrCode);
  }

  async findActiveByProductionOrder(productionOrderId: string): Promise<QrCodeEntity | null> {
    return this.repository.findOne({
      where: { productionOrderId, isActive: true },
      order: { issuedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findByCodeValue(tenantId: string, codeValue: string): Promise<QrCodeEntity | null> {
    return this.repository.findOne({
      where: { tenantId, codeValue },
      order: { issuedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findLatestByProductionOrder(productionOrderId: string): Promise<QrCodeEntity | null> {
    return this.repository.findOne({
      where: { productionOrderId },
      order: { reissueNo: 'DESC', createdAt: 'DESC' },
    });
  }
}
