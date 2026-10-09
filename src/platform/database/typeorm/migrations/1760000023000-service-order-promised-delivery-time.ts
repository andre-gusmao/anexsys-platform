import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderPromisedDeliveryTime1760000023000 implements MigrationInterface {
  name = 'ServiceOrderPromisedDeliveryTime1760000023000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN IF NOT EXISTS promised_delivery_time varchar(5)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_orders DROP COLUMN IF EXISTS promised_delivery_time`);
  }
}
