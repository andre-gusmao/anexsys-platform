import { Column, Entity } from 'typeorm';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';
import type { PickupMethod } from '../../../application/service-order/service-order-pickup';

@Entity({ name: 'service_order_pickups' })
export class ServiceOrderPickupEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'method', type: 'varchar', length: 20, nullable: true })
  method!: PickupMethod | null;

  @Column({ name: 'window_opened_at', type: 'timestamptz', nullable: true })
  windowOpenedAt!: Date | null;

  @Column({ name: 'window_expires_at', type: 'timestamptz', nullable: true })
  windowExpiresAt!: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'customer_phone', type: 'varchar', length: 40, nullable: true })
  customerPhone!: string | null;

  @Column({ name: 'recipient_name', type: 'varchar', length: 160, nullable: true })
  recipientName!: string | null;

  @Column({ name: 'accepted_text', type: 'text', nullable: true })
  acceptedText!: string | null;

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
