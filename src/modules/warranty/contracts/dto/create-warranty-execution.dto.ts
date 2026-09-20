export interface CreateWarrantyExecutionDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  productionOrderId: string;
  affectedServiceOrderItemIds: string[];
  executionReason: string;
  correctiveOperationalResourceId?: string | null;
  customerRejectionId?: string | null;
  qualityRecordId?: string | null;
  openedAt?: string | null;
}
