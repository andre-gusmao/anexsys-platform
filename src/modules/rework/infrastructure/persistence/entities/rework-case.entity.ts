import { Column, Entity } from 'typeorm';
import { ReworkCaseStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'rework_cases' })
export class ReworkCaseEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'production_order_version_id', type: 'uuid', nullable: true })
  productionOrderVersionId!: string | null;

  @Column({ name: 'service_order_item_ids', type: 'jsonb', nullable: true })
  serviceOrderItemIds!: string[] | null;

  @Column({ name: 'quality_record_id', type: 'uuid', nullable: true })
  qualityRecordId!: string | null;

  @Column({ name: 'customer_rejection_id', type: 'uuid', nullable: true })
  customerRejectionId!: string | null;

  @Column({ name: 'original_operational_resource_id', type: 'uuid', nullable: true })
  originalOperationalResourceId!: string | null;

  @Column({ name: 'corrective_operational_resource_id', type: 'uuid', nullable: true })
  correctiveOperationalResourceId!: string | null;

  @Column({ name: 'rework_reason', type: 'text' })
  reworkReason!: string;

  @Column({ name: 'assignment_notes', type: 'text', nullable: true })
  assignmentNotes!: string | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt!: Date | null;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: ReworkCaseStatus;
}
