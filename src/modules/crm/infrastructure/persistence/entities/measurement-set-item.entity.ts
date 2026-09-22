import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'measurement_set_items' })
export class MeasurementSetItemEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'measurement_set_id', type: 'uuid' })
  measurementSetId!: string;

  @Column({ name: 'body_part_id', type: 'uuid' })
  bodyPartId!: string;

  @Column({ name: 'body_part_code', type: 'varchar', length: 100 })
  bodyPartCode!: string;

  @Column({ name: 'body_part_display_name', type: 'text' })
  bodyPartDisplayName!: string;

  @Column({ name: 'measurement_unit_id', type: 'uuid' })
  measurementUnitId!: string;

  @Column({ name: 'measurement_unit_code', type: 'varchar', length: 20 })
  measurementUnitCode!: string;

  @Column({ name: 'measurement_unit_display_name', type: 'text' })
  measurementUnitDisplayName!: string;

  @Column({ name: 'measured_value', type: 'numeric', precision: 12, scale: 3 })
  measuredValue!: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;
}
