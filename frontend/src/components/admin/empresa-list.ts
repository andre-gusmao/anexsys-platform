import {
  buildPaginationItems,
  CUSTOMER_LIST_PAGE_SIZES,
  downloadTextFile,
  paginateCustomerList,
} from "../customers/customer-list";

export const EMPRESA_LIST_PAGE_SIZES = CUSTOMER_LIST_PAGE_SIZES;
export { buildPaginationItems, downloadTextFile, paginateCustomerList as paginateEmpresaList };

export type EmpresaListRecord = {
  id: string;
  legalName: string;
  tradeName: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  isDefault: boolean;
};

export type EmpresaListFilters = {
  name: string;
  document: string;
  city: string;
  state: string;
  email: string;
};

export type EmpresaListColumnId = "name" | "document" | "city" | "state" | "email" | "phone" | "default";

export type EmpresaListColumn = {
  id: EmpresaListColumnId;
  label: string;
  locked?: boolean;
};

export const EMPRESA_LIST_COLUMNS: EmpresaListColumn[] = [
  { id: "name", label: "Empresa", locked: true },
  { id: "document", label: "CNPJ" },
  { id: "city", label: "Cidade" },
  { id: "state", label: "UF" },
  { id: "email", label: "E-mail" },
  { id: "phone", label: "Telefone" },
  { id: "default", label: "Padrão" },
];

export const DEFAULT_EMPRESA_LIST_COLUMN_IDS: EmpresaListColumnId[] = ["name", "document", "city", "state", "default"];

export const emptyEmpresaListFilters = (): EmpresaListFilters => ({
  name: "",
  document: "",
  city: "",
  state: "",
  email: "",
});

function includesNormalized(value: string | null | undefined, query: string) {
  if (!query) return true;
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function digitsOnly(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

export function applyEmpresaListFilters(empresas: EmpresaListRecord[], filters: EmpresaListFilters): EmpresaListRecord[] {
  const nameQuery = filters.name.trim().toLowerCase();
  const documentQuery = digitsOnly(filters.document);
  const cityQuery = filters.city.trim().toLowerCase();
  const stateQuery = filters.state.trim().toLowerCase();
  const emailQuery = filters.email.trim().toLowerCase();

  return empresas.filter((empresa) => {
    if (nameQuery && ![empresa.legalName, empresa.tradeName].some((value) => includesNormalized(value, nameQuery))) {
      return false;
    }
    if (documentQuery && !digitsOnly(empresa.cnpj).includes(documentQuery)) {
      return false;
    }
    if (cityQuery && !includesNormalized(empresa.city, cityQuery)) {
      return false;
    }
    if (stateQuery && !includesNormalized(empresa.state, stateQuery)) {
      return false;
    }
    if (emailQuery && !includesNormalized(empresa.email, emailQuery)) {
      return false;
    }
    return true;
  });
}

export function formatEmpresaCnpj(value: string | null | undefined) {
  const digits = digitsOnly(value).slice(0, 14);
  if (!digits) return "—";
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function empresaDisplayName(empresa: Pick<EmpresaListRecord, "legalName" | "tradeName">) {
  return empresa.tradeName?.trim() || empresa.legalName;
}

function csvCell(value: string | null | undefined) {
  const text = value ?? "";
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildEmpresaExcelCsv(empresas: EmpresaListRecord[]) {
  const header = ["Razão social", "Fantasia", "CNPJ", "Cidade", "UF", "E-mail", "Telefone", "Padrão"];
  const rows = empresas.map((empresa) => [
    empresa.legalName,
    empresa.tradeName ?? "",
    formatEmpresaCnpj(empresa.cnpj) === "—" ? "" : formatEmpresaCnpj(empresa.cnpj),
    empresa.city ?? "",
    empresa.state ?? "",
    empresa.email ?? "",
    empresa.phone ?? "",
    empresa.isDefault ? "Sim" : "Não",
  ]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}

export function buildEmpresaEmailCsv(empresas: EmpresaListRecord[]) {
  return empresas
    .map((empresa) => empresa.email?.trim())
    .filter((email): email is string => Boolean(email))
    .join("\n");
}

export function normalizeEmpresaListColumnIds(ids: readonly string[]): EmpresaListColumnId[] {
  const allowed = new Set(EMPRESA_LIST_COLUMNS.map((column) => column.id));
  const next = ids.filter((id): id is EmpresaListColumnId => allowed.has(id as EmpresaListColumnId));
  if (!next.includes("name")) {
    next.unshift("name");
  }
  return next.length > 0 ? [...new Set(next)] : [...DEFAULT_EMPRESA_LIST_COLUMN_IDS];
}
