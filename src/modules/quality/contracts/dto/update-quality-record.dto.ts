import { DefectSeverity, QualityInspectionResult, QualityInspectionType } from 'src/shared/domain/enums';

export interface UpdateQualityDefectDto {
  description: string;
  category: string;
  severity: DefectSeverity;
}

export interface UpdateQualityRecordDto {
  actorUserId: string;
  serviceOrderItemId?: string | null;
  inspectionType?: QualityInspectionType;
  inspectionResult?: QualityInspectionResult;
  inspectionAt?: string | null;
  defects?: UpdateQualityDefectDto[] | null;
  notes?: string | null;
}
