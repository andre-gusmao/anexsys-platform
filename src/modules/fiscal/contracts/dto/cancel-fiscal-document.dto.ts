export interface CancelFiscalDocumentDto {
  actorUserId: string;
  reason: string;
  providerStatus?: string | null;
}
