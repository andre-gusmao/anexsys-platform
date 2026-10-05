import { PickupAuthorizationPath } from 'src/shared/domain/enums';

export interface CreatePickupAuthorizationDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  authorizedPersonName: string;
  authorizedPersonDocument?: string;
  authorizationPath: PickupAuthorizationPath;
  validFrom?: string;
  validUntil: string;
  requireRemoteApproval?: boolean;
}
