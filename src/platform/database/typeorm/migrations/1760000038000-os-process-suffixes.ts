import { MigrationInterface, QueryRunner } from 'typeorm';

export class OsProcessSuffixes1760000038000 implements MigrationInterface {
  name = 'OsProcessSuffixes1760000038000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      ALTER COLUMN version_suffix TYPE varchar(8)
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS held_for_rework boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS origin_service_order_item_id uuid
    `);
    await queryRunner.query(`
      UPDATE service_orders
      SET version_suffix = CASE UPPER(version_suffix)
        WHEN 'A' THEN '1' WHEN 'B' THEN '2' WHEN 'C' THEN '3' WHEN 'D' THEN '4'
        WHEN 'E' THEN '5' WHEN 'F' THEN '6' WHEN 'G' THEN '7' WHEN 'H' THEN '8'
        WHEN 'I' THEN '9' WHEN 'J' THEN '10' WHEN 'K' THEN '11' WHEN 'L' THEN '12'
        WHEN 'M' THEN '13' WHEN 'N' THEN '14' WHEN 'O' THEN '15' WHEN 'P' THEN '16'
        WHEN 'Q' THEN '17' WHEN 'R' THEN '18' WHEN 'S' THEN '19' WHEN 'T' THEN '20'
        WHEN 'U' THEN '21' WHEN 'V' THEN '22' WHEN 'W' THEN '23' WHEN 'X' THEN '24'
        WHEN 'Y' THEN '25' WHEN 'Z' THEN '26' ELSE version_suffix
      END
      WHERE version_suffix ~ '^[A-Za-z]$'
        AND return_kind IS NULL
    `);
    await queryRunner.query(`
      UPDATE service_orders
      SET order_no = REGEXP_REPLACE(order_no, '-[A-Za-z]$', '-' || version_suffix)
      WHERE version_suffix ~ '^[0-9]+$'
        AND return_kind IS NULL
        AND order_no ~ '-[A-Za-z]$'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_order_items
      DROP COLUMN IF EXISTS origin_service_order_item_id
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      DROP COLUMN IF EXISTS held_for_rework
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ALTER COLUMN version_suffix TYPE varchar(2)
    `);
  }
}
