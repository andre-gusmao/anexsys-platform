import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

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

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  warrantyAdjustmentPeriodDays?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  warrantyExecutionPeriodDays?: number;

  @IsOptional()
  @IsBoolean()
  blockDeliveryWithOutstandingBalance?: boolean;

  @IsUUID()
  actorUserId!: string;
}
