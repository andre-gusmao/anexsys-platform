import { CustomerRejectionResolutionType, CustomerRejectionStatus, DefectSeverity } from 'src/shared/domain/enums';

export interface UpdateCustomerRejectionDto {
  actorUserId: string;
  reportedQuantity?: number | null;
  rejectionReason?: string;
  severity?: DefectSeverity | null;
  resolutionType?: CustomerRejectionResolutionType | null;
  notes?: string | null;
  status?: CustomerRejectionStatus;
}
