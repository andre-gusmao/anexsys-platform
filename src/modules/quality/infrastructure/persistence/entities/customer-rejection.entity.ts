import { Column, Entity } from 'typeorm';
import {
  CustomerRejectionResolutionType,
  CustomerRejectionStatus,
  DefectSeverity,
} from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'customer_rejections' })
export class CustomerRejectionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'service_order_item_id', type: 'uuid' })
  serviceOrderItemId!: string;

  @Column({ name: 'quality_record_id', type: 'uuid', nullable: true })
  qualityRecordId!: string | null;

  @Column({ name: 'reported_quantity', type: 'numeric', precision: 18, scale: 4, nullable: true })
  reportedQuantity!: string | null;

  @Column({ name: 'rejection_reason', type: 'text' })
  rejectionReason!: string;

  @Column({ name: 'severity', type: 'varchar', length: 30, nullable: true })
  severity!: DefectSeverity | null;

  @Column({ name: 'resolution_type', type: 'varchar', length: 40, nullable: true })
  resolutionType!: CustomerRejectionResolutionType | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'reported_at', type: 'timestamptz' })
  reportedAt!: Date;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: CustomerRejectionStatus;
}
