import { DeliveryType } from 'src/shared/domain/enums';

export interface UpdateProductionOrderDto {
  actorUserId: string;
  deliveryType?: DeliveryType;
  operationalPriority?: string | null;
  customerDeliveryTargetDate?: string;
  internalProductionDeadline?: string | null;
  internalQualityDeadline?: string | null;
  plannedQuantity?: number | null;
  instructions?: string | null;
  pieceDescription?: string | null;
  observations?: string | null;
}
