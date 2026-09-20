export interface CreateWarrantyAdjustmentDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  serviceOrderItemId?: string | null;
  customerRejectionId?: string | null;
  adjustmentReason: string;
  actualDeliveryDate: string;
  warrantyPeriodDays?: number | null;
  openedAt?: string | null;
}
