import { Column, Entity } from 'typeorm';
import { RoleStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'communities' })
export class CommunityEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'code', type: 'varchar', length: 100 })
  code!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: RoleStatus.ACTIVE })
  status!: RoleStatus;
}
