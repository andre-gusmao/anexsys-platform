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

export type AccessUserListRecord = {
  id: string;
  email: string;
  displayName: string;
  defaultBranchId: string | null;
  status: "active" | "invited" | "inactive";
  defaultBranchLabel?: string;
};

export function userStatusLabel(status: AccessUserListRecord["status"]) {
  if (status === "inactive") return "Inativo";
  if (status === "invited") return "Convidado";
  return "Ativo";
}

export function applyAccessUserListFilters(
  users: AccessUserListRecord[],
  filters: Record<string, string>,
): AccessUserListRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const emailQuery = (filters.email ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();

  return users.filter((user) => {
    if (nameQuery && !includesNormalized(user.displayName, nameQuery) && !includesNormalized(user.email, nameQuery)) {
      return false;
    }
    if (emailQuery && !includesNormalized(user.email, emailQuery)) {
      return false;
    }
    if (statusQuery && user.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildAccessUserExcelCsv(users: AccessUserListRecord[]) {
  const header = ["Nome", "E-mail", "Status", "Filial padrão"];
  const rows = users.map((user) => [user.displayName, user.email, userStatusLabel(user.status), user.defaultBranchLabel ?? ""]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}

export function buildAccessUserEmailCsv(users: AccessUserListRecord[]) {
  const header = ["Nome", "E-mail"];
  const rows = users.map((user) => [user.displayName, user.email]);
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
