import { MigrationInterface, QueryRunner } from 'typeorm';

export class MeasurementCatalogStatus1760000021000 implements MigrationInterface {
  name = 'MeasurementCatalogStatus1760000021000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE measurement_body_parts
      ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'active'
    `);
    await queryRunner.query(`
      ALTER TABLE measurement_body_parts
      DROP CONSTRAINT IF EXISTS chk_measurement_body_parts_status
    `);
    await queryRunner.query(`
      ALTER TABLE measurement_body_parts
      ADD CONSTRAINT chk_measurement_body_parts_status CHECK (status IN ('active', 'inactive'))
    `);
    await queryRunner.query(`
      ALTER TABLE measurement_body_parts
      DROP CONSTRAINT IF EXISTS uq_measurement_body_parts_tenant_code
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_measurement_body_parts_tenant_live_code
      ON measurement_body_parts (tenant_id, code)
      WHERE is_deleted = false
    `);

    await queryRunner.query(`
      ALTER TABLE measurement_units
      ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'active'
    `);
    await queryRunner.query(`
      ALTER TABLE measurement_units
      DROP CONSTRAINT IF EXISTS chk_measurement_units_status
    `);
    await queryRunner.query(`
      ALTER TABLE measurement_units
      ADD CONSTRAINT chk_measurement_units_status CHECK (status IN ('active', 'inactive'))
    `);
    await queryRunner.query(`
      ALTER TABLE measurement_units
      DROP CONSTRAINT IF EXISTS uq_measurement_units_tenant_code
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_measurement_units_tenant_live_code
      ON measurement_units (tenant_id, code)
      WHERE is_deleted = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_measurement_units_tenant_live_code`);
    await queryRunner.query(`
      ALTER TABLE measurement_units
      ADD CONSTRAINT uq_measurement_units_tenant_code UNIQUE (tenant_id, code)
    `);
    await queryRunner.query(`ALTER TABLE measurement_units DROP CONSTRAINT IF EXISTS chk_measurement_units_status`);
    await queryRunner.query(`ALTER TABLE measurement_units DROP COLUMN IF EXISTS status`);

    await queryRunner.query(`DROP INDEX IF EXISTS uq_measurement_body_parts_tenant_live_code`);
    await queryRunner.query(`
      ALTER TABLE measurement_body_parts
      ADD CONSTRAINT uq_measurement_body_parts_tenant_code UNIQUE (tenant_id, code)
    `);
    await queryRunner.query(`ALTER TABLE measurement_body_parts DROP CONSTRAINT IF EXISTS chk_measurement_body_parts_status`);
    await queryRunner.query(`ALTER TABLE measurement_body_parts DROP COLUMN IF EXISTS status`);
  }
}
