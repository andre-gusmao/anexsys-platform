import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { WarrantyExecutionStatus } from 'src/shared/domain/enums';

export class SearchWarrantyExecutionsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsUUID()
  productionOrderId?: string;

  @IsOptional()
  @IsEnum(WarrantyExecutionStatus)
  status?: WarrantyExecutionStatus;
}
