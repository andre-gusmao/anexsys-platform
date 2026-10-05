const { Client } = require('pg');

const host = process.env.DB_HOST ?? '127.0.0.1';
const port = Number(process.env.DB_PORT ?? 5432);
const user = process.env.DB_USERNAME ?? 'postgres';
const password = process.env.DB_PASSWORD ?? 'postgres';
const database = process.env.DB_NAME ?? 'postgres';
const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS ?? 60000);
const started = Date.now();

async function tryConnect() {
  const client = new Client({ host, port, user, password, database });
  await client.connect();
  await client.query('SELECT 1');
  await client.end();
}

async function main() {
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      await tryConnect();
      console.log(`PostgreSQL disponível em ${host}:${port}.`);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.error(`PostgreSQL não respondeu em ${host}:${port} após ${timeoutMs}ms.`);
  console.error(lastError);
  process.exit(1);
}

main();
