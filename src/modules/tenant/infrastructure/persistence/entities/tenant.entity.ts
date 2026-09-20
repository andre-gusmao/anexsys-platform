import { Column, Entity, OneToMany } from 'typeorm';
import { BranchEntity } from 'src/modules/branch/infrastructure/persistence/entities/branch.entity';
import { TenantStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'tenants' })
export class TenantEntity extends MutableBusinessEntity {
  @Column({ name: 'code', type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ name: 'legal_name', type: 'text' })
  legalName!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: TenantStatus.ACTIVE })
  status!: TenantStatus;

  @OneToMany(() => BranchEntity, (branch) => branch.tenant)
  branches?: BranchEntity[];
}
