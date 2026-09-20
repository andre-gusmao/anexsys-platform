import { Column, Entity } from 'typeorm';
import { WarrantyAdjustmentStatus, WarrantyStartSource } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'warranty_adjustments' })
export class WarrantyAdjustmentEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'service_order_item_id', type: 'uuid', nullable: true })
  serviceOrderItemId!: string | null;

  @Column({ name: 'customer_rejection_id', type: 'uuid', nullable: true })
  customerRejectionId!: string | null;

  @Column({ name: 'adjustment_reason', type: 'text' })
  adjustmentReason!: string;

  @Column({ name: 'warranty_start_date', type: 'date' })
  warrantyStartDate!: string;

  @Column({ name: 'warranty_start_source', type: 'varchar', length: 20 })
  warrantyStartSource!: WarrantyStartSource;

  @Column({ name: 'warranty_period_days', type: 'integer', default: 7 })
  warrantyPeriodDays!: number;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: WarrantyAdjustmentStatus;
}
