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

export type OsListRecord = {
  id: string;
  orderNo: string;
  promisedDeliveryDate: string;
  deliveryType: string;
  operationalPriority: string | null;
  status: string;
  totalValue: string | null;
};

export function applyOsListFilters(orders: OsListRecord[], filters: Record<string, string>): OsListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();
  const deliveryQuery = (filters.deliveryType ?? "").trim();

  return orders.filter((order) => {
    if (
      nameQuery &&
      ![order.orderNo, order.deliveryType, order.operationalPriority ?? "", order.status].some((value) =>
        includesNormalized(value, nameQuery),
      )
    ) {
      return false;
    }
    if (statusQuery && order.status !== statusQuery) {
      return false;
    }
    if (deliveryQuery && order.deliveryType !== deliveryQuery) {
      return false;
    }
    return true;
  });
}

export function buildOsExcelCsv(orders: OsListRecord[]) {
  const header = ["Número", "Entrega", "Tipo", "Prioridade", "Status", "Valor"];
  const rows = orders.map((order) => [
    order.orderNo,
    order.promisedDeliveryDate,
    order.deliveryType,
    order.operationalPriority ?? "",
    order.status,
    order.totalValue ?? "",
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
