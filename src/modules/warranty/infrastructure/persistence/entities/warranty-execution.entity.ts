import { Column, Entity } from 'typeorm';
import { WarrantyExecutionStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'warranty_executions' })
export class WarrantyExecutionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'production_order_version_id', type: 'uuid', nullable: true })
  productionOrderVersionId!: string | null;

  @Column({ name: 'service_order_item_ids', type: 'jsonb', nullable: true })
  serviceOrderItemIds!: string[] | null;

  @Column({ name: 'customer_rejection_id', type: 'uuid', nullable: true })
  customerRejectionId!: string | null;

  @Column({ name: 'quality_record_id', type: 'uuid', nullable: true })
  qualityRecordId!: string | null;

  @Column({ name: 'original_operational_resource_id', type: 'uuid', nullable: true })
  originalOperationalResourceId!: string | null;

  @Column({ name: 'corrective_operational_resource_id', type: 'uuid', nullable: true })
  correctiveOperationalResourceId!: string | null;

  @Column({ name: 'execution_reason', type: 'text' })
  executionReason!: string;

  @Column({ name: 'actual_delivery_date', type: 'date' })
  actualDeliveryDate!: string;

  @Column({ name: 'warranty_period_days', type: 'integer', default: 7 })
  warrantyPeriodDays!: number;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: WarrantyExecutionStatus;
}
