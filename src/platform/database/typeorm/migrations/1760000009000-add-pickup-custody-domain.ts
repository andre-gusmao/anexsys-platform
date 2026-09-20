import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPickupCustodyDomain1760000009000 implements MigrationInterface {
  name = 'AddPickupCustodyDomain1760000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE pickup_authorizations (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        authorized_person_name text NOT NULL,
        authorized_person_document varchar(50) NULL,
        authorization_path varchar(30) NOT NULL,
        valid_from timestamptz NOT NULL,
        valid_until timestamptz NOT NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_pickup_authorizations_validity CHECK (valid_until >= valid_from),
        CONSTRAINT chk_pickup_authorizations_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired')),
        CONSTRAINT chk_pickup_authorizations_path CHECK (authorization_path IN ('customer', 'family_member', 'employee', 'courier', 'motorcycle_courier', 'third_party'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE pickup_tokens (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        pickup_authorization_id uuid NOT NULL REFERENCES pickup_authorizations(id),
        token_value text NOT NULL,
        issued_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_pickup_tokens_auth_value UNIQUE (pickup_authorization_id, token_value),
        CONSTRAINT chk_pickup_tokens_validity CHECK (expires_at >= issued_at),
        CONSTRAINT chk_pickup_tokens_used_at CHECK (used_at IS NULL OR used_at >= issued_at),
        CONSTRAINT chk_pickup_tokens_status CHECK (status IN ('active', 'used', 'expired', 'revoked'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE pickup_qr_codes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        pickup_authorization_id uuid NOT NULL REFERENCES pickup_authorizations(id),
        code_value text NOT NULL,
        issued_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_pickup_qr_codes_auth_value UNIQUE (pickup_authorization_id, code_value),
        CONSTRAINT chk_pickup_qr_codes_validity CHECK (expires_at >= issued_at),
        CONSTRAINT chk_pickup_qr_codes_used_at CHECK (used_at IS NULL OR used_at >= issued_at),
        CONSTRAINT chk_pickup_qr_codes_status CHECK (status IN ('active', 'used', 'expired', 'revoked'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE temporary_pickup_codes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        pickup_authorization_id uuid NOT NULL REFERENCES pickup_authorizations(id),
        code_value varchar(50) NOT NULL,
        issued_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_temporary_pickup_codes_auth_value UNIQUE (pickup_authorization_id, code_value),
        CONSTRAINT chk_temporary_pickup_codes_validity CHECK (expires_at >= issued_at),
        CONSTRAINT chk_temporary_pickup_codes_used_at CHECK (used_at IS NULL OR used_at >= issued_at),
        CONSTRAINT chk_temporary_pickup_codes_status CHECK (status IN ('active', 'used', 'expired', 'revoked'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE storage_locations (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        area varchar(50) NULL,
        corridor varchar(50) NULL,
        row_code varchar(50) NULL,
        shelf_code varchar(50) NULL,
        cabinet_code varchar(50) NULL,
        drawer_code varchar(50) NULL,
        display_label text NOT NULL,
        status varchar(30) NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_storage_locations_hierarchy UNIQUE (tenant_id, branch_id, area, corridor, row_code, shelf_code, cabinet_code, drawer_code),
        CONSTRAINT chk_storage_locations_status CHECK (status IN ('active', 'inactive'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE storage_location_assignments (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        storage_location_id uuid NOT NULL REFERENCES storage_locations(id),
        assigned_at timestamptz NOT NULL,
        released_at timestamptz NULL,
        is_current boolean NOT NULL DEFAULT true,
        assignment_reason varchar(50) NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_storage_location_assignments_released_at CHECK (released_at IS NULL OR released_at >= assigned_at),
        CONSTRAINT chk_storage_location_assignments_current CHECK ((is_current = true AND released_at IS NULL) OR (is_current = false AND released_at IS NOT NULL))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE physical_bag_support_contexts (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NOT NULL REFERENCES service_orders(id),
        production_order_id uuid NULL REFERENCES production_orders(id),
        storage_location_assignment_id uuid NULL REFERENCES storage_location_assignments(id),
        bag_label text NULL,
        notes text NULL,
        in_use boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE TABLE custody_events (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        service_order_id uuid NULL REFERENCES service_orders(id),
        production_order_id uuid NULL REFERENCES production_orders(id),
        pickup_authorization_id uuid NULL REFERENCES pickup_authorizations(id),
        operational_resource_id uuid NULL REFERENCES operational_resources(id),
        storage_location_id uuid NULL REFERENCES storage_locations(id),
        event_stage varchar(50) NOT NULL,
        event_at timestamptz NOT NULL,
        actor_id uuid NULL,
        notes text NULL,
        evidence_summary jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_custody_events_lineage CHECK (service_order_id IS NOT NULL OR production_order_id IS NOT NULL OR pickup_authorization_id IS NOT NULL),
        CONSTRAINT chk_custody_events_stage CHECK (event_stage IN ('intake', 'production_start', 'production_transfer', 'quality', 'rework', 'warranty', 'storage', 'delivery', 'pickup', 'return'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE cctv_references (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        custody_event_id uuid NOT NULL REFERENCES custody_events(id),
        source_label text NOT NULL,
        captured_at timestamptz NOT NULL,
        reference_uri text NOT NULL,
        notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE TABLE camera_snapshots (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        custody_event_id uuid NOT NULL REFERENCES custody_events(id),
        captured_at timestamptz NOT NULL,
        reference_uri text NOT NULL,
        notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);
    await queryRunner.query(`
      CREATE TABLE communication_events (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NULL REFERENCES branches(id),
        customer_id uuid NULL REFERENCES customers(id),
        service_order_id uuid NULL REFERENCES service_orders(id),
        channel varchar(30) NOT NULL,
        direction varchar(20) NOT NULL,
        subject text NULL,
        message_summary text NOT NULL,
        sent_at timestamptz NOT NULL,
        delivery_status varchar(30) NOT NULL,
        payload_snapshot jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_communication_events_channel CHECK (channel IN ('system', 'phone', 'whatsapp', 'email')),
        CONSTRAINT chk_communication_events_direction CHECK (direction IN ('outbound', 'inbound')),
        CONSTRAINT chk_communication_events_delivery_status CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE digital_approvals (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NULL REFERENCES branches(id),
        service_order_id uuid NULL REFERENCES service_orders(id),
        production_order_id uuid NULL REFERENCES production_orders(id),
        production_order_version_id uuid NULL REFERENCES production_order_versions(id),
        pickup_authorization_id uuid NULL REFERENCES pickup_authorizations(id),
        approval_type varchar(40) NOT NULL,
        decision varchar(20) NOT NULL,
        decided_at timestamptz NULL,
        decided_by uuid NULL,
        decision_notes text NULL,
        evidence_payload jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_digital_approvals_type CHECK (approval_type IN ('pickup_authorization')),
        CONSTRAINT chk_digital_approvals_decision CHECK (decision IN ('pending', 'approved', 'rejected')),
        CONSTRAINT chk_digital_approvals_target CHECK (
          (CASE WHEN service_order_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN production_order_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN production_order_version_id IS NULL THEN 0 ELSE 1 END) +
          (CASE WHEN pickup_authorization_id IS NULL THEN 0 ELSE 1 END) = 1
        )
      )
    `);

    await queryRunner.query('CREATE INDEX idx_pickup_authorizations_service_order ON pickup_authorizations (service_order_id, valid_from DESC)');
    await queryRunner.query('CREATE INDEX idx_pickup_tokens_authorization ON pickup_tokens (pickup_authorization_id, issued_at DESC)');
    await queryRunner.query('CREATE INDEX idx_pickup_qr_codes_authorization ON pickup_qr_codes (pickup_authorization_id, issued_at DESC)');
    await queryRunner.query('CREATE INDEX idx_temporary_pickup_codes_authorization ON temporary_pickup_codes (pickup_authorization_id, issued_at DESC)');
    await queryRunner.query('CREATE INDEX idx_storage_locations_branch_label ON storage_locations (branch_id, display_label)');
    await queryRunner.query('CREATE UNIQUE INDEX uq_storage_location_assignments_current ON storage_location_assignments (service_order_id) WHERE is_current = true');
    await queryRunner.query('CREATE UNIQUE INDEX uq_bag_support_context_current ON physical_bag_support_contexts (service_order_id) WHERE in_use = true');
    await queryRunner.query('CREATE INDEX idx_custody_events_lineage ON custody_events (service_order_id, production_order_id, pickup_authorization_id, event_at DESC)');
    await queryRunner.query('CREATE INDEX idx_cctv_references_event ON cctv_references (custody_event_id, captured_at)');
    await queryRunner.query('CREATE INDEX idx_camera_snapshots_event ON camera_snapshots (custody_event_id, captured_at)');
    await queryRunner.query('CREATE INDEX idx_communication_events_service_order ON communication_events (service_order_id, sent_at DESC)');
    await queryRunner.query('CREATE INDEX idx_digital_approvals_pickup_authorization ON digital_approvals (pickup_authorization_id, created_at DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_digital_approvals_pickup_authorization');
    await queryRunner.query('DROP INDEX IF EXISTS idx_communication_events_service_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_camera_snapshots_event');
    await queryRunner.query('DROP INDEX IF EXISTS idx_cctv_references_event');
    await queryRunner.query('DROP INDEX IF EXISTS idx_custody_events_lineage');
    await queryRunner.query('DROP INDEX IF EXISTS uq_bag_support_context_current');
    await queryRunner.query('DROP INDEX IF EXISTS uq_storage_location_assignments_current');
    await queryRunner.query('DROP INDEX IF EXISTS idx_storage_locations_branch_label');
    await queryRunner.query('DROP INDEX IF EXISTS idx_temporary_pickup_codes_authorization');
    await queryRunner.query('DROP INDEX IF EXISTS idx_pickup_qr_codes_authorization');
    await queryRunner.query('DROP INDEX IF EXISTS idx_pickup_tokens_authorization');
    await queryRunner.query('DROP INDEX IF EXISTS idx_pickup_authorizations_service_order');
    await queryRunner.query('DROP TABLE IF EXISTS digital_approvals');
    await queryRunner.query('DROP TABLE IF EXISTS communication_events');
    await queryRunner.query('DROP TABLE IF EXISTS camera_snapshots');
    await queryRunner.query('DROP TABLE IF EXISTS cctv_references');
    await queryRunner.query('DROP TABLE IF EXISTS custody_events');
    await queryRunner.query('DROP TABLE IF EXISTS physical_bag_support_contexts');
    await queryRunner.query('DROP TABLE IF EXISTS storage_location_assignments');
    await queryRunner.query('DROP TABLE IF EXISTS storage_locations');
    await queryRunner.query('DROP TABLE IF EXISTS temporary_pickup_codes');
    await queryRunner.query('DROP TABLE IF EXISTS pickup_qr_codes');
    await queryRunner.query('DROP TABLE IF EXISTS pickup_tokens');
    await queryRunner.query('DROP TABLE IF EXISTS pickup_authorizations');
  }
}
