import { StorageLocationStatus } from 'src/shared/domain/enums';

export interface CreateStorageLocationDto {
  tenantId: string;
  actorUserId: string;
  branchId: string;
  area?: string;
  corridor?: string;
  rowCode?: string;
  shelfCode?: string;
  cabinetCode?: string;
  drawerCode?: string;
  displayLabel?: string;
  status?: StorageLocationStatus;
}
