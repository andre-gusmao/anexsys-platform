import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  userId!: string;

  @IsUUID()
  roleId!: string;

  @IsOptional()
  @IsUUID()
  assignedBranchId?: string;

  @IsOptional()
  @IsBoolean()
  grantsAllBranches?: boolean;

  @IsUUID()
  actorUserId!: string;
}
