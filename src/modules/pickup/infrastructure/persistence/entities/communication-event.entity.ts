import { Column, Entity } from 'typeorm';
import { CommunicationDeliveryStatus, CommunicationDirection, InteractionChannel } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'communication_events' })
export class CommunicationEventEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId!: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId!: string | null;

  @Column({ name: 'channel', type: 'varchar', length: 30 })
  channel!: InteractionChannel;

  @Column({ name: 'direction', type: 'varchar', length: 20 })
  direction!: CommunicationDirection;

  @Column({ name: 'subject', type: 'text', nullable: true })
  subject!: string | null;

  @Column({ name: 'message_summary', type: 'text' })
  messageSummary!: string;

  @Column({ name: 'sent_at', type: 'timestamptz' })
  sentAt!: Date;

  @Column({ name: 'delivery_status', type: 'varchar', length: 30 })
  deliveryStatus!: CommunicationDeliveryStatus;

  @Column({ name: 'payload_snapshot', type: 'jsonb', nullable: true })
  payloadSnapshot!: Record<string, unknown> | null;
}
