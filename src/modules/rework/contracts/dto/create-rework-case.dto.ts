export interface CreateReworkCaseDto {
  tenantId: string;
  actorUserId: string;
  productionOrderId: string;
  affectedServiceOrderItemIds: string[];
  reworkReason: string;
  correctiveOperationalResourceId?: string | null;
  assignmentNotes?: string | null;
  qualityRecordId?: string | null;
  customerRejectionId?: string | null;
  openedAt?: string | null;
}
