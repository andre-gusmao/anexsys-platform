export type ApprovalMethod = "counter" | "paper" | "release";

export type ApprovalSummary = {
  method?: ApprovalMethod | null;
  confirmedAt?: string | Date | null;
  acceptedText?: string | null;
  releaseReason?: string | null;
  totalValue?: string | number | null;
  photoAvailable?: boolean;
  measurementsLocked?: boolean;
  signed?: boolean;
  releasedWithoutSignature?: boolean;
};

export function canRecordOsApproval(status: string) {
  return status !== "cancelled" && status !== "picked_up";
}

export function approvalMethodLabel(method: string | null | undefined) {
  if (method === "counter") return "Balcão";
  if (method === "paper") return "Papel";
  if (method === "release") return "Liberação";
  if (method === "link") return "Link do cliente";
  return null;
}
