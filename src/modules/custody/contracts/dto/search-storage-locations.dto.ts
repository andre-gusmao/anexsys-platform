import { StorageLocationStatus } from 'src/shared/domain/enums';

export interface SearchStorageLocationsDto {
  branchId?: string;
  status?: StorageLocationStatus;
  area?: string;
  corridor?: string;
  rowCode?: string;
  shelfCode?: string;
  cabinetCode?: string;
  drawerCode?: string;
  accessibleBranchIds: string[];
}
