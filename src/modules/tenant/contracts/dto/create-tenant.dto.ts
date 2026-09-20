import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @Length(2, 50)
  code!: string;

  @IsString()
  legalName!: string;

  @IsString()
  displayName!: string;

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
