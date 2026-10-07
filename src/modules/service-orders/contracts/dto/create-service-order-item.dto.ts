import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DeliveryType } from 'src/shared/domain/enums';

export class CreateServiceOrderItemDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  serviceOrderId!: string;

  @IsString()
  itemType!: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsUUID()
  actorUserId!: string;
}
