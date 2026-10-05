import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class SearchExpectedCashflowDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;
}
