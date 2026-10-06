export type CustomerListStatus = "active" | "inactive" | "blocked";
export type CustomerListType = "person" | "company";

export type CustomerListRecord = {
  id: string;
  customerType: CustomerListType;
  legalName: string;
  tradeName: string | null;
  cpfCnpj: string | null;
  email: string | null;
  phone: string;
  city?: string | null;
  state?: string | null;
  status: CustomerListStatus;
  createdAt?: string;
};

export type CustomerListFilters = {
  name: string;
  customerType: string;
  document: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  status: string;
};

export type CustomerListColumnId =
  | "name"
  | "type"
  | "document"
  | "status"
  | "phone"
  | "email"
  | "city"
  | "state"
  | "createdAt";

export type CustomerListColumn = {
  id: CustomerListColumnId;
  label: string;
  locked?: boolean;
};

export const CUSTOMER_LIST_COLUMNS: CustomerListColumn[] = [
  { id: "name", label: "Nome", locked: true },
  { id: "type", label: "Tipo" },
  { id: "document", label: "Documento" },
  { id: "status", label: "Status" },
  { id: "phone", label: "Telefone" },
  { id: "email", label: "E-mail" },
  { id: "city", label: "Cidade" },
  { id: "state", label: "Estado" },
  { id: "createdAt", label: "Cadastrado em" },
];

export const DEFAULT_CUSTOMER_LIST_COLUMN_IDS: CustomerListColumnId[] = [
  "name",
  "type",
  "document",
  "status",
  "phone",
  "createdAt",
];

export const CUSTOMER_LIST_PAGE_SIZES = [10, 25, 50] as const;

export const emptyCustomerListFilters = (): CustomerListFilters => ({
  name: "",
  customerType: "",
  document: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  status: "",
});

export function customerListStatusLabel(status: CustomerListStatus) {
  if (status === "inactive") return "Inativo";
  if (status === "blocked") return "Bloqueado";
  return "Ativo";
}

export function customerListTypeLabel(customerType: CustomerListType) {
  return customerType === "company" ? "Empresa" : "Pessoa";
}

export function formatCustomerListDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(date);
}

export function formatCustomerListPhone(value: string | null | undefined) {
  if (!value) return "—";
  if (value.length === 11) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  }
  if (value.length === 10) {
    return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
  }
  return value;
}

function includesNormalized(value: string | null | undefined, query: string) {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function applyCustomerListFilters(
  customers: CustomerListRecord[],
  filters: CustomerListFilters,
): CustomerListRecord[] {
  const documentQuery = digitsOnly(filters.document);
  const phoneQuery = digitsOnly(filters.phone);
  const emailQuery = filters.email.trim().toLowerCase();
  const cityQuery = filters.city.trim().toLowerCase();
  const stateQuery = filters.state.trim().toLowerCase();

  return customers.filter((customer) => {
    if (documentQuery && !digitsOnly(customer.cpfCnpj).includes(documentQuery)) {
      return false;
    }
    if (phoneQuery && !digitsOnly(customer.phone).includes(phoneQuery)) {
      return false;
    }
    if (emailQuery && !includesNormalized(customer.email, emailQuery)) {
      return false;
    }
    if (cityQuery && !includesNormalized(customer.city, cityQuery)) {
      return false;
    }
    if (stateQuery && !includesNormalized(customer.state, stateQuery)) {
      return false;
    }
    return true;
  });
}

export function paginateCustomerList<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = pageSize > 0 ? Math.floor(pageSize) : CUSTOMER_LIST_PAGE_SIZES[0];
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * safePageSize;
  return {
    items: items.slice(start, start + safePageSize),
    currentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    start: totalItems === 0 ? 0 : start + 1,
    end: Math.min(start + safePageSize, totalItems),
  };
}

function csvCell(value: string | null | undefined) {
  const text = value ?? "";
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCustomerExcelCsv(customers: CustomerListRecord[]) {
  const header = [
    "Nome",
    "Fantasia",
    "Tipo",
    "Documento",
    "Status",
    "Telefone",
    "E-mail",
    "Cidade",
    "Estado",
    "Cadastrado em",
  ];
  const rows = customers.map((customer) => [
    customer.legalName,
    customer.tradeName ?? "",
    customerListTypeLabel(customer.customerType),
    customer.cpfCnpj ?? "",
    customerListStatusLabel(customer.status),
    customer.phone,
    customer.email ?? "",
    customer.city ?? "",
    customer.state ?? "",
    formatCustomerListDateTime(customer.createdAt),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}

export function buildCustomerEmailCsv(customers: CustomerListRecord[]) {
  return customers
    .map((customer) => customer.email?.trim())
    .filter((email): email is string => Boolean(email))
    .join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function normalizeCustomerListColumnIds(ids: readonly string[]): CustomerListColumnId[] {
  const allowed = new Set(CUSTOMER_LIST_COLUMNS.map((column) => column.id));
  const next = ids.filter((id): id is CustomerListColumnId => allowed.has(id as CustomerListColumnId));
  if (!next.includes("name")) {
    next.unshift("name");
  }
  return next.length > 0 ? [...new Set(next)] : [...DEFAULT_CUSTOMER_LIST_COLUMN_IDS];
}
