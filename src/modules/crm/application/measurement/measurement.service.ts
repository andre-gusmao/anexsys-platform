import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AuditService } from 'src/modules/audit/application/audit/audit.service';
import {
  CustomerInteractionType,
  InteractionChannel,
} from 'src/shared/domain/enums';
import { DomainValidationError } from 'src/shared/errors/domain-validation.error';
import { CustomerService } from '../customer/customer.service';
import { CreateMeasurementRecordDto, CustomMeasurementInputDto } from '../../contracts/dto/create-measurement-record.dto';
import { CustomerInteractionEntity } from '../../infrastructure/persistence/entities/customer-interaction.entity';
import { MeasurementRecordEntity } from '../../infrastructure/persistence/entities/measurement-record.entity';
import { MeasurementRecordRepository } from '../../infrastructure/persistence/repositories/measurement-record.repository';

@Injectable()
export class MeasurementService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly customerService: CustomerService,
    private readonly measurementRecordRepository: MeasurementRecordRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateMeasurementRecordDto): Promise<MeasurementRecordEntity[]> {
    const customer = await this.customerService.getById(dto.customerId, dto.tenantId);
    const inputs = this.buildMeasurementInputs(dto);
    const measuredAt = dto.measuredAt ? new Date(dto.measuredAt) : new Date();

    const createdRecords: MeasurementRecordEntity[] = [];
    for (const input of inputs) {
      const nextVersion = (await this.measurementRecordRepository.findLatestVersionNumber(
        dto.tenantId,
        dto.customerId,
        input.label,
      )) + 1;

      const record = this.measurementRecordRepository.create({
        id: randomUUID(),
        tenantId: dto.tenantId,
        customerId: dto.customerId,
        serviceOrderId: null,
        measurementLabel: input.label,
        measurementData: {
          value: input.value,
          unit: input.unit ?? null,
          notes: input.notes ?? null,
        },
        versionNo: nextVersion,
        measuredAt,
        capturedBy: dto.actorUserId,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdBy: dto.actorUserId,
        updatedBy: dto.actorUserId,
      });
      createdRecords.push(record);
    }

    const savedRecords = await this.dataSource.transaction(async (manager) => {
      const persisted: MeasurementRecordEntity[] = [];
      for (const record of createdRecords) {
        const saved = await manager.save(MeasurementRecordEntity, manager.create(MeasurementRecordEntity, record));
        persisted.push(saved);

        const interaction = manager.create(CustomerInteractionEntity, {
          id: randomUUID(),
          tenantId: dto.tenantId,
          customerId: dto.customerId,
          serviceOrderId: null,
          interactionType: CustomerInteractionType.MEASUREMENT_RECORDED,
          channel: InteractionChannel.SYSTEM,
          occurredAt: new Date(),
          summary: `Measurement '${saved.measurementLabel}' version ${saved.versionNo} recorded.`,
          detail: `Measurement '${saved.measurementLabel}' received a new historical version for customer '${customer.legalName}'.`,
          createdBy: dto.actorUserId,
          updatedBy: dto.actorUserId,
        });
        await manager.save(CustomerInteractionEntity, interaction);
      }
      return persisted;
    });

    for (const record of savedRecords) {
      await this.auditService.record({
        tenantId: dto.tenantId,
        branchId: customer.branchId,
        actorUserId: dto.actorUserId,
        entityType: 'measurement_record',
        entityId: record.id,
        action: 'measurement.recorded',
        eventType: 'crm.write',
        metadata: {
          customerId: dto.customerId,
          label: record.measurementLabel,
          versionNo: record.versionNo,
        },
      });
    }

    return savedRecords;
  }

  async listByCustomer(tenantId: string, customerId: string): Promise<{
    history: MeasurementRecordEntity[];
    latestByLabel: MeasurementRecordEntity[];
  }> {
    await this.customerService.getById(customerId, tenantId);
    const history = await this.measurementRecordRepository.findByCustomer(tenantId, customerId);
    const latestByLabelMap = new Map<string, MeasurementRecordEntity>();

    for (const record of history) {
      if (!latestByLabelMap.has(record.measurementLabel)) {
        latestByLabelMap.set(record.measurementLabel, record);
      }
    }

    return {
      history,
      latestByLabel: [...latestByLabelMap.values()],
    };
  }

  private buildMeasurementInputs(dto: CreateMeasurementRecordDto): Array<{
    label: string;
    value: number;
    unit?: string;
    notes?: string;
  }> {
    const measurements: Array<{ label: string; value: number; unit?: string; notes?: string }> = [];

    if (dto.weight !== undefined) {
      measurements.push({ label: 'weight', value: dto.weight, unit: 'kg' });
    }

    if (dto.height !== undefined) {
      measurements.push({ label: 'height', value: dto.height, unit: 'cm' });
    }

    for (const customMeasurement of dto.customMeasurements ?? []) {
      measurements.push(this.normalizeCustomMeasurement(customMeasurement));
    }

    if (measurements.length === 0) {
      throw new DomainValidationError('At least one measurement must be provided.');
    }

    const normalizedLabels = new Set<string>();
    for (const measurement of measurements) {
      if (normalizedLabels.has(measurement.label)) {
        throw new DomainValidationError(`Measurement label '${measurement.label}' is duplicated in the request.`);
      }
      normalizedLabels.add(measurement.label);
    }

    return measurements;
  }

  private normalizeCustomMeasurement(customMeasurement: CustomMeasurementInputDto): {
    label: string;
    value: number;
    unit?: string;
    notes?: string;
  } {
    const label = customMeasurement.label.trim().toLowerCase();
    if (!label) {
      throw new DomainValidationError('Custom measurement label is required.');
    }

    return {
      label,
      value: customMeasurement.value,
      unit: customMeasurement.unit?.trim() || undefined,
      notes: customMeasurement.notes?.trim() || undefined,
    };
  }
}
