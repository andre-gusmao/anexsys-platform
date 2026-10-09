#!/usr/bin/env node
/**
 * Garante as colunas novas da OS no banco local, sem depender do Nest.
 * O start:dev chama isto antes de subir, para o André não precisar rodar migration:run.
 */
const path = require('node:path');
const { Client } = require('pg');
const { applyDatabaseUrlSsl } = require('./postgres-url.cjs');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // Sem .env: usa o que já estiver no ambiente.
}

applyDatabaseUrlSsl();

function clientConfig() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) {
    return { connectionString };
  }

  return {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'anexsys',
  };
}

async function main() {
  const client = new Client(clientConfig());
  await client.connect();
  try {
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS promised_delivery_time varchar(5)
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_order_items
      ADD COLUMN IF NOT EXISTS product_id uuid NULL
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_order_items
      ADD COLUMN IF NOT EXISTS service_id uuid NULL
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_order_items
      ADD COLUMN IF NOT EXISTS complement text NULL
    `);
    await client.query(`
      ALTER TABLE IF EXISTS tenants
      ADD COLUMN IF NOT EXISTS max_pieces_per_bag integer NOT NULL DEFAULT 5
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS group_id uuid
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS group_seq integer
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS version_suffix varchar(2)
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS actual_delivery_time varchar(5)
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS bag_closed boolean NOT NULL DEFAULT false
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_order_items
      ADD COLUMN IF NOT EXISTS brand varchar(120) NOT NULL DEFAULT ''
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_order_items
      ADD COLUMN IF NOT EXISTS model varchar(120) NOT NULL DEFAULT ''
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_order_items
      ADD COLUMN IF NOT EXISTS serial_no varchar(120) NOT NULL DEFAULT ''
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS origin_service_order_id uuid
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS return_kind varchar(20)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_service_orders_origin
      ON service_orders (origin_service_order_id)
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      DROP CONSTRAINT IF EXISTS chk_service_orders_return_kind
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD CONSTRAINT chk_service_orders_return_kind
      CHECK (return_kind IS NULL OR return_kind IN ('reconserto', 'warranty', 'charged'))
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      DROP CONSTRAINT IF EXISTS chk_service_orders_status
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD CONSTRAINT chk_service_orders_status
      CHECK (status IN ('open', 'approved', 'cancelled', 'in_production', 'awaiting_proof', 'awaiting_quality', 'quality', 'in_rework', 'ready_for_pickup', 'picked_up'))
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_order_proof_notes (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        branch_id uuid NOT NULL,
        service_order_id uuid NOT NULL,
        service_order_item_id uuid NOT NULL,
        batch_id uuid NOT NULL,
        note text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz,
        deleted_by uuid
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_proof_notes_order
      ON service_order_proof_notes (service_order_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_proof_notes_batch
      ON service_order_proof_notes (batch_id)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_order_pickups (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        branch_id uuid NOT NULL,
        service_order_id uuid NOT NULL,
        method varchar(20),
        window_opened_at timestamptz,
        window_expires_at timestamptz,
        confirmed_at timestamptz,
        customer_phone varchar(40),
        recipient_name varchar(160),
        accepted_text text,
        client_user_agent text,
        client_ip varchar(80),
        photo_file_name varchar(180),
        photo_mime_type varchar(80),
        photo_base64 text,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz,
        deleted_by uuid
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_pickups_order
      ON service_order_pickups (service_order_id)
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_order_approvals (
        id uuid PRIMARY KEY,
        tenant_id uuid NOT NULL,
        branch_id uuid NOT NULL,
        service_order_id uuid NOT NULL,
        method varchar(20) NOT NULL,
        confirmed_at timestamptz NOT NULL,
        accepted_text text,
        release_reason text,
        total_value_snapshot numeric(18, 2),
        discount_value_snapshot numeric(18, 2),
        services_snapshot jsonb,
        measurements_snapshot jsonb,
        measurements_locked_at timestamptz,
        client_user_agent text,
        client_ip varchar(80),
        photo_file_name varchar(180),
        photo_mime_type varchar(80),
        photo_base64 text,
        created_at timestamptz NOT NULL DEFAULT now(),
        created_by uuid NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        updated_by uuid NOT NULL,
        row_version bigint NOT NULL DEFAULT 1,
        is_deleted boolean NOT NULL DEFAULT false,
        deleted_at timestamptz,
        deleted_by uuid
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_approvals_order
      ON service_order_approvals (service_order_id)
    `);
    await client.query(`
      ALTER TABLE IF EXISTS service_orders
      ADD COLUMN IF NOT EXISTS public_token uuid
    `);
    await client.query(`
      UPDATE service_orders
      SET public_token = gen_random_uuid()
      WHERE public_token IS NULL
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_service_orders_public_token
      ON service_orders (public_token)
    `);
    await client.query(`
      UPDATE service_orders
      SET group_id = id
      WHERE group_id IS NULL
    `);
    await client.query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY created_at, id) AS seq
        FROM service_orders
      )
      UPDATE service_orders AS orders
      SET group_seq = numbered.seq
      FROM numbered
      WHERE orders.id = numbered.id
        AND orders.group_seq IS NULL
    `);
    console.log('Banco da OS conferido (horário de saída, produto, serviço, versões da sacola, trava, marca, modelo, série, qualidade, prova, anotações de prova, retirada, aprovação, link público e retorno do cliente).');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.warn(`Não deu para conferir o banco da OS agora: ${error.message}`);
});
