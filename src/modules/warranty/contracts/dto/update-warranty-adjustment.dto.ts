import { WarrantyAdjustmentStatus } from 'src/shared/domain/enums';

export interface UpdateWarrantyAdjustmentDto {
  actorUserId: string;
  adjustmentReason?: string;
  status?: WarrantyAdjustmentStatus;
}
