import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'physical_bag_support_contexts' })
export class PhysicalBagSupportContextEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'production_order_id', type: 'uuid', nullable: true })
  productionOrderId!: string | null;

  @Column({ name: 'storage_location_assignment_id', type: 'uuid', nullable: true })
  storageLocationAssignmentId!: string | null;

  @Column({ name: 'bag_label', type: 'text', nullable: true })
  bagLabel!: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'in_use', type: 'boolean', default: true })
  inUse!: boolean;
}
