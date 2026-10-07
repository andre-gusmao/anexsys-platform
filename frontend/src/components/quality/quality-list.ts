import { osStatusLabel } from "@/components/service-orders/os-list";

export type QualityListRecord = {
  id: string;
  orderNo: string;
  customerName: string;
  status: string;
  promisedDeliveryDate: string;
  versionNo: number;
  bagClosed?: boolean;
  productionOrderId?: string;
  productionNo?: string;
};

export function qualityPhaseLabel(phase: string) {
  if (phase === "needs_review") return "A revisar";
  if (phase === "rework_issued") return "Em refação";
  if (phase === "ready") return "Aprovado";
  return phase;
}

export function qualityDecisionLabel(decision: string) {
  if (decision === "approved") return "Aprovado";
  if (decision === "rejected") return "Reprovado";
  if (decision === "in_rework") return "Em refação";
  return "Pendente";
}

export function applyQualityListFilters(records: QualityListRecord[], filters: Record<string, string>): QualityListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();
  return records.filter((record) => {
    if (
      nameQuery &&
      ![record.orderNo, record.customerName, record.status, record.productionNo ?? ""].some((value) =>
        value.toLowerCase().includes(nameQuery),
      )
    ) {
      return false;
    }
    if (statusQuery && record.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildQualityExcelCsv(records: QualityListRecord[]) {
  const header = ["OS", "Cliente", "Status", "Entrega", "Versão"];
  const rows = records.map((record) => [
    record.orderNo,
    record.customerName,
    osStatusLabel(record.status),
    record.promisedDeliveryDate,
    String(record.versionNo),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => cell.replace(/;/g, ",")).join(";")).join("\n");
}
