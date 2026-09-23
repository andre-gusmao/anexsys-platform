# ANEXSYS_PLATFORM_GOVERNANCE_ARCHITECTURE_STANDARD_V1

## Status
FOUNDATIONAL PLATFORM IMPLEMENTATION

## Scope
This standard applies to all current and future ANEXSYS modules.

---

## 1. Current Compliance Level

### 1.1 Platform-wide summary
- **Overall platform compliance:** PARTIAL
- **UX standard compliance:** PARTIAL
- **Integrity / anti-fraud compliance:** PARTIAL
- **Audit compliance:** PARTIAL
- **Multiwindow compliance:** NON-COMPLIANT
- **Context preservation compliance:** PARTIAL

### 1.2 What is already structurally strong
- The backend already follows a modular monolith structure with domain modules under `src/modules`, TypeORM persistence, and consistent migration/test scripts.
- The frontend already has real authenticated workspaces for:
  - Companies
  - Branches
  - Users / Access
  - Customers
  - Body Parts
  - Measurement Units
  - Service Orders
- Company and Branch context are already visible in the authenticated shell and operational Service Orders already inherit active Company and Branch context.
- Multiple backend domains already record audit events, especially CRM, Service Orders, Production Orders, Finance, Quality, Warranty, Fiscal, Pickup, Custody, and Operational Resources.
- Several master-data and operational tables already use soft-delete columns or status-based inactivation patterns.

### 1.3 Main platform gaps
- The `Filter → Grid → Form` pattern is not yet enforced by a shared platform contract; it exists in some modules but not as a mandatory framework rule.
- Grid quick actions are inconsistent or missing.
- On-demand registration exists in some flows (`SmartLookup`) but is not yet standardized platform-wide.
- Friendly dependency-aware inactivation feedback is not standardized.
- Audit records do not yet guarantee explicit `previous value` and `new value` capture for all critical mutations.
- Internal workspace tabs do not exist.
- Form/filter/workflow restoration across navigation is not standardized.
- Production and Financial domains exist in the backend but do not yet have equivalent frontend workspaces.
- Suppliers, Products, and Services are not yet implemented as compliant workspaces.

---

## 1.4 Compliance Review by Module

| Module | UX | Integrity | Audit | Anti-Fraud | Multiwindow | Context Preservation | Current classification |
|---|---|---|---|---|---|---|---|
| Companies | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | PARTIAL | PARTIAL |
| Branches | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | PARTIAL | PARTIAL |
| Users / Access | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | PARTIAL | PARTIAL |
| Customers | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | PARTIAL | PARTIAL |
| Measurements | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | PARTIAL | PARTIAL |
| Body Parts | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | NON-COMPLIANT | PARTIAL |
| Measurement Units | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | NON-COMPLIANT | PARTIAL |
| Service Orders | PARTIAL | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | PARTIAL | PARTIAL |
| Production | NON-COMPLIANT (frontend) / PARTIAL (backend) | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | NON-COMPLIANT | PARTIAL |
| Financial | NON-COMPLIANT (frontend) / PARTIAL (backend) | PARTIAL | PARTIAL | PARTIAL | NON-COMPLIANT | NON-COMPLIANT | PARTIAL |
| Suppliers | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT |
| Products | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT |
| Services | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT | NON-COMPLIANT |

### 1.5 Basis for the classifications

#### COMPLIANT patterns not yet achieved platform-wide
A module should be considered fully COMPLIANT only when it has all of the following:
- mandatory `Filter → Grid → Form`
- automatic post-create refresh/selection/stay-on-screen
- smart search + suggestions + duplicate detection + assisted lookup
- quick actions in the grid
- no physical delete for master data
- dependency-aware inactivation protection with friendly feedback
- full audit trail including actor, timestamp, previous value, new value, and operation type
- reversible workflow support where applicable
- internal workspace tab support and browser-tab-safe restoration
- saved filters, saved form state, saved active record, and smart return

#### Why most modules are still PARTIAL
Current modules already show meaningful progress, but the standards are implemented as isolated features rather than mandatory platform infrastructure.

Examples of positive signals already present:
- real workspaces instead of raw tables or raw CRUD pages
- status-based lifecycle and reactivation/inactivation in multiple domains
- duplicate detection in Customers, Companies, and Measurement Master Data
- quick-create lookup infrastructure in `SmartLookup`
- audit history/timeline in several backend services
- branch/company context inheritance already visible in the authenticated shell

Examples of remaining gaps:
- no shared governance layer enforcing the same lifecycle rules everywhere
- no shared dependency-impact feedback service for inactivation attempts
- no internal multi-tab workspace engine
- no persistent workspace state restoration standard
- no universal quick-action pattern
- no platform-wide audit diff standard

---

## 2. Required Architectural Changes

### 2.1 Establish a mandatory workspace architecture contract
Create a platform-wide workspace contract that every current and future module must follow:
- Filter
- Grid
- Form
- Grid Quick Actions
- Context-aware header
- Friendly feedback surface
- Smart return state

This must become the default application architecture, not an optional UX style.

### 2.2 Create a governance layer for lifecycle and dependency rules
Add a shared governance service responsible for:
- inactivation policy
- dependency analysis before destructive lifecycle changes
- friendly impact messages
- anti-fraud restrictions
- authorization checks for reversible workflows

This service must be reusable across Customers, Companies, Branches, Users, Products, Services, Suppliers, and future master data.

### 2.3 Standardize audit as a first-class platform contract
Current audit is already present in many services, but it must become a stronger mandatory contract with guaranteed capture of:
- who
- when
- previous value
- new value
- operation type
- business reason when applicable

### 2.4 Add a context-preservation architecture
Introduce a shared workspace state mechanism capable of preserving:
- current screen
- active Company
- active Branch
- selected record
- form draft
- filters
- active sub-workflow stage

This must support both:
- intra-app navigation return
- same-browser restoration after refresh/reopen

### 2.5 Add a multiwindow workspace architecture
Introduce internal workspace tabs and a workspace registry for long-running operational flows.
This is mandatory for:
- Service Orders
- Production
- Financial
- Purchases
- Fiscal
- Customer Service

### 2.6 Separate platform readiness from module readiness
Backend-only domains such as Production and Financial must not be considered operationally compliant until frontend workspaces, context preservation, and user-facing governance behavior are implemented.

---

## 3. Required Frontend Changes

### 3.1 Shared workspace foundation
Create a reusable frontend foundation for every module with:
- standard filter section
- standard grid section
- standard form shell
- standard message banner
- standard quick actions area
- standard active-record summary

### 3.2 Shared smart search behavior
Standardize:
- incremental search
- suggestions
- duplicate detection
- lookup with quick-create
- automatic return-and-select behavior

The current `SmartLookup` approach should be elevated into a mandatory platform rule for assisted lookup and in-flow registration.

### 3.3 Grid quick actions
Add a shared quick-action pattern for rows, including when applicable:
- Edit
- Print
- Inactivate
- History
- Open in new tab

Full details remain inside the Form.

### 3.4 Friendly feedback standard
All user-facing modules must replace technical failures with business guidance.
Examples:
- explain what happened
- explain why it happened
- explain what the user should do next
- provide shortcut buttons to related records when a dependency blocks an action

### 3.5 Internal workspace tabs
Add internal tabs for long-running business work so users can keep parallel work open without losing context.

### 3.6 Workspace-state persistence
Persist and restore:
- filters
- active record
- edit mode vs view mode
- form drafts
- current item grid/header section for complex flows

### 3.7 Complete missing frontend modules
Create real compliant workspaces for:
- Production
- Financial
- Suppliers
- Products
- Services

These modules should not remain backend-only if they are part of the platform operating model.

---

## 4. Required Backend Changes

### 4.1 Standard dependency-protection service
Create a shared backend capability that can answer:
- what records depend on this entity
- whether inactivation is allowed
- what alternative action is recommended
- which shortcut links should be shown in the UI

### 4.2 Standard lifecycle commands
Replace ad hoc destructive flows with standard commands such as:
- create
- update
- activate
- deactivate
- block
- unblock
- reopen
- reverse
- cancel

### 4.3 Standard audit diff capture
Enhance audit payloads so they consistently store:
- previous values
- new values
- changed fields
- optional justification / source

### 4.4 Reversal workflows
Introduce explicit authorized reversal flows where business lifecycle requires it, such as:
- reopen receipt
- reopen production
- reopen service order
- reverse payment effects
- reverse delivery blockers when approved

### 4.5 Friendly domain-exception contract
Define a shared domain-exception response shape for:
- blocked inactivation
- blocked reversal
- dependency conflicts
- invalid lifecycle transition
- fraud-protection refusal

### 4.6 Backend support for context restoration
Support frontend context preservation with APIs that can reopen:
- details
- timelines
- workflow step summaries
- related records
without forcing users to restart a long business process.

---

## 5. Required Database Changes

### 5.1 Enforce soft delete standard for all relevant master data
The platform standard is:
- `is_deleted`
- `deleted_at`
- `deleted_by`

This is already present in several tables such as Customers, Measurements, Service Orders, Service Order Items, and calendar-related tables, but it is not yet universal.

### 5.2 Migrate status-only entities that still lack soft delete columns
Entities such as:
- tenants
- branches
- user identities

currently rely on status and audit but do not yet implement the full soft-delete base structure. These must be reviewed and aligned with the platform standard wherever master-data retention requires it.

### 5.3 Introduce stronger audit persistence where needed
Current audit persistence stores action metadata, but the standard requires guaranteed storage of before/after change detail. The schema should support this explicitly.

### 5.4 Add persistence for workspace context when required
To support multiwindow, smart return, and long-running work, the platform may need persisted workspace/session context structures for:
- open work tabs
- draft forms
- selected record per module
- filter snapshots
- resumable workflow stage

### 5.5 Add dependency-index support where needed
For large-scale dependency protection, supporting read models or dependency indexes may be required so blocked inactivation feedback remains fast and user-friendly.

---

## 6. Recommended Implementation Roadmap

### Phase 0 — Governance foundation (CRITICAL)
- establish the mandatory platform contract for `Filter → Grid → Form`
- define lifecycle/inactivation/audit standards
- define friendly feedback standard
- define context-preservation contract
- define reversal policy contract

### Phase 1 — Shared infrastructure (CRITICAL)
- shared workspace shell
- shared quick actions pattern
- shared dependency-impact response contract
- shared audit diff contract
- shared workspace-state persistence utilities
- shared internal tab infrastructure

### Phase 2 — Existing module alignment (HIGH)
Align current implemented workspaces first:
- Companies
- Branches
- Users / Access
- Customers
- Measurements
- Body Parts
- Measurement Units
- Service Orders

Primary goal:
- remove per-module drift
- converge on mandatory behavior
- standardize messages, quick actions, and restoration

### Phase 3 — Operational module completion (HIGH)
Implement compliant frontends for:
- Production
- Financial

These domains already show meaningful backend maturity and should become first-class governed workspaces.

### Phase 4 — Missing master-data modules (HIGH)
Implement compliant workspaces for:
- Suppliers
- Products
- Services

### Phase 5 — Long-process workspace model (HIGH)
Roll out internal tabs, smart return, and resumable workflows for:
- Service Orders
- Production
- Financial
- Fiscal
- Customer Service

### Phase 6 — Governance hardening (MEDIUM)
- add dependency dashboards
- add fraud-sensitive monitoring rules
- add admin review for privileged reversals
- add governance test suites for new modules

---

## 7. Priority Classification

### Priority A — CRITICAL / FOUNDATION
These must be implemented before continued module expansion:
- mandatory workspace architecture standard
- dependency protection standard
- audit diff standard
- context preservation standard
- company/branch inheritance standard for operational modules
- no-physical-delete enforcement for master data

### Priority B — HIGH / PLATFORM MATURITY
- internal workspace tabs
- reversible workflows
- standardized quick actions
- production frontend workspace
- financial frontend workspace
- alignment of existing master-data workspaces

### Priority C — MEDIUM / SCALE AND OPERABILITY
- dependency read models / impact indexing
- richer management dashboards for audit and fraud review
- deep browser-tab/window orchestration
- advanced long-process restore strategies

### Priority D — LOW / AFTER FOUNDATION
- visual refinements
- secondary convenience flows
- expanded reporting surfaces after governance standards are enforced

---

## Recommended Target State
The target platform standard is:
- **Simple for the User** because every module follows the same workspace architecture.
- **Secure for the Company** because destructive actions are replaced by governed lifecycle transitions.
- **Auditable for Management** because all critical changes preserve actor, time, previous value, new value, and traceability.
- **Resistant to Fraud** because history, references, and accountability are never destroyed.
- **Productive for Operations** because users keep context, avoid rework, and register missing data on demand without abandoning the workflow.

---

## Evidence Base Used For This Review
Frontend and shell:
- `frontend/src/components/app-shell/admin-shell.tsx`
- `frontend/src/components/app-shell/role-aware-nav.tsx`
- `frontend/src/components/providers/session-provider.tsx`
- `frontend/src/components/ui/smart-lookup.tsx`
- `frontend/src/components/ui/placeholder-workspace.tsx`
- `frontend/src/components/admin/companies-workspace.tsx`
- `frontend/src/components/admin/branches-workspace.tsx`
- `frontend/src/components/admin/access-workspace.tsx`
- `frontend/src/components/customers/customer-workspace.tsx`
- `frontend/src/components/measurements/measurement-master-data-workspace.tsx`
- `frontend/src/components/service-orders/service-orders-workspace.tsx`

Backend and persistence:
- `src/modules/audit/application/audit/audit.service.ts`
- `src/modules/crm/application/customer/customer.service.ts`
- `src/modules/service-orders/application/service-order/service-order.service.ts`
- `src/modules/production-orders/application/production-order/production-order.service.ts`
- `src/modules/finance/application/finance/finance.service.ts`
- `src/modules/tenant/application/tenant/tenant.service.ts`
- `src/modules/branch/application/branch/branch.service.ts`
- `src/modules/identity/application/identity/identity.service.ts`
- `src/shared/persistence/base.entity.ts`
- `src/platform/database/typeorm/migrations/1760000001000-add-crm-foundation.ts`
- `src/platform/database/typeorm/migrations/1760000002000-add-service-order-foundation.ts`

