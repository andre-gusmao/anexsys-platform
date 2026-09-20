import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePermissionDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  code!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  actorUserId!: string;
}
