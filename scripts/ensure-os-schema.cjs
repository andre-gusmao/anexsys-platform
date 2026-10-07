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
    console.log('Banco da OS conferido (horário de saída, produto, serviço e versões da sacola).');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.warn(`Não deu para conferir o banco da OS agora: ${error.message}`);
});
