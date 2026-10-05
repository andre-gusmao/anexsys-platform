import { Column, Entity } from 'typeorm';
import { PickupAuthorizationPath, PickupAuthorizationStatus } from 'src/shared/domain/enums';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'pickup_authorizations' })
export class PickupAuthorizationEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'authorized_person_name', type: 'text' })
  authorizedPersonName!: string;

  @Column({ name: 'authorized_person_document', type: 'varchar', length: 50, nullable: true })
  authorizedPersonDocument!: string | null;

  @Column({ name: 'authorization_path', type: 'varchar', length: 30 })
  authorizationPath!: PickupAuthorizationPath;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom!: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil!: Date;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status!: PickupAuthorizationStatus;
}
