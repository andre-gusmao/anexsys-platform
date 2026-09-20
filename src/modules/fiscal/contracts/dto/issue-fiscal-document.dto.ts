export interface IssueFiscalDocumentDto {
  actorUserId: string;
  issuedAt?: string | null;
  grossAmount?: number | null;
  providerStatus?: string | null;
  providerReferenceNo?: string | null;
}
