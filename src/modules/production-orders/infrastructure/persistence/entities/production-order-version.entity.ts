import { Column, Entity } from 'typeorm';
import { DeliveryType, ProductionOrderVersionReason } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'production_order_versions' })
export class ProductionOrderVersionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'version_no', type: 'integer' })
  versionNo!: number;

  @Column({ name: 'version_reason', type: 'varchar', length: 50 })
  versionReason!: ProductionOrderVersionReason;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_draft', type: 'boolean', default: false })
  isDraft!: boolean;

  @Column({ name: 'production_type', type: 'varchar', length: 50, nullable: true })
  productionType!: string | null;

  @Column({ name: 'delivery_type', type: 'varchar', length: 20, nullable: true })
  deliveryType!: DeliveryType | null;

  @Column({ name: 'operational_priority', type: 'varchar', length: 30, nullable: true })
  operationalPriority!: string | null;

  @Column({ name: 'change_summary', type: 'text' })
  changeSummary!: string;

  @Column({ name: 'planned_quantity', type: 'numeric', precision: 18, scale: 4, nullable: true })
  plannedQuantity!: string | null;

  @Column({ name: 'scheduled_start_at', type: 'timestamptz', nullable: true })
  scheduledStartAt!: Date | null;

  @Column({ name: 'scheduled_end_at', type: 'timestamptz', nullable: true })
  scheduledEndAt!: Date | null;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ name: 'piece_description', type: 'text', nullable: true })
  pieceDescription!: string | null;

  @Column({ name: 'measurements_snapshot', type: 'jsonb', nullable: true })
  measurementsSnapshot!: Record<string, unknown> | null;

  @Column({ name: 'observations', type: 'text', nullable: true })
  observations!: string | null;

  @Column({ name: 'resource_change_notes', type: 'text', nullable: true })
  resourceChangeNotes!: string | null;

  @Column({ name: 'affected_service_order_item_ids', type: 'jsonb', nullable: true })
  affectedServiceOrderItemIds!: string[] | null;
}
