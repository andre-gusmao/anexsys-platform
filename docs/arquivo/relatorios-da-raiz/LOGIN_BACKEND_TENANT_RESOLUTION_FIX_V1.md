# LOGIN_BACKEND_TENANT_RESOLUTION_FIX_V1

## 1. Problem

The frontend login UI had already been reduced to:
- Email
- Password

But the platform still failed at login time with:
- `HttpError: tenantId must be a UUID`
- `POST /auth/login/password` returning `400 Bad Request`

This created a critical regression because the user-facing login no longer collected tenant information while the overall authentication flow still had to remain tenant-safe.

## 2. Root Cause

The SaaS login redesign depends on one invariant:

- tenant resolution must happen after user identity is validated by email and password

The current repository already had most of the SaaS backend logic in place:
- backend login resolves active users by normalized email
- tenant/company context is selected from the authenticated user memberships
- frontend session login posts email and password only

The remaining gap was closing compatibility around the login contract and regression-proofing the flow so login does not fail when legacy client assumptions still reference `tenantId`.

## 3. Fix Applied

### Backend
- Updated `LoginPasswordDto` so `tenantId` is no longer required for login.
- Kept login resolution driven by normalized email and password in `AuthService`.
- Preserved backend response with resolved tenant context after successful authentication.

### Frontend
- Reinforced `session-provider.tsx` login flow to submit normalized email plus password only.
- Kept the resolved tenant context coming from the backend response and subsequent authenticated hydration.

### Integration coverage
- Updated Sprint 1 integration coverage to validate email/password-only login using:
  - `<email-do-administrador>`

## 4. Endpoint Contract Change

Changed endpoint:
- `POST /api/v1/auth/login/password`

### Previous request contract
- required `tenantId`
- required `email`
- required `password`

### Current request contract
- required `email`
- required `password`
- optional legacy `tenantId` tolerated for compatibility, but ignored for tenant resolution

### Response contract
The response still returns the resolved authenticated context:
- `accessToken`
- `refreshToken`
- `sessionId`
- `tenantId`
- `branchIds`
- `permissions`

## 5. Modified Files

- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/contracts/dto/login-password.dto.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/src/modules/identity/application/auth/auth.service.ts`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/test/integration/sprint1-acceptance.spec.mjs`
- `/home/runner/work/anexsys-platform/anexsys-platform/LOGIN_BACKEND_TENANT_RESOLUTION_FIX_V1.md`

## 6. Validation

Validation target:
- login must work with email and password only

Validated user:
- `<email-do-administrador>`

Validation performed:
- backend build
- unit/integration login coverage
- frontend lint/build
- secret scan on changed files
