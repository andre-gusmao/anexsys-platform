import {
  OperationalAvailabilityStatus,
  OperationalResourceStatus,
  OperationalResourceType,
} from 'src/shared/domain/enums';

export interface UpdateOperationalResourceDto {
  actorUserId: string;
  homeBranchId?: string | null;
  resourceType?: OperationalResourceType;
  displayName?: string;
  documentNo?: string | null;
  phone?: string | null;
  email?: string | null;
  qualificationNotes?: string | null;
  status?: OperationalResourceStatus;
  branchScopeBranchIds?: string[];
  availabilityStatus?: OperationalAvailabilityStatus;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availabilityNotes?: string | null;
}
