import { FiscalDocumentStatus, FiscalDocumentType } from 'src/shared/domain/enums';

export interface SearchFiscalDocumentsDto {
  branchId?: string;
  serviceOrderId?: string;
  serviceOrderItemId?: string;
  documentType?: FiscalDocumentType;
  status?: FiscalDocumentStatus;
}
