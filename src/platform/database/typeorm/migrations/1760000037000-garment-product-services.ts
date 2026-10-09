import { MigrationInterface, QueryRunner } from 'typeorm';

export class GarmentProductServices1760000037000 implements MigrationInterface {
  name = 'GarmentProductServices1760000037000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS garment_product_services (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        product_id uuid NOT NULL REFERENCES garment_products(id),
        service_id uuid NOT NULL REFERENCES atelier_services(id),
        suggested_price numeric(18, 2) NOT NULL,
        estimated_minutes integer NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'active',
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_garment_product_services_status CHECK (status IN ('active', 'inactive')),
        CONSTRAINT chk_garment_product_services_minutes CHECK (estimated_minutes >= 1)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_garment_product_services_live_pair
      ON garment_product_services (tenant_id, product_id, service_id)
      WHERE is_deleted = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_garment_product_services_live_pair`);
    await queryRunner.query(`DROP TABLE IF EXISTS garment_product_services`);
  }
}
