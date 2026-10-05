import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CustomerStatus, CustomerType } from 'src/shared/domain/enums';

export class SearchCustomersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;
}
