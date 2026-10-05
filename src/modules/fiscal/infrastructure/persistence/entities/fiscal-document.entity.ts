import { Column, Entity } from 'typeorm';
import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'fiscal_documents' })
export class FiscalDocumentEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'service_order_item_id', type: 'uuid', nullable: true })
  serviceOrderItemId!: string | null;

  @Column({ name: 'document_type', type: 'varchar', length: 40 })
  documentType!: FiscalDocumentType;

  @Column({ name: 'document_no', type: 'varchar', length: 60 })
  documentNo!: string;

  @Column({ name: 'issued_at', type: 'timestamptz', nullable: true })
  issuedAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: FiscalDocumentStatus;

  @Column({ name: 'gross_amount', type: 'numeric', precision: 18, scale: 2, nullable: true })
  grossAmount!: string | null;
}
