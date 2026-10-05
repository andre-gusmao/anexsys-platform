import { DeliveryType, ProductionOrderVersionReason } from 'src/shared/domain/enums';

export interface CreateProductionOrderVersionDto {
  actorUserId: string;
  versionReason: ProductionOrderVersionReason;
  activate?: boolean;
  isDraft?: boolean;
  deliveryType?: DeliveryType | null;
  operationalPriority?: string | null;
  changeSummary: string;
  plannedQuantity?: number | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  instructions?: string | null;
  pieceDescription?: string | null;
  observations?: string | null;
  resourceChangeNotes?: string | null;
  affectedServiceOrderItemIds?: string[] | null;
}
