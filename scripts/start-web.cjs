#!/usr/bin/env node
/**
 * Sobe homologação num único serviço: PostgreSQL (Neon) + API Nest + tela Next.
 * Render expõe só PORT (a tela). A API fica em 127.0.0.1:3000 e a tela faz proxy em /backend-api.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const API_PORT = String(process.env.API_PORT ?? '3000');
const PUBLIC_PORT = String(process.env.PORT ?? '10000');
const BACKEND_ORIGIN = `http://127.0.0.1:${API_PORT}`;

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} saiu com código ${code}`));
    });
  });
}

function spawnLongRunning(command, args, extraEnv = {}, cwd = ROOT) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
  child.on('exit', (code) => {
    console.error(`${command} ${args.join(' ')} encerrou com código ${code ?? 1}.`);
    process.exit(code || 1);
  });
  return child;
}

function warnIfPooledNeonUrl() {
  const url = process.env.DATABASE_URL ?? '';
  if (url.includes('-pooler')) {
    console.warn(
      'DATABASE_URL parece ser a string pooled do Neon (host com -pooler). Use a conexão direta, sem -pooler, senão o isolamento entre Contas (SET ROLE) quebra.',
    );
  }
}

async function main() {
  warnIfPooledNeonUrl();

  if (!process.env.JWT_SECRET) {
    throw new Error('Defina JWT_SECRET antes de subir o serviço.');
  }

  console.log('Aguardando o PostgreSQL...');
  await run(process.execPath, ['scripts/wait-for-postgres.cjs']);

  console.log('Aplicando migrações...');
  await run(process.execPath, [
    path.join(ROOT, 'node_modules/typeorm/cli.js'),
    '-d',
    path.join(ROOT, 'dist/platform/database/typeorm/data-source.js'),
    'migration:run',
  ]);

  const shouldBootstrap =
    process.env.BOOTSTRAP_ON_START === 'true' || process.env.BOOTSTRAP_ON_START === '1';
  if (shouldBootstrap) {
    if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
      console.warn(
        'BOOTSTRAP_ON_START está ligado, mas faltam BOOTSTRAP_ADMIN_EMAIL ou BOOTSTRAP_ADMIN_PASSWORD. Pulando o administrador inicial.',
      );
    } else {
      console.log('Criando (ou atualizando) o administrador inicial...');
      await run(process.execPath, ['scripts/bootstrap-master-admin.cjs']);
    }
  }

  console.log(`Subindo API em ${BACKEND_ORIGIN} e a tela na porta ${PUBLIC_PORT}...`);

  spawnLongRunning(process.execPath, ['dist/main.js'], {
    PORT: API_PORT,
    API_PORT,
    NODE_OPTIONS: process.env.API_NODE_OPTIONS ?? '--max-old-space-size=192',
  });

  const apiHealth = `${BACKEND_ORIGIN}/api/v1/health`;
  const apiDeadline = Date.now() + 60000;
  let apiReady = false;
  while (Date.now() < apiDeadline) {
    try {
      const response = await fetch(apiHealth);
      if (response.ok) {
        apiReady = true;
        break;
      }
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!apiReady) {
    throw new Error(`A API não respondeu em ${apiHealth} após 60s.`);
  }

  spawnLongRunning(
    process.execPath,
    [path.join(ROOT, 'frontend/node_modules/next/dist/bin/next'), 'start', '--hostname', '0.0.0.0', '--port', PUBLIC_PORT],
    {
      BACKEND_ORIGIN,
      PORT: PUBLIC_PORT,
      NODE_ENV: 'production',
      NODE_OPTIONS: process.env.WEB_NODE_OPTIONS ?? '--max-old-space-size=192',
    },
    path.join(ROOT, 'frontend'),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
