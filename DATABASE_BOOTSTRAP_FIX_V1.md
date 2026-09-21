# DATABASE_BOOTSTRAP_FIX_V1

## Objective

Define the correct migration execution strategy for this repository and the fastest path to obtain a working login.

Current state:

- PostgreSQL is running
- database `anexsys` exists
- backend starts successfully
- frontend starts successfully
- login screen is available

Problem:

- TypeORM migrations fail because the migration CLI cannot resolve imports that use the configured `src/*` alias

## Source-code basis

This analysis is based on the real repository files:

- `/home/runner/work/anexsys-platform/anexsys-platform/package.json`
- `/home/runner/work/anexsys-platform/anexsys-platform/tsconfig.json`
- `/home/runner/work/anexsys-platform/anexsys-platform/tsconfig.build.json`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/data-source.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/typeorm.config.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/entities.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/http/tenants.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/http/branches.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/http/roles.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/http/permissions.controller.ts`

## 1. Why `migration:run` fails

The current script is:

```json
"migration:run": "typeorm-ts-node-commonjs -d src/platform/database/typeorm/data-source.ts migration:run"
```

The repository configures path aliases in:

- `/home/runner/work/anexsys-platform/anexsys-platform/tsconfig.json`

Specifically:

```json
"paths": {
  "src/*": ["src/*"],
  "test/*": ["test/*"]
}
```

The TypeORM entity registry file:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/entities.ts`

imports entity classes using `src/...` paths, for example:

- `src/modules/audit/infrastructure/persistence/entities/audit-event.entity`

Root cause:

- `typeorm-ts-node-commonjs` registers `ts-node`
- but the current script does **not** register `tsconfig-paths`
- therefore Node can transpile TypeScript, but cannot resolve the `src/*` alias at runtime

That is why the CLI fails with errors such as:

- `Cannot find module: src/modules/audit/infrastructure/persistence/entities/audit-event.entity`

Even though the file exists.

## 2. Should TypeORM CLI use ts-node, tsconfig-paths, or compiled dist files?

### Correct answer

For this repository, the correct primary strategy is:

- **use `ts-node`**
- **use `tsconfig-paths`**
- **run the CLI against `src/platform/database/typeorm/data-source.ts`**

### Why

`/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/data-source.ts` is designed to load:

- TypeScript migrations when executed as `.ts`
- JavaScript migrations when executed as `.js`

It does this with:

```ts
const migrationExtension = extname(__filename) === '.ts' ? 'ts' : 'js';
```

So:

- when using the source data source, the migration runtime is naturally TypeScript-based
- the missing piece is alias resolution, which requires `tsconfig-paths/register`

### Should compiled `dist` files be used?

Not as the primary migration fix.

Use of compiled `dist` files is appropriate for:

- application runtime
- integration tests that explicitly boot compiled output

But for migrations, the simplest and most reliable fix for the current repository is:

- `ts-node` + `tsconfig-paths` + source `data-source.ts`

## 3. Required package.json changes

### Dev dependency

Add an explicit direct dev dependency:

```json
"tsconfig-paths": "4.2.0"
```

Exact command:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform
npm install --save-dev tsconfig-paths@4.2.0
```

Reason:

- the repository should not rely on `tsconfig-paths` only as a transitive dependency
- the migration command uses it directly
- it must be declared explicitly

### Recommended script changes

Replace the migration scripts in:

- `/home/runner/work/anexsys-platform/anexsys-platform/package.json`

with:

```json
"migration:run": "node -r ts-node/register/transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/platform/database/typeorm/data-source.ts migration:run",
"migration:revert": "node -r ts-node/register/transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/platform/database/typeorm/data-source.ts migration:revert",
"migration:show": "node -r ts-node/register/transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/platform/database/typeorm/data-source.ts migration:show"
```

## 4. Exact command required to create all database tables

After installing dependencies, run from:

- `/home/runner/work/anexsys-platform/anexsys-platform`

### One-off command

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform
node -r ts-node/register/transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/platform/database/typeorm/data-source.ts migration:run
```

### If package.json has been updated

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform
npm run migration:run
```

This is the command that should create all database tables defined by the 11 migration files under:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations`

## 5. Bootstrap strategy after migrations

The repository still has this constraint:

- first-time local bootstrap has no committed public seed script
- only tenant creation is public by HTTP
- first branch, first admin user, first role, and first scope require a controlled bootstrap path

So the correct bootstrap flow is:

1. run migrations
2. run a one-off Nest-service bootstrap command
3. validate auth by API
4. perform first login in the frontend

## 6. First tenant, first branch, first admin user

Use these exact local values:

### Tenant

- code: `ANXDEV`
- legal name: `ANEXSYS DEV LTDA`
- display name: `ANEXSYS DEV`

### Branch

- code: `HQ`
- legal name: `ANEXSYS DEV MATRIZ`
- display name: `Matriz`
- business calendar name: `Calendario Local`

### Administrator

- email: `andre@anexsys.local`
- display name: `Andre Local Admin`
- password: `AnexsysLocal123!`

### Role

- code: `TENANT_ADMIN`
- display name: `Tenant Admin`

### Permissions

- `tenants.read`
- `tenants.write`
- `branches.read`
- `branches.write`
- `roles.read`
- `roles.write`
- `permissions.read`
- `permissions.write`
- `users.read`
- `users.write`

### Branch scope

- `admin`

## 7. Exact bootstrap command

Run from:

- `/home/runner/work/anexsys-platform/anexsys-platform`

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform

npm run build

node <<'NODE'
require('reflect-metadata');

const { randomUUID } = require('node:crypto');
const { NestFactory } = require('@nestjs/core');

const { AppModule } = require('./dist/app.module.js');
const { TenantService } = require('./dist/modules/tenant/application/tenant/tenant.service.js');
const { BranchService } = require('./dist/modules/branch/application/branch/branch.service.js');
const { IdentityService } = require('./dist/modules/identity/application/identity/identity.service.js');
const { AuthorizationService } = require('./dist/modules/authorization/application/authorization/authorization.service.js');
const { BranchScopeType } = require('./dist/shared/domain/enums.js');

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const tenantService = app.get(TenantService);
    const branchService = app.get(BranchService);
    const identityService = app.get(IdentityService);
    const authorizationService = app.get(AuthorizationService);

    const bootstrapActorId = randomUUID();

    const tenant = await tenantService.create({
      code: 'ANXDEV',
      legalName: 'ANEXSYS DEV LTDA',
      displayName: 'ANEXSYS DEV',
      actorUserId: bootstrapActorId,
    });

    const branch = await branchService.create({
      tenantId: tenant.id,
      code: 'HQ',
      legalName: 'ANEXSYS DEV MATRIZ',
      displayName: 'Matriz',
      businessCalendarName: 'Calendario Local',
      actorUserId: bootstrapActorId,
    });

    const adminUser = await identityService.createUser({
      tenantId: tenant.id,
      defaultBranchId: branch.id,
      email: 'andre@anexsys.local',
      displayName: 'Andre Local Admin',
      password: 'AnexsysLocal123!',
      actorUserId: bootstrapActorId,
    });

    const role = await authorizationService.createRole({
      tenantId: tenant.id,
      code: 'TENANT_ADMIN',
      displayName: 'Tenant Admin',
      actorUserId: adminUser.id,
    });

    for (const permissionCode of [
      'tenants.read',
      'tenants.write',
      'branches.read',
      'branches.write',
      'roles.read',
      'roles.write',
      'permissions.read',
      'permissions.write',
      'users.read',
      'users.write',
    ]) {
      const permission = await authorizationService.createPermission({
        tenantId: tenant.id,
        code: permissionCode,
        displayName: permissionCode,
        actorUserId: adminUser.id,
      });

      await authorizationService.assignPermissionToRole({
        tenantId: tenant.id,
        roleId: role.id,
        permissionId: permission.id,
        actorUserId: adminUser.id,
      });
    }

    await authorizationService.assignRole({
      tenantId: tenant.id,
      userId: adminUser.id,
      roleId: role.id,
      assignedBranchId: branch.id,
      actorUserId: adminUser.id,
    });

    await authorizationService.assignBranchScope({
      tenantId: tenant.id,
      userId: adminUser.id,
      branchId: branch.id,
      scopeType: BranchScopeType.ADMIN,
      actorUserId: adminUser.id,
    });

    console.log(JSON.stringify({
      tenantId: tenant.id,
      branchId: branch.id,
      adminEmail: 'andre@anexsys.local',
      adminPassword: 'AnexsysLocal123!',
    }, null, 2));
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE
```

## 8. Validation procedure

## Step A - Validate migration discovery

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform
node -r ts-node/register/transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/platform/database/typeorm/data-source.ts migration:show
```

Expected result:

- the migration list loads without `Cannot find module: src/...`

## Step B - Validate table creation

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected result:

- core tables such as `tenants`, `branches`, `user_identities`, `roles`, `permissions`, `user_role_assignments`, `user_branch_scopes`

## Step C - Validate login by API

Replace `GENERATED_TENANT_UUID` with the tenant ID printed by the bootstrap command.

```bash
curl -s \
  -X POST http://127.0.0.1:3000/api/v1/auth/login/password \
  -H 'content-type: application/json' \
  -d '{
    "tenantId": "GENERATED_TENANT_UUID",
    "email": "andre@anexsys.local",
    "password": "AnexsysLocal123!"
  }'
```

Expected result:

- `accessToken`
- `refreshToken`
- `sessionId`
- `branchIds`
- `permissions`

## Step D - Validate authenticated context

Replace:

- `ACCESS_TOKEN_FROM_LOGIN`
- `GENERATED_TENANT_UUID`
- `GENERATED_BRANCH_UUID`

The authorization header must use the standard Bearer-token format with the access token returned by the login response.

```bash
curl -s \
  http://127.0.0.1:3000/api/v1/auth/me \
  -H "authorization: ******" \
  -H "x-tenant-id: GENERATED_TENANT_UUID" \
  -H "x-branch-id: GENERATED_BRANCH_UUID"
```

Expected result:

- authenticated admin user
- effective permissions
- effective branch scope

## Step E - Validate frontend login

Update:

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/.env.local`

with:

```env
BACKEND_ORIGIN=http://127.0.0.1:3000
NEXT_PUBLIC_TENANT_OPTIONS=[{"id":"GENERATED_TENANT_UUID","label":"ANEXSYS DEV","hint":"Local bootstrap tenant"}]
```

Then log in at:

- `http://localhost:3001/login`

with:

- email: `andre@anexsys.local`
- password: `AnexsysLocal123!`

## 9. Fastest path to a working login

The fastest path is:

1. install dependencies
2. add `tsconfig-paths` as an explicit dev dependency
3. run migrations with `ts-node` + `tsconfig-paths`
4. run the one-off Nest-service bootstrap command
5. put the generated tenant UUID in `frontend/.env.local`
6. log in with `andre@anexsys.local` / `AnexsysLocal123!`

## Final answer

### What is the fastest path to obtain a working login?

Use this exact sequence:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform
npm install
npm run build
node -r ts-node/register/transpile-only -r tsconfig-paths/register ./node_modules/typeorm/cli.js -d src/platform/database/typeorm/data-source.ts migration:run
```

Then run the bootstrap command from Section 7, capture the generated `tenantId`, set it in:

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/.env.local`

and log in with:

- email: `andre@anexsys.local`
- password: `AnexsysLocal123!`
