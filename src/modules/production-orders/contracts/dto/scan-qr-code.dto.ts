import { ProductionOrderStatus, QrScanType } from 'src/shared/domain/enums';

export interface ScanQrCodeDto {
  actorUserId: string;
  accessibleBranchIds: string[];
  codeValue: string;
  scanType: QrScanType;
  operationalResourceId?: string | null;
  targetStatus?: ProductionOrderStatus | null;
  diaryEntry?: string | null;
  deviceInfo?: string | null;
}
