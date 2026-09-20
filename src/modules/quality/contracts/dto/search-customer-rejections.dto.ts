import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { CustomerRejectionStatus } from 'src/shared/domain/enums';

export class SearchCustomerRejectionsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsOptional()
  @IsEnum(CustomerRejectionStatus)
  status?: CustomerRejectionStatus;
}
