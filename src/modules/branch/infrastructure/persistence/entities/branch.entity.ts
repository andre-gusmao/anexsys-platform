import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { TenantEntity } from 'src/modules/tenant/infrastructure/persistence/entities/tenant.entity';
import { CompanyEntity } from 'src/modules/company/infrastructure/persistence/entities/company.entity';
import { BranchStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'branches' })
export class BranchEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.branches, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => CompanyEntity, (company) => company.branches, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity;

  @Column({ name: 'code', type: 'varchar', length: 50 })
  code!: string;

  @Column({ name: 'legal_name', type: 'text' })
  legalName!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: BranchStatus.ACTIVE })
  status!: BranchStatus;

  @Column({ name: 'parent_branch_id', type: 'uuid', nullable: true })
  parentBranchId!: string | null;

  @ManyToOne(() => BranchEntity, (branch) => branch.children, { nullable: true })
  @JoinColumn({ name: 'parent_branch_id' })
  parentBranch!: BranchEntity | null;

  @OneToMany(() => BranchEntity, (branch) => branch.parentBranch)
  children?: BranchEntity[];

  @Column({ name: 'business_calendar_name', type: 'text', nullable: true })
  businessCalendarName!: string | null;

  @Column({ name: 'timezone', type: 'varchar', length: 64, default: 'America/Sao_Paulo' })
  timezone!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;
}
