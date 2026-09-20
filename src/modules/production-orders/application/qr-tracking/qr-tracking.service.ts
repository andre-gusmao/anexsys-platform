import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import { BranchService } from 'src/modules/branch/application/branch/branch.service';
import { OperationalResourceService } from 'src/modules/operational-resources/application/operational-resource/operational-resource.service';
import { TenantService } from 'src/modules/tenant/application/tenant/tenant.service';
import {
  ProductionOrderStatus,
  QrScanResult,
  QrScanType,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { ScanQrCodeDto } from '../../contracts/dto/scan-qr-code.dto';
import { SearchQrEventsDto } from '../../contracts/dto/search-qr-events.dto';
import { QrEventEntity } from '../../infrastructure/persistence/entities/qr-event.entity';
import { QrEventRepository } from '../../infrastructure/persistence/repositories/qr-event.repository';
import { ProductionOrderService } from '../production-order/production-order.service';

@Injectable()
export class QrTrackingService {
  constructor(
    private readonly qrEventRepository: QrEventRepository,
    private readonly productionOrderService: ProductionOrderService,
    private readonly operationalResourceService: OperationalResourceService,
    private readonly tenantService: TenantService,
    private readonly branchService: BranchService,
    private readonly auditService: AuditService,
  ) {}

  async searchEvents(tenantId: string, filters: SearchQrEventsDto & { accessibleBranchIds: string[] }) {
    await this.tenantService.getById(tenantId);
    if (filters.branchId) {
      const branch = await this.branchService.getById(filters.branchId);
      if (branch.tenantId !== tenantId) {
        throw new DomainValidationError('Branch must belong to the same tenant.');
      }
    }
    if (filters.productionOrderId) {
      await this.productionOrderService.getById(filters.productionOrderId, tenantId);
    }
    if (filters.operationalResourceId) {
      await this.operationalResourceService.getById(filters.operationalResourceId, tenantId);
    }
    return this.qrEventRepository.search(tenantId, filters);
  }

  async scan(tenantId: string, dto: ScanQrCodeDto) {
    const qrCode = await this.productionOrderService.getActiveQrCodeByValue(tenantId, dto.codeValue.trim());
    if (!qrCode || !qrCode.isActive) {
      throw new DomainValidationError('Active Production Order QR Code was not found.');
    }

    const order = await this.productionOrderService.getById(qrCode.productionOrderId, tenantId);
    this.productionOrderService.assertBranchAccess(order, dto.accessibleBranchIds);

    if (dto.operationalResourceId) {
      await this.operationalResourceService.assertResourceBranchAccess(
        dto.operationalResourceId,
        tenantId,
        dto.accessibleBranchIds,
      );
    }

    const result = await this.applyScanAction(order.id, tenantId, dto, order.branchId);
    const qrEvent = await this.qrEventRepository.save(
      this.qrEventRepository.create({
        id: randomUUID(),
        tenantId,
        branchId: order.branchId,
        qrCodeId: qrCode.id,
        productionOrderId: order.id,
        operationalResourceId: dto.operationalResourceId ?? null,
        scanType: dto.scanType,
        scannedCodeValue: dto.codeValue.trim(),
        scannedAt: new Date(),
        scanResult: QrScanResult.ACCEPTED,
        eventPayload: {
          deviceInfo: dto.deviceInfo?.trim() || null,
          diaryEntry: dto.diaryEntry?.trim() || null,
          targetStatus: dto.targetStatus ?? null,
          resultingStatus: result.status,
        },
        recordedBy: dto.actorUserId,
        createdBy: dto.actorUserId,
        updatedBy: dto.actorUserId,
      }),
    );

    await this.auditService.record({
      tenantId,
      branchId: order.branchId,
      actorUserId: dto.actorUserId,
      entityType: 'production_order',
      entityId: order.id,
      action: 'production_order.qr.scanned',
      eventType: 'production.traceability',
      metadata: {
        qrCodeId: qrCode.id,
        qrEventId: qrEvent.id,
        scanType: dto.scanType,
        scanResult: qrEvent.scanResult,
        resultingStatus: result.status,
      },
    });

    return {
      qrCode,
      qrEvent,
      productionOrder: result,
    };
  }

  private async applyScanAction(
    productionOrderId: string,
    tenantId: string,
    dto: ScanQrCodeDto,
    branchId: string,
  ) {
    switch (dto.scanType) {
      case QrScanType.START_EXECUTION:
        if (!dto.operationalResourceId) {
          throw new DomainValidationError('Operational Resource is required to start execution by QR scan.');
        }
        await this.operationalResourceService.assertAssignableToBranch(tenantId, dto.operationalResourceId, branchId);
        return this.productionOrderService.start(productionOrderId, tenantId, {
          actorUserId: dto.actorUserId,
          operationalResourceId: dto.operationalResourceId,
          diaryEntry: dto.diaryEntry ?? null,
        });
      case QrScanType.ASSUME_RESPONSIBILITY:
        if (!dto.operationalResourceId) {
          throw new DomainValidationError('Operational Resource is required to assume responsibility by QR scan.');
        }
        await this.operationalResourceService.assertAssignableToBranch(tenantId, dto.operationalResourceId, branchId);
        return this.productionOrderService.assumeResponsibility(productionOrderId, tenantId, {
          actorUserId: dto.actorUserId,
          operationalResourceId: dto.operationalResourceId,
          diaryEntry: dto.diaryEntry ?? null,
        });
      case QrScanType.UPDATE_DIARY:
        if (!dto.diaryEntry?.trim()) {
          throw new DomainValidationError('Operational Diary entry is required for QR diary updates.');
        }
        return this.productionOrderService.recordDiaryEntry(productionOrderId, tenantId, {
          actorUserId: dto.actorUserId,
          operationalResourceId: dto.operationalResourceId ?? null,
          diaryEntry: dto.diaryEntry,
          eventPayload: { deviceInfo: dto.deviceInfo?.trim() || null, scanType: dto.scanType },
        });
      case QrScanType.UPDATE_STATUS:
        if (!dto.targetStatus) {
          throw new DomainValidationError('Target production status is required for QR status updates.');
        }
        if (dto.targetStatus === ProductionOrderStatus.IN_PROGRESS) {
          return this.productionOrderService.start(productionOrderId, tenantId, {
            actorUserId: dto.actorUserId,
            operationalResourceId: dto.operationalResourceId ?? undefined,
            diaryEntry: dto.diaryEntry ?? null,
          });
        }
        if (dto.targetStatus === ProductionOrderStatus.PAUSED) {
          return this.productionOrderService.pause(productionOrderId, tenantId, {
            actorUserId: dto.actorUserId,
            diaryEntry: dto.diaryEntry ?? null,
          });
        }
        if (dto.targetStatus === ProductionOrderStatus.COMPLETED) {
          return this.productionOrderService.complete(productionOrderId, tenantId, {
            actorUserId: dto.actorUserId,
            diaryEntry: dto.diaryEntry ?? null,
          });
        }
        throw new DomainValidationError('QR status updates only support in-progress, paused, or completed targets.');
      default:
        throw new DomainValidationError('Unsupported QR scan action.');
    }
  }
}
