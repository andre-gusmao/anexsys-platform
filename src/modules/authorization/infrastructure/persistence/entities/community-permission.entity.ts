import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'community_permissions' })
export class CommunityPermissionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'community_id', type: 'uuid' })
  communityId!: string;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;
}
