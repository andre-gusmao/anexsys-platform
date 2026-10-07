import { Column, Entity } from 'typeorm';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'measurement_units' })
export class MeasurementUnitEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'code', type: 'varchar', length: 20 })
  code!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: MeasurementCatalogStatus.ACTIVE })
  status!: MeasurementCatalogStatus;
}
