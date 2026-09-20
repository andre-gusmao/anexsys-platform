export interface CreateWarrantyExecutionDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  productionOrderId: string;
  affectedServiceOrderItemIds: string[];
  executionReason: string;
  actualDeliveryDate: string;
  warrantyPeriodDays?: number | null;
  correctiveOperationalResourceId?: string | null;
  customerRejectionId?: string | null;
  qualityRecordId?: string | null;
  openedAt?: string | null;
}
