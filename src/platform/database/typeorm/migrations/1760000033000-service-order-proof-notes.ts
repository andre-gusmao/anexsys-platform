import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceOrderProofNotes1760000033000 implements MigrationInterface {
  name = 'ServiceOrderProofNotes1760000033000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS service_order_proof_notes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        branch_id uuid NOT NULL,
        service_order_id uuid NOT NULL,
        service_order_item_id uuid NOT NULL,
        batch_id uuid NOT NULL,
        note text NOT NULL,
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
      CREATE INDEX IF NOT EXISTS idx_proof_notes_order
      ON service_order_proof_notes (service_order_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_proof_notes_batch
      ON service_order_proof_notes (batch_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_proof_notes_batch`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_proof_notes_order`);
    await queryRunner.query(`DROP TABLE IF EXISTS service_order_proof_notes`);
  }
}
