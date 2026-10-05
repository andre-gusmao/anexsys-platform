import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { DeliveryType, ServiceOrderStatus } from 'src/shared/domain/enums';

export class SearchServiceOrdersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsEnum(ServiceOrderStatus)
  status?: ServiceOrderStatus;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;
}
