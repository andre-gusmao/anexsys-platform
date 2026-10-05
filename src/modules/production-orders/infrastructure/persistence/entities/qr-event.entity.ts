import { Column, Entity } from 'typeorm';
import { QrScanResult, QrScanType } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'qr_events' })
export class QrEventEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'qr_code_id', type: 'uuid' })
  qrCodeId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'operational_resource_id', type: 'uuid', nullable: true })
  operationalResourceId!: string | null;

  @Column({ name: 'scan_type', type: 'varchar', length: 60 })
  scanType!: QrScanType;

  @Column({ name: 'scanned_code_value', type: 'text' })
  scannedCodeValue!: string;

  @Column({ name: 'scanned_at', type: 'timestamptz' })
  scannedAt!: Date;

  @Column({ name: 'scan_result', type: 'varchar', length: 30 })
  scanResult!: QrScanResult;

  @Column({ name: 'event_payload', type: 'jsonb', nullable: true })
  eventPayload!: Record<string, unknown> | null;

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy!: string;
}
