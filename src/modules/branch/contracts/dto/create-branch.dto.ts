import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateBranchDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  @Length(2, 50)
  code!: string;

  @IsString()
  legalName!: string;

  @IsString()
  displayName!: string;

  @IsOptional()
  @IsUUID()
  parentBranchId?: string;

  @IsOptional()
  @IsString()
  businessCalendarName?: string;

  @IsUUID()
  actorUserId!: string;
}
