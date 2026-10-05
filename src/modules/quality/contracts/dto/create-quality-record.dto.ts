import { DefectSeverity, QualityInspectionType } from 'src/shared/domain/enums';

export interface QualityDefectDto {
  description: string;
  category: string;
  severity: DefectSeverity;
}

export interface CreateQualityRecordDto {
  tenantId: string;
  actorUserId: string;
  productionOrderId: string;
  serviceOrderItemId?: string | null;
  inspectionType: QualityInspectionType;
  inspectionAt?: string | null;
  defects?: QualityDefectDto[];
  notes?: string | null;
}
