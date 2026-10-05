import { WarrantyExecutionStatus } from 'src/shared/domain/enums';

export interface UpdateWarrantyExecutionDto {
  actorUserId: string;
  executionReason?: string;
  correctiveOperationalResourceId?: string | null;
  status?: WarrantyExecutionStatus;
}
