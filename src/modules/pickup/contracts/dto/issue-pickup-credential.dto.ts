export interface IssuePickupCredentialDto {
  tenantId: string;
  actorUserId: string;
  pickupAuthorizationId: string;
  value?: string;
  expiresAt: string;
}
