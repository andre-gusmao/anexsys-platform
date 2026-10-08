import { floorActionLabel, productionFloorAction } from "../service-orders/os-floor";
import { osStatusLabel } from "../service-orders/os-list";

export type PickBagRecord = {
  id: string;
  orderNo: string;
  status: string;
  promisedDeliveryDate: string;
  bagClosed?: boolean;
  deliveryType?: string;
};

function csvCell(value: string | null | undefined) {
  const text = value ?? "";
  if (/[";\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function pickBagAction(row: Pick<PickBagRecord, "status" | "bagClosed">): "pick_up" | "finish_production" | null {
  const action = productionFloorAction(row.status, Boolean(row.bagClosed));
  if (action === "pick_up" || action === "finish_production") {
    return action;
  }
  return null;
}

export function belongsToPickBagQueue(row: Pick<PickBagRecord, "status" | "bagClosed">) {
  return pickBagAction(row) !== null;
}

export function applyPickBagListFilters(records: PickBagRecord[], filters: Record<string, string>): PickBagRecord[] {
  const nameQuery = (filters.name ?? "").trim().toLowerCase();
  const statusQuery = (filters.status ?? "").trim();
  return records.filter((record) => {
    if (!belongsToPickBagQueue(record)) {
      return false;
    }
    if (nameQuery && ![record.orderNo, record.status].some((value) => value.toLowerCase().includes(nameQuery))) {
      return false;
    }
    if (statusQuery && record.status !== statusQuery) {
      return false;
    }
    return true;
  });
}

export function buildPickBagExcelCsv(records: PickBagRecord[]) {
  const header = ["OS", "Entrega", "Status", "Passo"];
  const rows = records.map((record) => {
    const action = pickBagAction(record);
    return [
      record.orderNo,
      record.promisedDeliveryDate,
      osStatusLabel(record.status),
      action ? floorActionLabel(action) : "",
    ];
  });
  return [header, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(";")).join("\n");
}
