import { Column, Entity } from 'typeorm';
import { InteractionChannel } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'customer_portal_profiles' })
export class CustomerPortalProfileEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'customer_code', type: 'varchar', length: 50, nullable: true })
  customerCode!: string | null;

  @Column({ name: 'vip_flag', type: 'boolean', default: false })
  vipFlag!: boolean;

  @Column({ name: 'preferred_channel', type: 'varchar', length: 30, nullable: true })
  preferredChannel!: InteractionChannel | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;
}
