import { Column, Entity } from 'typeorm';
import { MutableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'production_order_item_links' })
export class ProductionOrderItemLinkEntity extends MutableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'production_order_id', type: 'uuid' })
  productionOrderId!: string;

  @Column({ name: 'service_order_item_id', type: 'uuid' })
  serviceOrderItemId!: string;

  @Column({ name: 'is_primary_scope', type: 'boolean', default: false })
  isPrimaryScope!: boolean;
}
