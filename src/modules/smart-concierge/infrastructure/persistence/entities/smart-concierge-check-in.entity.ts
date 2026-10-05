import { Column, Entity } from 'typeorm';
import { CustomerIdentificationMethod, SmartConciergeQueueStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'smart_concierge_check_ins' })
export class SmartConciergeCheckInEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId!: string | null;

  @Column({ name: 'pickup_authorization_id', type: 'uuid', nullable: true })
  pickupAuthorizationId!: string | null;

  @Column({ name: 'attendant_user_id', type: 'uuid', nullable: true })
  attendantUserId!: string | null;

  @Column({ name: 'identification_method', type: 'varchar', length: 40 })
  identificationMethod!: CustomerIdentificationMethod;

  @Column({ name: 'identification_value', type: 'varchar', length: 160, nullable: true })
  identificationValue!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: SmartConciergeQueueStatus;

  @Column({ name: 'called_at', type: 'timestamptz', nullable: true })
  calledAt!: Date | null;

  @Column({ name: 'service_started_at', type: 'timestamptz', nullable: true })
  serviceStartedAt!: Date | null;

  @Column({ name: 'service_completed_at', type: 'timestamptz', nullable: true })
  serviceCompletedAt!: Date | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}
