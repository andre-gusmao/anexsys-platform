import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceOrderFoundation1760000002000 implements MigrationInterface {
  name = 'AddServiceOrderFoundation1760000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE business_calendar_days (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NULL REFERENCES branches(id),
        scope_type varchar(20) NOT NULL,
        calendar_date date NOT NULL,
        is_working_day boolean NOT NULL,
        description text NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_business_calendar_days_scope CHECK (scope_type IN ('tenant', 'branch', 'holiday'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE service_orders (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        customer_id uuid NOT NULL REFERENCES customers(id),
        workflow_definition_id uuid NULL,
        current_status_definition_id uuid NULL,
        order_no varchar(50) NOT NULL,
        opened_at timestamptz NOT NULL,
        delivery_commitment_source_at timestamptz NOT NULL,
        promised_delivery_date date NOT NULL,
        delivery_type varchar(20) NOT NULL,
        operational_priority varchar(50) NULL,
        commercial_responsible_actor_id uuid NOT NULL REFERENCES user_identities(id),
        technical_measurement_responsible_actor_id uuid NOT NULL REFERENCES user_identities(id),
        delivery_surcharge_method varchar(20) NULL,
        delivery_surcharge_value numeric(18,2) NULL,
        commercial_notes text NULL,
        customer_notes text NULL,
        status varchar(30) NOT NULL,
        total_value numeric(18,2) NULL,
        discount_value numeric(18,2) NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_service_orders_tenant_order_no UNIQUE (tenant_id, order_no),
        CONSTRAINT chk_service_orders_delivery_type CHECK (delivery_type IN ('Standard', 'Priority', 'Express')),
        CONSTRAINT chk_service_orders_status CHECK (status IN ('open', 'approved', 'cancelled')),
        CONSTRAINT chk_service_orders_surcharge_method CHECK (delivery_surcharge_method IS NULL OR delivery_surcharge_method IN ('fixed', 'percentage'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE service_order_items (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        item_no integer NOT NULL,
        item_type varchar(50) NOT NULL,
        description text NOT NULL,
        quantity numeric(18,4) NOT NULL,
        unit_price numeric(18,2) NULL,
        discount_value numeric(18,2) NULL,
        delivery_type varchar(20) NULL,
        operational_priority varchar(50) NULL,
        status varchar(30) NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_service_order_items_order_item_no UNIQUE (service_order_id, item_no),
        CONSTRAINT chk_service_order_items_quantity CHECK (quantity > 0),
        CONSTRAINT chk_service_order_items_status CHECK (status IN ('open', 'cancelled')),
        CONSTRAINT chk_service_order_items_delivery_type CHECK (delivery_type IS NULL OR delivery_type IN ('Standard', 'Priority', 'Express'))
      )
    `);

    await queryRunner.query('CREATE INDEX idx_business_calendar_days_scope_date ON business_calendar_days (tenant_id, scope_type, calendar_date)');
    await queryRunner.query('CREATE INDEX idx_business_calendar_days_branch_date ON business_calendar_days (branch_id, calendar_date)');
    await queryRunner.query('CREATE INDEX idx_service_orders_branch_status ON service_orders (branch_id, status)');
    await queryRunner.query('CREATE INDEX idx_service_orders_customer_id ON service_orders (customer_id)');
    await queryRunner.query('CREATE INDEX idx_service_order_items_order_id ON service_order_items (service_order_id, item_no)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_service_order_items_order_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_service_orders_customer_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_service_orders_branch_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_business_calendar_days_branch_date');
    await queryRunner.query('DROP INDEX IF EXISTS idx_business_calendar_days_scope_date');
    await queryRunner.query('DROP TABLE IF EXISTS service_order_items');
    await queryRunner.query('DROP TABLE IF EXISTS service_orders');
    await queryRunner.query('DROP TABLE IF EXISTS business_calendar_days');
  }
}
