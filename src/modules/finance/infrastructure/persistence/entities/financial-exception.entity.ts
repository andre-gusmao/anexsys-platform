import { Column, Entity } from 'typeorm';
import { FinancialExceptionStatus, FinancialExceptionType } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'financial_exceptions' })
export class FinancialExceptionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'payment_record_id', type: 'uuid', nullable: true })
  paymentRecordId!: string | null;

  @Column({ name: 'exception_type', type: 'varchar', length: 40 })
  exceptionType!: FinancialExceptionType;

  @Column({ name: 'reason', type: 'text' })
  reason!: string;

  @Column({ name: 'amount_impact', type: 'numeric', precision: 18, scale: 2, nullable: true })
  amountImpact!: string | null;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: FinancialExceptionStatus;
}
