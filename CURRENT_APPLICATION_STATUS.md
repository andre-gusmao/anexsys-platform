# CURRENT_APPLICATION_STATUS

## 1. Repository Summary

Current repository status:
- backend application exists and compiles locally
- frontend application source is **not** present in the repository
- backend runtime is a NestJS modular monolith
- persistence uses PostgreSQL through TypeORM migrations
- Customer Portal and Smart Concierge backend APIs are already implemented

Current execution conclusion:
- **ANEXSYS can already be executed locally**
- current local execution is **backend-only**
- there is **no frontend module or frontend runtime** in the current repository state

---

## 2. Existing Backend Modules

Modules currently present under `/home/runner/work/anexsys-platform/anexsys-platform/src/modules`:

1. Audit
2. Authorization
3. Branch
4. CRM
5. Custody
6. Customer Portal
7. Finance
8. Fiscal
9. Identity
10. Operational Resources
11. Pickup
12. Production Orders
13. Quality
14. Rework
15. Service Orders
16. Smart Concierge
17. Tenant
18. Warranty

Application wiring confirms these modules are loaded by `/home/runner/work/anexsys-platform/anexsys-platform/src/app.module.ts`.

---

## 3. Existing Frontend Modules

Current repository status:
- no frontend source module was found under:
  - `/home/runner/work/anexsys-platform/anexsys-platform/frontend`
  - `/home/runner/work/anexsys-platform/anexsys-platform/src/frontend`
  - `/home/runner/work/anexsys-platform/anexsys-platform/apps`
  - `/home/runner/work/anexsys-platform/anexsys-platform/web`

Conclusion:
- **there are no implemented frontend modules in the current repository**
- the repository contains frontend architecture documentation, but not a runnable frontend application

---

## 4. Existing Controllers

Controllers currently implemented:

### Identity and Access
- `auth.controller.ts`
- `users.controller.ts`
- `roles.controller.ts`
- `permissions.controller.ts`

### Tenant and Branch
- `tenants.controller.ts`
- `branches.controller.ts`

### CRM
- `customers.controller.ts`

### Service Orders
- `service-orders.controller.ts`

### Operational Resources
- `operational-resources.controller.ts`

### Production and QR
- `production-orders.controller.ts`
- `service-order-production-order.controller.ts`
- `qr-events.controller.ts`

### Quality, Rework, Warranty
- `quality-records.controller.ts`
- `customer-rejections.controller.ts`
- `rework-cases.controller.ts`
- `warranty-adjustments.controller.ts`
- `warranty-executions.controller.ts`

### Finance and Fiscal
- `payments.controller.ts`
- `service-order-finance.controller.ts`
- `cashflow.controller.ts`
- `financial-exceptions.controller.ts`
- `fiscal-documents.controller.ts`

### Custody and Pickup
- `storage-locations.controller.ts`
- `custody-events.controller.ts`
- `pickup-authorizations.controller.ts`

### Customer Experience
- `customer-portal.controller.ts`
- `smart-concierge.controller.ts`

Audit module exists, but no HTTP controller was found for it.

---

## 5. Existing API Endpoints

All routes are published under:
- `http://localhost:3000/api/v1`

### Authentication and Identity

`/auth`
- `POST /auth/login/password`
- `POST /auth/token/refresh`
- `POST /auth/logout`
- `GET /auth/me`

`/users`
- `GET /users`
- `POST /users`
- `GET /users/me/effective-permissions`
- `GET /users/:userId`
- `POST /users/:userId/roles`
- `POST /users/:userId/branch-scopes`

`/roles`
- `GET /roles`
- `POST /roles`
- `GET /roles/:roleId`
- `POST /roles/:roleId/permissions`

`/permissions`
- `GET /permissions`
- `POST /permissions`

### Tenant and Branch

`/tenants`
- `GET /tenants`
- `POST /tenants`
- `GET /tenants/:tenantId`
- `PATCH /tenants/:tenantId`
- `POST /tenants/:tenantId/activate`
- `POST /tenants/:tenantId/deactivate`

`/branches`
- `GET /branches`
- `POST /branches`
- `GET /branches/:branchId`
- `PATCH /branches/:branchId`
- `POST /branches/:branchId/activate`
- `POST /branches/:branchId/deactivate`
- `GET /branches/:branchId/children`

### CRM

`/customers`
- `GET /customers`
- `GET /customers/:customerId`
- `POST /customers`
- `PATCH /customers/:customerId`
- `GET /customers/:customerId/measurements`
- `POST /customers/:customerId/measurements`

### Service Orders

`/service-orders`
- `GET /service-orders`
- `POST /service-orders`
- `GET /service-orders/:serviceOrderId`
- `PATCH /service-orders/:serviceOrderId`
- `POST /service-orders/:serviceOrderId/items`
- `PATCH /service-orders/:serviceOrderId/items/:itemId`
- `POST /service-orders/:serviceOrderId/approve`
- `POST /service-orders/:serviceOrderId/cancel`
- `POST /service-orders/:serviceOrderId/delivery-date/recalculate`
- `GET /service-orders/:serviceOrderId/timeline`

### Operational Resources

`/operational-resources`
- `GET /operational-resources`
- `POST /operational-resources`
- `GET /operational-resources/:resourceId`
- `PATCH /operational-resources/:resourceId`
- `GET /operational-resources/:resourceId/skills`
- `POST /operational-resources/:resourceId/skills`
- `GET /operational-resources/:resourceId/availability`
- `PATCH /operational-resources/:resourceId/availability`
- `GET /operational-resources/:resourceId/assignments`

### Production Orders

`/service-orders/:serviceOrderId/production-order`
- `POST /service-orders/:serviceOrderId/production-order/generate`

`/production-orders`
- `GET /production-orders`
- `GET /production-orders/:productionOrderId`
- `PATCH /production-orders/:productionOrderId`
- `POST /production-orders/:productionOrderId/schedule`
- `POST /production-orders/:productionOrderId/start`
- `POST /production-orders/:productionOrderId/pause`
- `POST /production-orders/:productionOrderId/complete`
- `POST /production-orders/:productionOrderId/versions`
- `GET /production-orders/:productionOrderId/versions`
- `GET /production-orders/:productionOrderId/print-view`
- `GET /production-orders/:productionOrderId/qr`
- `POST /production-orders/:productionOrderId/qr/reissue`
- `GET /production-orders/:productionOrderId/qr-events`

### QR Events

`/qr-events`
- `GET /qr-events`
- `POST /qr-events/scan`

### Quality

`/quality-records`
- `GET /quality-records`
- `POST /quality-records`
- `GET /quality-records/:qualityRecordId`
- `PATCH /quality-records/:qualityRecordId`
- `POST /quality-records/:qualityRecordId/approve`
- `POST /quality-records/:qualityRecordId/reject`
- `POST /quality-records/:qualityRecordId/request-rework`
- `POST /quality-records/:qualityRecordId/request-warranty-execution`

`/production-orders/:productionOrderId/quality`
- `GET /production-orders/:productionOrderId/quality`

`/customer-rejections`
- `GET /customer-rejections`
- `POST /customer-rejections`
- `GET /customer-rejections/:customerRejectionId`
- `PATCH /customer-rejections/:customerRejectionId`

### Rework

`/rework-cases`
- `GET /rework-cases`
- `POST /rework-cases`
- `GET /rework-cases/:reworkCaseId`
- `PATCH /rework-cases/:reworkCaseId`
- `POST /rework-cases/:reworkCaseId/assign`
- `POST /rework-cases/:reworkCaseId/reassign`
- `POST /rework-cases/:reworkCaseId/close`
- `GET /rework-cases/:reworkCaseId/attribution`

### Warranty

`/warranty-adjustments`
- `GET /warranty-adjustments`
- `POST /warranty-adjustments`
- `GET /warranty-adjustments/:warrantyAdjustmentId`
- `PATCH /warranty-adjustments/:warrantyAdjustmentId`

`/warranty-executions`
- `GET /warranty-executions`
- `POST /warranty-executions`
- `GET /warranty-executions/:warrantyExecutionId`
- `PATCH /warranty-executions/:warrantyExecutionId`
- `POST /warranty-executions/:warrantyExecutionId/resolve`

### Finance

`/payments`
- `GET /payments`
- `POST /payments`
- `GET /payments/:paymentId`
- `POST /payments/:paymentId/allocations`

`/service-orders/:serviceOrderId`
- `GET /service-orders/:serviceOrderId/financial-summary`
- `GET /service-orders/:serviceOrderId/partial-payments`

`/cashflow`
- `GET /cashflow/expected`
- `GET /cashflow/actual`

`/financial-exceptions`
- `POST /financial-exceptions`
- `GET /financial-exceptions/:financialExceptionId`
- `POST /financial-exceptions/:financialExceptionId/resolve`

### Fiscal

`/fiscal-documents`
- `GET /fiscal-documents`
- `POST /fiscal-documents`
- `GET /fiscal-documents/:fiscalDocumentId`
- `POST /fiscal-documents/:fiscalDocumentId/issue`
- `POST /fiscal-documents/:fiscalDocumentId/cancel`
- `POST /fiscal-documents/:fiscalDocumentId/sync-status`

### Custody

`/storage-locations`
- `GET /storage-locations`
- `POST /storage-locations`
- `GET /storage-locations/:locationId`
- `PATCH /storage-locations/:locationId`

`/service-orders/:serviceOrderId`
- `GET /service-orders/:serviceOrderId/location`
- `POST /service-orders/:serviceOrderId/location-assignments`
- `GET /service-orders/:serviceOrderId/location-history`

`/custody-events`
- `GET /custody-events`
- `GET /custody-events/:custodyEventId`

### Pickup

`/pickup-authorizations`
- `GET /pickup-authorizations`
- `GET /pickup-authorizations/:pickupAuthorizationId`
- `POST /pickup-authorizations/:pickupAuthorizationId/tokens`
- `POST /pickup-authorizations/:pickupAuthorizationId/qr-codes`
- `POST /pickup-authorizations/:pickupAuthorizationId/temporary-codes`
- `POST /pickup-authorizations/:pickupAuthorizationId/remote-approval/request`
- `POST /pickup-authorizations/:pickupAuthorizationId/remote-approval/decision`
- `POST /pickup-authorizations/:pickupAuthorizationId/complete`

`/service-orders/:serviceOrderId`
- `POST /service-orders/:serviceOrderId/pickup-authorizations`

### Customer Portal

`/customer-portal`
- `POST /customer-portal/profiles`
- `GET /customer-portal/me`
- `PATCH /customer-portal/profile`
- `GET /customer-portal/orders`
- `GET /customer-portal/orders/:serviceOrderId`
- `GET /customer-portal/history`
- `POST /customer-portal/approvals/requests`
- `GET /customer-portal/approvals`
- `POST /customer-portal/approvals/:approvalId/approve`
- `POST /customer-portal/approvals/:approvalId/reject`
- `POST /customer-portal/approval-links/:approvalLinkToken/approve`
- `POST /customer-portal/approval-links/:approvalLinkToken/reject`
- `GET /customer-portal/pickup-authorizations`
- `POST /customer-portal/service-orders/:serviceOrderId/pickup-authorizations`
- `POST /customer-portal/pickup-authorizations/:pickupAuthorizationId/revoke`
- `GET /customer-portal/warranty-requests`
- `POST /customer-portal/warranty-requests`
- `GET /customer-portal/status-mappings`

### Smart Concierge

`/smart-concierge`
- `GET /smart-concierge/queue`
- `POST /smart-concierge/check-ins`
- `GET /smart-concierge/check-ins/:checkInId`
- `POST /smart-concierge/check-ins/:checkInId/handoff`
- `POST /smart-concierge/notifications`

---

## 6. Existing Database Migrations

Current migrations under `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations`:

1. `1760000000000-initial-sprint1-foundation.ts`
2. `1760000001000-add-crm-foundation.ts`
3. `1760000002000-add-service-order-foundation.ts`
4. `1760000003000-add-production-foundation.ts`
5. `1760000004000-add-qr-execution-tracking.ts`
6. `1760000005000-add-quality-rework-warranty.ts`
7. `1760000006000-add-warranty-config-and-start-rules.ts`
8. `1760000007000-add-finance-domain.ts`
9. `1760000008000-add-fiscal-domain.ts`
10. `1760000009000-add-pickup-custody-domain.ts`
11. `1760000010000-add-customer-experience-domain.ts`

---

## 7. Existing Authentication Features

Implemented authentication and access features:
- password login
- refresh token flow
- logout
- authenticated profile inspection
- user creation and listing
- role creation and lookup
- permission creation and listing
- permission assignment to roles
- branch-scope assignment
- request guards for JWT and permissions
- tenant-scoped and branch-scoped access resolution

---

## 8. Existing CRM Features

Implemented CRM features:
- customer search
- customer detail/profile retrieval
- customer creation
- customer update
- customer branch scoping
- measurement history listing
- measurement creation
- support for identity/contact/profile fields

---

## 9. Existing Service Order Features

Implemented Service Order features:
- service order search
- service order creation
- service order detail retrieval
- service order update
- item creation
- item update
- approval action
- cancellation action
- delivery date recalculation endpoint
- service order timeline
- commercial and technical responsible fields
- delivery type and surcharge fields

---

## 10. Existing Production Features

Implemented production features:
- operational resource management
- production order generation from service orders
- production order search
- production order detail retrieval
- production order update
- scheduling
- start
- pause
- completion
- version creation
- version history listing
- print-view payload retrieval
- assignment and availability endpoints for operational resources

---

## 11. Existing QR Features

Implemented QR features:
- production-order QR retrieval
- production-order QR reissue
- QR event listing
- QR scan endpoint
- QR event history per production order

QR ownership is implemented under Production Orders rather than as an independent bag identity flow.

---

## 12. Existing Quality Features

Implemented quality-related features:
- quality record search
- quality record creation
- quality record detail retrieval
- quality record update
- approve
- reject
- request rework
- request warranty execution
- quality retrieval by production order
- customer rejection creation and tracking
- rework case management
- warranty adjustment management
- warranty execution management and resolution

---

## 13. Existing Financial Features

Implemented finance features:
- payment search
- payment registration
- payment detail retrieval
- payment allocation
- service order financial summary
- service order partial payments
- expected cashflow view
- actual cashflow view
- financial exception creation
- financial exception retrieval
- financial exception resolution

---

## 14. Existing Fiscal Features

Implemented fiscal features:
- fiscal document listing
- fiscal document creation
- fiscal document detail retrieval
- document issue action
- document cancel action
- document status sync action

---

## 15. Existing Pickup Features

Implemented pickup features:
- pickup authorization listing
- pickup authorization creation from service order
- pickup authorization detail retrieval
- token generation
- QR generation
- temporary code generation
- remote approval request
- remote approval decision
- pickup completion
- storage location listing and creation
- storage location update
- service order location assignment
- service order location history
- custody event listing and detail retrieval

---

## 16. Existing Customer Portal Features

Implemented Customer Portal features:
- portal profile linking
- authenticated portal profile retrieval
- portal profile update
- order list
- order detail
- order history
- approval request creation
- approval listing
- approval decision by authenticated user
- approval decision by link token
- pickup authorization list
- pickup authorization creation
- pickup authorization revocation
- warranty request listing
- warranty request creation
- internal-to-external status mapping retrieval

---

## 17. Existing Smart Concierge Features

Implemented Smart Concierge features:
- queue retrieval
- queue filtering by branch, status, and free-text query
- customer/service order check-in creation
- check-in detail retrieval
- handoff/status transition
- notification dispatch registration

Current queue lifecycle support exists in the backend for:
- Waiting
- Called
- In Service
- No Show
- Completed

---

## 18. Can ANEXSYS already be executed locally?

**YES**

Important current-state note:
- local execution is currently available for the **backend**
- there is **no implemented frontend application** in this repository, so browser access is limited to backend routes and any external frontend shell developed outside this codebase

### Exact startup commands

From `/home/runner/work/anexsys-platform/anexsys-platform`:

1. Install dependencies:
   - `npm install`
2. Set environment variables:
   - `export PORT=3000`
   - `export DB_HOST=127.0.0.1`
   - `export DB_PORT=5432`
   - `export DB_USERNAME=postgres`
   - `export DB_PASSWORD=postgres`
   - `export DB_NAME=anexsys`
   - `export DB_SCHEMA=public`
   - `export DB_LOGGING=false`
   - `export JWT_SECRET=anexsys-local-dev-secret`
3. Run database migrations:
   - `npm run migration:run`
4. Start the backend:
   - `npm run start:dev`

### Backend URL

- `http://localhost:3000/api/v1`

### Frontend URL

- **No frontend URL is available in the current repository state**

### Required environment variables

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SCHEMA`
- `DB_LOGGING`
- `JWT_SECRET`

### Database startup procedure

Reproducible local Docker procedure:

1. Start PostgreSQL:
   - `docker run --name anexsys-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=anexsys -p 5432:5432 -d postgres:16`
2. Wait until PostgreSQL is ready.
3. Run:
   - `npm run migration:run`
4. Start the backend:
   - `npm run start:dev`

If PostgreSQL is installed locally instead of Docker:
- start the local PostgreSQL service
- create the `anexsys` database
- use the same environment variables shown above

---

## 19. Can a DEV environment be deployed today?

**YES**

Reason:
- the backend is implemented through Sprint 10
- the repository already has runtime scripts, migrations, authentication, tenant/branch foundations, and browser-access DEV milestone approval after Sprint 1
- no frontend is included here, but a backend-first DEV environment can still be deployed immediately

### Minimum deployment plan

1. Provision one PostgreSQL instance.
2. Provision one backend runtime host.
3. Configure environment variables for the backend.
4. Deploy the repository code and install dependencies.
5. Run:
   - `npm run build`
   - `npm run migration:run`
6. Start the backend process:
   - `npm run start:prod`
7. Publish the backend behind a domain or ingress such as `dev.anexsys.com.br`.
8. Bootstrap:
   - tenant
   - branch
   - admin user
   - role/permission model
   - test users
   - sample customer
   - sample service order
9. Validate:
   - login
   - tenant scope
   - branch scope
   - Customer Portal endpoints
   - Smart Concierge endpoints

Minimum deployable outcome:
- a shared backend DEV environment is reachable today
- a full frontend DEV experience is **not** deployable from this repository alone because frontend source code is not present
