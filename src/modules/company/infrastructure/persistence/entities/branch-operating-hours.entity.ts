import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BranchEntity } from 'src/modules/branch/infrastructure/persistence/entities/branch.entity';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'branch_operating_hours' })
export class BranchOperatingHoursEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @ManyToOne(() => BranchEntity, { nullable: false })
  @JoinColumn({ name: 'branch_id' })
  branch!: BranchEntity;

  @Column({ name: 'weekday', type: 'smallint' })
  weekday!: number;

  @Column({ name: 'is_open', type: 'boolean' })
  isOpen!: boolean;

  @Column({ name: 'opens_at', type: 'time', nullable: true })
  opensAt!: string | null;

  @Column({ name: 'closes_at', type: 'time', nullable: true })
  closesAt!: string | null;

  @Column({ name: 'cutoff_at', type: 'time', nullable: true })
  cutoffAt!: string | null;
}
