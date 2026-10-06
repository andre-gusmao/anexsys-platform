const { Client } = require('pg');
const { applyDatabaseUrlSsl } = require('./postgres-url.cjs');

applyDatabaseUrlSsl();

function wantsSsl(connectionString) {
  const explicit = (process.env.DB_SSL ?? '').toLowerCase();
  if (explicit === 'false' || explicit === '0' || explicit === 'off') {
    return false;
  }
  if (explicit === 'true' || explicit === '1' || explicit === 'on' || connectionString) {
    return true;
  }
  return false;
}

function clientConfig() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) {
    const ssl = wantsSsl(connectionString)
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined;
    return { connectionString, ssl };
  }

  return {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'postgres',
  };
}

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60000);
const started = Date.now();

async function tryConnect() {
  const client = new Client(clientConfig());
  await client.connect();
  await client.query('SELECT 1');
  await client.end();
}

async function main() {
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      await tryConnect();
      const target = process.env.DATABASE_URL ? 'DATABASE_URL' : `${process.env.DB_HOST ?? '127.0.0.1'}:${process.env.DB_PORT ?? 5432}`;
      console.log(`PostgreSQL disponível (${target}).`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(`PostgreSQL não respondeu após ${timeoutMs}ms.`);
  console.error(lastError);
  process.exit(1);
}

main();
