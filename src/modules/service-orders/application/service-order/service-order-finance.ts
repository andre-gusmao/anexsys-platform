export type OsListPaymentStatus = 'pending' | 'partial' | 'paid';

export function osListPaymentFromTotals(
  totalValue: string | number | null | undefined,
  amountPaid: number,
): { amountPaid: string; outstandingBalance: string; paymentStatus: OsListPaymentStatus } {
  const total = Number(totalValue ?? 0);
  const paid = Number.isFinite(amountPaid) ? amountPaid : 0;
  const outstanding = Math.max(Number((total - paid).toFixed(2)), 0);
  return {
    amountPaid: paid.toFixed(2),
    outstandingBalance: outstanding.toFixed(2),
    paymentStatus: outstanding <= 0 ? 'paid' : paid > 0 ? 'partial' : 'pending',
  };
}
