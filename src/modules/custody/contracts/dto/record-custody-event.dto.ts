import { CustodyEventStage } from 'src/shared/domain/enums';
import { PickupCompletionEvidenceReferenceDto } from 'src/modules/pickup/contracts/dto/complete-pickup-authorization.dto';

export interface RecordCustodyEventDto {
  tenantId: string;
  actorUserId: string;
  branchId: string;
  eventStage: CustodyEventStage;
  serviceOrderId?: string;
  productionOrderId?: string;
  pickupAuthorizationId?: string;
  operationalResourceId?: string;
  storageLocationId?: string;
  eventAt?: string;
  notes?: string;
  evidenceSummary?: Record<string, unknown>;
  cameraSnapshots?: PickupCompletionEvidenceReferenceDto[];
  cctvReferences?: PickupCompletionEvidenceReferenceDto[];
}
