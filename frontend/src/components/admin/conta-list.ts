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

export type ContaListRecord = {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  status: "active" | "inactive";
  warrantyAdjustmentPeriodDays: number;
  warrantyExecutionPeriodDays: number;
};

export function contaStatusLabel(status: ContaListRecord["status"]) {
  return status === "inactive" ? "Inativa" : "Ativa";
}

export function applyContaListFilters(contas: ContaListRecord[], filters: Record<string, string>): ContaListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const codeQuery = (filters.code ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();

  return contas.filter((conta) => {
    if (nameQuery && ![conta.displayName, conta.legalName].some((value) => includesNormalized(value, nameQuery))) {
      return false;
    }
    if (codeQuery && !includesNormalized(conta.code, codeQuery)) {
      return false;
    }
    if (statusQuery && conta.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildContaExcelCsv(contas: ContaListRecord[]) {
  const header = ["Nome", "Razão social", "Código", "Status", "Ajuste garantia (dias)", "Execução garantia (dias)"];
  const rows = contas.map((conta) => [
    conta.displayName,
    conta.legalName,
    conta.code,
    contaStatusLabel(conta.status),
    String(conta.warrantyAdjustmentPeriodDays),
    String(conta.warrantyExecutionPeriodDays),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
