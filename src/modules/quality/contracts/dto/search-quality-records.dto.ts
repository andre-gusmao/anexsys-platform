import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QualityReleaseDecision } from 'src/shared/domain/enums';

export class SearchQualityRecordsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  productionOrderId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderItemId?: string;

  @IsOptional()
  @IsEnum(QualityReleaseDecision)
  releaseDecision?: QualityReleaseDecision;
}
