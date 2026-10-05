import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DeliveryType, ServiceOrderItemStatus } from 'src/shared/domain/enums';

export class UpdateServiceOrderItemDto {
  @IsOptional()
  @IsString()
  itemType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  quantity?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number | null;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType | null;

  @IsOptional()
  @IsString()
  operationalPriority?: string | null;

  @IsOptional()
  @IsEnum(ServiceOrderItemStatus)
  status?: ServiceOrderItemStatus;

  @IsUUID()
  actorUserId!: string;
}
