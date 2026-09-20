import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrExecutionTracking1760000004000 implements MigrationInterface {
  name = 'AddQrExecutionTracking1760000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE qr_codes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        reissue_no integer NOT NULL,
        code_value text NOT NULL,
        issued_at timestamptz NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        revoked_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_qr_codes_production_order_reissue UNIQUE (production_order_id, reissue_no),
        CONSTRAINT uq_qr_codes_tenant_code UNIQUE (tenant_id, code_value),
        CONSTRAINT chk_qr_codes_reissue_no CHECK (reissue_no >= 1),
        CONSTRAINT chk_qr_codes_active_state CHECK (
          (is_active = true AND revoked_at IS NULL)
          OR (is_active = false AND revoked_at IS NOT NULL)
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE qr_events (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        qr_code_id uuid NOT NULL REFERENCES qr_codes(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        operational_resource_id uuid NULL REFERENCES operational_resources(id),
        scan_type varchar(60) NOT NULL,
        scanned_code_value text NOT NULL,
        scanned_at timestamptz NOT NULL,
        scan_result varchar(30) NOT NULL,
        event_payload jsonb NULL,
        recorded_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_qr_events_type CHECK (
          scan_type IN ('start_execution', 'assume_responsibility', 'update_status', 'update_diary')
        ),
        CONSTRAINT chk_qr_events_result CHECK (
          scan_result IN ('accepted', 'rejected')
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE production_execution_events (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        production_order_id uuid NOT NULL REFERENCES production_orders(id),
        production_order_version_id uuid NULL REFERENCES production_order_versions(id),
        operational_resource_id uuid NULL REFERENCES operational_resources(id),
        qr_event_id uuid NULL REFERENCES qr_events(id),
        event_type varchar(60) NOT NULL,
        event_at timestamptz NOT NULL,
        status_before varchar(30) NULL,
        status_after varchar(30) NULL,
        diary_entry text NULL,
        event_payload jsonb NULL,
        recorded_by uuid NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_production_execution_events_type CHECK (
          event_type IN ('execution_start', 'responsibility_assumed', 'status_updated', 'diary_updated')
        ),
        CONSTRAINT chk_production_execution_events_status_before CHECK (
          status_before IS NULL OR status_before IN ('open', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled')
        ),
        CONSTRAINT chk_production_execution_events_status_after CHECK (
          status_after IS NULL OR status_after IN ('open', 'scheduled', 'in_progress', 'paused', 'completed', 'cancelled')
        )
      )
    `);

    await queryRunner.query('CREATE INDEX idx_qr_codes_production_order_active ON qr_codes (production_order_id, issued_at DESC)');
    await queryRunner.query('CREATE UNIQUE INDEX uq_qr_codes_active_order ON qr_codes (production_order_id) WHERE is_active = true');
    await queryRunner.query('CREATE INDEX idx_qr_events_production_order ON qr_events (production_order_id, scanned_at DESC)');
    await queryRunner.query('CREATE INDEX idx_qr_events_branch_scan_type ON qr_events (branch_id, scan_type, scanned_at DESC)');
    await queryRunner.query('CREATE INDEX idx_production_execution_events_order ON production_execution_events (production_order_id, event_at DESC)');
    await queryRunner.query('CREATE INDEX idx_production_execution_events_resource ON production_execution_events (operational_resource_id, event_at DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_execution_events_resource');
    await queryRunner.query('DROP INDEX IF EXISTS idx_production_execution_events_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_qr_events_branch_scan_type');
    await queryRunner.query('DROP INDEX IF EXISTS idx_qr_events_production_order');
    await queryRunner.query('DROP INDEX IF EXISTS uq_qr_codes_active_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_qr_codes_production_order_active');
    await queryRunner.query('DROP TABLE IF EXISTS production_execution_events');
    await queryRunner.query('DROP TABLE IF EXISTS qr_events');
    await queryRunner.query('DROP TABLE IF EXISTS qr_codes');
  }
}
