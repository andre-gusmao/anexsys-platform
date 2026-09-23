export type CompanyRecord = {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  status: "active" | "inactive";
  warrantyAdjustmentPeriodDays: number;
  warrantyExecutionPeriodDays: number;
  blockDeliveryWithOutstandingBalance: boolean;
};

export type CompanyApiRecord = Partial<CompanyRecord> & {
  code?: string;
  legalName?: string;
  displayName?: string;
};

export function normalizeCompanyRecord(
  record: CompanyApiRecord,
  index: number,
  options?: { fallbackId?: string },
): CompanyRecord {
  const code = record.code?.trim() || `TENANT-${index + 1}`;
  const legalName = record.legalName?.trim() || code;
  const displayName = record.displayName?.trim() || legalName;

  return {
    id: record.id?.trim() || options?.fallbackId || code,
    code,
    legalName,
    displayName,
    status: record.status === "inactive" ? "inactive" : "active",
    warrantyAdjustmentPeriodDays: record.warrantyAdjustmentPeriodDays ?? 7,
    warrantyExecutionPeriodDays: record.warrantyExecutionPeriodDays ?? 7,
    blockDeliveryWithOutstandingBalance: record.blockDeliveryWithOutstandingBalance ?? false,
  };
}

export function normalizeCompanyListRecords(records: CompanyApiRecord[]): CompanyRecord[] {
  return records.map((record, index) => normalizeCompanyRecord(record, index));
}

export function resolveActiveCompanyId(
  companies: CompanyRecord[],
  activeCompanyId: string | null,
  activeCompanyCode: string | null,
): string | null {
  if (activeCompanyId && companies.some((company) => company.id === activeCompanyId)) {
    return activeCompanyId;
  }

  if (activeCompanyCode) {
    const matchingCompany = companies.find((company) => company.code === activeCompanyCode);
    if (matchingCompany) {
      return matchingCompany.id;
    }
  }

  return companies[0]?.id ?? null;
}
