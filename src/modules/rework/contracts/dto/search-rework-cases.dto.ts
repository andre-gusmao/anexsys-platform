import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ReworkCaseStatus } from 'src/shared/domain/enums';

export class SearchReworkCasesDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  productionOrderId?: string;

  @IsOptional()
  @IsEnum(ReworkCaseStatus)
  status?: ReworkCaseStatus;
}
