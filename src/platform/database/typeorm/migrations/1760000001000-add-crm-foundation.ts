import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCrmFoundation1760000001000 implements MigrationInterface {
  name = 'AddCrmFoundation1760000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE customers (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NULL REFERENCES branches(id),
        customer_type varchar(20) NOT NULL,
        legal_name text NOT NULL,
        trade_name text NULL,
        cpf_cnpj varchar(20) NULL,
        email text NULL,
        phone varchar(40) NOT NULL,
        birth_date date NULL,
        observations text NULL,
        address_line_1 text NULL,
        address_line_2 text NULL,
        district text NULL,
        city text NULL,
        state varchar(10) NULL,
        postal_code varchar(20) NULL,
        status varchar(30) NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_customers_type CHECK (customer_type IN ('person', 'company')),
        CONSTRAINT chk_customers_status CHECK (status IN ('active', 'inactive', 'blocked'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE customer_contacts (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        customer_id uuid NOT NULL REFERENCES customers(id),
        contact_name text NOT NULL,
        contact_role varchar(100) NULL,
        email text NULL,
        phone varchar(40) NULL,
        is_primary boolean NOT NULL DEFAULT false,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE customer_interactions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        customer_id uuid NOT NULL REFERENCES customers(id),
        service_order_id uuid NULL,
        interaction_type varchar(50) NOT NULL,
        channel varchar(50) NOT NULL,
        occurred_at timestamptz NOT NULL,
        summary text NOT NULL,
        detail text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE measurement_records (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        customer_id uuid NOT NULL REFERENCES customers(id),
        service_order_id uuid NULL,
        measurement_label varchar(120) NOT NULL,
        measurement_data jsonb NOT NULL DEFAULT '{}'::jsonb,
        version_no integer NOT NULL,
        measured_at timestamptz NOT NULL,
        captured_by uuid NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_measurement_records_customer_label_version UNIQUE (customer_id, measurement_label, version_no)
      )
    `);

    await queryRunner.query('CREATE INDEX idx_customers_tenant_status ON customers (tenant_id, status)');
    await queryRunner.query('CREATE INDEX idx_customers_branch_id ON customers (branch_id)');
    await queryRunner.query('CREATE INDEX idx_customer_contacts_customer_id ON customer_contacts (customer_id)');
    await queryRunner.query('CREATE UNIQUE INDEX uq_customer_contacts_primary_active ON customer_contacts (customer_id) WHERE is_primary = true AND is_deleted = false');
    await queryRunner.query('CREATE INDEX idx_customer_interactions_customer_occurred_at ON customer_interactions (customer_id, occurred_at DESC)');
    await queryRunner.query('CREATE INDEX idx_measurement_records_customer_label_version ON measurement_records (customer_id, measurement_label, version_no DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_measurement_records_customer_label_version');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customer_interactions_customer_occurred_at');
    await queryRunner.query('DROP INDEX IF EXISTS uq_customer_contacts_primary_active');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customer_contacts_customer_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customers_branch_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customers_tenant_status');
    await queryRunner.query('DROP TABLE IF EXISTS measurement_records');
    await queryRunner.query('DROP TABLE IF EXISTS customer_interactions');
    await queryRunner.query('DROP TABLE IF EXISTS customer_contacts');
    await queryRunner.query('DROP TABLE IF EXISTS customers');
  }
}
