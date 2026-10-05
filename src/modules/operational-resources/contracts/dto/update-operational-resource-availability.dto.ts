import { OperationalAvailabilityStatus } from 'src/shared/domain/enums';

export interface UpdateOperationalResourceAvailabilityDto {
  actorUserId: string;
  availabilityStatus: OperationalAvailabilityStatus;
  availableFrom?: string | null;
  availableUntil?: string | null;
  availabilityNotes?: string | null;
}
