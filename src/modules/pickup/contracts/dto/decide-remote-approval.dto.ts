import { DigitalApprovalDecision, InteractionChannel } from 'src/shared/domain/enums';

export interface DecideRemoteApprovalDto {
  tenantId: string;
  actorUserId?: string | null;
  pickupAuthorizationId: string;
  approvalId: string;
  decision: DigitalApprovalDecision;
  channel: InteractionChannel;
  decisionNotes?: string;
}
