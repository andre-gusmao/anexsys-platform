import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CustomMeasurementInputDto {
  @IsString()
  label!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMeasurementRecordDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  customerId!: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CustomMeasurementInputDto)
  customMeasurements?: CustomMeasurementInputDto[];

  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @IsUUID()
  actorUserId!: string;
}
