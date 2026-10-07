function includesNormalized(value: string | null | undefined, query: string) {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function csvCell(value: string | null | undefined) {
  const text = value ?? "";
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export type MeasurementListRecord = {
  id: string;
  code: string;
  displayName: string;
  sortOrder: number;
  status: "active" | "inactive";
};

export function measurementStatusLabel(status: MeasurementListRecord["status"]) {
  return status === "inactive" ? "Inativo" : "Ativo";
}

export function applyMeasurementListFilters(
  records: MeasurementListRecord[],
  filters: Record<string, string>,
): MeasurementListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const codeQuery = (filters.code ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();

  return records.filter((record) => {
    if (nameQuery && !includesNormalized(record.displayName, nameQuery) && !includesNormalized(record.code, nameQuery)) {
      return false;
    }
    if (codeQuery && !includesNormalized(record.code, codeQuery)) {
      return false;
    }
    if (statusQuery && record.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildMeasurementExcelCsv(records: MeasurementListRecord[]) {
  const header = ["Nome", "Código", "Ordem", "Status"];
  const rows = records.map((record) => [
    record.displayName,
    record.code,
    String(record.sortOrder),
    measurementStatusLabel(record.status),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
