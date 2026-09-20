import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerExperienceDomain1760000010000 implements MigrationInterface {
  name = 'AddCustomerExperienceDomain1760000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE digital_approvals
      ADD COLUMN request_channel varchar(30) NULL,
      ADD COLUMN approval_link_token varchar(120) NULL,
      ADD COLUMN requested_at timestamptz NULL
    `);
    await queryRunner.query(`
      ALTER TABLE digital_approvals
      DROP CONSTRAINT chk_digital_approvals_type
    `);
    await queryRunner.query(`
      ALTER TABLE digital_approvals
      ADD CONSTRAINT chk_digital_approvals_type CHECK (approval_type IN ('pickup_authorization', 'service_order_approval'))
    `);
    await queryRunner.query(`
      ALTER TABLE digital_approvals
      ADD CONSTRAINT chk_digital_approvals_request_channel CHECK (request_channel IS NULL OR request_channel IN ('system', 'phone', 'whatsapp', 'email', 'portal'))
    `);
    await queryRunner.query(`
      ALTER TABLE communication_events
      DROP CONSTRAINT chk_communication_events_channel
    `);
    await queryRunner.query(`
      ALTER TABLE communication_events
      ADD CONSTRAINT chk_communication_events_channel CHECK (channel IN ('system', 'phone', 'whatsapp', 'email', 'portal'))
    `);
    await queryRunner.query(`
      ALTER TABLE pickup_authorizations
      DROP CONSTRAINT chk_pickup_authorizations_status
    `);
    await queryRunner.query(`
      ALTER TABLE pickup_authorizations
      ADD CONSTRAINT chk_pickup_authorizations_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired', 'cancelled'))
    `);
    await queryRunner.query(`
      CREATE TABLE customer_portal_profiles (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        customer_id uuid NOT NULL REFERENCES customers(id),
        user_id uuid NOT NULL REFERENCES user_identities(id),
        customer_code varchar(50) NULL,
        vip_flag boolean NOT NULL DEFAULT false,
        preferred_channel varchar(30) NULL,
        last_login_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_customer_portal_profiles_user UNIQUE (tenant_id, user_id),
        CONSTRAINT uq_customer_portal_profiles_customer UNIQUE (tenant_id, customer_id),
        CONSTRAINT uq_customer_portal_profiles_customer_code UNIQUE (tenant_id, customer_code),
        CONSTRAINT chk_customer_portal_profiles_channel CHECK (preferred_channel IS NULL OR preferred_channel IN ('system', 'phone', 'whatsapp', 'email', 'portal'))
      )
    `);
    await queryRunner.query(`
      CREATE TABLE status_visibility_mappings (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        internal_name varchar(100) NOT NULL,
        external_name varchar(100) NOT NULL,
        customer_visibility boolean NOT NULL DEFAULT true,
        operational_visibility boolean NOT NULL DEFAULT true,
        management_visibility boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_status_visibility_mappings_internal UNIQUE (tenant_id, internal_name)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE smart_concierge_check_ins (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        customer_id uuid NULL REFERENCES customers(id),
        service_order_id uuid NULL REFERENCES service_orders(id),
        pickup_authorization_id uuid NULL REFERENCES pickup_authorizations(id),
        attendant_user_id uuid NULL REFERENCES user_identities(id),
        identification_method varchar(40) NOT NULL,
        identification_value varchar(160) NULL,
        status varchar(30) NOT NULL,
        called_at timestamptz NULL,
        service_started_at timestamptz NULL,
        service_completed_at timestamptz NULL,
        notes text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_smart_concierge_identification_method CHECK (identification_method IN ('name', 'phone', 'whatsapp', 'cpf', 'customer_code', 'qr_code', 'facial_recognition')),
        CONSTRAINT chk_smart_concierge_status CHECK (status IN ('waiting', 'called', 'in_service', 'no_show', 'completed')),
        CONSTRAINT chk_smart_concierge_lineage CHECK (customer_id IS NOT NULL OR service_order_id IS NOT NULL OR pickup_authorization_id IS NOT NULL)
      )
    `);

    await queryRunner.query('CREATE UNIQUE INDEX uq_digital_approvals_link_token ON digital_approvals (approval_link_token) WHERE approval_link_token IS NOT NULL');
    await queryRunner.query('CREATE INDEX idx_digital_approvals_service_order ON digital_approvals (service_order_id, requested_at DESC, created_at DESC)');
    await queryRunner.query('CREATE INDEX idx_customer_portal_profiles_user ON customer_portal_profiles (tenant_id, user_id)');
    await queryRunner.query('CREATE INDEX idx_customer_portal_profiles_customer_code ON customer_portal_profiles (tenant_id, customer_code)');
    await queryRunner.query('CREATE INDEX idx_smart_concierge_branch_status ON smart_concierge_check_ins (branch_id, status, created_at DESC)');
    await queryRunner.query('CREATE INDEX idx_smart_concierge_service_order ON smart_concierge_check_ins (service_order_id, created_at DESC)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_smart_concierge_service_order');
    await queryRunner.query('DROP INDEX IF EXISTS idx_smart_concierge_branch_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customer_portal_profiles_customer_code');
    await queryRunner.query('DROP INDEX IF EXISTS idx_customer_portal_profiles_user');
    await queryRunner.query('DROP INDEX IF EXISTS idx_digital_approvals_service_order');
    await queryRunner.query('DROP INDEX IF EXISTS uq_digital_approvals_link_token');
    await queryRunner.query('DROP TABLE IF EXISTS smart_concierge_check_ins');
    await queryRunner.query('DROP TABLE IF EXISTS status_visibility_mappings');
    await queryRunner.query('DROP TABLE IF EXISTS customer_portal_profiles');
    await queryRunner.query('ALTER TABLE pickup_authorizations DROP CONSTRAINT chk_pickup_authorizations_status');
    await queryRunner.query("ALTER TABLE pickup_authorizations ADD CONSTRAINT chk_pickup_authorizations_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'expired'))");
    await queryRunner.query('ALTER TABLE communication_events DROP CONSTRAINT chk_communication_events_channel');
    await queryRunner.query("ALTER TABLE communication_events ADD CONSTRAINT chk_communication_events_channel CHECK (channel IN ('system', 'phone', 'whatsapp', 'email'))");
    await queryRunner.query('ALTER TABLE digital_approvals DROP CONSTRAINT chk_digital_approvals_request_channel');
    await queryRunner.query('ALTER TABLE digital_approvals DROP CONSTRAINT chk_digital_approvals_type');
    await queryRunner.query("ALTER TABLE digital_approvals ADD CONSTRAINT chk_digital_approvals_type CHECK (approval_type IN ('pickup_authorization'))");
    await queryRunner.query('ALTER TABLE digital_approvals DROP COLUMN requested_at');
    await queryRunner.query('ALTER TABLE digital_approvals DROP COLUMN approval_link_token');
    await queryRunner.query('ALTER TABLE digital_approvals DROP COLUMN request_channel');
  }
}
