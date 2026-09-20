export interface RequestWarrantyExecutionFromQualityDto {
  actorUserId: string;
  executionReason: string;
  affectedServiceOrderItemIds: string[];
  actualDeliveryDate: string;
  correctiveOperationalResourceId?: string | null;
  warrantyPeriodDays?: number | null;
}
