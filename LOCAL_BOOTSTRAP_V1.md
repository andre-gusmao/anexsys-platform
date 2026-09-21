# LOCAL_BOOTSTRAP_V1

## Objective

Define the official local bootstrap procedure for ANEXSYS when:

- backend is already running successfully
- frontend is already running successfully
- PostgreSQL is already running
- database `anexsys` already exists
- login screen is already available at `http://localhost:3001/login`
- there is no tenant
- there is no branch
- there is no administrator user

## Source-code basis

This procedure is based on the real source code in:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/http/tenants.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/http/branches.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/http/roles.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/http/permissions.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/application/tenant/tenant.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/application/branch/branch.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/identity/identity.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/.env.example`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

## Important constraint

The repository does **not** contain a committed bootstrap script for first-time local administration.

The repository does **not** expose a full unauthenticated HTTP bootstrap flow.

What the source code allows:

- `POST /api/v1/tenants` is public
- branch creation requires authenticated `branches.write`
- user creation requires authenticated `users.write`
- role creation requires authenticated `roles.write`
- permission creation requires authenticated `permissions.write`
- role assignment requires authenticated `users.write`
- branch scope assignment requires authenticated `users.write`

Because of that, an empty local database cannot be bootstrapped completely by HTTP alone.

## Official local bootstrap decision

The official local bootstrap path is:

1. build the backend
2. run a one-off Node bootstrap command from the repository root
3. create the first tenant, first branch, first administrator, tenant-admin role, permissions, role assignment, and branch scope through the real Nest application services
4. validate authentication through `/api/v1/auth/login/password`
5. perform the first frontend login at `http://localhost:3001/login`

## Exact bootstrap values

Use these exact local values:

### Tenant

- Tenant code: `ANXDEV`
- Legal name: `ANEXSYS DEV LTDA`
- Display name: `ANEXSYS DEV`

### Branch

- Branch code: `HQ`
- Legal name: `ANEXSYS DEV MATRIZ`
- Display name: `Matriz`
- Business calendar name: `Calendario Local`

### Administrator

- Admin email: `andre@anexsys.local`
- Admin password: `AnexsysLocal123!`
- Display name: `Andre Local Admin`

### Role

- Role code: `TENANT_ADMIN`
- Role display name: `Tenant Admin`

### Permissions assigned to the role

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

### Branch scope assigned to the administrator

- Scope type: `admin`

## SQL commands

No SQL is required for the official creation flow.

The official creation flow uses Nest application services, not direct inserts.

Optional SQL verification queries are provided later in this document.

## API requests

API is used for validation after bootstrap:

- `POST /api/v1/auth/login/password`
- `GET /api/v1/auth/me`

## Bootstrap scripts

No committed bootstrap script currently exists in the repository.

Use the one-off bootstrap command below.

## Step 1 - Build the backend

Run from:

- `/home/runner/work/anexsys-platform/anexsys-platform`

Command:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform
npm run build
```

## Step 2 - Run the official bootstrap command

Run from:

- `/home/runner/work/anexsys-platform/anexsys-platform`

Command:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform

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

const bootstrapValues = {
  tenant: {
    code: 'ANXDEV',
    legalName: 'ANEXSYS DEV LTDA',
    displayName: 'ANEXSYS DEV',
  },
  branch: {
    code: 'HQ',
    legalName: 'ANEXSYS DEV MATRIZ',
    displayName: 'Matriz',
    businessCalendarName: 'Calendario Local',
  },
  admin: {
    email: 'andre@anexsys.local',
    displayName: 'Andre Local Admin',
    password: 'AnexsysLocal123!',
  },
  role: {
    code: 'TENANT_ADMIN',
    displayName: 'Tenant Admin',
  },
  permissions: [
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
  ],
};

(async () => {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

  try {
    const tenantService = app.get(TenantService);
    const branchService = app.get(BranchService);
    const identityService = app.get(IdentityService);
    const authorizationService = app.get(AuthorizationService);

    const existingTenant = (await tenantService.list()).find((tenant) => tenant.code === bootstrapValues.tenant.code);
    if (existingTenant) {
      throw new Error(`Tenant code '${bootstrapValues.tenant.code}' already exists. Use a clean database or change the bootstrap values.`);
    }

    const bootstrapActorId = randomUUID();

    const tenant = await tenantService.create({
      code: bootstrapValues.tenant.code,
      legalName: bootstrapValues.tenant.legalName,
      displayName: bootstrapValues.tenant.displayName,
      actorUserId: bootstrapActorId,
    });

    const branch = await branchService.create({
      tenantId: tenant.id,
      code: bootstrapValues.branch.code,
      legalName: bootstrapValues.branch.legalName,
      displayName: bootstrapValues.branch.displayName,
      businessCalendarName: bootstrapValues.branch.businessCalendarName,
      actorUserId: bootstrapActorId,
    });

    const adminUser = await identityService.createUser({
      tenantId: tenant.id,
      defaultBranchId: branch.id,
      email: bootstrapValues.admin.email,
      displayName: bootstrapValues.admin.displayName,
      password: bootstrapValues.admin.password,
      actorUserId: bootstrapActorId,
    });

    const role = await authorizationService.createRole({
      tenantId: tenant.id,
      code: bootstrapValues.role.code,
      displayName: bootstrapValues.role.displayName,
      actorUserId: adminUser.id,
    });

    const permissionIds = [];
    for (const permissionCode of bootstrapValues.permissions) {
      const permission = await authorizationService.createPermission({
        tenantId: tenant.id,
        code: permissionCode,
        displayName: permissionCode,
        actorUserId: adminUser.id,
      });

      permissionIds.push(permission.id);

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
      adminUserId: adminUser.id,
      roleId: role.id,
      permissionCount: permissionIds.length,
      adminEmail: bootstrapValues.admin.email,
      adminPassword: bootstrapValues.admin.password,
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

## Step 3 - Capture the exact generated identifiers

The command prints JSON similar to this:

```json
{
  "tenantId": "GENERATED_TENANT_UUID",
  "branchId": "GENERATED_BRANCH_UUID",
  "adminUserId": "GENERATED_USER_UUID",
  "roleId": "GENERATED_ROLE_UUID",
  "permissionCount": 10,
  "adminEmail": "andre@anexsys.local",
  "adminPassword": "AnexsysLocal123!"
}
```

At this point, record:

- Tenant UUID = value returned as `tenantId`
- Branch UUID = value returned as `branchId`
- Admin Email = `andre@anexsys.local`
- Admin Password = `AnexsysLocal123!`

## Step 4 - Optional SQL verification

Use these queries only to verify the bootstrap result.

### Verify tenant

```sql
SELECT id, code, display_name, status
FROM tenants
WHERE code = 'ANXDEV';
```

### Verify branch

```sql
SELECT id, tenant_id, code, display_name, status, business_calendar_name
FROM branches
WHERE code = 'HQ';
```

### Verify administrator user

```sql
SELECT id, tenant_id, default_branch_id, email, display_name, status
FROM user_identities
WHERE email = 'andre@anexsys.local';
```

### Verify role and assigned permissions

```sql
SELECT r.code AS role_code, p.code AS permission_code
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.code = 'TENANT_ADMIN'
ORDER BY p.code;
```

### Verify role assignment and branch scope

```sql
SELECT
  ura.user_id,
  r.code AS role_code,
  ura.assigned_branch_id,
  ubs.branch_id,
  ubs.scope_type
FROM user_role_assignments ura
JOIN roles r ON r.id = ura.role_id
JOIN user_branch_scopes ubs ON ubs.user_id = ura.user_id AND ubs.branch_id = ura.assigned_branch_id
WHERE r.code = 'TENANT_ADMIN';
```

## Step 5 - Validate authentication by API

Replace:

- `GENERATED_TENANT_UUID` with the `tenantId` printed by the bootstrap command
- `GENERATED_BRANCH_UUID` with the `branchId` printed by the bootstrap command

### Login request

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

Because this bootstrap creates only one branch for the tenant, `branchIds` should contain exactly the generated branch UUID.

### Session validation request

Use the `accessToken` returned by login:

The authorization header must use the standard Bearer-token format with the access token returned by the login response.

```bash
curl -s \
  http://127.0.0.1:3000/api/v1/auth/me \
  -H "authorization: ******" \
  -H "x-tenant-id: GENERATED_TENANT_UUID" \
  -H "x-branch-id: GENERATED_BRANCH_UUID"
```

Expected result:

- the admin user record
- `effectiveAccess.permissions` including the 10 bootstrap permissions
- `effectiveAccess.branchIds` containing the generated branch UUID
- `context.tenantId` equal to the generated tenant UUID
- `context.branchId` equal to the generated branch UUID

## Step 6 - Configure the frontend for the first login

Update or create:

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/.env.local`

Use:

```env
BACKEND_ORIGIN=http://127.0.0.1:3000
NEXT_PUBLIC_TENANT_OPTIONS=[{"id":"GENERATED_TENANT_UUID","label":"ANEXSYS DEV","hint":"Local bootstrap tenant"}]
```

If the frontend is already running, restart it after changing `.env.local`.

## Step 7 - Perform the first login

1. Open `http://localhost:3001/login`
2. In `Known tenant`, select `ANEXSYS DEV` if it appears
3. If needed, paste `GENERATED_TENANT_UUID` into the `Tenant ID` field
4. Enter email: `andre@anexsys.local`
5. Enter password: `AnexsysLocal123!`
6. Submit the form

Expected frontend behavior:

- login succeeds
- session is loaded from the backend
- because only one branch exists, the frontend should auto-select it
- the browser should proceed into the authenticated administrative shell without requiring manual branch selection

## Required answers

### How to create the first Tenant

Run the official bootstrap command in Step 2. It creates the tenant through `TenantService.create`.

### How to create the first Branch

Run the official bootstrap command in Step 2. It creates the branch through `BranchService.create`.

### How to create the first Administrator User

Run the official bootstrap command in Step 2. It creates the admin user through `IdentityService.createUser`.

### How to assign Tenant Admin role

Run the official bootstrap command in Step 2. It creates the `TENANT_ADMIN` role, creates the required permissions, assigns those permissions to the role, and assigns that role to the admin user.

### How to assign Branch scope

Run the official bootstrap command in Step 2. It assigns `admin` branch scope for the generated branch to the admin user.

### How to validate authentication

Run the login and `/auth/me` requests from Step 5.

### How to perform the first login

Follow Steps 6 and 7.

## Final answer

### What exact credentials should André use to perform the first successful login in the local environment?

Use:

- Tenant UUID: the exact `tenantId` printed by the Step 2 bootstrap command
- Branch UUID: the exact `branchId` printed by the Step 2 bootstrap command
- Admin Email: `andre@anexsys.local`
- Admin Password: `AnexsysLocal123!`
