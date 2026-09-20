import { StorageLocationStatus } from 'src/shared/domain/enums';

export interface UpdateStorageLocationDto {
  tenantId: string;
  actorUserId: string;
  area?: string;
  corridor?: string;
  rowCode?: string;
  shelfCode?: string;
  cabinetCode?: string;
  drawerCode?: string;
  displayLabel?: string;
  status?: StorageLocationStatus;
}
