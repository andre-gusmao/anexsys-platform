import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';

export interface CreateFiscalDocumentDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  serviceOrderItemId?: string | null;
  documentType: FiscalDocumentType;
  documentNo: string;
  grossAmount?: number | null;
  status?: FiscalDocumentStatus;
  issuedAt?: string | null;
}
