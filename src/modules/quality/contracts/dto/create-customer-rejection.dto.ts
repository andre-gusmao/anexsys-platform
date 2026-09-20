import { CustomerRejectionResolutionType, DefectSeverity } from 'src/shared/domain/enums';

export interface CreateCustomerRejectionDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  serviceOrderItemId: string;
  qualityRecordId?: string | null;
  reportedQuantity?: number | null;
  rejectionReason: string;
  severity?: DefectSeverity | null;
  resolutionType?: CustomerRejectionResolutionType | null;
  notes?: string | null;
  reportedAt?: string | null;
}
