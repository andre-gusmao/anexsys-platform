#!/usr/bin/env bash
# Prepara o ambiente local: dependências, banco, migrações e administrador inicial.
# Não cria conta na nuvem. Isso é feito pelo André.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${BOOTSTRAP_ADMIN_EMAIL:-}" || -z "${BOOTSTRAP_ADMIN_PASSWORD:-}" ]]; then
  echo "Defina BOOTSTRAP_ADMIN_EMAIL e BOOTSTRAP_ADMIN_PASSWORD antes de executar este script." >&2
  exit 1
fi

echo "Instalando dependências do servidor..."
npm ci

echo "Instalando dependências da tela..."
npm --prefix frontend ci

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Subindo PostgreSQL com Docker..."
  docker compose up -d postgres
else
  echo "Docker não está disponível. Use um PostgreSQL local na porta ${DB_PORT:-5432}."
fi

echo "Aguardando o PostgreSQL aceitar conexões..."
node scripts/wait-for-postgres.cjs

echo "Compilando o servidor..."
if npx nest build; then
  :
else
  echo "A compilação pelo Nest falhou neste ambiente; tentando tsc..."
  npx tsc -p tsconfig.build.json
fi

echo "Aplicando migrações..."
npm run migration:run

echo "Criando (ou atualizando) o administrador inicial..."
npm run bootstrap:master-admin

echo
echo "Pronto. Para rodar:"
echo "  1. Servidor:  npm run start:dev"
echo "  2. Tela:      npm run frontend:dev"
echo "  3. Abra http://127.0.0.1:3001 e entre com BOOTSTRAP_ADMIN_EMAIL"
echo
echo "A conta na nuvem e o domínio atelierizagusmao.com.br ficam com o André."
