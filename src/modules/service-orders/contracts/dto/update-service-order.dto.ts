import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { DeliveryType, SurchargeMethod } from 'src/shared/domain/enums';

export class UpdateServiceOrderDto {
  @IsOptional()
  @IsUUID()
  customerId?: string;

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
  @IsDateString()
  actualPickupDate?: string;

  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermsDays?: number;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  operationalPriority?: string | null;

  @IsOptional()
  @IsEnum(SurchargeMethod)
  deliverySurchargeMethod?: SurchargeMethod | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliverySurchargeValue?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number | null;

  @IsOptional()
  @IsString()
  commercialNotes?: string | null;

  @IsOptional()
  @IsString()
  customerNotes?: string | null;

  @IsUUID()
  actorUserId!: string;
}
