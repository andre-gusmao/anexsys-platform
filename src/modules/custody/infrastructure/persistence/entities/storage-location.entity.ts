import { Column, Entity } from 'typeorm';
import { StorageLocationStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'storage_locations' })
export class StorageLocationEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'area', type: 'varchar', length: 50, nullable: true })
  area!: string | null;

  @Column({ name: 'corridor', type: 'varchar', length: 50, nullable: true })
  corridor!: string | null;

  @Column({ name: 'row_code', type: 'varchar', length: 50, nullable: true })
  rowCode!: string | null;

  @Column({ name: 'shelf_code', type: 'varchar', length: 50, nullable: true })
  shelfCode!: string | null;

  @Column({ name: 'cabinet_code', type: 'varchar', length: 50, nullable: true })
  cabinetCode!: string | null;

  @Column({ name: 'drawer_code', type: 'varchar', length: 50, nullable: true })
  drawerCode!: string | null;

  @Column({ name: 'display_label', type: 'text' })
  displayLabel!: string;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: StorageLocationStatus;
}
