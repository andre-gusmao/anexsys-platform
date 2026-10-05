export interface ScheduleProductionOrderDto {
  actorUserId: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
  primaryResourceId: string;
  participantResourceIds?: string[];
  assignmentNotes?: string | null;
}
