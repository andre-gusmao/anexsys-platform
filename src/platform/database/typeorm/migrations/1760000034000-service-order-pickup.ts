import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderPickup1760000034000 implements MigrationInterface {
  name = 'ServiceOrderPickup1760000034000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_order_pickups (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        branch_id uuid NOT NULL,
        service_order_id uuid NOT NULL,
        method varchar(20),
        window_opened_at timestamptz,
        window_expires_at timestamptz,
        confirmed_at timestamptz,
        customer_phone varchar(40),
        recipient_name varchar(160),
        accepted_text text,
        client_user_agent text,
        client_ip varchar(80),
        photo_file_name varchar(180),
        photo_mime_type varchar(80),
        photo_base64 text,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz,
        deleted_by uuid
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pickups_order
      ON service_order_pickups (service_order_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pickups_order`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_order_pickups`);
  }
}
