import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderApproval1760000036000 implements MigrationInterface {
  name = 'ServiceOrderApproval1760000036000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_order_approvals (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        branch_id uuid NOT NULL,
        service_order_id uuid NOT NULL,
        method varchar(20) NOT NULL,
        confirmed_at timestamptz NOT NULL,
        accepted_text text,
        release_reason text,
        total_value_snapshot numeric(18, 2),
        discount_value_snapshot numeric(18, 2),
        services_snapshot jsonb,
        measurements_snapshot jsonb,
        measurements_locked_at timestamptz,
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
      CREATE INDEX IF NOT EXISTS idx_approvals_order
      ON service_order_approvals (service_order_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_approvals_order`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_order_approvals`);
  }
}
