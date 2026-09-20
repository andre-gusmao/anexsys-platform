import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  code!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isSystemManaged?: boolean;

  @IsUUID()
  actorUserId!: string;
}
