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

export type FilialListRecord = {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  status: "active" | "inactive";
  businessCalendarName: string | null;
  isDefault?: boolean;
};

export function filialStatusLabel(status: FilialListRecord["status"]) {
  return status === "inactive" ? "Inativa" : "Ativa";
}

export function applyFilialListFilters(filiais: FilialListRecord[], filters: Record<string, string>): FilialListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const codeQuery = (filters.code ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();

  return filiais.filter((filial) => {
    if (nameQuery && ![filial.displayName, filial.legalName].some((value) => includesNormalized(value, nameQuery))) {
      return false;
    }
    if (codeQuery && !includesNormalized(filial.code, codeQuery)) {
      return false;
    }
    if (statusQuery && filial.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildFilialExcelCsv(filiais: FilialListRecord[]) {
  const header = ["Nome", "Razão social", "Código", "Status", "Calendário", "Padrão"];
  const rows = filiais.map((filial) => [
    filial.displayName,
    filial.legalName,
    filial.code,
    filialStatusLabel(filial.status),
    filial.businessCalendarName ?? "",
    filial.isDefault ? "Sim" : "Não",
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
