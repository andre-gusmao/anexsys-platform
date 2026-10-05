# LOGIN_EMAIL_FIELD_FIX_V1

## 1. Reported Bug

After `LOGIN_UI_SAAS_REFACTOR_V1`, the login page stopped displaying Tenant ID as a visible field, but the Email field started opening with a legacy Tenant UUID value.

Reported example:
- `7157a7fa-fb8a-4947-aba6-a103bc93377b`

Expected:
- Email field empty

Actual:
- Email field populated with Tenant UUID

## 2. Investigation Summary

The following areas were reviewed:
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/components/providers/session-provider.tsx`
- frontend local storage usage
- remembered session/context restoration logic
- tenant migration implications from the old login UX

Findings:
- the current login page initializes `email` with an empty string
- the session provider persists authenticated session context only under `anexsys.frontend.session.v2`
- the persisted session structure does not write a login email field or a remembered Tenant UUID into the login form
- remembered session restoration rehydrates authenticated context only; it does not inject values into the login page email state

Conclusion:
- the incorrect value was not coming from the current React state initialization or session-provider local storage logic
- the most likely source was legacy browser/form autofill behavior after the old Tenant UUID field was removed from the login UI
- the first visible login input was being treated as a candidate for previously remembered tenant-form data

## 3. Fix Applied

The login page was hardened to prevent legacy Tenant UUID injection into the Email field:

- renamed the input identifiers from generic `email` to login-specific field identifiers
- changed autocomplete semantics to `username`
- added defensive client-side sanitization that clears the field when a UUID-shaped legacy value is injected automatically before user interaction
- kept valid user-entered email behavior intact

## 4. Session and Context Safety

The fix does not change:
- authenticated session persistence
- refresh-token handling
- company selection
- branch selection
- remembered authenticated context restoration

No backend or API contract changes were required.

## 5. Modified Files

- `/home/runner/work/anexsys-platform/anexsys-platform/frontend/src/app/login/page.tsx`
- `/home/runner/work/anexsys-platform/anexsys-platform/LOGIN_EMAIL_FIELD_FIX_V1.md`

## 6. Validation

Validation performed after the fix:
- frontend lint
- frontend build
- secret scan on changed files

Result:
- the login page keeps the Email field empty unless a valid user or browser email value is provided
- legacy UUID-shaped autofill is cleared automatically
