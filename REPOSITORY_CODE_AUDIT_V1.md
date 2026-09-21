# REPOSITORY_CODE_AUDIT_V1

## Scope

This audit inspects only actual source code files present in:

- `/home/runner/work/anexsys-platform/anexsys-platform/src`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend`

Excluded from this audit:

- reports
- sprint documents
- planning documents
- other non-source narrative files

## Existence check

1. Does `src/` exist? **YES**
   - `/home/runner/work/anexsys-platform/anexsys-platform/src`
2. Does `frontend/` exist? **YES**
   - `/home/runner/work/anexsys-platform/anexsys-platform/frontend`

## Package manifest inventory

Two `package.json` files exist:

- `/home/runner/work/anexsys-platform/anexsys-platform/package.json`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/package.json`

## Actual backend source code inventory

### NestJS modules found

The root application module at `/home/runner/work/anexsys-platform/anexsys-platform/src/app.module.ts` imports 18 NestJS modules.

| Module | Module file | Controllers | Services | Entities |
| --- | --- | ---: | ---: | ---: |
| Audit | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/audit/audit.module.ts` | 0 | 1 | 1 |
| Authorization | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/authorization.module.ts` | 2 | 1 | 5 |
| Branch | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/branch.module.ts` | 1 | 1 | 1 |
| CRM | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/crm.module.ts` | 1 | 2 | 4 |
| Custody | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/custody.module.ts` | 2 | 1 | 6 |
| Customer Portal | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/customer-portal/customer-portal.module.ts` | 1 | 1 | 2 |
| Finance | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/finance.module.ts` | 4 | 1 | 3 |
| Fiscal | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/fiscal/fiscal.module.ts` | 1 | 1 | 1 |
| Identity | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/identity.module.ts` | 2 | 2 | 3 |
| Operational Resources | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/operational-resources/operational-resources.module.ts` | 1 | 1 | 2 |
| Pickup | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/pickup.module.ts` | 1 | 1 | 6 |
| Production Orders | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/production-orders.module.ts` | 3 | 2 | 7 |
| Quality | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/quality/quality.module.ts` | 2 | 1 | 2 |
| Rework | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/rework/rework.module.ts` | 1 | 1 | 1 |
| Service Orders | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/service-orders.module.ts` | 1 | 2 | 3 |
| Smart Concierge | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/smart-concierge/smart-concierge.module.ts` | 1 | 1 | 1 |
| Tenant | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/tenant.module.ts` | 1 | 1 | 1 |
| Warranty | `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/warranty/warranty.module.ts` | 2 | 1 | 2 |

### Controllers found

27 controller files exist:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/http/permissions.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/http/roles.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/http/branches.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/http/customers.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/http/custody-events.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/http/storage-locations.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/customer-portal/http/customer-portal.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/http/cashflow.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/http/financial-exceptions.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/http/payments.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/http/service-order-finance.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/fiscal/http/fiscal-documents.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/operational-resources/http/operational-resources.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/http/pickup-authorizations.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/http/production-orders.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/http/qr-events.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/http/service-order-production-order.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/quality/http/customer-rejections.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/quality/http/quality-records.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/rework/http/rework-cases.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/http/service-orders.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/smart-concierge/http/smart-concierge.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/http/tenants.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/warranty/http/warranty-adjustments.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/warranty/http/warranty-executions.controller.ts`

### Services found

24 service files exist:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/audit/application/audit/audit.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/application/branch/branch.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/application/customer/customer.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/application/measurement/measurement.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/application/custody/custody.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/customer-portal/application/customer-portal/customer-portal.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/application/finance/finance.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/fiscal/application/fiscal/fiscal.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/identity/identity.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/operational-resources/application/operational-resource/operational-resource.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/application/pickup/pickup.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/application/production-order/production-order.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/application/qr-tracking/qr-tracking.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/quality/application/quality/quality.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/rework/application/rework/rework.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/application/delivery-date/delivery-date.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/application/service-order/service-order.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/smart-concierge/application/smart-concierge/smart-concierge.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/application/tenant/tenant.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/warranty/application/warranty/warranty.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/auth/password-hasher.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/auth/token-factory.service.ts`

### Entities found

52 entity files exist:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/audit/infrastructure/persistence/entities/audit-event.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/permission.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/role-permission.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/role.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/user-branch-scope.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/user-role-assignment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/branch/infrastructure/persistence/entities/branch.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/infrastructure/persistence/entities/customer-contact.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/infrastructure/persistence/entities/customer-interaction.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/infrastructure/persistence/entities/customer.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/crm/infrastructure/persistence/entities/measurement-record.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/infrastructure/persistence/entities/camera-snapshot.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/infrastructure/persistence/entities/cctv-reference.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/infrastructure/persistence/entities/custody-event.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/infrastructure/persistence/entities/physical-bag-support-context.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/infrastructure/persistence/entities/storage-location-assignment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/custody/infrastructure/persistence/entities/storage-location.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/customer-portal/infrastructure/persistence/entities/customer-portal-profile.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/customer-portal/infrastructure/persistence/entities/status-visibility-mapping.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/infrastructure/persistence/entities/financial-exception.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/infrastructure/persistence/entities/partial-payment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/finance/infrastructure/persistence/entities/payment-record.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/fiscal/infrastructure/persistence/entities/fiscal-document.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-credential.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-identity.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-session.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/operational-resources/infrastructure/persistence/entities/operational-resource-branch-scope.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/operational-resources/infrastructure/persistence/entities/operational-resource.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/infrastructure/persistence/entities/communication-event.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/infrastructure/persistence/entities/digital-approval.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/infrastructure/persistence/entities/pickup-authorization.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/infrastructure/persistence/entities/pickup-qr-code.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/infrastructure/persistence/entities/pickup-token.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/pickup/infrastructure/persistence/entities/temporary-pickup-code.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/production-execution-event.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/production-order-item-link.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/production-order-operational-assignment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/production-order-version.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/production-order.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/qr-code.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/production-orders/infrastructure/persistence/entities/qr-event.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/quality/infrastructure/persistence/entities/customer-rejection.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/quality/infrastructure/persistence/entities/quality-record.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/rework/infrastructure/persistence/entities/rework-case.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/infrastructure/persistence/entities/business-calendar-day.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/infrastructure/persistence/entities/service-order-item.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/service-orders/infrastructure/persistence/entities/service-order.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/smart-concierge/infrastructure/persistence/entities/smart-concierge-check-in.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/tenant/infrastructure/persistence/entities/tenant.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/warranty/infrastructure/persistence/entities/warranty-adjustment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/warranty/infrastructure/persistence/entities/warranty-execution.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/shared/persistence/base.entity.ts`

### Migrations found

11 migration files exist:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000000000-initial-sprint1-foundation.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000001000-add-crm-foundation.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000002000-add-service-order-foundation.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000003000-add-production-foundation.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000004000-add-qr-execution-tracking.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000005000-add-quality-rework-warranty.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000006000-add-warranty-config-and-start-rules.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000007000-add-finance-domain.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000008000-add-fiscal-domain.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000009000-add-pickup-custody-domain.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/migrations/1760000010000-add-customer-experience-domain.ts`

## Actual frontend source code inventory

### React / Next.js pages found

7 page files exist:

| Route role | Page file | Observed implementation state |
| --- | --- | --- |
| Root redirect | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/page.tsx` | Redirects to `/login` |
| Login | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx` | Functional login form with tenant selection and session hooks |
| Branch selection | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/select-branch/page.tsx` | Functional branch selection flow |
| Dashboard | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/(authenticated)/dashboard/page.tsx` | Authenticated dashboard placeholder |
| Admin tenants | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/(authenticated)/admin/tenants/page.tsx` | Placeholder workspace |
| Admin branches | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/(authenticated)/admin/branches/page.tsx` | Placeholder workspace |
| Admin access | `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/(authenticated)/admin/access/page.tsx` | Placeholder workspace |

### Frontend support components directly tied to the existing pages

The current page layer is supported by these real `.tsx` components:

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/admin-shell.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/authenticated-app.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/role-aware-nav.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/ui/placeholder-workspace.tsx`

## Actual backend implementation percentage

**Estimated actual backend implementation: 90%**

### Basis for the estimate

This estimate is based only on the source files listed above.

Evidence supporting a high backend completion level:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/app.module.ts` wires 18 real NestJS modules into the runtime application.
- 27 controllers expose HTTP endpoints across tenant, identity, authorization, CRM, service orders, production orders, quality, rework, warranty, finance, fiscal, custody, pickup, customer portal, and smart concierge.
- 24 service files implement application and platform logic.
- 52 entity files define a broad persistence model.
- 11 migrations exist, showing real database evolution across the implemented domains.
- `/home/runner/work/anexsys-platform/anexsys-platform/src/main.ts` is a valid backend bootstrap entrypoint.

Why this is not marked 100% from source inspection alone:

- no committed automated bootstrap/seed source file for first-time admin creation was found under `/home/runner/work/anexsys-platform/anexsys-platform/src`
- no committed root backend `.env.example` source file was found
- local startup still depends on external PostgreSQL configuration and manual environment setup

## Actual frontend implementation percentage

**Estimated actual frontend implementation: 20%**

### Basis for the estimate

This estimate is based only on the source files listed above.

Evidence supporting partial frontend implementation:

- the Next.js application exists under `/home/runner/work/anexsys-platform/anexsys-platform/frontend`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/package.json` contains real `dev`, `build`, `start`, and `lint` scripts
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx` implements a real login form
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/select-branch/page.tsx` implements a real branch-selection flow
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx` provides real session state handling
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/next.config.ts` contains a real backend proxy rewrite

Why the frontend percentage is still low:

- only 7 page files exist
- the authenticated dashboard is explicitly a placeholder
- the three admin pages are explicitly placeholder workspaces
- no real domain UI pages were found for CRM, service orders, production orders, quality, rework, warranty, finance, fiscal, custody, pickup, customer portal, or smart concierge under `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app`

## Can ANEXSYS be started locally right now?

**YES**

### Source-code evidence

- backend entrypoint exists at `/home/runner/work/anexsys-platform/anexsys-platform/src/main.ts`
- backend startup scripts exist at `/home/runner/work/anexsys-platform/anexsys-platform/package.json`
  - `start`
  - `start:dev`
  - `start:prod`
  - `migration:run`
- frontend startup scripts exist at `/home/runner/work/anexsys-platform/anexsys-platform/frontend/package.json`
  - `dev`
  - `build`
  - `start`
- frontend backend-proxy configuration exists at `/home/runner/work/anexsys-platform/anexsys-platform/frontend/next.config.ts`
- frontend environment template exists at `/home/runner/work/anexsys-platform/anexsys-platform/frontend/.env.example`

### Practical startup prerequisites still required

The repository can be started locally, but source inspection shows these prerequisites must be supplied externally:

- a running PostgreSQL instance compatible with the TypeORM configuration used by `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/database/typeorm/typeorm.config.ts`
- backend environment variables such as database connection values and `JWT_SECRET`
- a local frontend environment file derived from `/home/runner/work/anexsys-platform/anexsys-platform/frontend/.env.example`
- initial tenant/admin bootstrap performed manually, because no committed automatic seed/bootstrap source file for first-time local setup was found in the source tree
