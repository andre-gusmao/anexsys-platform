import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'user_credentials' })
export class UserCredentialEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'password_algorithm', type: 'varchar', length: 50, default: 'scrypt' })
  passwordAlgorithm!: string;

  @Column({ name: 'password_updated_at', type: 'timestamptz' })
  passwordUpdatedAt!: Date;

  @Column({ name: 'must_rotate_password', type: 'boolean', default: false })
  mustRotatePassword!: boolean;
}
