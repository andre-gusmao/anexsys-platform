import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsNumber,
} from 'class-validator';

export class MeasurementSetItemInputDto {
  @IsUUID()
  bodyPartId!: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMeasurementRecordDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  customerId!: string;

  @IsOptional()
  @IsDateString()
  measurementDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MeasurementSetItemInputDto)
  items!: MeasurementSetItemInputDto[];

  @IsUUID()
  actorUserId!: string;
}
