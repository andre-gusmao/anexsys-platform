import { Column, Entity } from 'typeorm';
import { CustodyEventStage } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'custody_events' })
export class CustodyEventEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId!: string | null;

  @Column({ name: 'production_order_id', type: 'uuid', nullable: true })
  productionOrderId!: string | null;

  @Column({ name: 'pickup_authorization_id', type: 'uuid', nullable: true })
  pickupAuthorizationId!: string | null;

  @Column({ name: 'operational_resource_id', type: 'uuid', nullable: true })
  operationalResourceId!: string | null;

  @Column({ name: 'storage_location_id', type: 'uuid', nullable: true })
  storageLocationId!: string | null;

  @Column({ name: 'event_stage', type: 'varchar', length: 50 })
  eventStage!: CustodyEventStage;

  @Column({ name: 'event_at', type: 'timestamptz' })
  eventAt!: Date;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'evidence_summary', type: 'jsonb', nullable: true })
  evidenceSummary!: Record<string, unknown> | null;
}
