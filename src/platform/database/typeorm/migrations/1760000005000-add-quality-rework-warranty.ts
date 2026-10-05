import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQualityReworkWarranty1760000005000 implements MigrationInterface {
  name = 'AddQualityReworkWarranty1760000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE production_order_versions
      ADD COLUMN affected_service_order_item_ids jsonb NULL
    `);

    await queryRunner.query(`
      CREATE TABLE quality_records (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        service_order_item_id uuid NULL REFERENCES service_order_items(id),
        workflow_definition_id uuid NULL,
        current_status_definition_id uuid NULL,
        quality_responsible_actor_id uuid NULL,
        inspection_type varchar(50) NOT NULL,
        inspection_result varchar(30) NOT NULL,
        inspection_at timestamptz NOT NULL,
        release_decision varchar(40) NOT NULL,
        defects jsonb NULL,
        notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_quality_records_inspection_type CHECK (inspection_type IN ('input_validation', 'in_process', 'final', 'post_rework', 'post_warranty', 'customer_rejection')),
        CONSTRAINT chk_quality_records_inspection_result CHECK (inspection_result IN ('pending', 'passed', 'failed')),
        CONSTRAINT chk_quality_records_release_decision CHECK (release_decision IN ('pending', 'approved', 'rejected', 'rework_requested', 'warranty_execution_requested'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE customer_rejections (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        service_order_item_id uuid NOT NULL REFERENCES service_order_items(id),
        quality_record_id uuid NULL REFERENCES quality_records(id),
        reported_quantity numeric(18,4) NULL,
        rejection_reason text NOT NULL,
        severity varchar(30) NULL,
        resolution_type varchar(40) NULL,
        notes text NULL,
        reported_at timestamptz NOT NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_customer_rejections_severity CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high', 'critical')),
        CONSTRAINT chk_customer_rejections_resolution CHECK (resolution_type IS NULL OR resolution_type IN ('rework', 'warranty_adjustment', 'warranty_execution', 'refund', 'replacement')),
        CONSTRAINT chk_customer_rejections_status CHECK (status IN ('open', 'under_review', 'resolved'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE rework_cases (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        production_order_version_id uuid NULL REFERENCES production_order_versions(id),
        service_order_item_ids jsonb NULL,
        quality_record_id uuid NULL REFERENCES quality_records(id),
        customer_rejection_id uuid NULL REFERENCES customer_rejections(id),
        original_operational_resource_id uuid NULL REFERENCES operational_resources(id),
        corrective_operational_resource_id uuid NULL REFERENCES operational_resources(id),
        rework_reason text NOT NULL,
        assignment_notes text NULL,
        closed_at timestamptz NULL,
        opened_at timestamptz NOT NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_rework_cases_status CHECK (status IN ('open', 'assigned', 'in_progress', 'closed'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE warranty_adjustments (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        service_order_item_id uuid NULL REFERENCES service_order_items(id),
        customer_rejection_id uuid NULL REFERENCES customer_rejections(id),
        adjustment_reason text NOT NULL,
        actual_delivery_date date NOT NULL,
        warranty_period_days integer NOT NULL DEFAULT 7,
        opened_at timestamptz NOT NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_warranty_adjustments_period CHECK (warranty_period_days >= 1),
        CONSTRAINT chk_warranty_adjustments_status CHECK (status IN ('open', 'approved', 'in_progress', 'resolved'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE warranty_executions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        production_order_version_id uuid NULL REFERENCES production_order_versions(id),
        service_order_item_ids jsonb NULL,
        customer_rejection_id uuid NULL REFERENCES customer_rejections(id),
        quality_record_id uuid NULL REFERENCES quality_records(id),
        original_operational_resource_id uuid NULL REFERENCES operational_resources(id),
        corrective_operational_resource_id uuid NULL REFERENCES operational_resources(id),
        execution_reason text NOT NULL,
        actual_delivery_date date NOT NULL,
        warranty_period_days integer NOT NULL DEFAULT 7,
        opened_at timestamptz NOT NULL,
        resolved_at timestamptz NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_warranty_executions_period CHECK (warranty_period_days >= 1),
        CONSTRAINT chk_warranty_executions_status CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved'))
      )
    `);

    await queryRunner.query('CREATE INDEX idx_quality_records_order ON quality_records (production_order_id, inspection_at DESC)');
    await queryRunner.query('CREATE INDEX idx_customer_rejections_order ON customer_rejections (service_order_id, reported_at DESC)');
    await queryRunner.query('CREATE INDEX idx_rework_cases_order ON rework_cases (production_order_id, opened_at DESC)');
    await queryRunner.query('CREATE INDEX idx_warranty_adjustments_order ON warranty_adjustments (service_order_id, opened_at DESC)');
    await queryRunner.query('CREATE INDEX idx_warranty_executions_order ON warranty_executions (production_order_id, opened_at DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_warranty_executions_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_warranty_adjustments_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_rework_cases_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customer_rejections_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_quality_records_order');
    await queryRunner.query('DROP TABLE IF EXISTS warranty_executions');
    await queryRunner.query('DROP TABLE IF EXISTS warranty_adjustments');
    await queryRunner.query('DROP TABLE IF EXISTS rework_cases');
    await queryRunner.query('DROP TABLE IF EXISTS customer_rejections');
    await queryRunner.query('DROP TABLE IF EXISTS quality_records');
    await queryRunner.query('ALTER TABLE production_order_versions DROP COLUMN IF EXISTS affected_service_order_item_ids');
  }
}
