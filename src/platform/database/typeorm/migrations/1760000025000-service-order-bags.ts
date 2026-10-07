import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderBags1760000025000 implements MigrationInterface {
  name = 'ServiceOrderBags1760000025000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS max_pieces_per_bag integer NOT NULL DEFAULT 5
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN IF NOT EXISTS group_id uuid
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN IF NOT EXISTS group_seq integer
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN IF NOT EXISTS version_suffix varchar(2)
    `);
    await queryRunner.query(`
      UPDATE service_orders
      SET group_id = id
      WHERE group_id IS NULL
    `);
    await queryRunner.query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS seq
        FROM service_orders
      )
      UPDATE service_orders AS orders
      SET group_seq = numbered.seq
      FROM numbered
      WHERE orders.id = numbered.id
        AND orders.group_seq IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_orders DROP COLUMN IF EXISTS version_suffix`);
    await queryRunner.query(`ALTER TABLE service_orders DROP COLUMN IF EXISTS group_seq`);
    await queryRunner.query(`ALTER TABLE service_orders DROP COLUMN IF EXISTS group_id`);
    await queryRunner.query(`ALTER TABLE tenants DROP COLUMN IF EXISTS max_pieces_per_bag`);
  }
}
