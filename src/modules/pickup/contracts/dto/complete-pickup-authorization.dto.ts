import { PickupCredentialType } from 'src/shared/domain/enums';

export interface PickupCompletionEvidenceReferenceDto {
  sourceLabel: string;
  referenceUri: string;
  capturedAt?: string;
  notes?: string;
}

export interface CompletePickupAuthorizationDto {
  tenantId: string;
  actorUserId: string;
  pickupAuthorizationId: string;
  authorizationMethod: PickupCredentialType;
  credentialValue?: string;
  approvalId?: string;
  notes?: string;
  operationalResourceId?: string;
  cameraSnapshots?: PickupCompletionEvidenceReferenceDto[];
  cctvReferences?: PickupCompletionEvidenceReferenceDto[];
}
