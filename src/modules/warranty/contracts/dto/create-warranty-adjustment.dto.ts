export interface CreateWarrantyAdjustmentDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  serviceOrderItemId?: string | null;
  customerRejectionId?: string | null;
  adjustmentReason: string;
  openedAt?: string | null;
}
