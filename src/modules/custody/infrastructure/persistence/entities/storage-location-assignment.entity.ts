import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'storage_location_assignments' })
export class StorageLocationAssignmentEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'storage_location_id', type: 'uuid' })
  storageLocationId!: string;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt!: Date | null;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent!: boolean;

  @Column({ name: 'assignment_reason', type: 'varchar', length: 50, nullable: true })
  assignmentReason!: string | null;
}
