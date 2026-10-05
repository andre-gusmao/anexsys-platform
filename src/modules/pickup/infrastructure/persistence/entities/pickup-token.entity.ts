import { Column, Entity } from 'typeorm';
import { PickupCredentialStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'pickup_tokens' })
export class PickupTokenEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'pickup_authorization_id', type: 'uuid' })
  pickupAuthorizationId!: string;

  @Column({ name: 'token_value', type: 'text' })
  tokenValue!: string;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: PickupCredentialStatus;
}
