# DEV_ENVIRONMENT_V1

## 1. Objective

Prepare the first usable ANEXSYS development environment after the approved BASELINE_V3.0 and the completion of Sprint 10.

This environment must allow:
- backend execution in local development
- controlled PostgreSQL persistence
- tenant and branch bootstrap
- creation of test users and seed data
- first end-to-end operational validation
- preparation for shared DEV publication at `dev.anexsys.com.br`

---

## 2. Baseline Context

Current approved state:
- BASELINE_V3.0 authorizes transition into Frontend Implementation, Development Environment, Sprint Execution, and Pilot Deployment preparation
- the backend uses one NestJS modular monolith with PostgreSQL via TypeORM
- Sprint 10 is the last completed sprint
- Smart Concierge and Customer Portal are already part of the approved post-Sprint-10 DEV scope

Approved milestone answer:
- the earliest approved state where ANEXSYS can be accessed through a web browser is **after Sprint 1**
- rationale: `dev.anexsys.com.br` can be deployed after Sprint 1 with tenant, branch, identity, authentication, authorization, and portal shell foundations available for iterative development

Current practical interpretation:
- the project is already beyond that milestone because Sprint 10 is completed
- therefore the DEV environment created in this document should target immediate internal use, not a future conceptual state

---

## 3. Local Environment

### 3.1 Local development goal

The first usable local environment should prioritize:
- fast backend iteration
- simple database setup
- controlled bootstrap
- compatibility with current migrations and automated tests

### 3.2 Local development model

Recommended local model:
- run the NestJS application on the host machine
- run PostgreSQL either locally or in Docker
- keep frontend shells and browser-based validation pointed to the same DEV backend base URL

This model is preferred for the first usable DEV environment because it minimizes friction for watch mode, debugging, migrations, and test execution.

### 3.3 Required local tools

Minimum local tools:
- Git
- Node.js with npm
- PostgreSQL
- a web browser

Recommended local tools:
- Docker Desktop or Docker Engine
- a REST client for API smoke validation

### 3.4 Step-by-step local setup guide

1. Clone the repository.
2. Open the repository at:
   - `/home/runner/work/anexsys-platform/anexsys-platform`
3. Install dependencies:
   - `npm install`
4. Prepare environment variables for local DEV.
5. Create a dedicated local PostgreSQL database for DEV.
6. Run the database migrations:
   - `npm run migration:run`
7. Start the application in watch mode:
   - `npm run start:dev`
8. Access the local HTTP entrypoint:
   - `http://localhost:3000/api/v1`

Expected result:
- the backend must start successfully
- requests must be served under `/api/v1`
- authentication and tenant-scoped flows must be ready for bootstrap and validation

---

## 4. Docker Strategy

### 4.1 First usable Docker strategy

The first usable DEV environment should use Docker selectively.

Recommended strategy:
- use Docker for PostgreSQL first
- keep the NestJS application running locally on the host machine during active development
- introduce full backend containerization for shared DEV deployment, not as a prerequisite for local iteration

### 4.2 Why this strategy is approved for first DEV

This approach keeps:
- live reload simple
- source debugging direct
- migration execution explicit
- database reset and recreation easy

### 4.3 Local Docker scope

Docker is recommended for:
- PostgreSQL runtime
- optional future shared services needed by later DEV hardening

Docker is not required for the first local milestone if the developer already has PostgreSQL available locally.

### 4.4 Shared DEV Docker posture

For shared DEV publication, the environment should support:
- one primary backend application artifact
- one shared PostgreSQL instance
- optional reverse proxy/TLS termination in front of the backend

Future worker, queueing, and object-storage expansion may be added later when the corresponding implementation paths require them.

---

## 5. PostgreSQL Setup

### 5.1 PostgreSQL role in DEV

PostgreSQL is mandatory for the first usable development environment because the application uses TypeORM migrations and tenant-scoped persistence across all implemented modules.

### 5.2 Required database variables

The application already supports:
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SCHEMA`
- `DB_LOGGING`

### 5.3 Recommended local DEV database

Recommended local DEV database naming:
- database: `anexsys_dev`
- schema: `public`

Recommended local integration-test separation:
- keep DEV and integration-test databases separate
- never run iterative DEV work against the same database used for repeatable integration validation

### 5.4 PostgreSQL setup flow

1. Ensure PostgreSQL is running.
2. Create a dedicated database for development.
3. Configure the local environment variables.
4. Run `npm run migration:run`.
5. Confirm all migrations apply successfully before starting the application.

### 5.5 Database operating rule

The first DEV environment must treat migrations as the source of schema truth.

Therefore:
- do not use schema auto-sync
- do not manually reshape the database outside the migration flow
- reset and recreate local DEV databases when needed instead of allowing undocumented drift

---

## 6. Seed Data

### 6.1 Seed objective

The DEV environment requires controlled seed data so that the first login and first operational flows are reproducible.

### 6.2 Seed data minimum scope

The initial DEV seed should create:
- 1 test tenant
- 1 test branch
- 1 platform admin user
- 1 branch operations/admin user
- 1 Smart Concierge/reception user
- 1 Customer Portal user linked to a CRM customer
- 1 sample customer
- 1 sample Service Order
- 1 sample storage location

### 6.3 Seed operating rule

The seed must be:
- DEV-only
- idempotent
- safe to rerun
- isolated from production data paths

### 6.4 Seed governance

The first DEV seed should not be embedded in business migrations.

Recommended rule:
- schema changes remain in migrations
- DEV bootstrap data remains in a controlled seeding/bootstrap step

### 6.5 Seed functional purpose

The seed should enable immediate validation of:
- tenant access
- branch scoping
- authentication
- Customer Portal profile linkage
- pickup/custody retrieval context
- Smart Concierge queue flows

---

## 7. Test Tenant

Canonical DEV tenant:
- code: `ANEXDEV`
- legal name: `ANEXSYS Desenvolvimento Ltda`
- display name: `ANEXSYS DEV`

Recommended tenant defaults:
- activate the tenant after bootstrap
- keep warranty defaults enabled
- keep tenant settings aligned with development-safe behavior

Purpose:
- provide one stable tenant for internal development, demos, and acceptance rehearsal

---

## 8. Test Branch

Canonical DEV branch:
- code: `DEV01`
- legal name: `ANEXSYS DEV Branch 01`
- display name: `ANEXSYS DEV`
- business calendar name: `ANEXSYS DEV Calendar`

Purpose:
- provide a single predictable branch scope for the first DEV milestone
- reduce branch-permission complexity during early environment stabilization

Expansion rule:
- additional branches may be introduced only after the single-branch DEV flow is stable

---

## 9. Test Users

The first usable DEV environment should start with a small controlled user set.

Recommended user set:
- Platform Admin
- Branch Admin
- Smart Concierge User
- Customer Portal User
- Operational Resource User
- Quality User
- Finance User

Recommended identity examples:
- `admin@anexsys.dev`
- `branch-admin@anexsys.dev`
- `concierge@anexsys.dev`
- `customer@anexsys.dev`
- `operations@anexsys.dev`
- `quality@anexsys.dev`
- `finance@anexsys.dev`

Recommended role strategy:
- keep one role per major DEV persona initially
- assign only the permissions required for the persona being validated
- avoid over-permissioned shared accounts except for the platform admin

Minimum first-login priority:
- Platform Admin
- Customer Portal User
- Smart Concierge User

These three users are sufficient for the first cross-domain validation flow.

---

## 10. Admin Credentials Strategy

### 10.1 Principle

Admin credentials must never be committed to the repository.

### 10.2 Local DEV strategy

For local DEV:
- generate bootstrap admin credentials outside the repository
- inject them through local environment variables or local-only bootstrap input
- allow local reset when the database is recreated

### 10.3 Shared DEV strategy

For shared DEV:
- create the initial admin through a controlled bootstrap step
- deliver credentials out of band
- force immediate rotation after the first controlled access
- never expose long-lived shared passwords in code, docs, migrations, or seed artifacts committed to Git

### 10.4 Important bootstrap constraint

The current platform exposes public tenant creation, but the first authenticated administrative user still requires a controlled bootstrap process.

Therefore the first usable DEV environment must include one of the following:
- a controlled bootstrap seed routine
- an internal bootstrap script
- a temporary environment initialization procedure executed by the development owner

Without this step, the environment is technically running but not operationally usable.

---

## 11. Environment Variables

Minimum variables for first usable DEV:

| Variable | Purpose | Example DEV value |
|---|---|---|
| `PORT` | backend HTTP port | `3000` |
| `DB_HOST` | PostgreSQL host | `127.0.0.1` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL user | local DEV user |
| `DB_PASSWORD` | PostgreSQL password | local DEV secret |
| `DB_NAME` | PostgreSQL database | `anexsys_dev` |
| `DB_SCHEMA` | PostgreSQL schema | `public` |
| `DB_LOGGING` | SQL logging toggle | `false` by default |
| `JWT_SECRET` | token signing secret | generated DEV-only secret |

Recommended local `.env` responsibilities:
- keep the file local and uncommitted
- use DEV-only secrets
- separate local DEV values from shared DEV values

---

## 12. Infrastructure Requirements

### 12.1 Local infrastructure

The first local DEV environment requires:
- one developer workstation
- one running backend process
- one PostgreSQL instance
- browser access to the backend or frontend shell target

### 12.2 Shared DEV infrastructure

The first shared DEV environment should include:
- one backend deployment
- one PostgreSQL database
- one DNS entry for `dev.anexsys.com.br`
- one reverse-proxy or ingress layer for HTTP publication
- one secret-management approach for environment variables and bootstrap credentials

### 12.3 Operational minimums

Shared DEV should also provide:
- database backup discipline
- application log access
- deployment restart capability
- controlled access by internal team members only

### 12.4 Explicit non-goals for first DEV

The first usable DEV environment does not need to be treated as production.

It does not need full production-grade:
- scale-out
- HA topology
- pilot-grade security closure
- production-grade audit closure

Those belong to later hardening and production-readiness milestones.

---

## 13. Development Deployment

### 13.1 First shared DEV topology

Recommended first shared DEV topology:
- one NestJS backend deployment
- one PostgreSQL database
- one published base URL
- one stable DEV tenant and DEV branch

### 13.2 Deployment objective

The goal of the first shared DEV deployment is:
- internal browser access
- environment stability for iterative validation
- shared access for backend, frontend, QA, and business validation

### 13.3 Deployment rule

The first shared DEV deployment should prioritize stability over sophistication.

Recommended rule:
- deploy a single stable backend instance first
- add more moving parts only when they become necessary for implemented capabilities

---

## 14. `dev.anexsys.com.br` Deployment Plan

### 14.1 Deployment target

`dev.anexsys.com.br` is the first shared browser-access environment for ANEXSYS iterative development.

### 14.2 Deployment phases

#### Phase 1 - Infrastructure preparation
- provision PostgreSQL
- provision the backend runtime host
- prepare DNS for `dev.anexsys.com.br`
- prepare reverse proxy or ingress
- load environment variables and secrets

#### Phase 2 - Backend publication
- install dependencies or deploy the built artifact
- run migrations against the DEV database
- start the backend application
- publish the backend through the DEV domain infrastructure

#### Phase 3 - Controlled bootstrap
- create the DEV tenant
- create the DEV branch
- create the initial admin user through the controlled bootstrap path
- create the test users
- create seed customer and sample Service Order records

#### Phase 4 - Functional smoke validation
- confirm login works
- confirm tenant and branch scope work
- confirm Customer Portal user can authenticate
- confirm Smart Concierge access works
- confirm one sample Service Order can be viewed in the intended DEV flow

### 14.3 Publication rule

`dev.anexsys.com.br` should be considered usable only after:
- backend deployment is reachable
- migrations are complete
- bootstrap users exist
- the first operational validation flow passes

---

## 15. First Operational Validation Flow

The first operational validation flow should be simple, repeatable, and cross-domain.

### 15.1 Validation objective

Prove that the first DEV environment is operationally usable.

### 15.2 Validation flow

1. Start PostgreSQL.
2. Run migrations.
3. Start the backend.
4. Bootstrap the DEV tenant, DEV branch, admin user, and test users.
5. Authenticate as Platform Admin.
6. Confirm authenticated access returns tenant-scoped context.
7. Create or confirm one sample CRM customer.
8. Create or confirm one sample Service Order.
9. Link one Customer Portal profile.
10. Create or confirm one storage location for retrieval context.
11. Authenticate as Customer Portal User.
12. Confirm customer-safe portal access works.
13. Authenticate as Smart Concierge User.
14. Confirm queue/reception access works.

### 15.3 Minimum success criteria

The first DEV environment is usable when:
- the backend is reachable
- login works
- tenant scoping works
- branch scoping works
- a sample Service Order exists
- Customer Portal access works
- Smart Concierge access works

---

## 16. Step-by-Step First-Run Guide

1. Open `/home/runner/work/anexsys-platform/anexsys-platform`.
2. Run `npm install`.
3. Prepare a local `.env` with the required DEV variables.
4. Start PostgreSQL locally or through Docker.
5. Create the `anexsys_dev` database.
6. Run `npm run migration:run`.
7. Run `npm run start:dev`.
8. Execute the controlled bootstrap for tenant, branch, admin, and test users.
9. Validate authentication.
10. Validate one seeded Service Order flow.
11. Validate Customer Portal access.
12. Validate Smart Concierge access.

---

## 17. Explicit Answer

### What is the earliest date/state where ANEXSYS can be accessed through a web browser?

There is no approved calendar date in the baseline.

The earliest approved **state** is:
- **after Sprint 1**

Approved rationale:
- `dev.anexsys.com.br` can be deployed after Sprint 1 with tenant, branch, identity, authentication, authorization, and portal shell foundations available for iterative development

Current status relative to that milestone:
- ANEXSYS is already beyond that point because Sprint 10 is completed
- therefore the first usable DEV environment defined here can be prepared immediately
