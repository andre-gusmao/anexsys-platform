import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderItemEquipment1760000028000 implements MigrationInterface {
  name = 'ServiceOrderItemEquipment1760000028000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS brand varchar(120) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS model varchar(120) NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS serial_no varchar(120) NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_order_items DROP COLUMN IF EXISTS serial_no`);
    await queryRunner.query(`ALTER TABLE service_order_items DROP COLUMN IF EXISTS model`);
    await queryRunner.query(`ALTER TABLE service_order_items DROP COLUMN IF EXISTS brand`);
  }
}
