# ANEXSYS Platform
# BACKEND_IMPLEMENTATION_V1

## Document Purpose

This repository-carried backend implementation document remains part of the approved downstream design baseline referenced by `BASELINE_V3.0` and the governing sprint-planning input set referenced by `SPRINT_EXECUTION_V1`.

This document defines the implementation blueprint for the ANEXSYS backend using the following approved documents as source of truth:
- `/docs/releases/BASELINE_V2.0.md`
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/DATABASE_CONCEPTUAL_V1.md`
- `/docs/DATABASE_LOGICAL_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`
- `/docs/API_DESIGN_V1.md`
- `/docs/working/MIGRATION_AND_ONBOARDING_V1.md`

This document defines:
- project structure
- monolithic modular structure
- module organization
- folder organization
- entity implementation ownership
- authentication implementation direction
- authorization implementation direction
- event implementation model
- background jobs implementation model
- audit implementation model
- integration implementation model
- migration implementation model
- implementation sequence
- suggested sprint breakdown

This document does not define:
- application source code
- controllers
- services
- database migrations
- infrastructure-as-code

---

## 1. Executive Summary

ANEXSYS is ready for backend implementation planning because the business baseline, backend architecture, API design, and data model are already explicit and aligned.

The implementation blueprint should therefore start with:
- a modular monolith
- explicit bounded-context folders and ownership
- PostgreSQL-aligned repository ownership
- event-first internal collaboration
- queue-backed background jobs
- audit-by-default write flows
- strict tenant and branch isolation from the first commit

The governing implementation truths remain:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Physical Bag = support-only physical context

The recommended implementation direction is:
- one backend application codebase
- one shared domain model organized by module
- separate worker runtime entrypoints from the same codebase
- repository ownership matching approved domain boundaries
- service ownership matching approved application/API ownership

---

## 2. Monolithic Modular Structure

### 2.1 Structure choice

ANEXSYS should be implemented as a modular monolith.

Implementation meaning:
- one primary backend repository
- one primary runtime for synchronous HTTP/API handling
- one or more background worker runtimes from the same codebase
- module-local domain rules, services, repositories, events, and policies

### 2.2 Implementation boundaries

Each module should own:
- domain entities and value concepts
- application services
- repository contracts
- persistence mappings
- event definitions
- policy rules
- module-local tests

Each module must not:
- write directly into another module's persistence layer without an explicit contract
- assume ownership of another module's truth fields
- bypass tenant, branch, audit, or workflow controls

### 2.3 Shared platform layers

Shared platform layers may provide:
- HTTP bootstrap and request pipeline
- authentication and request context
- authorization guards
- transaction handling
- outbox publication
- queue dispatch
- storage abstraction
- provider adapter base contracts
- audit interceptors

Shared platform layers must not become a shared business-logic dumping ground.

---

## 3. Module Organization

### 3.1 Core implementation modules

- Tenant
- Branch
- Identity
- Authorization
- CRM
- Service Orders
- Production Orders
- Operational Resources
- Quality
- Rework
- Warranty
- Finance
- Fiscal
- QR
- Custody
- Pickup
- Smart Concierge
- Workflow Engine
- Notifications
- Audit

### 3.2 Cross-cutting implementation support

In addition to the core modules, the implementation should include shared technical layers for:
- common kernel primitives
- persistence
- job processing
- external integrations
- storage
- configuration
- observability

### 3.3 Module interaction rule

Preferred interaction order:
1. direct application-service call when immediate consistency is required
2. domain event when asynchronous or cross-cutting reaction is appropriate
3. provider adapter when external side effects are required

---

## 4. Folder Organization

### 4.1 Top-level blueprint

Suggested structure:

- `src/`
  - `app/`
  - `modules/`
  - `platform/`
  - `shared/`
  - `workers/`
  - `config/`
- `test/`
- `docs/`

### 4.2 Application bootstrap layer

Suggested purpose:
- `src/app/`
  - runtime bootstrap
  - HTTP composition
  - module registration
  - pipeline/interceptor wiring

### 4.3 Module layer

Suggested purpose:
- `src/modules/<module-name>/`
  - `domain/`
  - `application/`
  - `infrastructure/`
  - `contracts/`
  - `events/`
  - `policies/`

### 4.4 Shared layer

Suggested purpose:
- `src/shared/`
  - base types
  - errors
  - result models
  - domain primitives
  - pagination/query conventions

### 4.5 Platform layer

Suggested purpose:
- `src/platform/`
  - auth runtime
  - queue runtime
  - database runtime
  - storage runtime
  - integration runtime
  - audit runtime

### 4.6 Worker layer

Suggested purpose:
- `src/workers/`
  - notification workers
  - SLA workers
  - reconciliation workers
  - migration/import workers
  - evidence-processing workers

### 4.7 Test organization

Suggested purpose:
- `test/unit/`
- `test/integration/`
- `test/module/`
- `test/contracts/`

---

## 5. Core Modules

### 5.1 Tenant
Purpose:
- tenant identity
- tenant-wide settings
- tenant calendars
- tenant policy defaults

### 5.2 Branch
Purpose:
- branch hierarchy
- branch calendars
- branch-local operating scope

### 5.3 Identity
Purpose:
- user identity
- credentials
- OTP factors
- sessions
- refresh tokens

### 5.4 Authorization
Purpose:
- roles
- permissions
- branch scope
- tenant scope
- effective access evaluation

### 5.5 CRM
Purpose:
- customers
- contacts
- interactions
- measurement records

### 5.6 Service Orders
Purpose:
- commercial truth
- Service Order Items
- Commercial Responsible
- Technical Measurement Responsible
- delivery commitment

### 5.7 Production Orders
Purpose:
- base Production Order
- Production Order versions
- operational assignment
- execution state
- print-view payload

### 5.8 Operational Resources
Purpose:
- execution-capacity identity
- skills
- availability
- branch allocation scope

### 5.9 Quality
Purpose:
- inspections
- release decisions
- rejection/approval outcomes

### 5.10 Rework
Purpose:
- corrective execution
- original-versus-corrective attribution
- reassignment

### 5.11 Warranty
Purpose:
- Warranty Adjustment
- Warranty Execution
- post-delivery obligations

### 5.12 Finance
Purpose:
- payment records
- partial allocations
- financial exceptions
- balances

### 5.13 Fiscal
Purpose:
- fiscal lifecycle
- issuance/cancellation orchestration
- fiscal-status synchronization

### 5.14 QR
Purpose:
- Production Order QR identity
- QR scan capture
- scan-driven operational transitions

### 5.15 Custody
Purpose:
- custody events
- evidence references
- location and bag support traceability

### 5.16 Pickup
Purpose:
- pickup authorization
- pickup credentials
- pickup completion

### 5.17 Smart Concierge
Purpose:
- reception orchestration
- check-in and handoff support

### 5.18 Workflow Engine
Purpose:
- workflow definitions
- status definitions
- SLA rules
- approval requirements
- Delivery Date Engine policy

### 5.19 Notifications
Purpose:
- channel orchestration
- template resolution
- delivery tracking

### 5.20 Audit
Purpose:
- immutable audit history
- security events
- write traceability

---

## 6. Entity Implementation Plan

| Entity | Purpose | Owner Module | Repository Ownership | Service Ownership |
|---|---|---|---|---|
| Tenant | top-level isolation and policy boundary | Tenant | Tenant repository | Tenant application service |
| Branch | branch-local business scope and calendar boundary | Branch | Branch repository | Branch application service |
| User Identity | authenticated principal identity | Identity | User repository | Identity application service |
| Session / Refresh Token | session continuity and revocation | Identity | Session repository | Session service |
| Role | RBAC role model | Authorization | Role repository | Authorization service |
| Permission Grant | dynamic access control scope | Authorization | Permission repository | Authorization service |
| Customer | customer relationship identity | CRM | Customer repository | Customer service |
| Customer Contact | communication endpoint and preference data | CRM | Customer contact repository | Customer service |
| Customer Interaction | relationship and service-history trace | CRM | Customer interaction repository | CRM interaction service |
| Measurement Record | versioned technical/customer measurement facts | CRM | Measurement repository | Measurement service |
| Service Order | commercial and financial source of truth | Service Orders | Service order repository | Service order service |
| Service Order Item | itemized business scope | Service Orders | Service order item repository | Service order item service |
| Production Order | operational execution root | Production Orders | Production order repository | Production order service |
| Production Order Version | corrective lineage state | Production Orders | Production version repository | Production version service |
| Operational Assignment | responsibility and execution assignment | Production Orders | Assignment repository | Assignment service |
| Operational Resource | capability and availability identity | Operational Resources | Operational resource repository | Operational resource service |
| Quality Record | inspection and release decision | Quality | Quality repository | Quality service |
| Customer Rejection | post-delivery rejection fact | Quality | Customer rejection repository | Quality/rejection service |
| Rework Case | internal corrective execution case | Rework | Rework repository | Rework service |
| Warranty Adjustment | non-execution warranty obligation | Warranty | Warranty adjustment repository | Warranty service |
| Warranty Execution | execution-related warranty flow | Warranty | Warranty execution repository | Warranty service |
| Payment Record | payment transaction and settlement trace | Finance | Payment repository | Finance payment service |
| Partial Payment | allocated financial settlement | Finance | Partial payment repository | Finance allocation service |
| Financial Exception | exceptional settlement correction | Finance | Financial exception repository | Finance exception service |
| Fiscal Document | legal/fiscal issuance lifecycle | Fiscal | Fiscal document repository | Fiscal service |
| QR Code | Production Order scan identity | QR | QR repository | QR service |
| QR Event | execution scan trace | QR | QR event repository | QR event service |
| Pickup Authorization | release authorization root | Pickup | Pickup authorization repository | Pickup service |
| Pickup Token | tokenized release artifact | Pickup | Pickup token repository | Pickup credential service |
| Pickup QR Code | scannable release artifact | Pickup | Pickup QR repository | Pickup credential service |
| Temporary Pickup Code | short-lived release artifact | Pickup | Temporary code repository | Pickup credential service |
| Storage Location | location catalog | Custody | Storage location repository | Location service |
| Storage Location Assignment | retrieval placement history | Custody | Location assignment repository | Location assignment service |
| Physical Bag Support Context | optional physical support context | Custody | Bag support repository | Custody/traceability service |
| Workflow Definition | lifecycle policy root | Workflow Engine | Workflow repository | Workflow service |
| Status Definition | status semantics | Workflow Engine | Status repository | Workflow policy service |
| SLA Rule | timing and breach policy | Workflow Engine | SLA repository | SLA policy service |
| Communication Event | notification/message trace | Notifications | Communication event repository | Notification orchestration service |
| Digital Approval | auditable approval decision | Workflow Engine or dedicated approval subservice | Approval repository | Approval service |
| Custody Event | physical handoff/event trace | Custody | Custody event repository | Custody service |
| Audit Event | immutable cross-domain audit event | Audit | Audit repository | Audit service |
| CCTV Reference | surveillance evidence reference | Custody / Audit | CCTV reference repository | Evidence service |
| Camera Snapshot | captured pickup/custody evidence | Custody / Audit | Snapshot repository | Evidence service |

Implementation rule:
- repository ownership follows persistence truth and lifecycle control
- service ownership follows application/API command ownership

---

## 7. Authentication Implementation

### 7.1 JWT
- JWT access tokens should authenticate API requests
- tokens should carry tenant-aware principal identity and usable scope hints
- server-side authorization must not trust claims without persistent scope validation

### 7.2 OTP Email
- Email OTP should be implemented as a challenge-based factor under Identity
- challenge issuance and verification must be rate-limited and audited

### 7.3 OTP WhatsApp
- WhatsApp OTP should follow the same challenge lifecycle model as Email OTP
- provider failures must be handled asynchronously where dispatch is deferred

### 7.4 Refresh Token
- refresh tokens should be revocable
- refresh-token rotation should be preferred
- suspicious reuse must produce audit and session invalidation behavior

### 7.5 Session Strategy
- maintain logical session records server-side even with JWT access tokens
- support logout, revocation, impersonation marking, and support-session traceability

---

## 8. Authorization Implementation

### 8.1 RBAC
- implement roles as baseline access grants
- allow role assignment at tenant scope and, where appropriate, branch overlay scope

### 8.2 Branch Scope
- branch-scoped visibility and writes must be checked for all branch-owned records
- cross-branch access must be explicit, not implicit

### 8.3 Tenant Scope
- every request and job must run under resolved tenant context
- repositories and query builders must enforce tenant filters by default

### 8.4 Dynamic Permissions
- dynamic permissions should refine action-level access beyond role names
- approval, finance, workflow-admin, and audit-reading rights should be modeled explicitly

Implementation rule:
- authorization should be evaluated in the application layer before repository writes occur

---

## 9. Event Implementation

### 9.1 Domain Events
- domain events represent business facts emitted by owning modules
- examples: ServiceOrderApproved, ProductionOrderStarted, QualityRejected

### 9.2 Integration Events
- derived from committed domain events
- used for external provider callbacks, outbound notifications, reconciliation triggers, and read-model propagation

### 9.3 Audit Events
- generated for critical writes, security actions, workflow transitions, approvals, finance actions, and evidence capture

### 9.4 QR Events
- represent Production Order scans and scan-driven action traceability
- must preserve actor, time, device/channel, and resulting transition context

### 9.5 Custody Events
- represent physical handoff, storage movement, pickup, evidence capture, and release confirmation

### 9.6 Financial Events
- represent payments, partial allocations, fiscal issuance events, and financial-exception resolution

Implementation mechanism:
- commit source-of-truth state first
- write outbox/event trace in the same transaction
- dispatch asynchronous handlers after commit

---

## 10. Background Jobs

### 10.1 Notifications
- build notification-dispatch jobs that react to approved domain events

### 10.2 WhatsApp
- support async message delivery, retry, and delivery-trace recording

### 10.3 Email
- support template resolution, async dispatch, bounce/failure visibility, and retry

### 10.4 SLA Monitoring
- periodic jobs should evaluate SLA triggers, pauses, resumptions, breaches, and escalations

### 10.5 Delivery Date Engine
- periodic or on-demand jobs may support bulk recalculation, calendar updates, and downstream scheduling refreshes

### 10.6 Financial Reconciliation
- jobs should reconcile payment-provider results, banking confirmations, and fiscal sync outcomes

Implementation rules:
- every job must carry tenant context
- external-effect jobs must be idempotent
- failures must be retryable and auditable

---

## 11. Audit Implementation

### 11.1 Event Logging
- every critical write path must emit audit events
- authentication, authorization, workflow, finance, QR, pickup, and approval flows are mandatory audit producers

### 11.2 Immutable History
- audit records must be append-only
- mutable business entities must never rewrite prior audit meaning

### 11.3 Evidence References
- evidence references should store metadata and secure retrieval pointers
- custody, approvals, snapshots, and CCTV references must remain linkable to Service Order / Production Order / Pickup lineage

Implementation rule:
- audit capture should be handled both explicitly in application services and implicitly in cross-cutting interceptors where appropriate

---

## 12. Integration Implementation

### 12.1 Stone
- implement as a finance-owned provider adapter
- support payment initiation, result reconciliation, and failure traceability

### 12.2 Cielo
- implement with the same adapter and reconciliation pattern used for Stone

### 12.3 Banking Providers
- implement adapters for receivable confirmation and settlement reconciliation

### 12.4 Fiscal Providers
- implement adapters for issuance, status sync, and cancellation lifecycle

### 12.5 Camera Providers
- implement custody/pickup evidence capture adapters

### 12.6 Access Control Devices
- implement optional enterprise adapters for door/gate/turnstile events and remote control

Implementation rules:
- all provider access must pass through adapter boundaries
- provider identifiers must not replace internal aggregate identity
- retries and callbacks must be normalized before reaching domain services

---

## 13. Migration Implementation

### 13.1 Import Framework
- implement migration as a guided orchestration boundary, not ad-hoc scripts
- import approval must separate staging/validation from activation

### 13.2 CSV
- support structured flat-file imports for supported onboarding domains

### 13.3 Excel
- support spreadsheet-driven imports for low-friction onboarding

### 13.4 API Import
- support API-driven bulk onboarding for structured partners or legacy systems

### 13.5 Data Validation
- validate duplicates, required fields, CPF, phone, email, addresses, and structural consistency before activation

### 13.6 Rollback
- rollback must exist as a governed onboarding control
- invalid migration progress must not silently become operational truth

Implementation rule:
- onboarding orchestration may own job state, but destination business truth must be committed only by the destination module after approval

---

## 14. Module Ownership Matrix

| Module | Owns Entities / Capabilities | Must Not Own |
|---|---|---|
| Tenant | tenant boundary, tenant settings, tenant calendars | orders, production execution |
| Branch | branch hierarchy, branch calendars, branch-local scope | tenant identity, finance truth |
| Identity | users, credentials, OTP, sessions, refresh tokens | business truth |
| Authorization | roles, permissions, branch scope, tenant scope | authentication secrets, order truth |
| CRM | customers, contacts, interactions, measurements | production execution, settlement |
| Service Orders | service orders, items, responsibilities, delivery commitment | operational execution truth |
| Production Orders | production orders, versions, assignments, execution state | commercial pricing and settlement truth |
| Operational Resources | resource profile, capability, availability | customer commercial truth |
| Quality | inspections, release/reject decisions | payment truth |
| Rework | corrective execution cases | warranty-commercial ownership |
| Warranty | warranty adjustments and warranty executions | base pricing truth |
| Finance | payment and allocation truth | production execution state |
| Fiscal | fiscal lifecycle | order pricing ownership |
| QR | Production Order QR identity and scan trace | commercial truth |
| Custody | storage, evidence, physical traceability, bag support context | operational execution truth |
| Pickup | pickup authorization and release artifacts | production execution truth |
| Smart Concierge | reception orchestration | order source-of-truth ownership |
| Workflow Engine | statuses, transitions, SLA, Delivery Date Engine policy | transactional business truth |
| Notifications | channel dispatch and delivery trace | workflow or order truth |
| Audit | immutable audit history | transactional state ownership |

---

## 15. Implementation Sequence

### Phase 1 - Foundation
- project bootstrap
- modular structure
- database connectivity foundation
- request context
- audit pipeline foundation
- tenant and branch context enforcement

### Phase 2 - Identity and Governance
- Identity
- Authorization
- Tenant
- Branch
- shared workflow-admin primitives

### Phase 3 - Core Commercial Domain
- CRM
- Service Orders
- delivery commitment and Delivery Date Engine invocation path

### Phase 4 - Core Operational Domain
- Operational Resources
- Production Orders
- QR
- execution assignments

### Phase 5 - Corrective and Quality Domain
- Quality
- Rework
- Warranty

### Phase 6 - Financial and Fiscal Domain
- Finance
- Fiscal

### Phase 7 - Traceability and Release Domain
- Custody
- Pickup
- approval/evidence linkage

### Phase 8 - Cross-Cutting Operational Support
- Notifications
- background jobs
- reporting read foundations
- Smart Concierge base flow

### Phase 9 - Migration and Activation
- migration orchestration
- file imports
- validation
- rollback
- go-live readiness flow

---

## 16. Suggested Sprint Breakdown

### Sprint 1
- project bootstrap
- modular skeleton
- shared platform layer
- auth request context
- audit/event infrastructure skeleton

### Sprint 2
- Identity
- Authorization
- Tenant
- Branch

### Sprint 3
- CRM
- measurement handling
- contact/interactions

### Sprint 4
- Service Orders
- Service Order Items
- delivery commitment
- Delivery Date Engine integration path

### Sprint 5
- Operational Resources
- Production Orders
- Production Order generation
- assignment lifecycle

### Sprint 6
- QR
- production execution transitions
- print-view payload
- execution event capture

### Sprint 7
- Quality
- Rework
- Warranty

### Sprint 8
- Finance
- Fiscal
- reconciliation foundation

### Sprint 9
- Custody
- Pickup
- evidence references
- storage locations

### Sprint 10
- Notifications
- SLA monitoring
- Smart Concierge base flow
- dashboard-read foundations

### Sprint 11
- migration framework
- CSV/Excel/API import
- validation and rollback flows

### Sprint 12
- hardening
- audit coverage review
- permission review
- performance stabilization
- implementation readiness review

---

## 17. Backend Complexity Assessment

**Complexity: High**

Reasons:
- many bounded contexts with strict ownership rules
- strong multi-tenant and multi-branch controls
- heavy workflow and status configurability
- significant audit and evidence requirements
- event-driven side effects across notifications, integrations, and monitoring
- finance, fiscal, QR, pickup, and custody are all high-sensitivity domains
- migration/onboarding is a first-class product capability rather than an afterthought

Complexity interpretation:
- not high because the architecture is unclear
- high because the platform scope is broad and governance-heavy

---

## 18. Remaining Technical Risks

- Identity and Access persistence details still require final schema-to-implementation mapping decisions.
- Workflow and status configurability may produce excessive complexity if administrative validation rules are weak.
- QR scanning concurrency, retries, and unstable-network behavior require careful execution-state protection.
- Financial and fiscal integrations will require strong adapter and reconciliation discipline from the beginning.
- Evidence handling, retention, and secure access for approvals, CCTV references, and snapshots require strict compliance-aware implementation.
- Migration staging and activation boundaries must be implemented carefully so invalid imported data never becomes operational truth.
- Read models for dashboards, audit search, and analytics may need optimization earlier than the first release if data volume grows quickly.

---

## 19. Final Implementation Statement

ANEXSYS backend implementation is ready to move into coding preparation.

Implementation conditions:
- preserve Service Order as commercial and financial truth
- preserve Production Order as operational truth
- keep Production Order QR ownership exclusive for production execution
- keep the physical bag as support-only traceability context
- enforce tenant, branch, workflow, audit, and security boundaries from the first implementation increment
