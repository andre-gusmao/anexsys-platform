import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  code?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsUUID()
  actorUserId!: string;
}
