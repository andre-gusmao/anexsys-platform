export type ServiceOrderDetailItemView = {
  id: string;
  itemNo: number;
  itemType: string;
  description: string;
  quantity: string;
  unitPrice: string | null;
  status: string;
};

export function buildServiceOrderDetailViewModel(input: {
  totalValue: string | null;
  items: ServiceOrderDetailItemView[];
}) {
  return {
    hasItems: input.items.length > 0,
    totalValueDisplay: input.totalValue ?? "—",
    itemLines: input.items.map((item) => {
      const parts = [
        `#${item.itemNo}`,
        item.itemType,
        item.description,
        item.quantity,
        item.unitPrice ?? null,
        item.status,
      ].filter((value): value is string => Boolean(value));
      return {
        id: item.id,
        line: parts.join(" · "),
      };
    }),
  };
}
