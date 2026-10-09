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

export type ProductPriceRecord = {
  id: string;
  productId: string;
  serviceId: string;
  productName: string;
  serviceName: string;
  suggestedPrice: string;
  estimatedMinutes: number;
  status: "active" | "inactive";
};

function matchesPriceSearch(record: ProductPriceRecord, query: string) {
  if (!query) {
    return true;
  }
  const combined = `${record.productName} · ${record.serviceName}`;
  return (
    includesNormalized(record.productName, query) ||
    includesNormalized(record.serviceName, query) ||
    includesNormalized(combined, query)
  );
}

export function productPriceStatusLabel(status: ProductPriceRecord["status"]) {
  return status === "inactive" ? "Inativo" : "Ativo";
}

export function applyProductPriceFilters(
  records: ProductPriceRecord[],
  filters: Record<string, string>,
): ProductPriceRecord[] {
  const productQuery = (filters.q ?? filters.product ?? "").trim();
  const serviceQuery = (filters.service ?? "").trim();
  const statusQuery = (filters.status ?? "").trim();

  return records.filter((record) => {
    if (productQuery && !matchesPriceSearch(record, productQuery)) {
      return false;
    }
    if (serviceQuery && !includesNormalized(record.serviceName, serviceQuery)) {
      return false;
    }
    if (statusQuery && record.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildProductPriceExcelCsv(records: ProductPriceRecord[]) {
  const header = ["Produto", "Serviço", "Preço", "Tempo (min)", "Status"];
  const rows = records.map((record) => [
    record.productName,
    record.serviceName,
    record.suggestedPrice,
    String(record.estimatedMinutes),
    productPriceStatusLabel(record.status),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
