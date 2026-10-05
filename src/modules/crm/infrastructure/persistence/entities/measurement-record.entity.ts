import { Column, Entity } from 'typeorm';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'measurement_records' })
export class MeasurementRecordEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId!: string | null;

  @Column({ name: 'measurement_label', type: 'varchar', length: 120 })
  measurementLabel!: string;

  @Column({ name: 'measurement_data', type: 'jsonb', default: () => "'{}'::jsonb" })
  measurementData!: Record<string, unknown>;

  @Column({ name: 'version_no', type: 'integer' })
  versionNo!: number;

  @Column({ name: 'measured_at', type: 'timestamptz' })
  measuredAt!: Date;

  @Column({ name: 'captured_by', type: 'uuid' })
  capturedBy!: string;
}
