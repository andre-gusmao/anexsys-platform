import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod, PaymentRecordStatus } from 'src/shared/domain/enums';

export class SearchPaymentsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsEnum(PaymentRecordStatus)
  status?: PaymentRecordStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}
