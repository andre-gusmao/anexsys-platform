export type PersistedServiceOrderItem = {
  id: string;
  itemNo: number;
  itemType: string;
  description: string;
  quantity: string;
  unitPrice: string | null;
  discountValue: string | null;
  status: string;
};

export type ServiceOrderItemGridRow = {
  localId: string;
  persistedItemId: string | null;
  itemNo: number;
  itemType: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountValue: string;
  status: string;
  isEditing: boolean;
  isNew: boolean;
  isRemoved: boolean;
};

type ItemPayload = {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  discountValue?: number;
};

function parseOptionalNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildPayload(row: ServiceOrderItemGridRow): ItemPayload {
  return {
    itemType: row.itemType.trim(),
    description: row.description.trim(),
    quantity: Number(row.quantity),
    unitPrice: parseOptionalNumber(row.unitPrice),
    discountValue: parseOptionalNumber(row.discountValue),
  };
}

function rowsMatch(left: ServiceOrderItemGridRow, right: ServiceOrderItemGridRow) {
  return left.itemType.trim() === right.itemType.trim()
    && left.description.trim() === right.description.trim()
    && left.quantity.trim() === right.quantity.trim()
    && left.unitPrice.trim() === right.unitPrice.trim()
    && left.discountValue.trim() === right.discountValue.trim();
}

export function createEmptyServiceOrderItemGridRow(itemNo: number): ServiceOrderItemGridRow {
  return {
    localId: `draft-${itemNo}`,
    persistedItemId: null,
    itemNo,
    itemType: "",
    description: "",
    quantity: "1",
    unitPrice: "",
    discountValue: "",
    status: "open",
    isEditing: true,
    isNew: true,
    isRemoved: false,
  };
}

export function mapServiceOrderItemsToGridRows(items: PersistedServiceOrderItem[]): ServiceOrderItemGridRow[] {
  return items
    .filter((item) => item.status !== "cancelled")
    .map((item) => ({
      localId: item.id,
      persistedItemId: item.id,
      itemNo: item.itemNo,
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? "",
      discountValue: item.discountValue ?? "",
      status: item.status,
      isEditing: false,
      isNew: false,
      isRemoved: false,
    }));
}

export function getNextServiceOrderItemNo(rows: ServiceOrderItemGridRow[]) {
  return rows.reduce((maxItemNo, row) => Math.max(maxItemNo, row.itemNo), 0) + 1;
}

export function getVisibleServiceOrderItemGridRows(rows: ServiceOrderItemGridRow[]) {
  return rows.filter((row) => !row.isRemoved);
}

export function addServiceOrderItemGridRow(rows: ServiceOrderItemGridRow[]) {
  return [...rows, createEmptyServiceOrderItemGridRow(getNextServiceOrderItemNo(rows))];
}

export function updateServiceOrderItemGridRow(
  rows: ServiceOrderItemGridRow[],
  localId: string,
  patch: Partial<Pick<ServiceOrderItemGridRow, "itemType" | "description" | "quantity" | "unitPrice" | "discountValue" | "isEditing">>,
) {
  return rows.map((row) => (row.localId === localId ? { ...row, ...patch } : row));
}

export function removeServiceOrderItemGridRow(rows: ServiceOrderItemGridRow[], localId: string) {
  return rows.flatMap((row) => {
    if (row.localId !== localId) return [row];
    if (row.isNew) return [];
    return [{ ...row, isRemoved: true, isEditing: false }];
  });
}

export function buildCreateServiceOrderItemsPayload(rows: ServiceOrderItemGridRow[]) {
  return getVisibleServiceOrderItemGridRows(rows).map(buildPayload);
}

export function buildServiceOrderItemMutationPlan(
  rows: ServiceOrderItemGridRow[],
  originalItems: PersistedServiceOrderItem[],
) {
  const originalRows = new Map(
    mapServiceOrderItemsToGridRows(originalItems).map((row) => [row.persistedItemId, row] as const),
  );

  const create = getVisibleServiceOrderItemGridRows(rows)
    .filter((row) => row.isNew)
    .map(buildPayload);

  const update = getVisibleServiceOrderItemGridRows(rows)
    .filter((row) => !row.isNew && row.persistedItemId)
    .flatMap((row) => {
      const original = originalRows.get(row.persistedItemId);
      if (!original || rowsMatch(row, original)) {
        return [];
      }
      return [{ itemId: row.persistedItemId, ...buildPayload(row) }];
    });

  const remove = rows
    .filter((row) => row.isRemoved && row.persistedItemId)
    .map((row) => ({ itemId: row.persistedItemId as string, status: "cancelled" as const }));

  return { create, update, remove };
}
