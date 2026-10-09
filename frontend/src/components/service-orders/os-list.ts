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
  hasAttachments?: boolean;
  paymentStatus?: "pending" | "partial" | "paid";
  outstandingBalance?: string | null;
  amountPaid?: string | null;
};

export function osDeliveryTypeLabel(type: string) {
  if (type === "Standard") return "Normal";
  if (type === "Priority") return "Urgente";
  if (type === "Express") return "Expresso";
  return type;
}

export function osStatusLabel(status: string) {
  if (status === "open") return "Aberta";
  if (status === "approved") return "Aprovada";
  if (status === "cancelled") return "Cancelada";
  if (status === "draft") return "Rascunho";
  if (status === "in_production") return "Em produção";
  if (status === "awaiting_proof") return "Aguardando prova";
  if (status === "awaiting_quality") return "Aguardando controle de qualidade";
  if (status === "quality") return "Controle de qualidade";
  if (status === "in_rework") return "Em refação";
  if (status === "ready_for_pickup") return "Pronto para retirada";
  if (status === "picked_up") return "Retirado";
  return status;
}

export function applyOsListFilters(orders: OsListRecord[], filters: Record<string, string>): OsListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();
  const deliveryQuery = (filters.deliveryType ?? "").trim();
  const paymentQuery = (filters.payment ?? "").trim();

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
    if (paymentQuery === "paid" && order.paymentStatus !== "paid") {
      return false;
    }
    if (paymentQuery === "open" && order.paymentStatus === "paid") {
      return false;
    }
    return true;
  });
}

export function buildOsExcelCsv(orders: OsListRecord[]) {
  const header = ["Número", "Entrega", "Tipo", "Prioridade", "Status", "Pagamento", "Valor"];
  const rows = orders.map((order) => [
    order.orderNo,
    order.promisedDeliveryDate,
    osDeliveryTypeLabel(order.deliveryType),
    order.operationalPriority ?? "",
    osStatusLabel(order.status),
    order.paymentStatus === "paid" ? "Pago" : "Em aberto",
    order.totalValue ?? "",
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
