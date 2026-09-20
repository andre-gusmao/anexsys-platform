import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryType, SurchargeMethod } from 'src/shared/domain/enums';

export class CreateServiceOrderItemInputDto {
  @IsString()
  itemType!: string;

  @IsString()
  description!: string;

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
}

export class CreateServiceOrderDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  branchId!: string;

  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsUUID()
  commercialResponsibleActorId?: string;

  @IsOptional()
  @IsUUID()
  technicalMeasurementResponsibleActorId?: string;

  @IsOptional()
  @IsDateString()
  deliveryCommitmentSourceAt?: string;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string;

  @IsOptional()
  @IsEnum(SurchargeMethod)
  deliverySurchargeMethod?: SurchargeMethod;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliverySurchargeValue?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  commercialNotes?: string;

  @IsOptional()
  @IsString()
  customerNotes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateServiceOrderItemInputDto)
  items!: CreateServiceOrderItemInputDto[];

  @IsUUID()
  actorUserId!: string;
}
