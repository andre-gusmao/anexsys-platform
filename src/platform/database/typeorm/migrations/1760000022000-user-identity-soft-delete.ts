import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserIdentitySoftDelete1760000022000 implements MigrationInterface {
  name = 'UserIdentitySoftDelete1760000022000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_identities
      ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE user_identities
      ADD COLUMN IF NOT EXISTS deleted_at timestamptz
    `);
    await queryRunner.query(`
      ALTER TABLE user_identities
      ADD COLUMN IF NOT EXISTS deleted_by uuid
    `);
    await queryRunner.query(`
      ALTER TABLE user_identities
      DROP CONSTRAINT IF EXISTS uq_user_identities_tenant_email
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_user_identities_tenant_live_email
      ON user_identities (tenant_id, email)
      WHERE is_deleted = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_user_identities_tenant_live_email`);
    await queryRunner.query(`
      ALTER TABLE user_identities
      ADD CONSTRAINT uq_user_identities_tenant_email UNIQUE (tenant_id, email)
    `);
    await queryRunner.query(`ALTER TABLE user_identities DROP COLUMN IF EXISTS deleted_by`);
    await queryRunner.query(`ALTER TABLE user_identities DROP COLUMN IF EXISTS deleted_at`);
    await queryRunner.query(`ALTER TABLE user_identities DROP COLUMN IF EXISTS is_deleted`);
  }
}
