import { IsUUID } from 'class-validator';

export class AssignPermissionToRoleDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  roleId!: string;

  @IsUUID()
  permissionId!: string;

  @IsUUID()
  actorUserId!: string;
}
