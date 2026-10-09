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

export const PROOF_NOTE_MAX_CHARS = 102;

export function normalizeProofNotes(
  notes: Array<{ itemId?: string | null; note?: string | null }> | null | undefined,
): Array<{ itemId: string; note: string }> {
  const byItem = new Map<string, string>();
  for (const row of notes ?? []) {
    const itemId = row.itemId?.trim();
    const note = row.note?.trim();
    if (!itemId || !note) {
      continue;
    }
    byItem.set(itemId, note.slice(0, PROOF_NOTE_MAX_CHARS));
  }
  return [...byItem.entries()].map(([itemId, note]) => ({ itemId, note }));
}

export function latestProofNoteByItem(
  notes: Array<{ serviceOrderItemId: string; createdAt: Date | string; note: string }>,
): Map<string, string> {
  const latest = new Map<string, { createdAt: number; note: string }>();
  for (const row of notes) {
    const createdAt = new Date(row.createdAt).getTime();
    const current = latest.get(row.serviceOrderItemId);
    if (!current || createdAt >= current.createdAt) {
      latest.set(row.serviceOrderItemId, { createdAt, note: row.note });
    }
  }
  return new Map([...latest.entries()].map(([itemId, value]) => [itemId, value.note]));
}
