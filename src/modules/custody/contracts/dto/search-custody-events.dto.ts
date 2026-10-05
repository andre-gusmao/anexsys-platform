import { CustodyEventStage } from 'src/shared/domain/enums';

export interface SearchCustodyEventsDto {
  branchId?: string;
  serviceOrderId?: string;
  productionOrderId?: string;
  pickupAuthorizationId?: string;
  eventStage?: CustodyEventStage;
  accessibleBranchIds: string[];
}
