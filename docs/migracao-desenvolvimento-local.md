# Migração do desenvolvimento para ambiente local (VS Code + Cursor)

**Atualizado em:** 06/10/2026  
**Tipo:** auditoria e plano de execução. **Nenhum código da aplicação foi alterado neste documento.**  
**Fonte:** `.env.example`, `frontend/.env.example`, `package.json`, `frontend/package.json`, `scripts/`, `render.yaml`, `Dockerfile`, `docker-compose.yml`, `src/main.ts`, `src/app.module.ts`, `src/platform/database/typeorm/`, `frontend/next.config.ts`, `README.md`, `docs/04-estado-atual.md`.

## Objetivo

Suspender o ciclo diário **GitHub → Render → Neon** para desenvolvimento, teste e homologação interna. O ANEXSYS passa a rodar no computador do desenvolvedor:

- Backend NestJS local
- Frontend Next.js local
- PostgreSQL 16 local
- VS Code + Cursor local

O Render fica **somente para homologação final** (publicação pontual a partir de `main` ou da branch combinada). Neon fica **somente se** essa homologação final continuar usando o banco remoto.

Esta migração **não** muda regra de negócio, **não** recria módulos, **não** refatora telas e **não** altera a arquitetura. Só descreve como o que já existe no repositório deve ser usado em localhost.

---

## 1. Arquitetura atual (como está publicado)

```
Navegador
    │
    ▼
Render (um único serviço web gratuito)
    ├── Next.js em produção na porta pública PORT (ex.: 10000)
    │     rewrite /backend-api/*  →  http://127.0.0.1:3000/api/v1/*
    └── NestJS em produção em 127.0.0.1:3000 (interno ao mesmo container)
            │
            ▼
        Neon PostgreSQL (DATABASE_URL + SSL)
```

Quem orquestra isso é `scripts/start-web.cjs` (`npm run start:web`): espera o banco, aplica migrações, opcionalmente roda o bootstrap (`BOOTSTRAP_ON_START=true`) e sobe API + tela num único processo de deploy.

Arquivos **só de publicação**:

| Arquivo | Função |
|---|---|
| `render.yaml` | Blueprint do serviço `anexsys-homologacao` (plano free, Oregon, Node 22) |
| `Dockerfile` | Imagem Node 22; `CMD` = `node scripts/start-web.cjs`; expõe 10000 |
| `scripts/start-web.cjs` | Processo de homologação: migração + bootstrap + API + Next `start` |

A tela nunca chama o Nest em outro host na nuvem: no Render, `BACKEND_ORIGIN=http://127.0.0.1:3000` porque API e tela compartilham o mesmo container.

URL pública conhecida da homologação: `https://anexsys-platform.onrender.com/`. O plano Free **dorme após ~15 min** sem uso; o primeiro acesso depois disso demora cerca de um minuto. Esse atraso é o principal motivo para sair do Render no dia a dia.

---

## 2. Arquitetura local proposta (o que já está no repositório)

```
Navegador  →  http://127.0.0.1:3001
                 │
                 │  Next.js (npm run frontend:dev)
                 │  rewrite /backend-api/* → http://127.0.0.1:3000/api/v1/*
                 ▼
              http://127.0.0.1:3000
                 │  NestJS (npm run start:dev)  prefixo /api/v1
                 ▼
              PostgreSQL 16 em 127.0.0.1:5432
                 banco anexsys  (Docker ou instalação nativa)
```

Não há proxy extra, não há CORS (a tela e a API se falam pelo rewrite same-origin da origem `3001`) e **não** há chamada hardcoded para `onrender.com` nem para `neon.tech` no código de negócio.

O ciclo diário desejado **já existe** nos scripts:

```
Cursor / VS Code
    → salvar arquivo
    → tsx watch (backend) e Next Fast Refresh (frontend)
    → atualizar o navegador
    → testar
```

Sem `git push`, sem GitHub, sem deploy no Render e sem `npm run build` a cada alteração. Ver seção 7.

---

## 3. Inventário de variáveis de ambiente

São **dois** arquivos locais (ambos no `.gitignore` via `.env` e `.env.*`; os exemplos versionados são `.env.example` e `frontend/.env.example`):

| Arquivo | Quem lê |
|---|---|
| `.env` na raiz | Nest (`ConfigModule.forRoot`), TypeORM CLI, bootstrap (`scripts/bootstrap-master-admin.cjs`), `wait-for-postgres.cjs` |
| `frontend/.env.local` | Next.js (`BACKEND_ORIGIN` no `next.config.ts` e no `/health`) |

O script `bash scripts/dev-setup.sh` **não** carrega o `.env`. Ele exige `BOOTSTRAP_ADMIN_EMAIL` e `BOOTSTRAP_ADMIN_PASSWORD` já exportados no shell.

### 3.1 Obrigatórias para o backend subir

| Variável | Localhost | Observação |
|---|---|---|
| `JWT_SECRET` | **obrigatória** | Sem ela o `JwtModule` aborta: `JWT_SECRET must be configured.` Use uma string longa qualquer, só sua, nunca a da homologação. |
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `5432` | |
| `DB_USERNAME` | `postgres` (ou o usuário local) | |
| `DB_PASSWORD` | **preencha** | Não deixe em branco. O `docker-compose.yml` usa `${DB_PASSWORD:-postgres}`; se a variável existir vazia, o Docker pode subir com senha vazia e o TypeORM falha. |
| `DB_NAME` | `anexsys` | |
| `DB_SCHEMA` | `public` | Padrão |

Alternativa à família `DB_*`: `DATABASE_URL`. **Não use `DATABASE_URL` no desenvolvimento local.** Se ela existir, o TypeORM ignora `DB_HOST` e ainda força SSL (`ensureSslModeRequire` + `resolveRemoteSsl`). Isso é o caminho Neon/homologação.

### 3.2 Obrigatórias para criar o administrador inicial

| Variável | Localhost | Observação |
|---|---|---|
| `BOOTSTRAP_ADMIN_EMAIL` | o e-mail com o qual você vai entrar | Normalizado em minúsculas |
| `BOOTSTRAP_ADMIN_PASSWORD` | senha **com 8 ou mais caracteres** | O DTO de login exige `MinLength(8)` |
| `BOOTSTRAP_ADMIN_DISPLAY_NAME` | `Administrador Local` | Já vem no exemplo |

### 3.3 Opcionais do bootstrap (valores locais padrão)

| Variável | Padrão se omitida |
|---|---|
| `BOOTSTRAP_TENANT_CODE` | `ANXDEV` |
| `BOOTSTRAP_TENANT_LEGAL_NAME` | `ANEXSYS DEV LTDA` |
| `BOOTSTRAP_TENANT_DISPLAY_NAME` | `ANEXSYS DEV` |
| `BOOTSTRAP_BRANCH_CODE` | `HQ` |
| `BOOTSTRAP_BRANCH_LEGAL_NAME` | `ANEXSYS DEV MATRIZ` |
| `BOOTSTRAP_BRANCH_DISPLAY_NAME` | `Matriz` |
| `BOOTSTRAP_BRANCH_CALENDAR_NAME` | `Calendario Local` |

O bootstrap cria (se ainda não existirem): Conta, Empresa padrão (via `CompanyService.getOrCreateDefault` na criação da Filial), Filial, usuário administrador, papel `MASTER_ADMINISTRATOR` e o conjunto de permissões listado em `scripts/bootstrap-master-admin.cjs`.

### 3.4 Frontend

| Variável | Localhost | Observação |
|---|---|---|
| `BACKEND_ORIGIN` | `http://127.0.0.1:3000` | Única variável realmente usada. O rewrite `/backend-api` aponta para `${BACKEND_ORIGIN}/api/v1`. |
| `NEXT_PUBLIC_TENANT_OPTIONS` | pode copiar o exemplo | **Não é usada pelo login atual** (e-mail + senha). Pode ignorar. |

### 3.5 Variáveis específicas do Render / Neon — não usar no dia a dia local

| Variável | Onde | O que fazer localmente |
|---|---|---|
| `DATABASE_URL` | Render (sync: false) + Neon | **Não definir.** Use `DB_HOST`/`DB_*`. |
| `DB_SSL=true` | `render.yaml` | **Não definir** (ou `false`). Postgres local não exige SSL. |
| `DB_SSL_REJECT_UNAUTHORIZED=false` | `render.yaml` | Só Neon (certificado). Omitir localmente. |
| `BOOTSTRAP_ON_START=true` | `render.yaml` / `start-web.cjs` | **Não definir.** No local o bootstrap é um comando separado (`npm run bootstrap:master-admin`). |
| `NODE_ENV=production` | Render | Local: deixe o Next/Nest em desenvolvimento (`start:dev` / `frontend:dev`). |
| `NODE_VERSION=22` | Render | Instale Node 22 na máquina (`engines.node: >=22`). |
| `PORT` no Render | porta pública da tela (10000) | Local: `PORT=3000` é a **API**. A tela é 3001, fixa no `frontend/package.json`. |
| `API_PORT` | `start-web.cjs` (interno 3000) | Local: desnecessário; `src/main.ts` usa `API_PORT ?? PORT ?? 3000`. |
| `BOOTSTRAP_TENANT_CODE=ANXHOMOLOG` etc. | `render.yaml` | Local: use `ANXDEV` / ANEXSYS DEV (já é o padrão). |
| `BACKEND_ORIGIN=http://127.0.0.1:3000` | Render **e** local | Mesmo valor. No Render a API é localhost **dentro do container**; no PC é localhost de verdade. |

### 3.6 Variáveis que devem apontar para localhost

```
DB_HOST=127.0.0.1
DB_PORT=5432
PORT=3000
BACKEND_ORIGIN=http://127.0.0.1:3000
```

Nenhuma URL `*.onrender.com` ou `*.neon.tech` deve aparecer no `.env` de desenvolvimento.

---

## 4. Configuração local definitiva (modelos)

**Não copie senha de exemplo para o repositório.** Escolha as suas. Os blocos abaixo são o conteúdo esperado dos arquivos **locais**, que o Git ignora.

### 4.1 `.env` (raiz)

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=escolha-uma-senha-local
DB_NAME=anexsys
DB_SCHEMA=public

JWT_SECRET=escolha-um-segredo-longo-so-seu
PORT=3000

BOOTSTRAP_ADMIN_EMAIL=voce@local
BOOTSTRAP_ADMIN_PASSWORD=senha-com-8-ou-mais
BOOTSTRAP_ADMIN_DISPLAY_NAME=Administrador Local

BOOTSTRAP_TENANT_CODE=ANXDEV
BOOTSTRAP_TENANT_LEGAL_NAME=ANEXSYS DEV LTDA
BOOTSTRAP_TENANT_DISPLAY_NAME=ANEXSYS DEV
BOOTSTRAP_BRANCH_CODE=HQ
BOOTSTRAP_BRANCH_LEGAL_NAME=ANEXSYS DEV MATRIZ
BOOTSTRAP_BRANCH_DISPLAY_NAME=Matriz
BOOTSTRAP_BRANCH_CALENDAR_NAME=Calendario Local
```

Deixe **comentadas** (ou ausentes) as linhas de homologação:

```env
# DATABASE_URL=...
# DB_SSL=true
# DB_SSL_REJECT_UNAUTHORIZED=false
# BOOTSTRAP_ON_START=true
```

### 4.2 `frontend/.env.local`

```env
BACKEND_ORIGIN=http://127.0.0.1:3000
```

Se o Next já estava rodando quando você criou o arquivo, **reinicie** `npm run frontend:dev` (o `next.config.ts` lê `BACKEND_ORIGIN` na subida).

---

## 5. Scripts — o que usar e o que não usar localmente

### 5.1 Raiz (`package.json`)

| Script | Uso local | Notas |
|---|---|---|
| `npm run start:dev` | **Sim — dia a dia** | `tsx watch src/main.ts`. Recarrega o Nest ao salvar. Porta 3000. |
| `npm run start:debug` | Opcional | Igual, com `--inspect`. |
| `npm run frontend:dev` | **Sim — dia a dia** | `next dev --port 3001`. Fast Refresh. |
| `npm run migration:run` | **Sim — primeira vez e após puxar migração nova** | TypeORM CLI em `src/platform/database/typeorm/data-source.ts`. |
| `npm run migration:show` | Conferir o que já rodou | |
| `npm run migration:revert` | Só se precisar desfazer a última | |
| `npm run bootstrap:master-admin` | **Sim — primeira vez** | Compila (`npm run build`) e roda `scripts/bootstrap-master-admin.cjs`. |
| `npm run dev:setup` | Atalho da primeira vez | `bash scripts/dev-setup.sh`. Exige as duas variáveis de bootstrap no shell. |
| `npm run db:wait` | Usado pelo setup | `scripts/wait-for-postgres.cjs`. |
| `npm run build` | Só quando for bootstrap/produção local | `tsc` + `tsc-alias`. **Não** use `npx nest build` como caminho principal: quebra neste Node; o README já documenta isso. |
| `npm start` / `start:prod` | Não no dia a dia | Sobe `dist/main.js` (build de produção). |
| `npm run start:web` | **Não no PC** | Processo do Render (`start-web.cjs`): Next em produção na `PORT` pública. |
| `npm run migration:run:prod` | Não no PC | CLI apontando para `dist/...`. |
| `npm run test` / `test:unit` | Sim | `tsx --test test/unit/**/*.spec.ts`. |
| `npm run test:watch` | Sim | Unitários em watch. |
| `npm run test:integration` | Sim, com Postgres no ar | Cria bancos temporários `anexsys_sprint*_integration`. |

### 5.2 Frontend (`frontend/package.json`)

| Script | Uso local |
|---|---|
| `npm run frontend:dev` (raiz) / `npm --prefix frontend run dev` | Desenvolvimento, porta **3001** |
| `frontend:build` / `frontend:start` | Produção local da tela. Desnecessário no ciclo diário. |
| `frontend:lint` | Qualidade. Há 2 erros já conhecidos em `customer-workspace.tsx` e `service-orders-workspace.tsx` (`docs/04-estado-atual.md`); não impedem o uso. |

### 5.3 Bootstrap e setup

| Arquivo | Papel |
|---|---|
| `scripts/dev-setup.sh` | `npm ci` (raiz + frontend) → Docker Postgres se disponível → espera banco → tenta `nest build` e cai para `tsc` → `migration:run` → `bootstrap:master-admin`. |
| `scripts/bootstrap-master-admin.cjs` | Cria/reutiliza Conta, Filial, admin, papel e permissões. Imprime JSON. **Não redefine a senha** se o e-mail já existir nessa Conta. |
| `scripts/wait-for-postgres.cjs` | Healthcheck TCP/SQL. Com `DB_*`, conecta no banco `postgres` (não em `anexsys`) só para saber se o servidor aceita conexão. |
| `scripts/postgres-url.cjs` | Ajuste SSL da `DATABASE_URL` (Neon). Irrelevante se você não definir essa URL. |
| `scripts/start-web.cjs` | Homologação Render. Não usar no VS Code. |

O `README.md` cita um atalho `bootstrap-local.js`. **Esse arquivo não existe no repositório.** O comando correto é `npm run bootstrap:master-admin`.

### 5.4 Migrações (19 arquivos)

Ordem TypeORM em `src/platform/database/typeorm/migrations/`:

1. `1760000000000` fundação Sprint 1 (`tenants`, `branches`, usuários, auditoria…)
2. `1760000001000` CRM
3. `1760000002000` ordem de serviço
4. `1760000003000` produção
5. `1760000004000` QR / execução
6. `1760000005000` qualidade / retrabalho / garantia
7. `1760000006000` regras de garantia
8. `1760000007000` financeiro
9. `1760000008000` fiscal (esqueleto)
10. `1760000009000` retirada / custódia
11. `1760000010000` experiência do cliente
12. `1760000011000` identidade SaaS
13. `1760000012000` medidas
14. `1760000013000` domínio de cliente / endereços
15. `1760000014000` unidade de medida padrão
16. `1760000015000` reparo de schema de endereço
17. `1760000016000` governança
18. `1760000017000` Ciclo 1 multiempresa (`companies`, `company_id` na Filial, horário, **role `anexsys_app` + RLS**)
19. `1760000018000` perfil fiscal da Empresa (IE, IM, e-mail, telefone, endereço)

`synchronize: false`. O schema **só** muda por migração. Depois de `git pull` que traga migração nova, rode de novo `npm run migration:run`.

---

## 6. Dependências de Render e Neon

### 6.1 O código de negócio obriga Render ou Neon?

**Não.** Não há hostname de Render ou Neon em módulos, telas ou regras. A única chamada HTTP externa de produto no frontend é o ViaCEP público (`https://viacep.com.br/ws/.../json/`) no cadastro de Empresa e de Cliente. Isso precisa de internet, não de Render.

Adaptação: nenhuma no código. Basta **não** definir `DATABASE_URL` / `DB_SSL` e **não** usar `npm run start:web`.

### 6.2 O que *parece* dependência e como tratar

| Ponto | É bloqueio local? | Adaptação |
|---|---|---|
| `render.yaml` | Não. Só blueprint de deploy. | Ignorar no dia a dia. |
| `Dockerfile` + `start-web.cjs` | Não, se você não os invocar. | Usar `start:dev` + `frontend:dev`. |
| `DATABASE_URL` + SSL automático | Sim, **se** a variável estiver no `.env`. | Apague `DATABASE_URL`. Use `DB_*`. |
| Host Neon com `-pooler` | Só na nuvem. O `start-web.cjs` avisa que pooled quebra `SET ROLE` (RLS). | Local: Postgres nativo/Docker, usuário dono do banco. |
| Role `anexsys_app` (migração 17) | Não. A migração faz `CREATE ROLE anexsys_app NOLOGIN` e `GRANT anexsys_app TO CURRENT_USER`. | Rode as migrações com um usuário Postgres que possa criar role (superuser local ou o user do Docker). |
| RLS `SET ROLE anexsys_app` | Roda igual no Postgres local. | Sem mudança. |
| ViaCEP | Precisa de internet. | Sem adaptação; se a rede bloquear, o CEP não preenche sozinho — o restante do cadastro continua. |
| Plano Free do Render (sleep) | Só na URL pública. | Deixe de usar essa URL para desenvolver. |

### 6.3 O que recomenda manter remoto

- **Render Free:** homologação final, quando o André for validar um ciclo pelo link público (roteiro em `docs/00-leia-primeiro.md` / `docs/05-plano-de-continuidade.md`).
- **Neon:** apenas se a homologação final continuar nesse banco. Não use o Neon como banco de desenvolvimento (latência, SSL, sleep, risco de misturar dados de teste com homologação).
- **GitHub:** histórico e PRs. Não faz parte do loop “salvar → ver no navegador”.

---

## 7. Desenvolvimento rápido (hot reload)

O objetivo do pedido já está coberto pelos scripts atuais. **Não é necessário alterar código** para obter este fluxo.

### 7.1 Loop diário

1. Postgres no ar (`docker compose up -d postgres` ou serviço local).
2. Terminal A, na raiz: `npm run start:dev`
3. Terminal B, na raiz: `npm run frontend:dev`
4. Navegador: `http://127.0.0.1:3001`
5. Edite no Cursor/VS Code, salve.

Comportamento:

| Camada | Mecanismo | Efeito ao salvar |
|---|---|---|
| Backend `src/**/*.ts` | `tsx watch` | Reinicia o processo Nest. A API volta em 1–2 s. |
| Frontend `frontend/src/**` | `next dev` (Turbopack no Next 16) | Fast Refresh no navegador. |
| `.env` / `frontend/.env.local` | lidos na subida | **Reinicie** o processo correspondente. |
| Nova migração | TypeORM | Rode `npm run migration:run` (não é hot reload). Depois, se a API já estava no ar, reinicie `start:dev`. |

Não use `npm run build` nem `nest build` entre alterações. Não faça push para “ver o resultado”.

### 7.2 VS Code + Cursor

Abra a **raiz** do repositório (não só `frontend/`). Sugestão de layout:

- Terminal 1: backend
- Terminal 2: frontend
- Navegador em `http://127.0.0.1:3001`

Não há pasta `.vscode` versionada. Não é obrigatório criar launch.json; os dois `npm run` bastam. Se quiser depurar: `npm run start:debug` e “Attach to Node” na porta de inspect.

Evite:

- `npm run start:web` (sobe Next em produção, sem Fast Refresh)
- apontar `BACKEND_ORIGIN` para `https://anexsys-platform.onrender.com`
- apontar `DATABASE_URL` para o Neon enquanto edita código

---

## 8. Checklist de execução local

Pré-requisitos na máquina:

- Node.js **22**
- npm (vem com o Node)
- Docker **ou** PostgreSQL 16 nativo
- Git (só para clonar/atualizar o código, não para o loop diário)

### PASSO 1 — Configuração do PostgreSQL

**Com Docker (recomendado):**

```bash
cd /caminho/do/anexsys-platform
# o .env precisa existir com DB_PASSWORD preenchido (Passo 3 pode ser feito antes)
docker compose up -d postgres
docker compose ps
```

Sobe o container `anexsys-postgres` (imagem `postgres:16-alpine`) na porta `5432`, volume `anexsys-postgres-data`.

**Sem Docker:** instale PostgreSQL 16, garanta que escuta em `127.0.0.1:5432` e que o usuário de `DB_USERNAME` pode criar banco e role.

### PASSO 2 — Criação do banco local

Com Docker, o `POSTGRES_DB` já cria `anexsys`.

Sem Docker:

```sql
CREATE DATABASE anexsys;
```

Confira:

```bash
# Docker
docker exec -it anexsys-postgres psql -U postgres -d anexsys -c '\conninfo'
```

### PASSO 3 — Configuração dos arquivos `.env`

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Edite `.env` (JWT, senha do banco, e-mail e senha do admin). Edite `frontend/.env.local` para `BACKEND_ORIGIN=http://127.0.0.1:3000`. **Não** ligue `DATABASE_URL`, `DB_SSL` nem `BOOTSTRAP_ON_START`.

### PASSO 4 — Instalação das dependências

Na raiz:

```bash
npm ci
npm --prefix frontend ci
```

(`npm ci` exige os lockfiles; é o mesmo caminho do `dev-setup.sh`.)

### PASSO 5 — Execução das migrações

```bash
npm run migration:run
npm run migration:show
```

Esperado: as 19 migrações listadas como executadas. A 17 cria a role `anexsys_app` e o RLS.

### PASSO 6 — Execução do bootstrap do administrador

```bash
export BOOTSTRAP_ADMIN_EMAIL='voce@local'
export BOOTSTRAP_ADMIN_PASSWORD='senha-com-8-ou-mais'
npm run bootstrap:master-admin
```

Se as variáveis já estão no `.env`, o `ConfigModule` as carrega ao subir o contexto Nest. Ainda assim, o `dev-setup.sh` exige o `export` no shell.

Saída esperada: JSON no terminal com `adminEmail`, `tenantId`, `branchId`, `adminUserId`, `roleCode: "MASTER_ADMINISTRATOR"`, `permissionCount` / `effectivePermissionCount` > 0. Detalhes na seção 10.

### PASSO 7 — Inicialização do backend

```bash
npm run start:dev
```

Confira: `http://127.0.0.1:3000/api/v1/health` → `{"status":"ok"}`.

### PASSO 8 — Inicialização do frontend

Outro terminal:

```bash
npm run frontend:dev
```

Confira: `http://127.0.0.1:3001` (login) e `http://127.0.0.1:3001/health` → `{"status":"ok"}` (o `/health` da tela consulta o da API).

### PASSO 9 — Validação do login

Na tela: abra `http://127.0.0.1:3001`, informe o e-mail e a senha do Passo 6. Esperado: entrar no Dashboard como **Administrador Local**, Conta **ANEXSYS DEV**, Filial **Matriz**.

Pelo terminal:

```bash
curl -s -X POST http://127.0.0.1:3000/api/v1/auth/login/password \
  -H 'content-type: application/json' \
  -d '{"email":"voce@local","password":"senha-com-8-ou-mais"}'
```

Sucesso: JSON com `accessToken`, `tenantId`, `permissions`. Falha comum: senha com menos de 8 caracteres (400 de validação) ou bootstrap que não criou o usuário (401).

### PASSO 10 — Validação das rotas principais

Com a sessão autenticada, abra pelo menu (cada item abre aba de workspace). Confirme que a aba mostra o **formulário/lista**, não só o título.

| Menu | Rota | O que conferir |
|---|---|---|
| Dashboard | `/dashboard` | Visão inicial |
| Clientes | `/customers` | Lista + novo cliente (WhatsApp e endereço/CEP obrigatórios) |
| Partes do Corpo | `/body-parts` | Cadastro mestre |
| Unidades de Medida | `/measurement-units` | Cadastro mestre |
| Contas | `/admin/tenants` | Lista/criação de Conta (quem assina o ANEXSYS) |
| Empresas | `/admin/companies` | CNPJ / dados fiscais da Empresa **dentro da Conta** |
| Filiais | `/admin/branches` | Filiais; após o PR de contexto multiempresa, ligadas à Empresa ativa |
| Usuários e Acessos | `/admin/access` | Papéis e permissões |
| Service Orders | `/service-orders` | Lista e formulário de OS |

Rotas auxiliares: `/login`, `/select-branch`.

Telas que **existem no servidor mas não no menu** (produção, qualidade, financeiro, portal do cliente, etc.) não fazem parte desta validação de rotas principais — ver relatório da seção 11.

---

## 9. Portas

| Serviço | Porta | Origem |
|---|---|---|
| PostgreSQL | **5432** | `DB_PORT` / `docker-compose.yml` |
| Backend Nest | **3000** | `API_PORT` ?? `PORT` ?? 3000 (`src/main.ts`) |
| Frontend Next (dev) | **3001** | `frontend/package.json` → `next dev --port 3001` |
| Frontend Next (Render) | `PORT` do provedor (ex. 10000) | `start-web.cjs` — não usar no PC |

Conflito típico: outro app na 3000/3001/5432. Não mude a 3001 no dia a dia sem ajustar o hábito do time; se mudar a API, atualize `BACKEND_ORIGIN` e reinicie o Next.

---

## 10. Estrutura de banco (visão operacional)

Banco: `anexsys`, schema `public`, UUID nas chaves.

Hierarquia de isolamento (Ciclo 1):

```
tenants          → Conta (quem assina o ANEXSYS)
  companies      → Empresa (CNPJ / perfil fiscal)
    branches     → Filial (ligada a company_id, timezone, is_default)
      branch_operating_hours
```

Identidade e acesso: `user_identities`, `user_credentials`, `user_sessions`, `user_context_preferences`, `first_access_tokens`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `user_branch_scopes`, `communities`, `community_permissions`, `user_communities`.

Operação com tela hoje: `customers` (+ contatos, interações, endereços), medidas (`measurement_*`), `service_orders` / `service_order_items`.

Existem no servidor (migrações e módulos) **sem tela no menu**: produção (`production_orders`, QR), qualidade, retrabalho, garantia, financeiro, fiscal (`fiscal_documents`), custódia, retirada, portal do cliente, concierge, `audit_events`.

Papel de isolamento: `anexsys_app` (`NOLOGIN`). O backend faz `SET ROLE anexsys_app` por requisição (RLS). O usuário da conexão local precisa ter sido o mesmo (ou herdeiro) de quem rodou a migração 17, por causa do `GRANT anexsys_app TO CURRENT_USER`.

TypeORM **não** sincroniza o schema sozinho.

---

## 11. Fluxo de inicialização

```
[Postgres 5432 escutando]
        │
        ▼
npm ci  +  npm --prefix frontend ci     (só a primeira vez / lockfile novo)
        │
        ▼
npm run migration:run                   (schema + role anexsys_app)
        │
        ▼
npm run bootstrap:master-admin          (Conta ANXDEV, Empresa padrão, Filial HQ, admin)
        │
        ├── terminal A: npm run start:dev          → :3000  /api/v1
        └── terminal B: npm run frontend:dev       → :3001  (proxy /backend-api)
                │
                ▼
        Navegador http://127.0.0.1:3001
```

Atalho da primeira vez (Docker + variáveis já exportadas):

```bash
export BOOTSTRAP_ADMIN_EMAIL='voce@local'
export BOOTSTRAP_ADMIN_PASSWORD='senha-com-8-ou-mais'
bash scripts/dev-setup.sh
```

Depois, só os dois `npm run` do dia a dia.

Ordem **errada** (não faça):

1. Subir `start:dev` antes das migrações → tabelas inexistentes.
2. Bootstrap antes das migrações → falha ao gravar Conta/Filial.
3. `start:web` no PC → Next em produção, porta `PORT`, sem hot reload.

---

## 12. Como verificar o administrador inicial (`BOOTSTRAP_ADMIN_*`)

O bootstrap **é idempotente para existência**, não para senha:

- Se o e-mail **não** existe na Conta: cria o usuário com `BOOTSTRAP_ADMIN_PASSWORD`.
- Se o e-mail **já** existe: devolve o usuário atual e **não troca a senha**.
- Se faltar `BOOTSTRAP_ADMIN_PASSWORD` e o usuário não existir: erro explícito pedindo a variável.
- Papel, permissões e escopo de Filial são preenchidos se ainda faltarem (inclusive `platform.tenants.create`). Por isso o README pede para quem já tinha admin antigo rodar o bootstrap de novo.

### 12.1 Evidência na hora do bootstrap

O script imprime JSON. Confira pelo menos:

- `adminEmail` = o e-mail em minúsculas
- `tenantDisplayName` = `ANEXSYS DEV` (local)
- `branchDisplayName` = `Matriz`
- `roleCode` = `MASTER_ADMINISTRATOR`
- `adminUserId`, `tenantId`, `branchId` preenchidos
- `permissionCount` e `effectivePermissionCount` iguais à lista de códigos em `ALL_PERMISSION_CODES` (dezenas de permissões, incluindo `tenants.*`, `companies.*`, `branches.*`, `customers.*`, `service_orders.*`)

### 12.2 Evidência por login HTTP

```bash
curl -s -o /tmp/anexsys-login.json -w '%{http_code}\n' \
  -X POST http://127.0.0.1:3000/api/v1/auth/login/password \
  -H 'content-type: application/json' \
  -d '{"email":"SEU_EMAIL","password":"SUA_SENHA"}'
```

HTTP **201/200** com `accessToken` = ok. HTTP **401** = usuário/senha não batem (senha antiga se o usuário já existia, ou bootstrap não rodou). HTTP **400** = senha com menos de 8 caracteres ou corpo inválido.

### 12.3 Evidência na tela

`http://127.0.0.1:3001` → mesmo e-mail/senha → Dashboard, sem tela de erro de sessão. O seletor de contexto deve mostrar a Conta ANEXSYS DEV.

### 12.4 Se a senha “não pega”

O bootstrap não reseta senha. Opções sem mudar regra de negócio:

- usar o e-mail/senha **originais** com os quais o usuário foi criado; ou
- apagar o usuário (e credencial) no banco local e rodar o bootstrap de novo; ou
- usar outro `BOOTSTRAP_ADMIN_EMAIL` que ainda não exista.

Não misture o e-mail/senha da homologação Render com o banco local: são instâncias diferentes.

---

## 13. Relatório da auditoria

### 13.1 O que está funcionando hoje

- Pipeline local **completo** já versionado: `.env.example`, Docker Postgres 16, `dev-setup.sh`, migrações TypeORM, bootstrap de admin, `start:dev` (watch), `frontend:dev` (porta 3001 + rewrite).
- Login e-mail + senha, JWT, isolamento por Conta (filtro + RLS `anexsys_app`).
- Telas de Cadastro: Clientes (com medidas), Partes do Corpo, Unidades; Administração: Contas, Empresas (perfil fiscal no código atual), Filiais, Acessos; Operações: OS.
- Workspace em abas (menu abre aba; conteúdo não depende de corrida com a URL) — em `main` a partir do merge do loop de navegação.
- Health da API e da tela.
- Testes unitários e de integração descritos em `docs/04-estado-atual.md` (110 unitários e 43 de integração na medição de 05/10/2026; rode de novo na sua máquina após o Passo 5).
- Homologação pública no Render **sobe** (com o atraso do Free). Serve como prova de que o empacotamento `start-web.cjs` + Neon funciona — só não serve como ciclo de edição.

### 13.2 O que está quebrado ou incompleto (produto, não o ambiente local)

Isto **não** é regressão da migração para localhost; já está em `docs/04-estado-atual.md`:

- Ordem de Produção, QR, qualidade, retrabalho, garantia, financeiro, fiscal real, retirada/custódia, concierge e portal do cliente: **backend existe, tela no menu não**.
- WhatsApp, LGPD, cobrança do ANEXSYS, importação de dados: **não existem**.
- Sessão em `localStorage`; sem recuperação de senha.
- `npx nest build` falha neste Node; o atalho correto é `npm run build` (`tsc`).
- README cita `bootstrap-local.js` inexistente.
- `dev-setup.sh` não lê `.env` (só o ambiente do shell).
- Lint do frontend: 2 erros já conhecidos, não bloqueiam o `next dev`.
- PRs abertos de produto (não entram em `main` automaticamente): correção do 400 em `GET /companies` / hidratação React #418, e separação Conta/Empresa/Filial no combo. Quem for desenvolver localmente essas linhas deve checar o branch da feature, não só `main`.
- Homologação Render: o `render.yaml` ainda aponta a branch antiga `cursor/homologacao-gratuita-a1bd`. A publicação “oficial” recente tem sido `main`. Isso é assunto de **homologação final**, não do PC.

Nada disso impede o Passo 1–10 acima.

### 13.3 O que depende do Render

Somente o empacotamento de um container único e a URL pública:

- `render.yaml`, `Dockerfile`, `scripts/start-web.cjs`
- `NODE_ENV=production`, `BOOTSTRAP_ON_START`, `PORT` pública da tela
- sleep do plano Free

Nenhuma regra de negócio, migração ou tela exige Render para executar.

### 13.4 O que depende do Neon

Somente a string `DATABASE_URL` + SSL:

- `ensureSslModeRequire` / `resolveRemoteSsl` / aviso de host `-pooler`
- `DB_SSL` e `DB_SSL_REJECT_UNAUTHORIZED` no blueprint

O Postgres local com `DB_HOST=127.0.0.1` **não** passa por esse caminho.

### 13.5 O que pode ser executado localmente

Tudo que o time usa para desenvolver e testar:

- API, tela, banco, migrações, bootstrap, login, rotas do menu, testes unitários, testes de integração (com Postgres).
- Hot reload descrito na seção 7.
- Cadastro ViaCEP, se houver internet.

### 13.6 O que recomenda manter remoto

| Manter remoto | Por quê |
|---|---|
| GitHub | Fonte do código e PRs. |
| Render Free | Homologação final do André (link + roteiro), não o dia a dia. |
| Neon | Só se a homologação final continuar usando esse banco. Não como datasource de desenvolvimento. |
| ViaCEP | Serviço público; não há equivalente interno. |

Não manter remoto: o banco de trabalho, o Nest e o Next de desenvolvimento.

---

## 14. Troubleshooting

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `JWT_SECRET must be configured.` | `.env` ausente ou processo iniciado fora da raiz | Crie `.env` na raiz; rode os npm na raiz. |
| `ECONNREFUSED 127.0.0.1:5432` | Postgres parado | `docker compose up -d postgres` |
| `password authentication failed` | `DB_PASSWORD` vazio no `.env` vs senha do container | Preencha a mesma senha nos dois lados; se o volume já nasceu com outra senha, recrie o volume (`docker compose down -v` apaga dados locais). |
| SSL / `certificate` / `sslmode` contra localhost | `DATABASE_URL` ou `DB_SSL=true` no `.env` | Remova essas variáveis. |
| Migração 17 falha ao criar role | usuário Postgres sem permissão `CREATEROLE` | Use o superuser do Docker (`postgres`). |
| Bootstrap pede `BOOTSTRAP_ADMIN_*` | `dev-setup.sh` não lê `.env` | `export` no shell ou rode `npm run bootstrap:master-admin` com o `.env` na raiz. |
| Login 401 depois de “já rodei o bootstrap” | usuário já existia; senha não foi atualizada | Ver seção 12.4. |
| Login 400 | senha &lt; 8 caracteres | Aumente a senha e recrie o usuário se ainda não existia. |
| Tela abre, API “Failed to fetch” | Next sem `BACKEND_ORIGIN` ou API fora do ar | Confira `:3000/api/v1/health` e reinicie o frontend. |
| `/health` da tela 503 | API ainda não subiu | Espere o `start:dev`; o Next reporta `starting`/`degraded`. |
| Porta 3000/3001 ocupada | outro processo | Encerre o processo; não mude portas sem ajustar `BACKEND_ORIGIN`. |
| `npx nest build` quebra | incompatível com este Node | Use `npm run build` ou só `start:dev` (não precisa build). |
| CEP não preenche | sem internet / ViaCEP fora | Preencha o endereço na mão. |
| Tela lenta só na URL do Render | sleep Free ~15 min | Use localhost. |
| RLS / `permission denied for table` | role `anexsys_app` não concedida ao seu user | Rode as migrações com o mesmo usuário de `DB_USERNAME`. |
| Integração falha criando `anexsys_sprint*_integration` | Postgres no ar, mas usuário sem `CREATEDB` | Use o user Docker `postgres`. |

---

## 15. Plano de execução (sem mudar código)

1. Instalar Node 22, Docker (ou Postgres 16) e VS Code + Cursor no PC.
2. Clonar o repositório (branch de trabalho atual, em geral `main`, ou a feature em aberto).
3. Seguir o checklist Passo 1–10 deste documento.
4. Trabalhar só com `start:dev` + `frontend:dev`.
5. Usar GitHub/PRs quando a alteração estiver pronta para revisão — não para “ver a tela”.
6. Publicar no Render **apenas** quando o ciclo estiver pronto para o André homologar no link público.
7. **Não** apontar o `.env` local para o Neon.
8. Correções futuras (se um dia forem desejadas, em outro ciclo, não nesta auditoria): fazer o `dev-setup.sh` carregar o `.env`; atualizar o README que cita `bootstrap-local.js`; alinhar `render.yaml` à branch que realmente publica. Nenhuma delas é pré-requisito para desenvolver em localhost.

---

## 16. Fora de escopo (explícito)

- Não alterar regras de negócio.
- Não recriar módulos.
- Não refatorar funcionalidades.
- Não mudar a arquitetura Nest / Next / TypeORM / RLS.
- Não desligar o Render de forma permanente: ele permanece como homologação final.
