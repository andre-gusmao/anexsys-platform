import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderQualityStatus1760000029000 implements MigrationInterface {
  name = 'ServiceOrderQualityStatus1760000029000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      DROP CONSTRAINT IF EXISTS chk_service_orders_status
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD CONSTRAINT chk_service_orders_status
      CHECK (status IN ('open', 'approved', 'cancelled', 'quality', 'ready_for_pickup'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      DROP CONSTRAINT IF EXISTS chk_service_orders_status
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD CONSTRAINT chk_service_orders_status
      CHECK (status IN ('open', 'approved', 'cancelled'))
    `);
  }
}
