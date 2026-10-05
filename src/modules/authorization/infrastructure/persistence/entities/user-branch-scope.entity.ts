import { Column, Entity, Unique } from 'typeorm';
import { BranchScopeType } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'user_branch_scopes' })
@Unique('uq_user_branch_scopes_user_branch_scope_type', ['userId', 'branchId', 'scopeType'])
export class UserBranchScopeEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'scope_type', type: 'varchar', length: 30 })
  scopeType!: BranchScopeType;
}
