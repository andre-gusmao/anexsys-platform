import { Column, Entity } from 'typeorm';
import { InteractionChannel } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'customer_interactions' })
export class CustomerInteractionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'service_order_id', type: 'uuid', nullable: true })
  serviceOrderId!: string | null;

  @Column({ name: 'interaction_type', type: 'varchar', length: 50 })
  interactionType!: string;

  @Column({ name: 'channel', type: 'varchar', length: 50, default: InteractionChannel.SYSTEM })
  channel!: InteractionChannel;

  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'summary', type: 'text' })
  summary!: string;

  @Column({ name: 'detail', type: 'text', nullable: true })
  detail!: string | null;
}
