export interface AssignStorageLocationDto {
  tenantId: string;
  actorUserId: string;
  serviceOrderId: string;
  storageLocationId: string;
  assignedAt?: string;
  assignmentReason?: string;
  productionOrderId?: string;
  bagLabel?: string;
  bagNotes?: string;
  bagInUse?: boolean;
}
