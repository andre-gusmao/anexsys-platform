import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWarrantyConfigAndStartRules1760000006000 implements MigrationInterface {
  name = 'AddWarrantyConfigAndStartRules1760000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN warranty_adjustment_period_days integer NOT NULL DEFAULT 7,
      ADD COLUMN warranty_execution_period_days integer NOT NULL DEFAULT 7,
      ADD CONSTRAINT chk_tenants_warranty_adjustment_period CHECK (warranty_adjustment_period_days >= 1),
      ADD CONSTRAINT chk_tenants_warranty_execution_period CHECK (warranty_execution_period_days >= 1)
    `);

    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN actual_pickup_date date NULL,
      ADD COLUMN actual_delivery_date date NULL
    `);

    await queryRunner.query('ALTER TABLE warranty_adjustments RENAME COLUMN actual_delivery_date TO warranty_start_date');
    await queryRunner.query('ALTER TABLE warranty_adjustments ADD COLUMN warranty_start_source varchar(20) NOT NULL DEFAULT \'delivery\'');
    await queryRunner.query(`
      ALTER TABLE warranty_adjustments
      ADD CONSTRAINT chk_warranty_adjustments_start_source CHECK (warranty_start_source IN ('pickup', 'delivery'))
    `);

    await queryRunner.query('ALTER TABLE warranty_executions RENAME COLUMN actual_delivery_date TO warranty_start_date');
    await queryRunner.query('ALTER TABLE warranty_executions ADD COLUMN warranty_start_source varchar(20) NOT NULL DEFAULT \'delivery\'');
    await queryRunner.query(`
      ALTER TABLE warranty_executions
      ADD CONSTRAINT chk_warranty_executions_start_source CHECK (warranty_start_source IN ('pickup', 'delivery'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE warranty_executions DROP CONSTRAINT IF EXISTS chk_warranty_executions_start_source');
    await queryRunner.query('ALTER TABLE warranty_executions DROP COLUMN IF EXISTS warranty_start_source');
    await queryRunner.query('ALTER TABLE warranty_executions RENAME COLUMN warranty_start_date TO actual_delivery_date');

    await queryRunner.query('ALTER TABLE warranty_adjustments DROP CONSTRAINT IF EXISTS chk_warranty_adjustments_start_source');
    await queryRunner.query('ALTER TABLE warranty_adjustments DROP COLUMN IF EXISTS warranty_start_source');
    await queryRunner.query('ALTER TABLE warranty_adjustments RENAME COLUMN warranty_start_date TO actual_delivery_date');

    await queryRunner.query('ALTER TABLE service_orders DROP COLUMN IF EXISTS actual_delivery_date');
    await queryRunner.query('ALTER TABLE service_orders DROP COLUMN IF EXISTS actual_pickup_date');

    await queryRunner.query('ALTER TABLE tenants DROP CONSTRAINT IF EXISTS chk_tenants_warranty_execution_period');
    await queryRunner.query('ALTER TABLE tenants DROP CONSTRAINT IF EXISTS chk_tenants_warranty_adjustment_period');
    await queryRunner.query('ALTER TABLE tenants DROP COLUMN IF EXISTS warranty_execution_period_days');
    await queryRunner.query('ALTER TABLE tenants DROP COLUMN IF EXISTS warranty_adjustment_period_days');
  }
}
