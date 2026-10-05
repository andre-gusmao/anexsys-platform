import { Column, Entity } from 'typeorm';
import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'operational_resources' })
export class OperationalResourceEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'home_branch_id', type: 'uuid', nullable: true })
  homeBranchId!: string | null;

  @Column({ name: 'resource_type', type: 'varchar', length: 30 })
  resourceType!: OperationalResourceType;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'document_no', type: 'varchar', length: 50, nullable: true })
  documentNo!: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ name: 'email', type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'skill_profile', type: 'jsonb', nullable: true })
  skillProfile!: string[] | null;

  @Column({ name: 'qualification_notes', type: 'text', nullable: true })
  qualificationNotes!: string | null;

  @Column({ name: 'availability_status', type: 'varchar', length: 30, default: OperationalAvailabilityStatus.AVAILABLE })
  availabilityStatus!: OperationalAvailabilityStatus;

  @Column({ name: 'available_from', type: 'date', nullable: true })
  availableFrom!: string | null;

  @Column({ name: 'available_until', type: 'date', nullable: true })
  availableUntil!: string | null;

  @Column({ name: 'availability_notes', type: 'text', nullable: true })
  availabilityNotes!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: OperationalResourceStatus.ACTIVE })
  status!: OperationalResourceStatus;
}
