# MASTER_DATA_NAVIGATION_AND_SMART_LOOKUP_V1

## Objective

Make the existing administrative menus operational and implement the ANEXSYS Smart Lookup pattern so users can create missing master data without leaving the current workflow.

## Implemented

### 1. Companies workspace

- Replaced the placeholder route at `frontend/src/app/(authenticated)/admin/tenants/page.tsx`
- Added `frontend/src/components/admin/companies-workspace.tsx`
- Delivered:
  - grid
  - search
  - create
  - edit
  - view
- Kept the current repository architecture intact:
  - current company flow remains aligned to the live Tenant-based implementation
  - no Tenant/Company/Branch refactor was introduced

### 2. Branches workspace

- Replaced the placeholder route at `frontend/src/app/(authenticated)/admin/branches/page.tsx`
- Added `frontend/src/components/admin/branches-workspace.tsx`
- Delivered:
  - grid
  - search
  - create
  - edit
  - view
  - activate/deactivate
  - child-branch visibility
- Reused current backend endpoints:
  - `GET /branches`
  - `POST /branches`
  - `GET /branches/:branchId`
  - `PATCH /branches/:branchId`
  - `POST /branches/:branchId/activate`
  - `POST /branches/:branchId/deactivate`
  - `GET /branches/:branchId/children`

### 3. Users and Access workspace

- Replaced the placeholder route at `frontend/src/app/(authenticated)/admin/access/page.tsx`
- Added `frontend/src/components/admin/access-workspace.tsx`
- Delivered:
  - Users tab
  - Roles tab
  - Permissions tab
  - Communities tab
- Users tab includes:
  - grid
  - search
  - create
  - edit
  - view
  - role assignment
  - branch scope assignment
  - community assignment
  - effective access summary
- Roles, Permissions, and Communities now support operational create/edit/view flows from the same workspace

### 4. Smart Lookup standard component

- Added reusable component:
  - `frontend/src/components/ui/smart-lookup.tsx`
- Behavior implemented:
  - user searches existing records
  - when no result exists, the UI offers `+ Create New Record`
  - quick-create opens inline inside the same workflow
  - after save, the original form is restored
  - the newly created record is automatically selected

### 5. Smart Lookup application

The new pattern is now applied in currently supported operational flows:

- User default branch selection
- Branch parent selection
- Customer measurement body-part selection
- Customer measurement unit selection

Quick-create is already wired for:

- Branches
- Body Parts
- Measurement Units

The component was designed as future-ready architecture for:

- Customers
- Suppliers
- Companies
- Branches
- Services
- Products
- Employees
- Body Parts
- Measurement Units

### 6. Backend support added

Updated backend to support the new operational edit/view flows:

- `src/modules/identity/application/identity/identity.service.ts`
  - added user update support
- `src/modules/identity/http/users.controller.ts`
  - added `PATCH /users/:userId`
  - added `GET /users/:userId/access-summary`
- `src/modules/authorization/application/authorization/authorization.service.ts`
  - added role update support
  - added permission update support
  - added community update support
  - added user access summary aggregation
- `src/modules/authorization/http/roles.controller.ts`
  - added `PATCH /roles/:roleId`
- `src/modules/authorization/http/permissions.controller.ts`
  - added `GET /permissions/:permissionId`
  - added `PATCH /permissions/:permissionId`
- `src/modules/authorization/http/communities.controller.ts`
  - added `PATCH /communities/:communityId`

## UX principle achieved

Implemented the requested ANEXSYS UX rule:

> Never force users to leave the current workflow to create missing master data.

This is now operational in the delivered Smart Lookup flows.

## Validation

Executed successfully:

- `npm run build`
- `npm run test:unit`
- `npm run frontend:lint`
- `npm run frontend:build`
- `parallel_validation`

Environment-dependent validation:

- `npm run test:integration`
  - executed
  - failed in the sandbox with `connect ECONNREFUSED 127.0.0.1:5432`
  - the current integration suite depends on local PostgreSQL availability for bootstrap and migrations

## Main files changed

### Frontend

- `frontend/src/app/(authenticated)/admin/tenants/page.tsx`
- `frontend/src/app/(authenticated)/admin/branches/page.tsx`
- `frontend/src/app/(authenticated)/admin/access/page.tsx`
- `frontend/src/components/admin/companies-workspace.tsx`
- `frontend/src/components/admin/branches-workspace.tsx`
- `frontend/src/components/admin/access-workspace.tsx`
- `frontend/src/components/ui/smart-lookup.tsx`
- `frontend/src/components/customers/customer-workspace.tsx`
- `frontend/src/app/globals.css`

### Backend

- `src/modules/identity/application/identity/identity.service.ts`
- `src/modules/identity/http/users.controller.ts`
- `src/modules/authorization/application/authorization/authorization.service.ts`
- `src/modules/authorization/http/roles.controller.ts`
- `src/modules/authorization/http/permissions.controller.ts`
- `src/modules/authorization/http/communities.controller.ts`
