import {
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
}
