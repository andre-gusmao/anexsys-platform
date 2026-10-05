import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaasIdentityContext1760000011000 implements MigrationInterface {
  name = 'AddSaasIdentityContext1760000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_sessions
      ADD COLUMN context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN login_email text NULL
    `);

    await queryRunner.query(`
      CREATE TABLE first_access_tokens (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        user_id uuid NOT NULL REFERENCES user_identities(id),
        token_hash text NOT NULL,
        delivery_channel varchar(30) NULL,
        issued_at timestamptz NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz NULL,
        revoked_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_context_preferences (
        normalized_email text PRIMARY KEY,
        last_tenant_id uuid NULL REFERENCES tenants(id),
        last_branch_id uuid NULL REFERENCES branches(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1
      )
    `);

    await queryRunner.query(`
      CREATE TABLE communities (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(100) NOT NULL,
        display_name text NOT NULL,
        description text NULL,
        status varchar(30) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_communities_tenant_code UNIQUE (tenant_id, code),
        CONSTRAINT chk_communities_status CHECK (status IN ('active', 'inactive'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE community_permissions (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        community_id uuid NOT NULL REFERENCES communities(id),
        permission_id uuid NOT NULL REFERENCES permissions(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_community_permissions UNIQUE (community_id, permission_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_communities (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        user_id uuid NOT NULL REFERENCES user_identities(id),
        community_id uuid NOT NULL REFERENCES communities(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_user_communities UNIQUE (user_id, community_id)
      )
    `);

    await queryRunner.query('CREATE UNIQUE INDEX uq_first_access_tokens_hash ON first_access_tokens (token_hash)');
    await queryRunner.query('CREATE INDEX idx_first_access_tokens_user_id ON first_access_tokens (user_id, expires_at DESC)');
    await queryRunner.query('CREATE INDEX idx_user_sessions_login_email ON user_sessions (login_email)');
    await queryRunner.query('CREATE INDEX idx_communities_tenant_id ON communities (tenant_id)');
    await queryRunner.query('CREATE INDEX idx_community_permissions_community_id ON community_permissions (community_id)');
    await queryRunner.query('CREATE INDEX idx_user_communities_user_id ON user_communities (user_id)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_user_communities_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_community_permissions_community_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_communities_tenant_id');
    await queryRunner.query('DROP INDEX IF EXISTS idx_user_sessions_login_email');
    await queryRunner.query('DROP INDEX IF EXISTS idx_first_access_tokens_user_id');
    await queryRunner.query('DROP INDEX IF EXISTS uq_first_access_tokens_hash');
    await queryRunner.query('DROP TABLE IF EXISTS user_communities');
    await queryRunner.query('DROP TABLE IF EXISTS community_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS communities');
    await queryRunner.query('DROP TABLE IF EXISTS user_context_preferences');
    await queryRunner.query('DROP TABLE IF EXISTS first_access_tokens');
    await queryRunner.query('ALTER TABLE user_sessions DROP COLUMN login_email');
    await queryRunner.query('ALTER TABLE user_sessions DROP COLUMN context_data');
  }
}
