import { FiscalDocumentStatus } from 'src/shared/domain/enums';

export interface SyncFiscalDocumentStatusDto {
  actorUserId: string;
  status: FiscalDocumentStatus;
  providerStatus?: string | null;
  providerReferenceNo?: string | null;
  issuedAt?: string | null;
  grossAmount?: number | null;
  notes?: string | null;
}
