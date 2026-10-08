import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderProof1760000032000 implements MigrationInterface {
  name = 'ServiceOrderProof1760000032000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE service_orders
      DROP CONSTRAINT IF EXISTS chk_service_orders_status
    `);
    await queryRunner.query(`
      ALTER TABLE service_orders
      ADD CONSTRAINT chk_service_orders_status
      CHECK (status IN (
        'open',
        'approved',
        'cancelled',
        'in_production',
        'awaiting_proof',
        'awaiting_quality',
        'quality',
        'in_rework',
        'ready_for_pickup',
        'picked_up'
      ))
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
      CHECK (status IN (
        'open',
        'approved',
        'cancelled',
        'in_production',
        'awaiting_quality',
        'quality',
        'in_rework',
        'ready_for_pickup',
        'picked_up'
      ))
    `);
  }
}
