# SAAS_IDENTITY_IMPLEMENTATION_IMPACT_V1

## 1. Purpose

This document describes the implementation impact of the approved SaaS identity redesign on the current ANEXSYS repository.

Reference redesign:

- `/home/runner/work/anexsys-platform/anexsys-platform/SAAS_IDENTITY_AND_ACCESS_REDESIGN_V1.md`

Primary implementation inputs reviewed:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-identity.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-credential.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-session.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/role.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/permission.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/user-role-assignment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/user-branch-scope.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/http/request-context.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

---

## 2. Current implementation snapshot

The current implementation is still aligned to an internal or bootstrap-style identity model, not to the approved SaaS model.

### Current backend behavior

- `POST /api/v1/auth/login/password` requires `tenantId`, `email`, and `password`
- password login resolves the user by `tenantId + email`
- the issued JWT/session is tenant-bound
- `GET /api/v1/auth/me` returns:
  - user
  - effective permissions
  - effective branch IDs
  - current tenant context
  - requested branch context

### Current frontend behavior

- login screen shows:
  - known tenant selector
  - Tenant ID input
  - Email
  - Password
- frontend session state persists:
  - `tenantId`
  - tokens
  - branch IDs
  - active branch
- frontend requires preconfigured tenant options or manual tenant UUID entry

### Current authorization behavior

- authorization is role/permission based
- branch access is derived from:
  - branch scopes
  - branch-bound role assignments
  - role assignments with null branch, which currently expand to all active tenant branches

### Current identity persistence behavior

The current repository persists:

- user identity
- password credential
- refresh-token session
- role definitions
- permissions
- user-role assignments
- user-branch scopes

The current repository does **not** yet persist a complete SaaS identity model for:

- company membership resolution independent of login input
- first-access token lifecycle
- password reset token lifecycle
- password history
- community membership
- community-to-permission aggregation
- last context memory

---

## 3. Gap between current implementation and approved redesign

The approved redesign requires:

- Email + Password only login
- no Tenant UUID on production login
- automatic tenant/company resolution after authentication
- Communities as business-facing access groupings
- post-login Company/Branch selector when needed
- remembered last valid context
- first-access onboarding with one-time auditable token
- password reset and password-history support

The current repository does not yet satisfy those requirements.

Therefore the impact is **high** across:

- Identity backend
- Authorization backend
- API contracts
- Frontend login/session UX
- Database schema
- local bootstrap/onboarding flow
- automated tests

---

## 4. Backend impact

## 4.1 AuthController impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`

Required changes:

- remove `tenantId` as required input from password login
- redesign login request DTO to accept only:
  - email
  - password
- add first-access endpoints
- add password-reset endpoints
- add context-selection or post-login context-resolution support endpoints if not embedded in `/auth/me`

Impact level:

- **high**

## 4.2 AuthService impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`

Required changes:

- replace tenant-scoped user lookup during login
- introduce user-first identity resolution by email
- resolve allowed company memberships after identity validation
- resolve branch eligibility after company resolution
- support:
  - first-access token validation
  - password creation on first access
  - password reset flow
  - forced rotation checks
  - password-history checks
- enrich post-login response with:
  - allowed Companies
  - allowed Branches
  - Communities
  - last valid context
  - selector requirement state

Impact level:

- **very high**

## 4.3 Request-context impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/http/request-context.ts`

Current model:

- assumes authenticated principal carries a single `tenantId`
- supports `x-tenant-id`
- supports `x-branch-id`

Required changes:

- preserve tenant-safe request enforcement
- allow authenticated user identity to exist before a final Company/Branch operating context is selected
- distinguish:
  - authenticated principal identity
  - selected Company context
  - selected Branch context
- support last-context reopening without requiring login-time tenant knowledge

Impact level:

- **high**

## 4.4 UsersController impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`

Required changes:

- current user creation is password-based and tenant-scoped
- SaaS onboarding requires creation of:
  - administrator identity
  - first-access onboarding artifact
  - no permanent initial password
- user-management APIs must evolve to support:
  - invite / first-access initiation
  - resend first-access token
  - password reset initiation
  - company access assignment
  - community assignment

Impact level:

- **high**

---

## 5. Authorization impact

## 5.1 Current model retained in principle

The repository already has valid primitives for:

- roles
- permissions
- branch scopes

Those primitives do not need to be discarded.

## 5.2 Current model is insufficient for the approved redesign

Current gap:

- there is no Community model
- permissions are not yet aggregated through Communities
- company-level access is not formalized as a user-facing selectable account context

## 5.3 AuthorizationService impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`

Required changes:

- compute effective access from:
  - Company entitlement
  - Branch entitlement
  - Community membership
  - permission grants
- keep branch scope enforcement
- support context-sensitive recomputation when user switches Company or Branch
- return richer effective-access payloads than only:
  - `branchIds`
  - `permissions`

Likely new effective-access output will need:

- allowed company list
- allowed branch list for selected company
- community list
- selected company
- selected branch
- remembered last valid context

Impact level:

- **very high**

## 5.4 Role model impact

Current role model may remain as:

- governance construct
- internal authorization structure
- migration bridge

But everyday business administration should shift toward:

- Communities as the main assignment language

Impact level:

- **medium-high**

---

## 6. Frontend impact

## 6.1 Login page impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx`

Required changes:

- remove known tenant selector
- remove Tenant ID input
- keep only:
  - Email
  - Password
- add first-access entry path
- add forgot-password entry path

Impact level:

- **very high**

## 6.2 Session provider impact

Current impact area:

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

Current model stores:

- `tenantId`
- permissions
- branchIds
- activeBranchId

Required changes:

- remove login-time tenant dependency
- store selected Company context separately from authenticated identity
- store selected Branch context separately from allowed Branch list
- persist last valid Company and Branch
- support:
  - automatic Company open
  - automatic Branch open
  - Company selector
  - Branch selector
  - post-login context switching without reauthentication
- support first-access and password-reset flows

Impact level:

- **very high**

## 6.3 Frontend routing impact

Required additions:

- first-access route
- password-reset route
- Company selector route or modal flow
- refined Branch selector flow under selected Company

Impact level:

- **high**

---

## 7. API contract impact

## 7.1 Breaking contract changes

The following contract is no longer valid for production SaaS login:

- `POST /api/v1/auth/login/password` requiring `tenantId`

This is a breaking API contract change.

## 7.2 Required new contract family

The API layer will need contracts for:

- login by email/password only
- first-access token validation
- first password creation
- forgot-password request
- password reset completion
- company selection
- branch selection
- effective-access retrieval including Communities and remembered context

Impact level:

- **very high**

---

## 8. Database impact

## 8.1 Current persistence that can be reused

These existing tables/entities can be evolved rather than discarded:

- `user_identities`
- `user_credentials`
- `user_sessions`
- `roles`
- `permissions`
- `user_role_assignments`
- `user_branch_scopes`

## 8.2 New persistence concepts required

The approved redesign implies new identity-domain persistence for at least:

- company memberships or company-entitlement records
- community definitions
- user-community memberships
- community-permission mappings
- first-access tokens
- password reset tokens
- password history
- remembered last valid context
- security event records specific to onboarding and password lifecycle

## 8.3 User identity model impact

Current user identity is directly tenant-scoped:

- `user_identities.tenant_id`

That model is still valid for tenant isolation, but the implementation now also needs a user-facing Company selection model on top of it.

This means the repository must formally represent:

- authenticated user identity
- company access
- branch access
- operating context memory

Impact level:

- **very high**

---

## 9. Bootstrap and provisioning impact

## 9.1 Current bootstrap constraint

The repository currently depends on a controlled bootstrap path to create:

- first tenant
- first branch
- first admin user

## 9.2 SaaS provisioning requirement

The approved redesign changes this expectation for production SaaS onboarding.

Production provisioning must automatically create:

- Tenant
- Administrator User
- first-access onboarding artifacts

Therefore:

- technical bootstrap remains valid for local/dev setup
- it is not sufficient for SaaS subscription onboarding

Required implementation additions:

- subscription provisioning workflow
- welcome email dispatch
- first-access link generation
- one-time token issuance
- auditable onboarding state

Impact level:

- **high**

---

## 10. Security impact

Positive security outcomes of the redesign:

- no tenant UUID exposure on login
- no permanent seeded first password
- single-use onboarding token
- expiring onboarding token
- auditable password lifecycle
- auditable onboarding lifecycle
- explicit remembered-context validation before reuse

Security-sensitive implementation areas:

- email uniqueness and user lookup strategy
- ambiguous same-email handling across companies if multi-company identity is allowed
- token issuance and revocation
- context-switch authorization recalculation
- password-history enforcement
- first-access replay prevention

Impact level:

- **very high**

---

## 11. Testing impact

## 11.1 Backend tests

Current integration and unit coverage will require redesign for:

- login without tenant input
- company resolution after auth
- branch selector behavior
- first-access token flow
- password reset flow
- password-history rejection
- last-context reopening
- context-switch authorization

## 11.2 Frontend tests

Frontend coverage will need to expand for:

- email/password-only login
- first-access screens
- forgot-password screens
- company selector
- branch selector
- remembered context reuse
- invalid remembered context fallback

Impact level:

- **high**

---

## 12. Migration impact

## 12.1 Implementation migration

This redesign should be implemented incrementally, not as a single uncontrolled rewrite.

Recommended sequence:

1. formalize new identity data model
2. add new persistence and migrations
3. redesign backend login and effective-access response
4. add first-access and password-reset flows
5. add company/community models
6. update frontend login and session handling
7. add company/branch selector and remembered-context behavior
8. migrate administration flows from pure role assignment toward community-oriented administration

## 12.2 Backward-compatibility strategy

Recommended temporary compatibility strategy:

- keep internal technical bootstrap flows working during transition
- isolate production SaaS login behind the new email/password-only contract
- avoid dual long-term login models

Impact level:

- **high**

---

## 13. Files and modules directly impacted

Most directly impacted existing files:

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/http/request-context.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-identity.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-credential.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-session.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/role.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/permission.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/user-role-assignment.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/infrastructure/persistence/entities/user-branch-scope.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

Likely new modules or subdomains required:

- first access / onboarding
- password recovery
- communities
- company memberships / account access
- context memory

---

## 14. Impact summary

### Very high impact

- password login contract
- auth service behavior
- effective-access computation
- frontend login UX
- frontend session model
- database identity schema

### High impact

- request context model
- user administration flows
- onboarding/provisioning
- automated tests
- branch/company selection UX

### Medium-high impact

- role administration language and its transition toward community-oriented access management

---

## 15. Final conclusion

The approved SaaS identity redesign is not a cosmetic login change.

It is a cross-cutting implementation change that affects:

- authentication
- authorization
- identity persistence
- onboarding
- password lifecycle
- frontend session behavior
- post-login context selection
- provisioning
- tests

The current repository already contains reusable foundations:

- JWT/session lifecycle
- password hashing
- role and permission primitives
- branch scope primitives

But the approved SaaS model requires a substantial evolution from:

- tenant-input authentication

to:

- identity-first authentication with post-auth company and branch context resolution

That change is feasible on top of the current architecture, but it must be treated as a major identity-platform implementation initiative rather than a small login-form adjustment.
