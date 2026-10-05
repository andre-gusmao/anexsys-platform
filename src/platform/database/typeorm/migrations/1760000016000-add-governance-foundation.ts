import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGovernanceFoundation1760000016000 implements MigrationInterface {
  name = 'AddGovernanceFoundation1760000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audit_events
      ADD COLUMN IF NOT EXISTS previous_values jsonb NULL,
      ADD COLUMN IF NOT EXISTS new_values jsonb NULL
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
      ADD COLUMN IF NOT EXISTS deleted_by uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE branches
      ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
      ADD COLUMN IF NOT EXISTS deleted_by uuid NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tenants_active
      ON tenants (id)
      WHERE is_deleted = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_branches_tenant_id_active
      ON branches (tenant_id, display_name)
      WHERE is_deleted = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_branches_parent_active
      ON branches (parent_branch_id)
      WHERE is_deleted = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_branches_parent_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_branches_tenant_id_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tenants_active`);

    await queryRunner.query(`
      ALTER TABLE branches
      DROP COLUMN IF EXISTS deleted_by,
      DROP COLUMN IF EXISTS deleted_at,
      DROP COLUMN IF EXISTS is_deleted
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      DROP COLUMN IF EXISTS deleted_by,
      DROP COLUMN IF EXISTS deleted_at,
      DROP COLUMN IF EXISTS is_deleted
    `);

    await queryRunner.query(`
      ALTER TABLE audit_events
      DROP COLUMN IF EXISTS new_values,
      DROP COLUMN IF EXISTS previous_values
    `);
  }
}
