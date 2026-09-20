export interface FiscalProviderLifecyclePayload {
  fiscalDocumentId: string;
  tenantId: string;
  branchId: string;
  serviceOrderId: string;
  documentType: string;
  documentNo: string;
  grossAmount?: string | null;
}

export interface FiscalProviderLifecycleResult {
  providerStatus: string;
  providerReferenceNo?: string | null;
  notes?: string | null;
}

export interface FiscalProviderContract {
  issueDocument(payload: FiscalProviderLifecyclePayload): Promise<FiscalProviderLifecycleResult>;
  syncStatus(payload: FiscalProviderLifecyclePayload): Promise<FiscalProviderLifecycleResult>;
  cancelDocument(payload: FiscalProviderLifecyclePayload & { reason: string }): Promise<FiscalProviderLifecycleResult>;
}
