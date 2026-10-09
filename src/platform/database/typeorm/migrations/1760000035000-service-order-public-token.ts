import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderPublicToken1760000035000 implements MigrationInterface {
  name = 'ServiceOrderPublicToken1760000035000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS public_token uuid
    `);
    await queryRunner.query(`
      UPDATE service_orders
      SET public_token = gen_random_uuid()
      WHERE public_token IS NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_service_orders_public_token
      ON service_orders (public_token)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_service_orders_public_token`);
    await queryRunner.query(`ALTER TABLE IF EXISTS service_orders DROP COLUMN IF EXISTS public_token`);
  }
}
