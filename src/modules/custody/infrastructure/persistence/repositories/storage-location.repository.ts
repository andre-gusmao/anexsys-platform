import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageLocationStatus } from 'src/shared/domain/enums';
import { StorageLocationEntity } from '../entities/storage-location.entity';

export interface StorageLocationSearchFilters {
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

@Injectable()
export class StorageLocationRepository {
  constructor(@InjectRepository(StorageLocationEntity) private readonly repository: Repository<StorageLocationEntity>) {}
  create(payload: Partial<StorageLocationEntity>): StorageLocationEntity { return this.repository.create(payload); }
  async save(entity: StorageLocationEntity): Promise<StorageLocationEntity> { return this.repository.save(entity); }
  async findById(id: string): Promise<StorageLocationEntity | null> { return this.repository.findOne({ where: { id } }); }
  async findByHierarchy(tenantId: string, branchId: string, area: string | null, corridor: string | null, rowCode: string | null, shelfCode: string | null, cabinetCode: string | null, drawerCode: string | null): Promise<StorageLocationEntity | null> {
    return this.repository
      .createQueryBuilder('storage_location')
      .where('storage_location.tenant_id = :tenantId', { tenantId })
      .andWhere('storage_location.branch_id = :branchId', { branchId })
      .andWhere('storage_location.is_deleted = false')
      .andWhere('storage_location.area IS NOT DISTINCT FROM :area', { area })
      .andWhere('storage_location.corridor IS NOT DISTINCT FROM :corridor', { corridor })
      .andWhere('storage_location.row_code IS NOT DISTINCT FROM :rowCode', { rowCode })
      .andWhere('storage_location.shelf_code IS NOT DISTINCT FROM :shelfCode', { shelfCode })
      .andWhere('storage_location.cabinet_code IS NOT DISTINCT FROM :cabinetCode', { cabinetCode })
      .andWhere('storage_location.drawer_code IS NOT DISTINCT FROM :drawerCode', { drawerCode })
      .getOne();
  }
  async search(tenantId: string, filters: StorageLocationSearchFilters): Promise<StorageLocationEntity[]> {
    const query = this.repository.createQueryBuilder('storage_location').where('storage_location.tenant_id = :tenantId', { tenantId }).andWhere('storage_location.is_deleted = false');
    if (filters.accessibleBranchIds.length === 0) query.andWhere('1 = 0');
    else query.andWhere('storage_location.branch_id IN (:...accessibleBranchIds)', { accessibleBranchIds: filters.accessibleBranchIds });
    if (filters.branchId) query.andWhere('storage_location.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.status) query.andWhere('storage_location.status = :status', { status: filters.status });
    if (filters.area) query.andWhere('storage_location.area = :area', { area: filters.area });
    if (filters.corridor) query.andWhere('storage_location.corridor = :corridor', { corridor: filters.corridor });
    if (filters.rowCode) query.andWhere('storage_location.row_code = :rowCode', { rowCode: filters.rowCode });
    if (filters.shelfCode) query.andWhere('storage_location.shelf_code = :shelfCode', { shelfCode: filters.shelfCode });
    if (filters.cabinetCode) query.andWhere('storage_location.cabinet_code = :cabinetCode', { cabinetCode: filters.cabinetCode });
    if (filters.drawerCode) query.andWhere('storage_location.drawer_code = :drawerCode', { drawerCode: filters.drawerCode });
    return query.orderBy('storage_location.display_label', 'ASC').getMany();
  }
}
