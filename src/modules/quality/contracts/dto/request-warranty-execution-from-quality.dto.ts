export interface RequestWarrantyExecutionFromQualityDto {
  actorUserId: string;
  executionReason: string;
  affectedServiceOrderItemIds: string[];
  correctiveOperationalResourceId?: string | null;
}
