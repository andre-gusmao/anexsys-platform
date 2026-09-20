# ANEXSYS Platform
# BACKEND_ARCHITECTURE_V1

## Document Purpose

This repository-carried backend architecture document remains part of the approved downstream design baseline referenced by `BASELINE_V3.0` and the governing sprint-planning input set referenced by `SPRINT_EXECUTION_V1`.

This document defines the complete backend architecture for ANEXSYS using only the following approved documents as source of truth:
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/frozen/DATABASE_GUIDELINES_V1.md`
- `/docs/DATABASE_CONCEPTUAL_V1.md`
- `/docs/DATABASE_LOGICAL_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`
- `/docs/working/MIGRATION_AND_ONBOARDING_V1.md`

This document defines:
- backend principles
- modular monolith strategy
- domain boundaries
- service boundaries
- integration boundaries
- security architecture
- event architecture
- workflow architecture
- audit architecture
- backend module map
- backend technology strategy
- scalability strategy
- deployment strategy

This document does not define:
- source code
- API endpoints
- database migrations
- infrastructure-as-code
- implementation backlog

---

## 1. Executive Summary

ANEXSYS backend architecture must preserve the approved separation of business truth:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Physical Bag = physical support element only

The backend must therefore be organized around:
- a modular monolith as the initial architecture style
- strict tenant and branch isolation
- explicit bounded contexts aligned to the conceptual, logical, and physical data models
- event-driven internal collaboration without giving up transactional consistency
- immutable audit and custody traceability
- configurable workflow, status, SLA, approval, and notification behavior

The recommended backend direction is:
- framework: NestJS with TypeScript
- application style: modular monolith with domain modules and clear internal contracts
- transactional data store: PostgreSQL aligned to `DATABASE_PHYSICAL_V1.md`
- binary evidence and document storage: object storage behind an internal storage abstraction
- event propagation: transactional outbox plus internal domain-event bus
- background processing: queue-backed workers for notifications, integrations, SLA timers, and heavy asynchronous tasks

This strategy is recommended because ANEXSYS already has stable business boundaries, a mature database baseline, explicit source-of-truth rules, and many cross-domain workflows that benefit from one deployable codebase with strong module isolation before any future service extraction.

---

## 2. Backend Principles

### 2.1 Source-of-truth discipline
- Service Order modules own commercial, delivery-commitment, approval-reference, and financial-anchor meaning.
- Production Order modules own operational execution, QR execution, responsibility assumption, status progression, and diary-linked operational history.
- Physical Bag support remains optional physical context only and must never become an independent backend authority.

### 2.2 Modular boundary discipline
- Each module owns its own application services, domain rules, data access, events, and policy enforcement.
- Cross-module access must happen through internal contracts, not direct rule leakage.
- Shared infrastructure utilities must not become shared business logic.

### 2.3 Audit-first processing
- All critical business actions must generate immutable audit records.
- Operational scans, custody events, approvals, financial actions, and permission changes must remain traceable.
- Evidence references must be preserved even when mutable operational records change.

### 2.4 Configuration over hard-coding
- Workflow status behavior, delivery types, SLA rules, calendars, approval requirements, and notification templates must be tenant-configurable.
- The backend must support industry-agnostic behavior through configuration, not sector-specific branching in core modules.

### 2.5 Asynchronous where needed, transactional where required
- Source-of-truth changes must commit transactionally in the owning module.
- Notifications, integrations, derived dashboards, reminders, and long-running recalculations should be asynchronous.
- Cross-domain reactions must not weaken transactional ownership.

### 2.6 Security by default
- Every request and background action must execute under authenticated tenant context and authorized scope.
- Sensitive data must use least-privilege access, explicit purpose boundaries, and auditable access paths.

---

## 3. Chosen Backend Strategy

### 3.1 Architecture style

ANEXSYS should start as a modular monolith.

Chosen strategy:
- one primary backend codebase
- one primary deployable application for synchronous business operations
- separate worker runtime processes from the same codebase for background jobs
- internal module contracts to keep future extraction possible

Justification:
- business rules are already rich, cross-cutting, and tightly related
- many flows require strong transactional consistency across Service Order, Production Order, Workflow, Audit, Finance, and Pickup
- a modular monolith reduces distributed-system overhead during the first implementation phase
- the approved domain model is mature enough to create strong boundaries now, enabling later selective extraction if scale demands it

### 3.2 Recommended backend framework

Recommended framework: **NestJS + TypeScript**

Justification:
- strong module system fits the required bounded-context structure
- dependency injection supports clear policy, adapter, and domain-service boundaries
- guards, interceptors, and pipes align well with cross-cutting security, tenant isolation, and audit capture
- good support for JWT, queues, schedulers, validation, and event patterns without forcing microservices
- TypeScript improves consistency between domain contracts, workflow policies, and integration adapters

### 3.3 Persistence strategy

The backend should use PostgreSQL as the transactional system of record, directly aligned to `DATABASE_PHYSICAL_V1.md`.

Architecture rule:
- the database schema is a persistence implementation of the approved business model, not the source of architectural ownership
- modules must access persistence through repositories or module-local persistence services
- module boundaries must remain valid even when tables are related physically

### 3.4 Internal communication strategy

The backend should use:
- direct service calls for synchronous intra-request collaboration where immediate consistency is required
- domain events for cross-module reactions
- outbox-driven asynchronous publication for post-commit work

This preserves:
- strong transactional behavior for source-of-truth updates
- asynchronous decoupling for notifications, integrations, reminders, projections, and analytics feeders

### 3.5 Extraction readiness strategy

Every module should be designed so that future extraction is possible if justified, especially for:
- Notifications
- Smart Concierge
- Fiscal integrations
- Payment integrations
- Reporting/analytics pipelines

The first implementation phase should not split these into separate services unless justified by scale or external dependency isolation needs.

---

## 4. Module Map

### 4.1 Core governance modules

#### Tenant Management
Owns:
- tenant identity
- tenant status
- tenant-wide policies
- tenant configuration boundaries
- tenant calendars and default business rules

#### Branch Management
Owns:
- branch identity
- branch hierarchy
- branch calendars
- branch-local operating policies
- branch participation scope for users and Operational Resources

#### Identity and Access
Owns:
- user identity
- authentication factors
- session and token lifecycle
- roles
- permissions
- branch and tenant scopes
- support for future federation

### 4.2 Customer-facing business modules

#### CRM
Owns:
- customers
- contacts
- customer interactions
- measurement records
- communication preferences

#### Service Orders
Owns:
- Service Order commercial lifecycle
- Service Order Items
- Commercial Responsible
- Technical Measurement Responsible
- promised delivery commitment
- delivery type selection
- customer-facing approvals and communication references

#### Smart Concierge
Owns:
- reception flow orchestration
- queue and handoff support
- future concierge automation capabilities

Status rule:
- this module is approved for architecture readiness
- advanced automation remains future scope unless prioritized

### 4.3 Operational execution modules

#### Production Orders
Owns:
- base Production Order generation from Service Order
- Production Order Version lineage
- execution status
- production scheduling coordination
- operational priority
- internal production and quality deadlines
- operational diary linkage
- production print-view payload

#### Operational Resources
Owns:
- Operational Resource identity
- skills
- qualification
- availability
- branch scopes
- workload and productivity references

#### QR Tracking
Owns:
- Production Order QR identity
- QR scan validation
- QR event capture
- scan-triggered operational actions

Architecture rule:
- for production execution, QR authority belongs to Production Orders
- physical bag context may be referenced but never owns the scan authority

#### Quality
Owns:
- inspection workflows
- quality checkpoints
- acceptance and rejection decisions
- quality release gates
- quality accountability

#### Rework
Owns:
- rework initiation
- original-versus-corrective attribution
- corrective execution coordination
- rework closure policy

#### Warranty
Owns:
- Warranty Adjustment flows
- Warranty Execution flows
- warranty eligibility policy application
- post-delivery responsibility tracking

#### Custody
Owns:
- chain-of-custody event registration
- storage-location movement history
- pickup evidence linkage
- physical bag support context
- location visibility during retrieval

#### Pickup Authorization
Owns:
- authorized pickup lifecycle
- pickup tokens
- pickup QR codes
- temporary pickup codes
- remote approval linkage

### 4.4 Financial control modules

#### Finance
Owns:
- payment records
- partial payments
- outstanding balance projections
- financial exceptions
- settlement visibility

Boundary rule:
- Finance remains anchored to Service Order commercial truth

#### Fiscal
Owns:
- fiscal document lifecycle
- fiscal integration orchestration
- fiscal issuance traceability

### 4.5 Cross-cutting platform modules

#### Workflow Engine
Owns:
- workflow definitions
- status definitions
- transition rules
- visibility rules
- approval requirements
- SLA rules and triggers
- delivery-date policy rules

#### Audit
Owns:
- immutable audit event recording
- change tracking
- actor and context traceability
- sensitive-action audit controls

#### Notifications
Owns:
- notification composition
- template resolution
- channel dispatch orchestration
- retries
- delivery trace
- user/customer notification preferences

#### Integrations
Owns:
- external provider adapters
- anti-corruption boundaries
- idempotent delivery to providers
- reconciliation callbacks and external-result normalization

---

## 5. Domain Map

### 5.1 Governing domains

| Domain | Owns source of truth for | Must not own |
|---|---|---|
| Tenant Management | tenant boundary, tenant policy | commercial orders, production execution |
| Branch Management | branch boundary, branch calendars | tenant identity, financial truth |
| Identity and Access | user identity, roles, permissions, sessions | business order truth |
| CRM | customer identity, interactions, measurements | production execution, settlement |
| Service Orders | commercial commitment, delivery commitment, financial anchor | operational execution truth |
| Production Orders | operational execution, Production Order lineage, operational responsibility events | prices, discounts, payment truth |
| Operational Resources | execution capacity, qualification, availability | customer commercial truth |
| Quality | inspection and release decisions | payment truth |
| Rework | internal corrective execution flow | warranty-commercial ownership |
| Warranty | post-delivery adjustment and execution responsibility | original commercial pricing truth |
| Finance | payment transaction and settlement trace | operational execution state |
| Fiscal | fiscal issuance lifecycle | core pricing ownership |
| Pickup Authorization | release authorization | production execution truth |
| QR Tracking | Production Order QR authority and scans | Service Order financial authority |
| Custody | physical movement and evidence traceability | transactional source-of-truth meaning |
| Workflow Engine | lifecycle policy and SLA rules | transactional business ownership |
| Audit | immutable history | live transactional state ownership |
| Notifications | delivery of messages and alerts | workflow-state authority |
| Integrations | provider adaptation and reconciliation | domain source-of-truth ownership |
| Smart Concierge | reception orchestration | order source-of-truth ownership |

### 5.2 Core lineage map

- Tenant
  - governs Branches
  - governs users, roles, permissions, workflows, calendars, and policies
- Customer
  - participates in Service Orders
  - keeps CRM and measurement history
- Service Order
  - is the commercial and financial root
  - owns Service Order Items
  - generates exactly one base Production Order
  - anchors Finance, Fiscal, Pickup, and many customer-facing communications
- Production Order
  - is the operational execution root
  - owns QR authority
  - emits execution events
  - may create Production Order Versions for corrective lineage
- Quality / Rework / Warranty
  - remain subordinate to Service Order and Production Order lineage
- Custody / Pickup / Audit
  - record what happened without replacing business ownership

### 5.3 Service-boundary rules

- Service Orders may reference Production Orders but do not own operational execution state.
- Production Orders may reference Service Order context but do not own commercial price or settlement truth.
- Workflow Engine governs allowed lifecycle behavior but does not own transactional meaning.
- Audit records history of actions but does not become the writable business state.
- Notifications and Integrations consume events and commands but must not silently mutate source-of-truth entities without explicit domain rules.

---

## 6. Service Boundaries Inside the Modular Monolith

### 6.1 Module-internal layers

Each module should contain:
- application services
- domain rules and policies
- repository or persistence services
- event publishers and subscribers
- integration adapters where owned by the module

### 6.2 Shared platform layers

Shared backend capabilities may include:
- request context resolution
- authentication and token validation
- tenant and branch authorization guards
- audit interceptors
- background-job dispatch
- storage abstraction
- notification abstraction
- integration base contracts

### 6.3 Forbidden boundary shortcuts

The backend must avoid:
- direct data writes into another module's tables without module contract
- bypassing tenant and branch validation in background jobs
- notification providers directly changing business state
- workflow configuration directly becoming business-source ownership
- bag/container context becoming an execution root

---

## 7. Technology Strategy

### 7.1 Backend framework recommendation

Recommended:
- NestJS
- TypeScript

Recommended supporting architecture choices:
- PostgreSQL for transactional persistence
- Redis-backed queueing for asynchronous jobs
- object storage for attachments, snapshots, approvals, and print/document artifacts

### 7.2 Authentication strategy

The backend must support:
- password login
- OTP by WhatsApp
- OTP by Email
- JWT-based authenticated API/session access
- future SSO support

Recommended authentication architecture:
- one Identity and Access module
- one principal model for users regardless of login method
- password credentials stored using strong one-way hashing
- OTP challenges modeled as short-lived authentication factors
- JWT access tokens for stateless request authentication
- refresh-token or session-token lifecycle with revocation support
- future SSO support through a federation adapter boundary, not a separate identity model

Authentication flow rule:
- successful authentication establishes tenant-aware user identity
- branch selection or branch-resolution policy must occur before branch-scoped business actions
- all sign-in, challenge, verification, impersonation, and logout actions must be audited

### 7.3 Authorization strategy

The backend must support:
- RBAC
- dynamic permissions
- multi-branch permissions
- tenant-level permissions

Recommended authorization architecture:
- RBAC for baseline role grants
- permission matrix for module/action/scope grants
- branch-scoped overlays for branch-local rights
- tenant-scoped overrides for tenant administration and cross-branch governance
- object-state-aware checks for sensitive transitions such as approvals, financial overrides, status changes, and data export

Authorization rule hierarchy:
1. authenticated tenant identity
2. active user status
3. role membership
4. permission grant
5. branch-scope eligibility
6. object-state restrictions
7. approval-authority restrictions where applicable

### 7.4 Multi-tenant strategy

Recommended model:
- shared application
- shared PostgreSQL cluster
- shared schema with strict `tenant_id` isolation aligned to the approved physical model

Required backend controls:
- tenant context resolved on every request and job
- tenant-consistent repository queries
- tenant-consistent foreign-key usage
- tenant-local numbering, workflow, calendars, permissions, and templates
- no cross-tenant reads except explicitly authorized platform-administration functions

Future option:
- the architecture should preserve a path to tenant-level database partitioning or selective extraction if very large tenants later justify it

### 7.5 Storage strategy

Recommended model:
- PostgreSQL stores transactional metadata and references
- binary artifacts are stored outside PostgreSQL through a storage abstraction

Binary artifact scope includes:
- approval attachments
- signatures
- photos
- camera snapshots
- imported files
- print artifacts

Storage rules:
- evidence metadata remains auditable in the database
- file access must respect tenant, branch, and role restrictions
- retention and deletion policy must respect LGPD and business evidence rules

### 7.6 Event processing strategy

Recommended model:
- internal domain events for module reactions
- transactional outbox for reliable asynchronous publication
- explicit event handlers for notifications, integrations, SLA timers, and projections

Why:
- preserves reliability when business state and asynchronous work must not diverge
- reduces risk of missed notifications or missed reconciliation actions
- keeps the monolith internally decoupled without distributed transactions

### 7.7 Background jobs strategy

Background jobs are required for:
- notifications
- payment/fiscal/integration retries
- SLA deadline checks
- reminder scheduling
- migration import processing
- report generation
- evidence post-processing
- delayed cleanup governed by retention policy

Job rules:
- every job must carry tenant context
- jobs must be idempotent where external effects exist
- failed jobs must be retryable and auditable
- dead-letter handling must preserve investigation traceability

---

## 8. Multi-Tenant and Multi-Branch Architecture

### 8.1 Tenant isolation

Tenant isolation must be enforced at:
- authentication context
- authorization checks
- repository filtering
- workflow configuration lookup
- numbering generation
- notification templates
- storage namespace resolution
- integration credentials
- audit queries

### 8.2 Branch isolation

Branch isolation must be enforced at:
- branch-scoped user visibility
- Operational Resource allocation scope
- branch-local workflow behavior where configured
- storage-location visibility
- scheduling and dashboard views
- finance and pickup operations where branch ownership is required

### 8.3 Security boundaries

The backend must enforce:
- platform-admin boundaries
- tenant-admin boundaries
- branch-manager boundaries
- sensitive-data boundaries for finance, measurements, approvals, attendance, and custody evidence
- support-access boundaries with full auditability

### 8.4 Data ownership enforcement

The backend must ensure:
- Service Order records cannot be mutated by modules that do not own commercial truth
- Production status cannot be authored outside Production/Workflow rules
- financial settlement cannot be authored from Production context
- bag/location/pickup context cannot replace Service Order or Production Order ownership

---

## 9. Workflow Engine Architecture

### 9.1 Architectural role

Workflow Engine is a policy module, not the owner of transactional business truth.

It must define:
- dynamic statuses
- permitted transitions
- visibility rules
- approval requirements
- SLA timing behavior
- escalation rules
- delivery-date policy hooks

### 9.2 Dynamic statuses

Statuses must be:
- tenant-configurable
- optionally branch-sensitive
- workflow-domain specific
- auditable and versioned

Status domains include:
- Service Order
- Service Order Item
- Production Order
- Quality
- Rework
- Warranty
- Payment
- Delivery
- Pickup
- Approval
- Smart Concierge

### 9.3 Internal versus external status

The backend should separate:
- internal status: detailed operational and back-office state
- external status: customer-facing simplified visibility state

Rules:
- internal status may contain granular production, quality, queue, and exception details
- external status must expose only customer-safe lifecycle meaning
- status visibility must be configurable by role, channel, and workflow domain

### 9.4 SLA integration

Workflow Engine must integrate with:
- SLA start triggers
- pause/resume triggers
- completion triggers
- violation triggers
- escalation rules
- delivery-type influence
- branch and tenant calendar evaluation

### 9.5 Approval flows

Workflow Engine must support approval-gated transitions for:
- Service Order approval
- Production Order version approval
- delivery authorization
- payment-condition confirmation
- rework or warranty resolution confirmation
- pickup authorization and remote approval paths where applicable

### 9.6 Delivery Date Engine placement

The Delivery Date Engine should be implemented as a domain service governed by Workflow/Policy and invoked from Service Orders and scheduling flows.

It must:
- suggest the next-week same-weekday baseline date
- apply holiday, branch-calendar, and tenant-calendar validation
- move non-working dates to the next valid business day
- feed downstream promised delivery, scheduling, SLA, and buffer calculations

---

## 10. Event Model

### 10.1 Event architecture principles

- events originate in the domain that owns the business fact
- events are immutable after publication
- event names reflect business meaning, not technical mechanics
- downstream consumers react without taking ownership of the originating fact

### 10.2 Core event families

#### QR Events
- ProductionOrderQrScanned
- OperationalResponsibilityAssumed
- ProductionStatusUpdatedByScan
- OperationalDiaryUpdatedByScan

#### Production Events
- ProductionOrderGenerated
- ProductionOrderScheduled
- ProductionOrderStarted
- ProductionOrderPaused
- ProductionOrderCompleted
- ProductionOrderVersionCreated

#### Quality Events
- QualityInspectionRecorded
- QualityApproved
- QualityRejected

#### Rework Events
- ReworkOpened
- ReworkAssigned
- ReworkReassigned
- ReworkClosed

#### Warranty Events
- WarrantyAdjustmentOpened
- WarrantyExecutionOpened
- WarrantyResolutionCompleted

#### Finance Events
- PaymentRecorded
- PartialPaymentAllocated
- FinancialExceptionOpened
- FiscalDocumentIssued

#### Audit Events
- AuditEventRecorded
- SensitiveAccessRecorded
- PermissionChanged

#### Custody Events
- StorageLocationAssigned
- CustodyTransferred
- PhysicalBagContextAssociated
- PickupEvidenceCaptured

#### Pickup Events
- PickupAuthorized
- PickupTokenIssued
- PickupQrIssued
- TemporaryPickupCodeIssued
- PickupCompleted

### 10.3 Event routing model

- domain events stay internal first
- integration events are derived from internal domain events when external propagation is needed
- notification triggers subscribe to business events, not raw database changes
- analytics projections subscribe to approved event streams or read-model refresh triggers

### 10.4 Event persistence alignment

The backend event model must align with the approved physical structures, especially:
- `production_execution_events`
- `qr_events`
- `custody_events`
- `audit_events`
- `communication_events`

---

## 11. Audit Architecture

### 11.1 Audit ownership

Audit is a dedicated cross-cutting backend module responsible for immutable history.

It must preserve:
- actor identity
- tenant and branch context
- action type
- target aggregate type and identifier
- previous and resulting state where applicable
- reason/justification where required
- evidence references where available

### 11.2 Immutable history

Audit records must be append-only for critical business actions, especially:
- status changes
- QR scans
- approval decisions
- financial actions
- rework and warranty actions
- custody and pickup events
- authentication and permission changes

### 11.3 Change tracking

The backend should distinguish:
- business audit events
- technical access/security events
- custody evidence events

This allows:
- compliance review
- operational investigation
- dispute resolution
- LGPD-sensitive access review

### 11.4 Evidence tracking

Evidence tracking must link:
- approvals
- signatures
- photos
- camera snapshots
- CCTV references
- pickup artifacts
- related Service Order / Production Order / Pickup Authorization lineage

### 11.5 Audit capture model

Audit capture should happen through:
- application-service audit emitters for business actions
- security interceptors for authentication and authorization activity
- integration adapters for external request/response trace points where business-relevant

---

## 12. Security Model

### 12.1 Identity model

- users authenticate through password, email OTP, WhatsApp OTP, and later SSO
- Operational Resources may map to user accounts when interactive execution is required
- human identity and Operational Resource participation must remain related but not automatically identical

### 12.2 Session and token model

- JWT access tokens authenticate requests
- refresh/session lifecycle must support revocation
- branch and tenant claims must never bypass server-side authorization checks
- impersonation or elevated support sessions must be explicitly marked and audited

### 12.3 Permission model

- RBAC grants base access
- dynamic permissions refine action rights
- branch-scoped permissions constrain where actions may occur
- tenant-level permissions authorize administrative and cross-branch functions

### 12.4 Sensitive data controls

The backend must apply stricter controls to:
- financial data
- customer contact data
- measurement records
- attendance data
- approval evidence
- CCTV and camera evidence
- future biometric data

### 12.5 Operational execution security

- Production Order scan actions must validate authenticated identity, tenant, branch eligibility, and workflow permission before changing operational state
- the Production Order remains the only QR-driven execution authority for production execution
- physical bag scans must never become an alternative execution authority

---

## 13. Notification Architecture

### 13.1 Supported channels

The backend must support:
- WhatsApp
- Email
- Internal Notifications
- future SMS

### 13.2 Notification design

Notifications should be orchestrated by a dedicated module that:
- listens to approved business events
- resolves audience and consent rules
- renders templates
- dispatches through channel adapters
- stores delivery attempts and outcomes

### 13.3 Notification trigger examples

- Service Order created or approved
- delivery date changed
- Priority or Express alert created
- Production Order assigned or delayed
- quality rejection opened
- rework or warranty action required
- payment reminder due
- pickup authorization issued
- customer approval requested

---

## 14. Integration Architecture

### 14.1 Integration boundary model

All external integrations must be implemented through explicit adapter boundaries.

The backend should separate:
- provider-neutral domain contracts
- provider-specific adapter logic
- reconciliation and retry handling
- audit and traceability of external calls

### 14.2 Supported integration families

#### Stone
- payment initiation and result reconciliation

#### Cielo
- payment initiation and result reconciliation

#### Banking integrations
- receivable confirmation
- payment settlement trace
- statement or reconciliation support where adopted

#### Fiscal integrations
- fiscal document issuance
- cancellation
- status synchronization

#### Camera integrations
- pickup-evidence capture
- CCTV reference registration

#### Physical access control
- optional enterprise integration for doors, gates, turnstiles, and related access events

#### Future APIs
- customer portals
- partner integrations
- mobile operational apps
- future marketplace or ERP adapters

### 14.3 Integration rules

- external provider identifiers must never replace internal aggregate identity
- integration failures must not silently corrupt source-of-truth records
- retries must be idempotent where provider side effects exist
- external responses must be normalized before reaching domain services

---

## 15. Storage Architecture

### 15.1 Transactional storage

PostgreSQL is the system of record for:
- orders
- production lineage
- finance
- workflow
- audit
- custody
- approvals
- notifications metadata

### 15.2 Evidence and attachment storage

Object storage should be used for:
- approval files
- images
- camera snapshots
- customer attachments
- print artifacts
- imported onboarding files

### 15.3 Retrieval and access rules

- access must be tenant-aware
- sensitive artifacts require stricter authorization
- evidence retrieval must remain auditable

---

## 16. Scalability Strategy

### 16.1 Initial scale model

The first implementation phase should scale through:
- stateless application instances
- shared PostgreSQL persistence
- asynchronous workers
- read-optimized queries and projections where needed

### 16.2 Module pressure points

The most likely early scale hotspots are:
- QR scanning throughput
- notifications
- audit/event growth
- integrations
- reporting and dashboards

### 16.3 Evolution strategy

When required, the architecture should evolve by:
- separating worker processes from request-serving processes
- isolating notification and integration throughput
- introducing specialized read models
- partitioning high-volume event/audit tables
- extracting selected modules only when organizational and operational value exceeds complexity cost

---

## 17. Deployment Strategy

### 17.1 Deployment model

Recommended deployment model:
- one primary backend application artifact
- one or more worker artifacts built from the same codebase
- shared PostgreSQL database
- shared queueing infrastructure
- shared object storage

### 17.2 Environment strategy

The backend should support separate environments for:
- development
- test
- staging
- production

### 17.3 Operational controls

Deployment architecture must support:
- secure secret management
- environment-specific provider credentials
- audit-safe logging
- backup and recovery alignment
- health monitoring
- job monitoring
- integration-failure monitoring

---

## 18. Remaining Technical Risks

- Identity and Access detailed data model still requires final repository-level formalization because the current baseline defines authorization requirements but not a full user/session schema.
- External-provider variability for Stone, Cielo, banking, fiscal, camera, and access-control integrations will require strict adapter governance and staged rollout.
- Workflow configurability is powerful but may become overly complex without strong administration UX and validation rules.
- Notification and approval channels must respect consent, retention, and LGPD constraints consistently across WhatsApp, Email, and future SMS.
- QR scanning concurrency and offline/unstable-network behavior will need careful implementation rules to avoid duplicate execution events.
- Reporting and dashboard needs may eventually require specialized read models beyond the transactional module queries.
- Migration onboarding imports may create high-volume validation workloads that should remain isolated from core operational traffic.

---

## 19. Backend Readiness Score

**Score: 95/100**

Rationale:
- the business architecture intent is explicit and stable
- the conceptual, logical, and physical database artifacts are mature and internally aligned
- source-of-truth ownership, workflow policy ownership, event ownership, and audit ownership are already well defined
- multi-tenant, multi-branch, pickup, custody, QR, quality, rework, and finance boundaries are sufficiently clear to start backend implementation
- the remaining deductions apply mainly to detailed identity/access schema decisions, provider-specific adapter contracts, and operational implementation tactics rather than to architectural uncertainty

---

## 20. Final Readiness Statement

ANEXSYS is ready to start backend implementation.

Readiness conditions:
- implementation must preserve the approved Service Order versus Production Order separation
- implementation must keep Production Order QR ownership exclusive for operational execution
- implementation must keep the physical bag as support-only physical context
- implementation must enforce tenant, branch, workflow, audit, and security boundaries from the first release
