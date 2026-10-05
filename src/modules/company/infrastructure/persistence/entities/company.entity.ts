import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { TenantEntity } from 'src/modules/tenant/infrastructure/persistence/entities/tenant.entity';
import { BranchEntity } from 'src/modules/branch/infrastructure/persistence/entities/branch.entity';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'companies' })
export class CompanyEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @Column({ name: 'legal_name', type: 'text' })
  legalName!: string;

  @Column({ name: 'trade_name', type: 'text', nullable: true })
  tradeName!: string | null;

  @Column({ name: 'cnpj', type: 'varchar', length: 14, nullable: true })
  cnpj!: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @OneToMany(() => BranchEntity, (branch) => branch.company)
  branches?: BranchEntity[];
}
