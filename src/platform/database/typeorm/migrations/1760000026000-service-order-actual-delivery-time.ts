import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderActualDeliveryTime1760000026000 implements MigrationInterface {
  name = 'ServiceOrderActualDeliveryTime1760000026000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN IF NOT EXISTS actual_delivery_time varchar(5)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_orders DROP COLUMN IF EXISTS actual_delivery_time`);
  }
}
