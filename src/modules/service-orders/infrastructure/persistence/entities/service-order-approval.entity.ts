import { Column, Entity } from 'typeorm';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';
import type { ApprovalMethod } from '../../../application/service-order/service-order-approval';

@Entity({ name: 'service_order_approvals' })
export class ServiceOrderApprovalEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'method', type: 'varchar', length: 20 })
  method!: ApprovalMethod;

  @Column({ name: 'confirmed_at', type: 'timestamptz' })
  confirmedAt!: Date;

  @Column({ name: 'accepted_text', type: 'text', nullable: true })
  acceptedText!: string | null;

  @Column({ name: 'release_reason', type: 'text', nullable: true })
  releaseReason!: string | null;

  @Column({ name: 'total_value_snapshot', type: 'numeric', precision: 18, scale: 2, nullable: true })
  totalValueSnapshot!: string | null;

  @Column({ name: 'discount_value_snapshot', type: 'numeric', precision: 18, scale: 2, nullable: true })
  discountValueSnapshot!: string | null;

  @Column({ name: 'services_snapshot', type: 'jsonb', nullable: true })
  servicesSnapshot!: Record<string, unknown>[] | null;

  @Column({ name: 'measurements_snapshot', type: 'jsonb', nullable: true })
  measurementsSnapshot!: Record<string, unknown> | null;

  @Column({ name: 'measurements_locked_at', type: 'timestamptz', nullable: true })
  measurementsLockedAt!: Date | null;

  @Column({ name: 'client_user_agent', type: 'text', nullable: true })
  clientUserAgent!: string | null;

  @Column({ name: 'client_ip', type: 'varchar', length: 80, nullable: true })
  clientIp!: string | null;

  @Column({ name: 'photo_file_name', type: 'varchar', length: 180, nullable: true })
  photoFileName!: string | null;

  @Column({ name: 'photo_mime_type', type: 'varchar', length: 80, nullable: true })
  photoMimeType!: string | null;

  @Column({ name: 'photo_base64', type: 'text', nullable: true })
  photoBase64!: string | null;
}
