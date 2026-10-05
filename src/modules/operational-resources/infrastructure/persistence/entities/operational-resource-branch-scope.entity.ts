import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'operational_resource_branch_scopes' })
export class OperationalResourceBranchScopeEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'operational_resource_id', type: 'uuid' })
  operationalResourceId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom!: string;

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo!: string | null;

  @Column({ name: 'scope_role', type: 'varchar', length: 50, nullable: true })
  scopeRole!: string | null;
}
