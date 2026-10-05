import { IsEnum, IsUUID } from 'class-validator';
import { BranchScopeType } from 'src/shared/domain/enums';

export class AssignBranchScopeDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  userId!: string;

  @IsUUID()
  branchId!: string;

  @IsEnum(BranchScopeType)
  scopeType!: BranchScopeType;

  @IsUUID()
  actorUserId!: string;
}
