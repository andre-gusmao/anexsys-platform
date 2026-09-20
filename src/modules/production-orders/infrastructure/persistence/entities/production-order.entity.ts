import { Column, Entity } from 'typeorm';
import { DeliveryType, ProductionOrderStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'production_orders' })
export class ProductionOrderEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'workflow_definition_id', type: 'uuid', nullable: true })
  workflowDefinitionId!: string | null;

  @Column({ name: 'current_status_definition_id', type: 'uuid', nullable: true })
  currentStatusDefinitionId!: string | null;

  @Column({ name: 'production_no', type: 'varchar', length: 50 })
  productionNo!: string;

  @Column({ name: 'production_type', type: 'varchar', length: 50 })
  productionType!: string;

  @Column({ name: 'delivery_type', type: 'varchar', length: 20, default: DeliveryType.STANDARD })
  deliveryType!: DeliveryType;

  @Column({ name: 'operational_priority', type: 'varchar', length: 30, nullable: true })
  operationalPriority!: string | null;

  @Column({ name: 'customer_delivery_target_date', type: 'date' })
  customerDeliveryTargetDate!: string;

  @Column({ name: 'internal_production_deadline', type: 'date', nullable: true })
  internalProductionDeadline!: string | null;

  @Column({ name: 'internal_quality_deadline', type: 'date', nullable: true })
  internalQualityDeadline!: string | null;

  @Column({ name: 'planned_quantity', type: 'numeric', precision: 18, scale: 4, nullable: true })
  plannedQuantity!: string | null;

  @Column({ name: 'produced_quantity', type: 'numeric', precision: 18, scale: 4, nullable: true })
  producedQuantity!: string | null;

  @Column({ name: 'scheduled_start_at', type: 'timestamptz', nullable: true })
  scheduledStartAt!: Date | null;

  @Column({ name: 'scheduled_end_at', type: 'timestamptz', nullable: true })
  scheduledEndAt!: Date | null;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ name: 'piece_description', type: 'text' })
  pieceDescription!: string;

  @Column({ name: 'measurements_snapshot', type: 'jsonb', nullable: true })
  measurementsSnapshot!: Record<string, unknown> | null;

  @Column({ name: 'observations', type: 'text', nullable: true })
  observations!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: ProductionOrderStatus.OPEN })
  status!: ProductionOrderStatus;
}
