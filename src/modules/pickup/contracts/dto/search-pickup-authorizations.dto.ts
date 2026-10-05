import { PickupAuthorizationStatus } from 'src/shared/domain/enums';

export interface SearchPickupAuthorizationsDto {
  branchId?: string;
  serviceOrderId?: string;
  status?: PickupAuthorizationStatus;
  accessibleBranchIds: string[];
}
