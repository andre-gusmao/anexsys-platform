import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QrScanResult, QrScanType } from 'src/shared/domain/enums';

export class SearchQrEventsDto {
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  productionOrderId?: string;

  @IsOptional()
  @IsUUID()
  operationalResourceId?: string;

  @IsOptional()
  @IsEnum(QrScanType)
  scanType?: QrScanType;

  @IsOptional()
  @IsEnum(QrScanResult)
  scanResult?: QrScanResult;
}
