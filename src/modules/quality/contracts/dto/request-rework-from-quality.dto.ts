export interface RequestReworkFromQualityDto {
  actorUserId: string;
  reworkReason: string;
  affectedServiceOrderItemIds: string[];
  correctiveOperationalResourceId?: string | null;
  assignmentNotes?: string | null;
}
