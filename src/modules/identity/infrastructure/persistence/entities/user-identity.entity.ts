import { Column, Entity } from 'typeorm';
import { UserStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'user_identities' })
export class UserIdentityEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'default_branch_id', type: 'uuid', nullable: true })
  defaultBranchId!: string | null;

  @Column({ name: 'email', type: 'text' })
  email!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: UserStatus.INVITED })
  status!: UserStatus;
}
