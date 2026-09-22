import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairTenantDefaultMeasurementUnitCode1760000014000 implements MigrationInterface {
  name = 'RepairTenantDefaultMeasurementUnitCode1760000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS default_measurement_unit_code varchar(20)
    `);

    await queryRunner.query(`
      UPDATE tenants
      SET default_measurement_unit_code = 'CM'
      WHERE default_measurement_unit_code IS NULL
         OR btrim(default_measurement_unit_code) = ''
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ALTER COLUMN default_measurement_unit_code SET DEFAULT 'CM'
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ALTER COLUMN default_measurement_unit_code SET NOT NULL
    `);
  }

  public async down(): Promise<void> {
    // no-op: this repair migration is intentionally additive and idempotent
  }
}
