# SAAS_IDENTITY_AND_ACCESS_REDESIGN_V1

## 1. Purpose

This document redesigns the ANEXSYS SaaS Identity and Access model using the following documents as source of truth:

- `/home/runner/work/anexsys-platform/anexsys-platform/docs/releases/BASELINE_V3.0.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/BACKEND_ARCHITECTURE_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/API_DESIGN_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/FRONTEND_ARCHITECTURE_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/DATABASE_PHYSICAL_V1.md`

The redesign resolves the current SaaS login issue:

- the user must not be required to type Tenant UUID on the login screen

This document also formalizes the Identity and Access gap explicitly left open by the current architectural baseline.

---

## 2. Source-of-truth alignment

The redesign preserves the approved baseline:

- ANEXSYS is a multi-tenant SaaS platform
- each tenant is an isolation boundary
- each tenant may operate one or more branches
- every authenticated request must execute under tenant context and authorized scope
- branch scope must be validated before sensitive read or write operations
- JWT-backed identity remains the authentication basis
- tenant, branch, role, permission, and object-state checks remain server-side responsibilities

The redesign also respects two open baseline facts:

- Identity and Access still requires final formalization at repository level
- identity-domain physical structures are not yet fully specified in the current physical database document

This document provides that missing formalization at the SaaS access-model level.

---

## 3. Current problem

The current login concept requires tenant-aware authentication context at sign-in time.

That is acceptable for internal technical bootstrap scenarios, but it is not acceptable for production SaaS usage because:

- end users do not know Tenant UUIDs
- the login experience becomes operationally hostile
- tenant discovery is incorrectly shifted to the human user
- production SaaS identity should resolve tenancy from the authenticated user, not from manual infrastructure-like input

Therefore:

- Tenant UUID must never be required on the production login screen
- the platform must determine tenant ownership after validating the user identity

---

## 4. Core redesign decisions

### 4.1 Tenant remains the isolation boundary

Tenant remains:

- the SaaS subscription boundary
- the top-level data-isolation boundary
- the owner of configuration, calendars, workflows, numbering rules, and governed visibility

This redesign does **not** remove tenant as a backend or security concept.

It removes tenant from the **login input**.

### 4.2 Company becomes the user-facing account context

For the SaaS access experience, **Company** is the user-facing business account context presented after authentication.

In this redesign:

- Tenant remains the technical and governance isolation boundary
- Company is the user-facing label and selectable account context derived from the user’s authorized tenant membership

This means the platform may present:

- one Company when the user belongs to one tenant
- multiple Companies when the authenticated principal is authorized in multiple tenant accounts

### 4.3 Branch remains the operational context under Company

Branch remains:

- the approved operational unit
- the explicit business context for dashboards, lists, queues, orders, and operational actions

Company selection answers:

- which tenant account the user is operating in

Branch selection answers:

- which operational branch context the user is actively using inside that company

---

## 5. New SaaS login model

## 5.1 Login inputs

Users must authenticate using:

- Email
- Password

Only.

The login screen must never require:

- Tenant UUID
- Branch code
- Company code
- any internal technical identifier

## 5.2 Authentication resolution model

The platform shall:

1. validate the email and password
2. identify the authenticated principal
3. load the principal’s authorized Companies
4. load the principal’s authorized Branches
5. load the principal’s Communities
6. derive effective Permissions
7. determine whether automatic context opening is possible

## 5.3 Multi-company behavior

If the authenticated user belongs to:

- exactly one Company, the Company shall be selected automatically
- multiple Companies, the platform shall show a Company selector after authentication

The selector is a post-authentication context selector, not part of the login form.

## 5.4 Multi-branch behavior

If the authenticated user has:

- exactly one valid Branch in the selected Company, the Branch shall be selected automatically
- multiple valid Branches in the selected Company, the platform shall show a Branch selector after authentication

---

## 6. First Access security model

## 6.1 Subscription provisioning

When a customer subscribes, ANEXSYS shall automatically create:

- Tenant
- Administrator User

The platform shall automatically trigger:

- Welcome Email
- First Access Link
- One-Time Token

The user must never receive:

- a permanent password
- a reusable onboarding password

## 6.2 First access workflow

The first access workflow shall be:

1. open first-access link
2. enter email
3. enter one-time token
4. validate token
5. create personal password
6. confirm password
7. login

## 6.3 First access token rules

The first-access token must:

- expire automatically
- be single-use
- be auditable
- be invalidated immediately after successful use
- be invalidated when replaced by a newer onboarding token
- never become the permanent authentication secret

## 6.4 Audit requirements

The platform shall audit:

- token issuance
- token resend
- token validation success
- token validation failure
- token expiration
- first password creation
- first successful login

---

## 7. Password policy

The Identity and Access model shall support:

- minimum password length
- complexity rules
- password rotation
- password reset
- password history

## 7.1 Policy governance

Password policy must be tenant-governable within platform-wide security boundaries.

This means:

- the platform may define mandatory global minimum security rules
- tenants may configure stricter rules where permitted
- weaker tenant-specific policies must never bypass platform minimums

## 7.2 Password lifecycle capabilities

The platform shall support:

- first password creation
- voluntary password change
- forced rotation after policy or risk triggers
- forgot-password reset
- password reset confirmation
- rejection of reused passwords according to password-history policy

## 7.3 Audit requirements

Password events must be auditable, including:

- password created
- password changed
- password reset requested
- password reset completed
- forced rotation triggered
- password-history violation rejected

---

## 8. Post-login experience

After authentication, the platform shall load for the authenticated user:

- Companies
- Branches
- Communities
- Permissions

The frontend shall receive enough post-authentication context to determine:

- whether the Company can be opened automatically
- whether the Branch can be opened automatically
- whether a selector must be displayed
- what the last valid Company and Branch were
- what the effective Communities and Permissions are in the selected context

---

## 9. Company / Branch context model

## 9.1 Context rules

Users may switch operational context without reauthentication.

This means:

- switching Company does not require a new password prompt
- switching Branch does not require a new password prompt
- the security model must recompute effective scope and visibility at each context switch

## 9.2 Automatic opening rules

If the user has access to only one Company and one Branch:

- open automatically

If the user has access to one Company and multiple Branches:

- open the Company automatically
- present Branch selector unless last valid Branch can be reused

If the user has access to multiple Companies:

- present Company selector
- then resolve Branch automatically or present Branch selector according to the selected Company

## 9.3 Server-side enforcement

The convenience of automatic opening must never weaken security.

Therefore:

- all API requests must still resolve authenticated tenant context server-side
- all branch-sensitive operations must still validate branch eligibility server-side
- the selector is a UX layer over governed access scope, not a replacement for authorization

---

## 10. Last context memory

The platform shall persist:

- Last Company
- Last Branch

## 10.1 Reuse rule

On the next login, the platform shall automatically reopen the last valid operating context if:

- the user still has access to that Company
- the user still has access to that Branch
- the Company and Branch are still active

## 10.2 Invalid-memory fallback

If the stored context is no longer valid, the platform shall:

1. discard the invalid remembered context
2. choose the next valid automatic context when only one exists
3. otherwise display the appropriate selector

Users must not be forced to select the same branch every day when the previous context remains valid.

---

## 11. Communities model

## 11.1 Purpose

Communities are business-facing access groupings such as:

- Customer Service
- Production
- Finance
- Quality
- Managers
- Executives
- Administrators

Users may belong to multiple Communities.

## 11.2 Communities are not permissions

Communities are organizational and functional groupings.

Permissions remain independent atomic rights.

Communities aggregate permissions.

## 11.3 Communities and scope

Community membership may be granted with governed scope, such as:

- Company-wide
- Branch-specific

Effective access must be computed from:

- Company entitlement
- Branch entitlement
- Community membership
- direct or delegated permission grants where allowed by governance policy

## 11.4 Visibility behavior

Communities may drive:

- default navigation visibility
- default dashboard prioritization
- default work queues
- default notification routing

But Communities must never bypass:

- tenant isolation
- Company scope
- Branch scope
- explicit permission requirements

---

## 12. Permissions model

Permissions remain independent and atomic.

Examples:

- View
- Create
- Edit
- Delete
- Print
- Export
- Approve
- Cancel
- Deliver
- Authorize Pickup
- Warranty Management

## 12.1 Permission principles

- permissions are evaluated server-side
- permissions may be aggregated by Communities
- permissions must remain auditable
- sensitive permissions must support stricter governance and traceability

## 12.2 Communities and permissions relationship

The approved relationship is:

- Communities aggregate Permissions
- Users receive effective Permissions through their scoped Community memberships

Roles from the current architecture remain valid as governance constructs, but the primary business-facing assignment model should be Community-oriented.

That means:

- Communities become the main administrative language for everyday access administration
- Permissions remain the atomic enforcement language
- Roles may remain as backend governance artifacts, migration anchors, or administrative delegation structures where needed

---

## 13. Company / Branch access model

Each user profile must define:

- Allowed Companies
- Allowed Branches

Users must never see data outside their authorized scope.

## 13.1 Scope rules

Company scope determines:

- which tenant account context the user may enter

Branch scope determines:

- which operational branches the user may use inside the selected Company

## 13.2 Scope enforcement

The platform must enforce:

- no cross-tenant leakage
- no cross-company leakage
- no cross-branch leakage
- no permission elevation through frontend-only hiding

Frontend visibility may improve usability, but backend enforcement remains mandatory.

---

## 14. SaaS provisioning model

When a customer subscribes, the platform shall automatically create:

- Tenant
- default Company context for that subscription
- first Administrator User
- first-access onboarding record
- welcome communication

The provisioning model must ensure the customer receives:

- account identity
- first-access link
- one-time token
- clear password-creation instructions

The provisioning model must not rely on:

- manual Tenant UUID distribution
- permanent seeded passwords
- technical database-side bootstrap steps for normal SaaS onboarding

---

## 15. API redesign implications

The following API-level decisions are required.

## 15.1 Login API

`POST /api/v1/auth/login/password` must accept:

- email
- password

It must not require:

- tenantId

## 15.2 Login response behavior

The login response must support two outcomes:

### Outcome A - direct context open

When one valid context can be opened automatically, the response may return:

- authenticated principal
- token/session state
- resolved Company
- resolved Branch
- Communities
- effective Permissions

### Outcome B - context selection required

When multiple valid contexts exist, the response must return:

- authenticated principal
- token/session state
- available Companies
- available Branches for the default or selected Company
- Communities
- effective Permissions
- indication that Company and/or Branch selection is required before full workspace entry

## 15.3 First access APIs

Identity and Access shall also own first-access APIs for:

- first-access initiation
- token validation
- password creation
- onboarding completion

## 15.4 Password recovery APIs

Identity and Access shall own password-recovery APIs for:

- forgot-password request
- reset-token validation
- password reset completion

---

## 16. Frontend redesign implications

## 16.1 Login screen

The Administrative Portal login screen must use:

- Email
- Password

Only.

It must not show:

- Tenant UUID field
- technical identifiers

## 16.2 Post-login selector

If required, the frontend shall show:

- Company selector
- Branch selector

after authentication, not before authentication.

## 16.3 Context memory

The frontend must support:

- remembered last Company
- remembered last Branch
- automatic reopening of last valid context
- fallback to selector when remembered context is no longer valid

## 16.4 Navigation behavior

Navigation shall be driven by:

- selected Company
- selected Branch
- Community memberships
- effective Permissions

This remains aligned with the approved frontend requirement that branch context must stay explicit and controlled for multi-branch users.

---

## 17. Backend redesign implications

Identity and Access must formally own:

- global user identity
- tenant membership resolution
- Company entitlement
- Branch entitlement
- Community membership
- permission aggregation
- session lifecycle
- first-access token lifecycle
- password lifecycle
- last-context memory

The backend must continue to enforce:

- authenticated tenant context
- authorized branch scope
- least-privilege access
- auditable security events

---

## 18. Database redesign implications

The current physical database baseline explicitly states that identity-domain tables are not yet fully formalized.

Therefore, this redesign authorizes formalization of identity-domain persistence for at least the following concepts:

- user principal
- user credential factors
- tenant or Company memberships
- branch memberships or branch scopes
- Communities
- Community-to-Permission grants
- first-access tokens
- password-reset tokens
- password history
- session records
- last valid context memory
- security audit events related to authentication and access

This redesign does not weaken the approved physical rules:

- tenant-safe isolation remains mandatory
- branch-scoped enforcement remains mandatory
- auditability remains mandatory

---

## 19. Migration from the current login model

The transition from the current tenant-aware login behavior to the SaaS production model shall be:

1. remove Tenant UUID from login UI
2. redesign password login to authenticate by email and password only
3. resolve Company membership from the authenticated user
4. resolve Branch eligibility from the authenticated user
5. introduce post-login selector only when required
6. add first-access onboarding flow
7. add password reset and password-history support
8. persist and reuse last valid Company and Branch context

During transition:

- bootstrap and internal setup flows may remain technical
- production end-user login must follow the redesigned SaaS model

---

## 20. Final approved redesign

The ANEXSYS SaaS Identity and Access redesign is:

- login by Email + Password only
- no Tenant UUID on production login screen
- tenant ownership resolved from authenticated user membership
- Company presented as the user-facing account context
- Branch presented as the operational context
- Communities introduced as business-facing access groups
- Permissions retained as independent atomic rights
- Communities aggregate Permissions
- Allowed Companies and Allowed Branches explicitly defined per user
- last valid Company and Branch context remembered and reused
- first-access onboarding secured by expiring, single-use, auditable token
- welcome flow creates password instead of distributing permanent password
- backend remains the authoritative enforcer of tenant, branch, permission, and audit boundaries

This redesign is consistent with the approved SaaS, multi-tenant, multi-branch, API, frontend, and physical database baseline while closing the identity-and-access formalization gap explicitly identified in the current architecture set.
