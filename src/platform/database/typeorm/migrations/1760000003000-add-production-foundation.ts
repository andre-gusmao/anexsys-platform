import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductionFoundation1760000003000 implements MigrationInterface {
  name = 'AddProductionFoundation1760000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE operational_resources (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        home_branch_id uuid NULL REFERENCES branches(id),
        resource_type varchar(30) NOT NULL,
        display_name text NOT NULL,
        document_no varchar(50) NULL,
        phone varchar(40) NULL,
        email text NULL,
        skill_profile jsonb NULL,
        qualification_notes text NULL,
        availability_status varchar(30) NOT NULL DEFAULT 'available',
        available_from date NULL,
        available_until date NULL,
        availability_notes text NULL,
        status varchar(30) NOT NULL DEFAULT 'active',
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_operational_resources_type CHECK (resource_type IN ('employee', 'daily_worker', 'contractor')),
        CONSTRAINT chk_operational_resources_status CHECK (status IN ('active', 'inactive')),
        CONSTRAINT chk_operational_resources_availability CHECK (availability_status IN ('available', 'unavailable')),
        CONSTRAINT chk_operational_resources_availability_dates CHECK (available_until IS NULL OR available_from IS NULL OR available_until >= available_from)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE operational_resource_branch_scopes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        operational_resource_id uuid NOT NULL REFERENCES operational_resources(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        valid_from date NOT NULL,
        valid_to date NULL,
        scope_role varchar(50) NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_operational_resource_branch_scope UNIQUE (operational_resource_id, branch_id, valid_from),
        CONSTRAINT chk_operational_resource_branch_scope_dates CHECK (valid_to IS NULL OR valid_to >= valid_from)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE production_orders (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        workflow_definition_id uuid NULL,
        current_status_definition_id uuid NULL,
        production_no varchar(50) NOT NULL,
        production_type varchar(50) NOT NULL,
        delivery_type varchar(20) NOT NULL,
        operational_priority varchar(30) NULL,
        customer_delivery_target_date date NOT NULL,
        internal_production_deadline date NULL,
        internal_quality_deadline date NULL,
        planned_quantity numeric(18,4) NULL,
        produced_quantity numeric(18,4) NULL,
        scheduled_start_at timestamptz NULL,
        scheduled_end_at timestamptz NULL,
        instructions text NULL,
        piece_description text NOT NULL,
        measurements_snapshot jsonb NULL,
        observations text NULL,
        status varchar(30) NOT NULL DEFAULT 'open',
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_production_orders_tenant_production_no UNIQUE (tenant_id, production_no),
        CONSTRAINT uq_production_orders_service_order UNIQUE (service_order_id),
        CONSTRAINT chk_production_orders_delivery_type CHECK (delivery_type IN ('Standard', 'Priority', 'Express')),
        CONSTRAINT chk_production_orders_status CHECK (status IN ('open', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE production_order_item_links (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        service_order_item_id uuid NOT NULL REFERENCES service_order_items(id),
        is_primary_scope boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_production_order_item_links UNIQUE (production_order_id, service_order_item_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE production_order_versions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        version_no integer NOT NULL,
        version_reason varchar(50) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        is_draft boolean NOT NULL DEFAULT false,
        production_type varchar(50) NULL,
        delivery_type varchar(20) NULL,
        operational_priority varchar(30) NULL,
        change_summary text NOT NULL,
        planned_quantity numeric(18,4) NULL,
        scheduled_start_at timestamptz NULL,
        scheduled_end_at timestamptz NULL,
        instructions text NULL,
        piece_description text NULL,
        measurements_snapshot jsonb NULL,
        observations text NULL,
        resource_change_notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_production_order_versions UNIQUE (production_order_id, version_no),
        CONSTRAINT chk_production_order_versions_no CHECK (version_no >= 2),
        CONSTRAINT chk_production_order_versions_reason CHECK (version_reason IN ('rework', 'warranty_execution', 'corrective_production')),
        CONSTRAINT chk_production_order_versions_delivery_type CHECK (delivery_type IS NULL OR delivery_type IN ('Standard', 'Priority', 'Express'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE production_order_operational_assignments (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        operational_resource_id uuid NOT NULL REFERENCES operational_resources(id),
        assignment_role varchar(50) NOT NULL,
        assigned_at timestamptz NOT NULL,
        released_at timestamptz NULL,
        is_current boolean NOT NULL DEFAULT true,
        is_primary_responsible boolean NOT NULL DEFAULT false,
        assignment_notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_production_order_assignment_role CHECK (assignment_role IN ('primary', 'participant')),
        CONSTRAINT chk_production_order_assignment_release CHECK (released_at IS NULL OR released_at >= assigned_at)
      )
    `);

    await queryRunner.query('CREATE INDEX idx_operational_resources_home_branch ON operational_resources (tenant_id, home_branch_id)');
    await queryRunner.query('CREATE INDEX idx_operational_resource_branch_scopes_branch ON operational_resource_branch_scopes (branch_id, valid_from)');
    await queryRunner.query('CREATE INDEX idx_production_orders_branch_status ON production_orders (branch_id, status)');
    await queryRunner.query('CREATE INDEX idx_production_orders_service_order ON production_orders (service_order_id)');
    await queryRunner.query('CREATE INDEX idx_production_order_item_links_order ON production_order_item_links (production_order_id)');
    await queryRunner.query('CREATE INDEX idx_production_order_versions_order ON production_order_versions (production_order_id, version_no)');
    await queryRunner.query('CREATE INDEX idx_production_order_assignments_order ON production_order_operational_assignments (production_order_id, assigned_at)');
    await queryRunner.query('CREATE INDEX idx_production_order_assignments_resource ON production_order_operational_assignments (operational_resource_id, assigned_at)');
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_production_order_primary_current_assignment
      ON production_order_operational_assignments (production_order_id)
      WHERE is_current = true AND is_primary_responsible = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS uq_production_order_primary_current_assignment');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_order_assignments_resource');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_order_assignments_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_order_versions_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_order_item_links_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_orders_service_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_orders_branch_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_operational_resource_branch_scopes_branch');
    await queryRunner.query('DROP INDEX IF EXISTS idx_operational_resources_home_branch');
    await queryRunner.query('DROP TABLE IF EXISTS production_order_operational_assignments');
    await queryRunner.query('DROP TABLE IF EXISTS production_order_versions');
    await queryRunner.query('DROP TABLE IF EXISTS production_order_item_links');
    await queryRunner.query('DROP TABLE IF EXISTS production_orders');
    await queryRunner.query('DROP TABLE IF EXISTS operational_resource_branch_scopes');
    await queryRunner.query('DROP TABLE IF EXISTS operational_resources');
  }
}
