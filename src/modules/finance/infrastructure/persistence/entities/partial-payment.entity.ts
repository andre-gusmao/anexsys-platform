import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'partial_payments' })
export class PartialPaymentEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'payment_record_id', type: 'uuid' })
  paymentRecordId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'service_order_item_id', type: 'uuid', nullable: true })
  serviceOrderItemId!: string | null;

  @Column({ name: 'allocated_amount', type: 'numeric', precision: 18, scale: 2 })
  allocatedAmount!: string;

  @Column({ name: 'allocated_at', type: 'timestamptz' })
  allocatedAt!: Date;
}
