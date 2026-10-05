import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'permissions' })
export class PermissionEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'code', type: 'varchar', length: 150 })
  code!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;
}
