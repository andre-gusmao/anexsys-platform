import { Column, Entity } from 'typeorm';
import { ProductionExecutionEventType, ProductionOrderStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'production_execution_events' })
export class ProductionExecutionEventEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'production_order_version_id', type: 'uuid', nullable: true })
  productionOrderVersionId!: string | null;

  @Column({ name: 'operational_resource_id', type: 'uuid', nullable: true })
  operationalResourceId!: string | null;

  @Column({ name: 'qr_event_id', type: 'uuid', nullable: true })
  qrEventId!: string | null;

  @Column({ name: 'event_type', type: 'varchar', length: 60 })
  eventType!: ProductionExecutionEventType;

  @Column({ name: 'event_at', type: 'timestamptz' })
  eventAt!: Date;

  @Column({ name: 'status_before', type: 'varchar', length: 30, nullable: true })
  statusBefore!: ProductionOrderStatus | null;

  @Column({ name: 'status_after', type: 'varchar', length: 30, nullable: true })
  statusAfter!: ProductionOrderStatus | null;

  @Column({ name: 'diary_entry', type: 'text', nullable: true })
  diaryEntry!: string | null;

  @Column({ name: 'event_payload', type: 'jsonb', nullable: true })
  eventPayload!: Record<string, unknown> | null;

  @Column({ name: 'recorded_by', type: 'uuid' })
  recordedBy!: string;
}
