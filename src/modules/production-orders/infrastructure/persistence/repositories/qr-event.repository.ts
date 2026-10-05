import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { QrScanResult, QrScanType } from 'src/shared/domain/enums';
import { QrEventEntity } from '../entities/qr-event.entity';

export interface QrEventSearchFilters {
  branchId?: string;
  productionOrderId?: string;
  operationalResourceId?: string;
  scanType?: QrScanType;
  scanResult?: QrScanResult;
  accessibleBranchIds: string[];
}

@Injectable()
export class QrEventRepository {
  constructor(
    @InjectRepository(QrEventEntity)
    private readonly repository: Repository<QrEventEntity>,
  ) {}

  create(payload: Partial<QrEventEntity>): QrEventEntity {
    return this.repository.create(payload);
  }

  async save(event: QrEventEntity): Promise<QrEventEntity> {
    return this.repository.save(event);
  }

  async findByProductionOrder(productionOrderId: string): Promise<QrEventEntity[]> {
    return this.repository.find({
      where: { productionOrderId },
      order: { scannedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async search(tenantId: string, filters: QrEventSearchFilters): Promise<QrEventEntity[]> {
    const query = this.repository
      .createQueryBuilder('qr_event')
      .where('qr_event.tenant_id = :tenantId', { tenantId });

    if (filters.accessibleBranchIds.length === 0) {
      query.andWhere('1 = 0');
    } else {
      query.andWhere('qr_event.branch_id IN (:...accessibleBranchIds)', {
        accessibleBranchIds: filters.accessibleBranchIds,
      });
    }

    if (filters.branchId) {
      query.andWhere('qr_event.branch_id = :branchId', { branchId: filters.branchId });
    }
    if (filters.productionOrderId) {
      query.andWhere('qr_event.production_order_id = :productionOrderId', {
        productionOrderId: filters.productionOrderId,
      });
    }
    if (filters.operationalResourceId) {
      query.andWhere('qr_event.operational_resource_id = :operationalResourceId', {
        operationalResourceId: filters.operationalResourceId,
      });
    }
    if (filters.scanType) {
      query.andWhere('qr_event.scan_type = :scanType', { scanType: filters.scanType });
    }
    if (filters.scanResult) {
      query.andWhere('qr_event.scan_result = :scanResult', { scanResult: filters.scanResult });
    }

    return query.orderBy('qr_event.scanned_at', 'DESC').addOrderBy('qr_event.created_at', 'DESC').getMany();
  }
}
