import { ReworkCaseStatus } from 'src/shared/domain/enums';

export interface UpdateReworkCaseDto {
  actorUserId: string;
  reworkReason?: string;
  assignmentNotes?: string | null;
  status?: ReworkCaseStatus;
}
