import { MigrationInterface, QueryRunner } from 'typeorm';

export class AtelierCatalogAndOsItemFields1760000024000 implements MigrationInterface {
  name = 'AtelierCatalogAndOsItemFields1760000024000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS garment_products (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(100) NOT NULL,
        display_name text NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        status varchar(30) NOT NULL DEFAULT 'active',
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_garment_products_status CHECK (status IN ('active', 'inactive'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_garment_products_tenant_live_code
      ON garment_products (tenant_id, code)
      WHERE is_deleted = false
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS atelier_services (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(100) NOT NULL,
        display_name text NOT NULL,
        default_price numeric(18, 2) NULL,
        sort_order integer NOT NULL DEFAULT 0,
        status varchar(30) NOT NULL DEFAULT 'active',
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_atelier_services_status CHECK (status IN ('active', 'inactive'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_atelier_services_tenant_live_code
      ON atelier_services (tenant_id, code)
      WHERE is_deleted = false
    `);

    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS product_id uuid NULL
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS service_id uuid NULL
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD COLUMN IF NOT EXISTS complement text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      DROP CONSTRAINT IF EXISTS fk_service_order_items_product
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD CONSTRAINT fk_service_order_items_product
      FOREIGN KEY (product_id) REFERENCES garment_products(id)
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      DROP CONSTRAINT IF EXISTS fk_service_order_items_service
    `);
    await queryRunner.query(`
      ALTER TABLE service_order_items
      ADD CONSTRAINT fk_service_order_items_service
      FOREIGN KEY (service_id) REFERENCES atelier_services(id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE service_order_items DROP CONSTRAINT IF EXISTS fk_service_order_items_service`);
    await queryRunner.query(`ALTER TABLE service_order_items DROP CONSTRAINT IF EXISTS fk_service_order_items_product`);
    await queryRunner.query(`ALTER TABLE service_order_items DROP COLUMN IF EXISTS complement`);
    await queryRunner.query(`ALTER TABLE service_order_items DROP COLUMN IF EXISTS service_id`);
    await queryRunner.query(`ALTER TABLE service_order_items DROP COLUMN IF EXISTS product_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_atelier_services_tenant_live_code`);
    await queryRunner.query(`DROP TABLE IF EXISTS atelier_services`);
    await queryRunner.query(`DROP INDEX IF EXISTS uq_garment_products_tenant_live_code`);
    await queryRunner.query(`DROP TABLE IF EXISTS garment_products`);
  }
}
