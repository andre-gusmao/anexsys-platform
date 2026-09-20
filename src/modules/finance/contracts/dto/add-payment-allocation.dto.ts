export interface AddPaymentAllocationDto {
  actorUserId: string;
  allocations: Array<{
    serviceOrderItemId?: string | null;
    allocatedAmount: number;
  }>;
}
