import { MigrationInterface, QueryRunner } from 'typeorm';

export class StandardizeCustomerMeasurements1760000012000 implements MigrationInterface {
  name = 'StandardizeCustomerMeasurements1760000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION md5_uuid(value text) RETURNS uuid AS $$
        SELECT (
          substr(md5(value), 1, 8) || '-' ||
          substr(md5(value), 9, 4) || '-' ||
          substr(md5(value), 13, 4) || '-' ||
          substr(md5(value), 17, 4) || '-' ||
          substr(md5(value), 21, 12)
        )::uuid
      $$ LANGUAGE SQL IMMUTABLE;
    `);

    await queryRunner.query(`
      ALTER TABLE tenants
      ADD COLUMN default_measurement_unit_code varchar(20) NOT NULL DEFAULT 'CM'
    `);

    await queryRunner.query(`
      CREATE TABLE measurement_body_parts (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(100) NOT NULL,
        display_name text NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_measurement_body_parts_tenant_code UNIQUE (tenant_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE measurement_units (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(20) NOT NULL,
        display_name text NOT NULL,
        sort_order integer NOT NULL DEFAULT 0,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_measurement_units_tenant_code UNIQUE (tenant_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE measurement_sets (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        customer_id uuid NOT NULL REFERENCES customers(id),
        service_order_id uuid NULL,
        measurement_date date NOT NULL,
        notes text NULL,
        captured_by uuid NOT NULL,
        version_no integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_measurement_sets_customer_version UNIQUE (customer_id, version_no)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE measurement_set_items (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        measurement_set_id uuid NOT NULL REFERENCES measurement_sets(id) ON DELETE CASCADE,
        body_part_id uuid NOT NULL REFERENCES measurement_body_parts(id),
        body_part_code varchar(100) NOT NULL,
        body_part_display_name text NOT NULL,
        measurement_unit_id uuid NOT NULL REFERENCES measurement_units(id),
        measurement_unit_code varchar(20) NOT NULL,
        measurement_unit_display_name text NOT NULL,
        measured_value numeric(12, 3) NOT NULL,
        notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_measurement_set_items_unique_body_part UNIQUE (measurement_set_id, body_part_id)
      )
    `);

    await queryRunner.query(`
      WITH default_units(code, sort_order) AS (
        VALUES ('CM', 1), ('MM', 2), ('M', 3), ('POL', 4)
      )
      INSERT INTO measurement_units (
        id, tenant_id, code, display_name, sort_order, is_deleted, deleted_at, deleted_by, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT
        md5_uuid(concat(t.id::text, ':measurement_unit:', default_units.code)),
        t.id,
        default_units.code,
        default_units.code,
        default_units.sort_order,
        false,
        NULL,
        NULL,
        now(),
        t.id,
        now(),
        t.id,
        1
      FROM tenants t
      CROSS JOIN default_units
      ON CONFLICT (tenant_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      WITH default_body_parts(display_name, sort_order) AS (
        VALUES
          ('Busto', 1),
          ('Cintura', 2),
          ('Quadril', 3),
          ('Ombro', 4),
          ('Pescoço', 5),
          ('Manga', 6),
          ('Punho', 7),
          ('Comprimento', 8)
      )
      INSERT INTO measurement_body_parts (
        id, tenant_id, code, display_name, sort_order, is_deleted, deleted_at, deleted_by, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT
        md5_uuid(concat(t.id::text, ':measurement_body_part:', upper(regexp_replace(default_body_parts.display_name, '[^A-Za-z0-9]+', '_', 'g')))),
        t.id,
        upper(regexp_replace(default_body_parts.display_name, '[^A-Za-z0-9]+', '_', 'g')),
        default_body_parts.display_name,
        default_body_parts.sort_order,
        false,
        NULL,
        NULL,
        now(),
        t.id,
        now(),
        t.id,
        1
      FROM tenants t
      CROSS JOIN default_body_parts
      ON CONFLICT (tenant_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      WITH legacy_labels AS (
        SELECT DISTINCT
          tenant_id,
          upper(regexp_replace(trim(measurement_label), '[^A-Za-z0-9]+', '_', 'g')) AS code,
          initcap(trim(measurement_label)) AS display_name
        FROM measurement_records
        WHERE is_deleted = false AND trim(measurement_label) <> ''
      )
      INSERT INTO measurement_body_parts (
        id, tenant_id, code, display_name, sort_order, is_deleted, deleted_at, deleted_by, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT
        md5_uuid(concat(tenant_id::text, ':measurement_body_part:', code)),
        tenant_id,
        code,
        display_name,
        100,
        false,
        NULL,
        NULL,
        now(),
        tenant_id,
        now(),
        tenant_id,
        1
      FROM legacy_labels
      ON CONFLICT (tenant_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      WITH legacy_units AS (
        SELECT DISTINCT
          tenant_id,
          upper(nullif(trim(measurement_data ->> 'unit'), '')) AS code
        FROM measurement_records
        WHERE is_deleted = false AND nullif(trim(measurement_data ->> 'unit'), '') IS NOT NULL
      )
      INSERT INTO measurement_units (
        id, tenant_id, code, display_name, sort_order, is_deleted, deleted_at, deleted_by, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT
        md5_uuid(concat(tenant_id::text, ':measurement_unit:', code)),
        tenant_id,
        code,
        code,
        100,
        false,
        NULL,
        NULL,
        now(),
        tenant_id,
        now(),
        tenant_id,
        1
      FROM legacy_units
      ON CONFLICT (tenant_id, code) DO NOTHING
    `);

    await queryRunner.query(`
      WITH grouped_records AS (
        SELECT
          tenant_id,
          customer_id,
          service_order_id,
          measured_at::date AS measurement_date,
          captured_by,
          created_by,
          updated_by,
          min(created_at) AS created_at,
          max(updated_at) AS updated_at,
          md5(
            concat_ws(
              '|',
              tenant_id::text,
              customer_id::text,
              coalesce(service_order_id::text, ''),
              measured_at::text,
              captured_by::text,
              created_by::text
            )
          ) AS group_hash
        FROM measurement_records
        WHERE is_deleted = false
        GROUP BY tenant_id, customer_id, service_order_id, measured_at::date, measured_at, captured_by, created_by, updated_by
      ),
      ranked_sets AS (
        SELECT
          md5_uuid(concat(group_hash, ':measurement_set')) AS id,
          tenant_id,
          customer_id,
          service_order_id,
          measurement_date,
          captured_by,
          created_by,
          updated_by,
          created_at,
          updated_at,
          row_number() OVER (PARTITION BY customer_id ORDER BY measurement_date ASC, created_at ASC, group_hash ASC) AS version_no,
          group_hash
        FROM grouped_records
      )
      INSERT INTO measurement_sets (
        id, tenant_id, customer_id, service_order_id, measurement_date, notes, captured_by, version_no, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT
        id,
        tenant_id,
        customer_id,
        service_order_id,
        measurement_date,
        NULL,
        captured_by,
        version_no,
        created_at,
        created_by,
        updated_at,
        updated_by,
        1
      FROM ranked_sets
      ON CONFLICT (customer_id, version_no) DO NOTHING
    `);

    await queryRunner.query(`
      WITH grouped_records AS (
        SELECT
          tenant_id,
          customer_id,
          service_order_id,
          measured_at::date AS measurement_date,
          captured_by,
          created_by,
          updated_by,
          min(created_at) AS created_at,
          md5(
            concat_ws(
              '|',
              tenant_id::text,
              customer_id::text,
              coalesce(service_order_id::text, ''),
              measured_at::text,
              captured_by::text,
              created_by::text
            )
          ) AS group_hash
        FROM measurement_records
        WHERE is_deleted = false
        GROUP BY tenant_id, customer_id, service_order_id, measured_at::date, measured_at, captured_by, created_by, updated_by
      ),
      ranked_sets AS (
        SELECT
          md5_uuid(concat(group_hash, ':measurement_set')) AS measurement_set_id,
          tenant_id,
          customer_id,
          service_order_id,
          measurement_date,
          captured_by,
          created_by,
          updated_by,
          group_hash
        FROM grouped_records
      )
      INSERT INTO measurement_set_items (
        id, tenant_id, measurement_set_id, body_part_id, body_part_code, body_part_display_name, measurement_unit_id, measurement_unit_code, measurement_unit_display_name, measured_value, notes, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT
        md5_uuid(concat(mr.id::text, ':measurement_set_item')),
        mr.tenant_id,
        rs.measurement_set_id,
        mbp.id,
        mbp.code,
        mbp.display_name,
        mu.id,
        mu.code,
        mu.display_name,
        COALESCE((mr.measurement_data ->> 'value')::numeric(12,3), 0),
        nullif(trim(mr.measurement_data ->> 'notes'), ''),
        mr.created_at,
        mr.created_by,
        mr.updated_at,
        mr.updated_by,
        1
      FROM measurement_records mr
      INNER JOIN ranked_sets rs
        ON rs.tenant_id = mr.tenant_id
       AND rs.customer_id = mr.customer_id
       AND coalesce(rs.service_order_id::text, '') = coalesce(mr.service_order_id::text, '')
       AND rs.measurement_date = mr.measured_at::date
       AND rs.captured_by = mr.captured_by
       AND rs.created_by = mr.created_by
      INNER JOIN measurement_body_parts mbp
        ON mbp.tenant_id = mr.tenant_id
       AND mbp.code = upper(regexp_replace(trim(mr.measurement_label), '[^A-Za-z0-9]+', '_', 'g'))
      INNER JOIN measurement_units mu
        ON mu.tenant_id = mr.tenant_id
       AND mu.code = upper(coalesce(nullif(trim(mr.measurement_data ->> 'unit'), ''), 'CM'))
      WHERE mr.is_deleted = false
      ON CONFLICT (measurement_set_id, body_part_id) DO NOTHING
    `);

    await queryRunner.query('CREATE INDEX idx_measurement_body_parts_tenant_id ON measurement_body_parts (tenant_id, sort_order, display_name)');
    await queryRunner.query('CREATE INDEX idx_measurement_units_tenant_id ON measurement_units (tenant_id, sort_order, code)');
    await queryRunner.query('CREATE INDEX idx_measurement_sets_customer_id ON measurement_sets (customer_id, version_no DESC)');
    await queryRunner.query('CREATE INDEX idx_measurement_set_items_set_id ON measurement_set_items (measurement_set_id)');
    await queryRunner.query('DROP FUNCTION IF EXISTS md5_uuid(text)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_measurement_set_items_set_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_measurement_sets_customer_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_measurement_units_tenant_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_measurement_body_parts_tenant_id');
    await queryRunner.query('DROP TABLE IF EXISTS measurement_set_items');
    await queryRunner.query('DROP TABLE IF EXISTS measurement_sets');
    await queryRunner.query('DROP TABLE IF EXISTS measurement_units');
    await queryRunner.query('DROP TABLE IF EXISTS measurement_body_parts');
    await queryRunner.query('ALTER TABLE tenants DROP COLUMN default_measurement_unit_code');
    await queryRunner.query('DROP FUNCTION IF EXISTS md5_uuid(text)');
  }
}
