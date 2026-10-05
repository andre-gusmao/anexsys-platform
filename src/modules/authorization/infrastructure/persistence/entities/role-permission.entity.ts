import { Column, Entity, Unique } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'role_permissions' })
@Unique('uq_role_permissions_role_permission', ['roleId', 'permissionId'])
export class RolePermissionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId!: string;

  @Column({ name: 'permission_id', type: 'uuid' })
  permissionId!: string;
}
