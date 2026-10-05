# LOGIN_REFACTOR_VALIDATION_V1

## 1. Objective

This document validates the implemented SaaS Identity redesign in the ANEXSYS codebase.

Validation scope:

1. Login Screen
2. First Access Flow
3. Token Flow
4. Company Resolution
5. Branch Resolution
6. Last Context Memory
7. Communities
8. Permissions
9. Header Selector

It also answers whether the previous Tenant UUID login flow can be completely removed from the codebase.

---

## 2. Implementation Validation

### 2.1 Login Screen

Status: **Validated**

Findings:
- The login request contract now accepts only `email` and `password`.
- The frontend login screen no longer renders a Tenant UUID field.
- The login screen explicitly states that company and branch context are resolved after authentication.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/contracts/dto/login-password.dto.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx`

Conclusion:
- The previous Tenant UUID requirement has been removed from the login entry flow.

### 2.2 First Access Flow

Status: **Validated**

Findings:
- The platform supports invitation-based first access.
- First access token validation uses `email` plus token.
- First access completion requires password creation and activates the invited user.
- The acceptance test confirms invite -> validate -> complete -> later login.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/users.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/integration/saas-identity-acceptance.spec.mjs`

Conclusion:
- First access is consistent with the redesigned SaaS onboarding model and does not require Tenant UUID at entry.

### 2.3 Token Flow

Status: **Validated with security caveat**

Findings:
- Access and refresh tokens are issued after email/password authentication.
- Refresh tokens are validated, hashed in persistence, and rotated on refresh.
- Session identity remains tenant-scoped after authentication.
- Frontend session restoration and authenticated requests reuse refresh flow automatically.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/auth/token-factory.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-session.entity.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

Conclusion:
- The token flow is functionally aligned with the redesign.
- However, the frontend currently persists session tokens in `localStorage`, which is a security risk for long-term production hardening.

### 2.4 Company Resolution

Status: **Validated**

Findings:
- Authentication resolves all active user identities by normalized email.
- If the same email exists in multiple companies, the system builds `availableCompanies` and determines the active company from stored last context when available.
- If no valid prior company context exists, the session is marked as requiring company selection.
- Company switching is supported without reauthentication.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/select-branch/page.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/unit/auth.service.spec.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/integration/saas-identity-acceptance.spec.mjs`

Conclusion:
- Company resolution is implemented and matches the approved post-auth company selector model.

### 2.5 Branch Resolution

Status: **Validated**

Findings:
- Branch access is derived from effective access, not from login input.
- The branch is resolved after authentication from remembered context, current context, default branch, or explicit user selection.
- Branch selection is rejected if it falls outside effective access scope.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/select-branch/page.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/integration/saas-identity-acceptance.spec.mjs`

Conclusion:
- Branch resolution is consistent with the redesign and no longer depends on pre-login tenant-aware user input.

### 2.6 Last Context Memory

Status: **Validated**

Findings:
- Last company and last branch are persisted by normalized email.
- The remembered company is reused on future login when still valid.
- The remembered branch is restored after company resolution when still inside access scope.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/identity/identity.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/unit/auth.service.spec.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/integration/saas-identity-acceptance.spec.mjs`

Conclusion:
- Last context memory is implemented and improves SaaS usability as intended.

### 2.7 Communities

Status: **Validated**

Findings:
- Community memberships are loaded as part of effective access.
- Authenticated session payloads expose community codes to the frontend through `/auth/me`.
- Acceptance coverage confirms cross-company community behavior.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/unit/authorization.service.spec.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/integration/saas-identity-acceptance.spec.mjs`

Conclusion:
- Communities are integrated into the redesigned identity/access model.

### 2.8 Permissions

Status: **Validated with one design-risk note**

Findings:
- Effective access merges role-based permissions and community-based permissions.
- `/auth/me` exposes effective permissions and effective branch scope to the frontend.
- Missing permission references fail fast in authorization logic.
- Tenant-wide role assignments currently expand branch access to all active tenant branches.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/authorization/application/authorization/authorization.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/unit/authorization.service.spec.ts`

Conclusion:
- Permission composition is implemented.
- If the intended business rule is that explicit branch scopes should constrain tenant-wide roles, the current implementation should be reviewed.

### 2.9 Header Selector

Status: **Validated**

Findings:
- The administrative header exposes active company, active branch, and permission count.
- Company selector is shown when more than one company is available.
- Branch selector is shown in the authenticated shell.
- Context switching includes pending-state protection for company and branch changes.

Evidence:
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/app-shell/admin-shell.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/select-branch/page.tsx`

Conclusion:
- The header selector behavior is aligned with the redesigned post-login context model.

---

## 3. Answer: Can the previous Tenant UUID login flow be completely removed from the codebase?

### Short answer

**Yes, the previous Tenant UUID login flow can be completely removed from the login entry flow.**

### Validation basis

The current implemented authentication entry path no longer depends on Tenant UUID:
- login DTO requires only `email` and `password`
- login endpoint consumes only `email` and `password`
- login page renders only `email` and `password`
- acceptance tests authenticate successfully without Tenant UUID in login payloads

### Important nuance

**Tenant UUID cannot be removed from the overall authenticated context model.**

The redesign still uses tenant identity after authentication for company context and tenant-scoped authorization.

This means:
- old pre-login Tenant UUID collection can be removed
- old login payloads requiring Tenant UUID can be removed
- but tenant context remains required after authentication in the SaaS multi-company model

### Remaining dependencies that still require Tenant UUID

These are not legacy login dependencies, but they are active post-auth context dependencies:

1. Authenticated request header
- The frontend still sends `x-tenant-id` on authenticated requests.
- Evidence: `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

2. Backend request context and guard enforcement
- Request context reads `x-tenant-id`.
- JWT guard validates requested tenant scope against token tenant scope.
- Evidence:
  - `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/http/request-context.ts`
  - `/home/runner/work/anexsys-platform/anexsys-platform/src/platform/auth/jwt-auth.guard.ts`

3. Company switch endpoint
- Company selection after login explicitly posts `tenantId` to `/auth/context/company`.
- Evidence:
  - `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/http/auth.controller.ts`
  - `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`

4. Authenticated session state
- Session state stores the active tenant/company context.
- Evidence:
  - `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
  - `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/infrastructure/persistence/entities/user-session.entity.ts`

### Final conclusion

- **Remove:** previous Tenant UUID login field, login payload requirement, and any legacy login instructions depending on manual tenant entry.
- **Keep:** tenant-aware authenticated context, company selection, and tenant-scoped authorization behavior.

---

## 4. Risk Assessment

### 4.1 Low risk
- Login screen removal of Tenant UUID is already implemented and validated.
- First access flow is compatible with the redesign.
- Company and branch resolution logic are covered by unit and acceptance tests.

### 4.2 Medium risk
- Authenticated request handling still depends on `x-tenant-id` being consistent with the active session tenant. Any incomplete frontend migration outside the main session provider may cause tenant-scope failures.
- Global role assignments currently expand branch access to all active branches in the tenant. If branch scopes are supposed to be restrictive, this could create authorization drift.

### 4.3 Security risk
- The frontend persists session tokens in `localStorage`. This increases exposure to token theft in case of XSS or injected script execution.

### 4.4 Validation environment risk
- Runtime acceptance coverage depends on PostgreSQL availability. The test suite exists, but complete runtime validation is environment-dependent.

---

## 5. Migration Safety Assessment

### 5.1 Safe to remove now
- Tenant UUID input from the login screen
- Tenant UUID from login request payloads
- Legacy user guidance telling users to inform Tenant UUID before authentication

### 5.2 Not safe to remove now
- `tenantId` from authenticated session state
- `x-tenant-id` support in authenticated backend request handling
- tenant-scoped company selection after authentication
- tenant-aware authorization checks

### 5.3 Overall migration assessment

**Migration is safe if the scope is clearly defined as removing Tenant UUID from pre-authentication login only.**

**Migration is not safe if interpreted as removing tenant context from the entire authenticated SaaS model.**

The implemented redesign is consistent with:
- email/password-only authentication
- post-auth company resolution
- post-auth branch resolution
- remembered last context
- community-aware permission composition

The remaining work, if desired, is hardening and simplification, not redesign reversal.
