import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_context_preferences' })
export class UserContextPreferenceEntity {
  @PrimaryColumn({ name: 'normalized_email', type: 'text' })
  normalizedEmail!: string;

  @Column({ name: 'last_tenant_id', type: 'uuid', nullable: true })
  lastTenantId!: string | null;

  @Column({ name: 'last_branch_id', type: 'uuid', nullable: true })
  lastBranchId!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'updated_by', type: 'uuid' })
  updatedBy!: string;

  @Column({ name: 'row_version', type: 'bigint', default: () => '1' })
  rowVersion!: string;
}
