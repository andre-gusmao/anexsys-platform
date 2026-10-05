# MASTER_ADMIN_AUTHORIZATION_FIX_V1

## 1. Root Cause

The current bootstrap gap is not in tenant resolution or branch existence.

The failure is in the **authorization graph** required after login:

- the user exists
- the tenant exists
- the branch exists
- `default_branch_id` is populated

but the authenticated user still has no effective authorization grants because the bootstrap did not create the required authorization records that feed `getEffectiveAccessForUser(...)`.

That leaves:

- `permissions = []`
- `branchIds = []`
- no visible operational menus such as Customers
- no branch automatically selected in the frontend session context

## 2. Why Are Permissions Zero?

Permissions are zero because effective permissions are computed from:

- `user_role_assignments` → `role_permissions`
- `user_communities` → `community_permissions`

The effective-access code is:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`

The calculation reads:

- active role assignments
- branch scopes
- community memberships
- permissions attached to roles
- permissions attached to communities

If the bootstrap admin user has no role assignment and no community membership carrying permission links, the result is an empty permission set.

## 3. Why Is Branch Not Auto-Selected?

The branch is not auto-selected because the frontend only restores an active branch when the authenticated effective access includes at least one allowed branch.

Even if:

- `user_identities.default_branch_id` is populated

the frontend still needs `effectiveAccess.branchIds` to contain that branch.

Without role/branch-scope bootstrap records:

- `effectiveAccess.branchIds = []`

So the frontend cannot restore the branch automatically and falls back to:

- `Branch: Select branch`

## 4. Which Tables Should Contain Role/Community Assignments?

For a usable bootstrap admin context, the following tables must contain records:

### Governance and identity
- `tenants`
- `branches`
- `user_identities`
- `user_credentials`

### Authorization model
- `roles`
- `permissions`
- `role_permissions`
- `user_role_assignments`
- `communities`
- `community_permissions`
- `user_communities`
- `user_branch_scopes`

### Context restoration
- `user_context_preferences`

## 5. What Exact Records Were Missing for the Bootstrap Admin User?

For the bootstrap admin user, the missing records are the authorization/context records below:

### Required role
- role with code `MASTER_ADMINISTRATOR`

### Required community
- community with code `GLOBAL_ADMINISTRATORS`

### Required permissions
- all current permission codes used by the application controllers

### Required links
- `role_permissions` linking the Master Administrator role to all current permission codes
- `community_permissions` linking the Global Administrators community to all current permission codes
- `user_role_assignments` linking the bootstrap admin user to `MASTER_ADMINISTRATOR`
- `user_communities` linking the bootstrap admin user to `GLOBAL_ADMINISTRATORS`
- `user_branch_scopes` linking the bootstrap admin user to branch `Matriz` with `admin` scope

### Required context record
- `user_context_preferences` row for `<email-do-administrador>` with:
  - `last_tenant_id = ANEXSYS DEV tenant id`
  - `last_branch_id = Matriz branch id`

## 6. Implemented Fix

### Official committed bootstrap command

Added package command:

- `npm run bootstrap:master-admin`

### Committed bootstrap script

Added:

- `/home/runner/work/anexsys-platform/anexsys-platform/scripts/bootstrap-master-admin.cjs`

This script now ensures:

- tenant `ANEXSYS DEV`
- branch `Matriz`
- admin user `<email-do-administrador>`
- community `Global Administrators`
- role `Master Administrator`
- all current permission records
- role-to-permission links
- community-to-permission links
- user-to-role assignment
- user-to-community membership
- admin branch scope
- `user_context_preferences` persistence for tenant and branch restoration

The script is idempotent and can repair a partially bootstrapped environment.

### Branch context persistence improvement

Updated login behavior so that single-company login persists a valid branch context immediately when a valid default branch can already be inferred from effective access.

This closes the gap where:

- tenant login succeeded
- branch existed
- default branch existed
- but `last_branch_id` remained empty

## 7. Files Modified

- `/home/runner/work/anexsys-platform/anexsys-platform/package.json`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/unit/auth.service.spec.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/scripts/bootstrap-master-admin.cjs`
- `/home/runner/work/anexsys-platform/anexsys-platform/MASTER_ADMIN_AUTHORIZATION_FIX_V1.md`

## 8. Exact Command to Repair the Bootstrap Admin

If the user already exists:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform && npm run bootstrap:master-admin
```

If the user does not yet exist and must be created:

```bash
cd /home/runner/work/anexsys-platform/anexsys-platform && BOOTSTRAP_ADMIN_PASSWORD='<set-admin-password>' npm run bootstrap:master-admin
```

## 9. Required Validations Now Covered

The fix is designed so that after bootstrap:

1. branch context restores automatically after login
2. `last_branch_id` is persisted in `user_context_preferences`
3. effective permissions are greater than zero
4. Customers menu becomes visible
5. the bootstrap admin can access all current pilot screens protected by the current permission set
