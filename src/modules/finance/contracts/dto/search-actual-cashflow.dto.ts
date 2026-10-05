import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod } from 'src/shared/domain/enums';

export class SearchActualCashflowDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
