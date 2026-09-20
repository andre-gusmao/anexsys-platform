import { Column, Entity } from 'typeorm';
import { PaymentDirection, PaymentMethod, PaymentProviderName, PaymentRecordStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'payment_records' })
export class PaymentRecordEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'payment_reference_no', type: 'varchar', length: 50, nullable: true })
  paymentReferenceNo!: string | null;

  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod!: PaymentMethod;

  @Column({ name: 'payment_provider', type: 'varchar', length: 30, nullable: true })
  paymentProvider!: PaymentProviderName | null;

  @Column({ name: 'payment_direction', type: 'varchar', length: 20, default: PaymentDirection.INBOUND })
  paymentDirection!: PaymentDirection;

  @Column({ name: 'payment_amount', type: 'numeric', precision: 18, scale: 2 })
  paymentAmount!: string;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt!: Date | null;

  @Column({ name: 'authorized_at', type: 'timestamptz', nullable: true })
  authorizedAt!: Date | null;

  @Column({ name: 'reconciled_at', type: 'timestamptz', nullable: true })
  reconciledAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: PaymentRecordStatus;
}
