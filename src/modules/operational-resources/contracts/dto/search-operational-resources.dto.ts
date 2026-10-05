import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';

export class SearchOperationalResourcesDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsEnum(OperationalResourceType)
  resourceType?: OperationalResourceType;

  @IsOptional()
  @IsEnum(OperationalResourceStatus)
  status?: OperationalResourceStatus;

  @IsOptional()
  @IsEnum(OperationalAvailabilityStatus)
  availabilityStatus?: OperationalAvailabilityStatus;
}
