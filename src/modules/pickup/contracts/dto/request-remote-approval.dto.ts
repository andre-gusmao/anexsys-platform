import { InteractionChannel } from 'src/shared/domain/enums';

export interface RequestRemoteApprovalDto {
  tenantId: string;
  actorUserId: string;
  pickupAuthorizationId: string;
  channel: InteractionChannel;
  messageSummary?: string;
}
