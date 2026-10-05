import { Column, Entity } from 'typeorm';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'measurement_body_parts' })
export class MeasurementBodyPartEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'code', type: 'varchar', length: 100 })
  code!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;
}
