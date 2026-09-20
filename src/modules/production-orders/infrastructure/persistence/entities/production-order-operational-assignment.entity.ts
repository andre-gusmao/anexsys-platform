import { Column, Entity } from 'typeorm';
import { OperationalAssignmentRole } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'production_order_operational_assignments' })
export class ProductionOrderOperationalAssignmentEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'operational_resource_id', type: 'uuid' })
  operationalResourceId!: string;

  @Column({ name: 'assignment_role', type: 'varchar', length: 50 })
  assignmentRole!: OperationalAssignmentRole;

  @Column({ name: 'assigned_at', type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ name: 'released_at', type: 'timestamptz', nullable: true })
  releasedAt!: Date | null;

  @Column({ name: 'is_current', type: 'boolean', default: true })
  isCurrent!: boolean;

  @Column({ name: 'is_primary_responsible', type: 'boolean', default: false })
  isPrimaryResponsible!: boolean;

  @Column({ name: 'assignment_notes', type: 'text', nullable: true })
  assignmentNotes!: string | null;
}
