import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSprint1Foundation1760000000000 implements MigrationInterface {
  name = 'InitialSprint1Foundation1760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE tenants (
        id uuid PRIMARY KEY,
        code varchar(50) NOT NULL UNIQUE,
        legal_name text NOT NULL,
        display_name text NOT NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_tenants_status CHECK (status IN ('active', 'inactive'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE branches (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(50) NOT NULL,
        legal_name text NOT NULL,
        display_name text NOT NULL,
        status varchar(30) NOT NULL,
        parent_branch_id uuid NULL REFERENCES branches(id),
        business_calendar_name text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_branches_tenant_code UNIQUE (tenant_id, code),
        CONSTRAINT chk_branches_status CHECK (status IN ('active', 'inactive'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_identities (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        default_branch_id uuid NULL REFERENCES branches(id),
        email text NOT NULL,
        display_name text NOT NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_user_identities_tenant_email UNIQUE (tenant_id, email),
        CONSTRAINT chk_user_identities_status CHECK (status IN ('active', 'invited', 'inactive'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_credentials (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        user_id uuid NOT NULL UNIQUE REFERENCES user_identities(id),
        password_hash text NOT NULL,
        password_algorithm varchar(50) NOT NULL,
        password_updated_at timestamptz NOT NULL,
        must_rotate_password boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        user_id uuid NOT NULL REFERENCES user_identities(id),
        refresh_token_hash text NOT NULL,
        status varchar(30) NOT NULL,
        issued_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        last_used_at timestamptz NULL,
        revoked_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT chk_user_sessions_status CHECK (status IN ('active', 'revoked', 'expired'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE roles (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(100) NOT NULL,
        display_name text NOT NULL,
        description text NULL,
        status varchar(30) NOT NULL,
        is_system_managed boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, code),
        CONSTRAINT chk_roles_status CHECK (status IN ('active', 'inactive'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE permissions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(150) NOT NULL,
        display_name text NOT NULL,
        description text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_permissions_tenant_code UNIQUE (tenant_id, code)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE role_permissions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        role_id uuid NOT NULL REFERENCES roles(id),
        permission_id uuid NOT NULL REFERENCES permissions(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_role_assignments (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        user_id uuid NOT NULL REFERENCES user_identities(id),
        role_id uuid NOT NULL REFERENCES roles(id),
        assigned_branch_id uuid NULL REFERENCES branches(id),
        assigned_at timestamptz NOT NULL,
        revoked_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_branch_scopes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        user_id uuid NOT NULL REFERENCES user_identities(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        scope_type varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_user_branch_scopes_user_branch_scope_type UNIQUE (user_id, branch_id, scope_type),
        CONSTRAINT chk_user_branch_scopes_scope_type CHECK (scope_type IN ('member', 'manager', 'admin'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_events (
        id uuid PRIMARY KEY,
        tenant_id uuid NULL REFERENCES tenants(id),
        branch_id uuid NULL REFERENCES branches(id),
        actor_user_id uuid NULL,
        entity_type varchar(100) NOT NULL,
        entity_id uuid NULL,
        action varchar(100) NOT NULL,
        event_type varchar(100) NOT NULL,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        occurred_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query('CREATE INDEX idx_branches_tenant_id ON branches (tenant_id)');
    await queryRunner.query('CREATE INDEX idx_user_identities_tenant_id ON user_identities (tenant_id)');
    await queryRunner.query('CREATE INDEX idx_user_sessions_user_id_status ON user_sessions (user_id, status)');
    await queryRunner.query('CREATE INDEX idx_roles_tenant_id ON roles (tenant_id)');
    await queryRunner.query('CREATE INDEX idx_permissions_tenant_id ON permissions (tenant_id)');
    await queryRunner.query('CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id)');
    await queryRunner.query('CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments (user_id)');
    await queryRunner.query(`CREATE UNIQUE INDEX uq_user_role_assignments_active_role_branch ON user_role_assignments (tenant_id, user_id, role_id, COALESCE(assigned_branch_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE revoked_at IS NULL`);
    await queryRunner.query('CREATE INDEX idx_user_branch_scopes_user_id ON user_branch_scopes (user_id)');
    await queryRunner.query('CREATE INDEX idx_audit_events_tenant_branch ON audit_events (tenant_id, branch_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_audit_events_tenant_branch');
    await queryRunner.query('DROP INDEX IF EXISTS idx_user_branch_scopes_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS uq_user_role_assignments_active_role_branch');
    await queryRunner.query('DROP INDEX IF EXISTS idx_user_role_assignments_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_role_permissions_role_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_permissions_tenant_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_roles_tenant_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_user_sessions_user_id_status');
    await queryRunner.query('DROP INDEX IF EXISTS idx_user_identities_tenant_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_branches_tenant_id');
    await queryRunner.query('DROP TABLE IF EXISTS audit_events');
    await queryRunner.query('DROP TABLE IF EXISTS user_branch_scopes');
    await queryRunner.query('DROP TABLE IF EXISTS user_role_assignments');
    await queryRunner.query('DROP TABLE IF EXISTS role_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS permissions');
    await queryRunner.query('DROP TABLE IF EXISTS roles');
    await queryRunner.query('DROP TABLE IF EXISTS user_sessions');
    await queryRunner.query('DROP TABLE IF EXISTS user_credentials');
    await queryRunner.query('DROP TABLE IF EXISTS user_identities');
    await queryRunner.query('DROP TABLE IF EXISTS branches');
    await queryRunner.query('DROP TABLE IF EXISTS tenants');
  }
}
