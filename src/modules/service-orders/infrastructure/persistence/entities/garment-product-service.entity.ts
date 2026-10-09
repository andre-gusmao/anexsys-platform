import { Column, Entity } from 'typeorm';
import { MeasurementCatalogStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'garment_product_services' })
export class GarmentProductServiceEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId!: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @Column({ name: 'suggested_price', type: 'numeric', precision: 18, scale: 2 })
  suggestedPrice!: string;

  @Column({ name: 'estimated_minutes', type: 'integer' })
  estimatedMinutes!: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: MeasurementCatalogStatus.ACTIVE })
  status!: MeasurementCatalogStatus;
}
