import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'status_visibility_mappings' })
export class StatusVisibilityMappingEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'internal_name', type: 'varchar', length: 100 })
  internalName!: string;

  @Column({ name: 'external_name', type: 'varchar', length: 100 })
  externalName!: string;

  @Column({ name: 'customer_visibility', type: 'boolean', default: true })
  customerVisibility!: boolean;

  @Column({ name: 'operational_visibility', type: 'boolean', default: true })
  operationalVisibility!: boolean;

  @Column({ name: 'management_visibility', type: 'boolean', default: true })
  managementVisibility!: boolean;
}
