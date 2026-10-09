import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderBagClosed1760000027000 implements MigrationInterface {
  name = 'ServiceOrderBagClosed1760000027000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD COLUMN IF NOT EXISTS bag_closed boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_orders DROP COLUMN IF EXISTS bag_closed`);
  }
}
