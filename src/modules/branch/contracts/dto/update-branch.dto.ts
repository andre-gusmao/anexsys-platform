import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class UpdateBranchDto {
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

  @IsOptional()
  @IsUUID()
  parentBranchId?: string | null;

  @IsOptional()
  @IsString()
  businessCalendarName?: string | null;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsUUID()
  actorUserId!: string;
}
