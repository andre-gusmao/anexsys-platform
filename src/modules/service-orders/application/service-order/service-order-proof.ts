import { ServiceOrderStatus } from 'src/shared/domain/enums';

export type ProofAction = 'send_to_proof' | 'complete_proof';

export function canSendToProof(status: string, bagClosed: boolean): boolean {
  return bagClosed && status === ServiceOrderStatus.IN_PRODUCTION;
}

export function canActOnProof(status: string): boolean {
  return status === ServiceOrderStatus.AWAITING_PROOF;
}

export function proofActionResultStatus(action: ProofAction): ServiceOrderStatus {
  if (action === 'send_to_proof') {
    return ServiceOrderStatus.AWAITING_PROOF;
  }
  return ServiceOrderStatus.IN_PRODUCTION;
}

export function proofActionAudit(action: ProofAction): string {
  return `service_order.proof.${action}`;
}
