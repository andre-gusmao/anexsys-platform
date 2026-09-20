import {
  OperationalAvailabilityStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';

export interface CreateOperationalResourceDto {
  tenantId: string;
  actorUserId: string;
  homeBranchId?: string | null;
  resourceType: OperationalResourceType;
  displayName: string;
  documentNo?: string | null;
  phone?: string | null;
  email?: string | null;
  qualificationNotes?: string | null;
  skills?: string[];
  branchScopeBranchIds?: string[];
  availabilityStatus?: OperationalAvailabilityStatus;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availabilityNotes?: string | null;
}
