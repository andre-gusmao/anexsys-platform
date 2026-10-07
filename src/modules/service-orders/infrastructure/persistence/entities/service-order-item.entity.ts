import { Column, Entity } from 'typeorm';
import { DeliveryType, ServiceOrderItemStatus } from 'src/shared/domain/enums';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'service_order_items' })
export class ServiceOrderItemEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId!: string;

  @Column({ name: 'service_order_id', type: 'uuid' })
  serviceOrderId!: string;

  @Column({ name: 'item_no', type: 'integer' })
  itemNo!: number;

  @Column({ name: 'item_type', type: 'varchar', length: 50 })
  itemType!: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'complement', type: 'text', nullable: true })
  complement!: string | null;

  @Column({ name: 'quantity', type: 'numeric', precision: 18, scale: 4 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 18, scale: 2, nullable: true })
  unitPrice!: string | null;

  @Column({ name: 'discount_value', type: 'numeric', precision: 18, scale: 2, nullable: true })
  discountValue!: string | null;

  @Column({ name: 'delivery_type', type: 'varchar', length: 20, nullable: true })
  deliveryType!: DeliveryType | null;

  @Column({ name: 'operational_priority', type: 'varchar', length: 50, nullable: true })
  operationalPriority!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 30, default: ServiceOrderItemStatus.OPEN })
  status!: ServiceOrderItemStatus;
}
