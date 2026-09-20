import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WarrantyAdjustmentStatus } from 'src/shared/domain/enums';

export class SearchWarrantyAdjustmentsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsEnum(WarrantyAdjustmentStatus)
  status?: WarrantyAdjustmentStatus;
}
