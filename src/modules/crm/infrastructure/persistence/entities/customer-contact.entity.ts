import { Column, Entity } from 'typeorm';
import { SoftDeletableBusinessEntity } from 'src/shared/persistence/base.entity';

@Entity({ name: 'customer_contacts' })
export class CustomerContactEntity extends SoftDeletableBusinessEntity {
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'contact_name', type: 'text' })
  contactName!: string;

  @Column({ name: 'contact_role', type: 'varchar', length: 100, nullable: true })
  contactRole!: string | null;

  @Column({ name: 'email', type: 'text', nullable: true })
  email!: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 40, nullable: true })
  phone!: string | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary!: boolean;
}
