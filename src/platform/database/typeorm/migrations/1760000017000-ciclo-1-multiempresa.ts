import { MigrationInterface, QueryRunner } from 'typeorm';

export class Ciclo1Multiempresa1760000017000 implements MigrationInterface {
  name = 'Ciclo1Multiempresa1760000017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE companies (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        legal_name text NOT NULL,
        trade_name text NULL,
        cnpj varchar(14) NULL,
        is_default boolean NOT NULL DEFAULT false,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz NULL,
        deleted_by uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_companies_tenant_cnpj UNIQUE (tenant_id, cnpj)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_companies_tenant_id ON companies (tenant_id)');

    await queryRunner.query(`
      INSERT INTO companies (
        id, tenant_id, legal_name, trade_name, cnpj, is_default,
        is_deleted, deleted_at, deleted_by, created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT gen_random_uuid(), t.id, t.legal_name, t.display_name, NULL, true,
             false, NULL, NULL, t.created_at, t.created_by, t.updated_at, t.updated_by, 1
      FROM tenants t
      WHERE t.is_deleted = false
        AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.tenant_id = t.id)
    `);

    await queryRunner.query(`ALTER TABLE branches ADD COLUMN company_id uuid NULL`);
    await queryRunner.query(`ALTER TABLE branches ADD COLUMN timezone varchar(64) NOT NULL DEFAULT 'America/Sao_Paulo'`);
    await queryRunner.query(`ALTER TABLE branches ADD COLUMN is_default boolean NOT NULL DEFAULT false`);

    await queryRunner.query(`
      UPDATE branches b
      SET company_id = c.id
      FROM companies c
      WHERE c.tenant_id = b.tenant_id AND c.is_default = true AND b.company_id IS NULL
    `);

    await queryRunner.query(`
      UPDATE branches b
      SET is_default = true
      WHERE b.id = (
        SELECT b2.id FROM branches b2
        WHERE b2.company_id = b.company_id AND b2.is_deleted = false
        ORDER BY b2.created_at ASC, b2.display_name ASC
        LIMIT 1
      )
    `);

    await queryRunner.query(`ALTER TABLE branches ALTER COLUMN company_id SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE branches
      ADD CONSTRAINT fk_branches_company_id FOREIGN KEY (company_id) REFERENCES companies(id)
    `);
    await queryRunner.query('CREATE INDEX idx_branches_company_id ON branches (company_id)');

    await queryRunner.query(`
      CREATE TABLE branch_operating_hours (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        branch_id uuid NOT NULL REFERENCES branches(id),
        weekday smallint NOT NULL,
        is_open boolean NOT NULL,
        opens_at time NULL,
        closes_at time NULL,
        cutoff_at time NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_branch_operating_hours UNIQUE (branch_id, weekday),
        CONSTRAINT chk_branch_operating_hours_weekday CHECK (weekday BETWEEN 0 AND 6)
      )
    `);
    await queryRunner.query('CREATE INDEX idx_branch_operating_hours_branch_id ON branch_operating_hours (branch_id)');

    await queryRunner.query(`
      INSERT INTO branch_operating_hours (
        id, tenant_id, branch_id, weekday, is_open, opens_at, closes_at, cutoff_at,
        created_at, created_by, updated_at, updated_by, row_version
      )
      SELECT gen_random_uuid(), b.tenant_id, b.id, d.weekday,
             CASE WHEN d.weekday = 0 THEN false ELSE true END,
             CASE WHEN d.weekday = 0 THEN NULL ELSE TIME '09:30' END,
             CASE
               WHEN d.weekday = 0 THEN NULL
               WHEN d.weekday = 6 THEN TIME '14:00'
               ELSE TIME '18:00'
             END,
             CASE
               WHEN d.weekday = 0 THEN NULL
               WHEN d.weekday = 6 THEN TIME '14:00'
               ELSE TIME '18:00'
             END,
             now(), b.created_by, now(), b.updated_by, 1
      FROM branches b
      CROSS JOIN (SELECT generate_series(0, 6) AS weekday) d
      WHERE b.is_deleted = false
    `);

    await queryRunner.query(`
      CREATE TABLE tenant_modules (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL REFERENCES tenants(id),
        code varchar(50) NOT NULL,
        display_name text NOT NULL,
        is_enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        CONSTRAINT uq_tenant_modules_tenant_code UNIQUE (tenant_id, code)
      )
    `);

    await queryRunner.query(`
      INSERT INTO tenant_modules (id, tenant_id, code, display_name, is_enabled, created_at, created_by, updated_at, updated_by, row_version)
      SELECT gen_random_uuid(), t.id, m.code, m.display_name, m.is_enabled, now(), t.created_by, now(), t.updated_by, 1
      FROM tenants t
      CROSS JOIN (
        VALUES
          ('identity', 'Acesso', true),
          ('customers', 'Clientes', true),
          ('service_orders', 'Ordens de serviço', true),
          ('production', 'Produção', true),
          ('quality', 'Qualidade', true),
          ('finance', 'Financeiro', false),
          ('whatsapp', 'WhatsApp', false),
          ('concierge', 'Concierge', false)
      ) AS m(code, display_name, is_enabled)
      WHERE t.is_deleted = false
    `);

    await queryRunner.query(`
      ALTER TABLE user_role_assignments
      ADD COLUMN grants_all_branches boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      UPDATE user_role_assignments
      SET grants_all_branches = true
      WHERE assigned_branch_id IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anexsys_app') THEN
          CREATE ROLE anexsys_app NOLOGIN NOSUPERUSER NOINHERIT NOBYPASSRLS;
        END IF;
      END
      $$
    `);
    await queryRunner.query(`GRANT anexsys_app TO CURRENT_USER`);
    await queryRunner.query(`GRANT USAGE ON SCHEMA public TO anexsys_app`);
    await queryRunner.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anexsys_app`);
    await queryRunner.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anexsys_app`);
    await queryRunner.query(`
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anexsys_app
    `);

    await queryRunner.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN
          SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
          WHERE n.nspname = 'public' AND c.relkind = 'r'
        LOOP
          EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
          EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', r.table_name);
          EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.table_name);
          EXECUTE format(
            'CREATE POLICY tenant_isolation ON %I
               USING (
                 current_setting(''app.rls_bypass'', true) = ''on''
                 OR tenant_id::text = NULLIF(current_setting(''app.current_tenant_id'', true), '''')
               )
               WITH CHECK (
                 current_setting(''app.rls_bypass'', true) = ''on''
                 OR tenant_id::text = NULLIF(current_setting(''app.current_tenant_id'', true), '''')
               )',
            r.table_name
          );
        END LOOP;

        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS tenant_isolation ON tenants;
        CREATE POLICY tenant_isolation ON tenants
          USING (
            current_setting('app.rls_bypass', true) = 'on'
            OR id::text = NULLIF(current_setting('app.current_tenant_id', true), '')
          )
          WITH CHECK (
            current_setting('app.rls_bypass', true) = 'on'
            OR id::text = NULLIF(current_setting('app.current_tenant_id', true), '')
          );
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN
          SELECT c.relname AS table_name
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_policy p ON p.polrelid = c.oid AND p.polname = 'tenant_isolation'
          WHERE n.nspname = 'public' AND c.relkind = 'r'
        LOOP
          EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.table_name);
          EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', r.table_name);
          EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.table_name);
        END LOOP;
      END
      $$
    `);

    await queryRunner.query(`ALTER TABLE user_role_assignments DROP COLUMN IF EXISTS grants_all_branches`);
    await queryRunner.query(`DROP TABLE IF EXISTS tenant_modules`);
    await queryRunner.query(`DROP TABLE IF EXISTS branch_operating_hours`);
    await queryRunner.query(`ALTER TABLE branches DROP CONSTRAINT IF EXISTS fk_branches_company_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_branches_company_id`);
    await queryRunner.query(`ALTER TABLE branches DROP COLUMN IF EXISTS is_default`);
    await queryRunner.query(`ALTER TABLE branches DROP COLUMN IF EXISTS timezone`);
    await queryRunner.query(`ALTER TABLE branches DROP COLUMN IF EXISTS company_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_companies_tenant_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS companies`);
  }
}
