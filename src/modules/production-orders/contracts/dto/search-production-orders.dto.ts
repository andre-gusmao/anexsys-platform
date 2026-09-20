import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProductionOrderStatus, ProductionOrderVersionReason } from 'src/shared/domain/enums';

export class SearchProductionOrdersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @IsOptional()
  @IsUUID()
  operationalResourceId?: string;

  @IsOptional()
  @IsEnum(ProductionOrderStatus)
  status?: ProductionOrderStatus;

  @IsOptional()
  @IsEnum(ProductionOrderVersionReason)
  versionReason?: ProductionOrderVersionReason;
}
