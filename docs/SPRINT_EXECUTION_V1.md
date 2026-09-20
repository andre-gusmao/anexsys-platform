# ANEXSYS Platform
# SPRINT_EXECUTION_V1

## Document Purpose

This document transforms the approved implementation plan into an executable development roadmap for ANEXSYS using the following documents as source of truth:
- `/docs/releases/BASELINE_V3.0.md`
- `/docs/BACKEND_IMPLEMENTATION_V1.md`
- `/docs/BACKEND_ARCHITECTURE_V1.md`
- `/docs/FRONTEND_ARCHITECTURE_V1.md`
- `/docs/API_DESIGN_V1.md`

This document defines:
- sprint-by-sprint execution scope
- backend, frontend, database, and API task grouping
- MVP cut line
- delivery milestones
- pilot and production sequencing

This document does not define:
- source code
- controllers
- framework classes
- infrastructure-as-code

---

## 1. Executive Summary

ANEXSYS is ready to move from approved planning into sprint execution.

The recommended roadmap should progress in the following order:
- governance and access foundations
- customer and measurement continuity
- Service Order commercial truth
- Production Order operational truth
- QR-driven execution and diary traceability
- quality and corrective execution
- financial and fiscal continuity
- pickup, custody, and storage control
- reception, customer portal, and migration readiness
- hardening and production readiness

The roadmap must preserve the approved architectural invariants:
- Service Order remains the commercial and financial source of truth
- Production Order remains the operational execution source of truth
- Production Order QR ownership remains exclusive for execution
- the physical bag/container remains support-only traceability context

The sprint plan below assumes:
- modular monolith backend implementation
- desktop-first administrative frontend
- mobile-first operational execution frontend
- `/api/v1` as the application API namespace
- PostgreSQL as the transactional system of record

---

## 2. Sprint Sequence

### Sprint 1 - Tenant, Branch, Identity, Authentication, Authorization

**Sprint Goal**
- establish tenant-safe access, branch governance, identity, and permission foundations for all downstream work

**Functional Scope**
- tenant management
- branch management
- user identity
- authentication
- authorization

**Backend Tasks**
- implement Tenant and Branch core modules
- implement Identity and Authorization modules
- implement JWT, refresh-token, and session strategy foundations
- implement branch and tenant request-context enforcement
- implement audit emission for auth and permission-sensitive actions

**Frontend Tasks**
- implement login and session-entry shell
- implement tenant/branch context selection where authorized
- implement user/session state handling in the administrative portal shell
- implement role-aware navigation skeleton

**Database Tasks**
- implement tenant, branch, identity, session, role, permission, and branch-scope persistence
- implement tenant and branch consistency rules
- implement audit support tables required for access governance

**API Tasks**
- implement Authentication APIs
- implement Authorization APIs
- implement Tenant APIs
- implement Branch APIs

**Acceptance Criteria**
- users can authenticate securely
- tenant context is resolved for authenticated use
- branch scope is enforced
- roles and permissions can govern visibility and actions
- auth and authorization actions are auditable

**Risks**
- weak tenant isolation would contaminate all downstream work
- incomplete permission modeling would create broad rework
- branch context ambiguity would destabilize visibility rules

**Definition of Done**
- backend modules, persistence, and APIs are usable in dev
- frontend login and context selection flows work
- auth/authorization acceptance scenarios pass
- audit and security behaviors are verified

---

### Sprint 2 - CRM, Customers, Measurements

**Sprint Goal**
- establish customer continuity and measurement history before order intake

**Functional Scope**
- CRM
- customers
- measurements

**Backend Tasks**
- implement customer, contact, interaction, and measurement application services
- implement duplicate-aware customer and measurement validation rules
- implement branch-aware customer visibility behavior

**Frontend Tasks**
- implement customer directory
- implement customer profile
- implement measurement history and measurement registration views
- implement CRM interaction timeline

**Database Tasks**
- implement customers, customer_contacts, customer_interactions, and measurement_records persistence
- implement relevant soft-delete, versioning, and tenant/branch scope rules

**API Tasks**
- implement Customer APIs
- implement Measurement APIs

**Acceptance Criteria**
- customer records can be created, searched, and maintained
- contacts and interactions are visible in CRM context
- measurements are version-aware and attributable
- branch and tenant scope remain enforced

**Risks**
- duplicate customer handling may create migration problems
- weak measurement attribution may break later operational execution

**Definition of Done**
- CRM, customer, and measurement workflows work end to end
- APIs support frontend needs without ownership drift
- search, filtering, and visibility rules are verified

---

### Sprint 3 - Service Orders, Service Order Items, Delivery Date Engine

**Sprint Goal**
- establish the commercial intake and delivery-commitment core

**Functional Scope**
- Service Orders
- Service Order Items
- Delivery Date Engine

**Backend Tasks**
- implement Service Order and Service Order Item modules
- implement Commercial Responsible and Technical Measurement Responsible rules
- implement Delivery Date Engine invocation path and delivery-type behavior
- implement approval-dependent progression rules where required

**Frontend Tasks**
- implement Service Order List
- implement Service Order Create/Edit
- implement Service Order Detail
- implement delivery-date suggestion visibility
- implement approval-state visibility in Service Order views

**Database Tasks**
- implement service_orders and service_order_items persistence
- implement delivery commitment source fields and delivery-type fields
- implement workflow references needed for order lifecycle

**API Tasks**
- implement Service Order APIs
- implement supporting Workflow APIs needed by Service Order lifecycle actions

**Acceptance Criteria**
- Service Orders can be created and maintained
- Service Order Items can be managed
- delivery dates are suggested automatically using approved rules
- commercial truth remains anchored to Service Order only

**Risks**
- Delivery Date Engine behavior may drift if calendar rules are not centralized
- Service Order screens may become too dense if pricing, approvals, and measurements are not separated well

**Definition of Done**
- Service Order intake works end to end across backend, frontend, database, and APIs
- delivery commitment is visible and explainable
- Production Order is not yet required for commercial completion

---

### Sprint 4 - Production Orders, Operational Resources, Operational Assignments

**Sprint Goal**
- establish the operational execution root and execution-capacity model

**Functional Scope**
- Production Orders
- Operational Resources
- Operational Assignments

**Backend Tasks**
- implement Production Order generation from Service Order
- implement Production Order version lineage foundations
- implement Operational Resource management
- implement assignment and primary-responsibility lifecycle behavior

**Frontend Tasks**
- implement Production Overview
- implement Assigned Production Orders overview
- implement Operational Resource management/admin views
- implement assignment visibility in production views

**Database Tasks**
- implement production_orders, production_order_versions, operational_resources, and operational assignment persistence
- enforce one base Production Order per Service Order and current-responsibility rules

**API Tasks**
- implement Production Order APIs
- implement Operational Resource APIs

**Acceptance Criteria**
- each Service Order can generate exactly one base Production Order
- Operational Resources can be managed and assigned
- current assignment state is visible and controlled
- operational truth is anchored to Production Order

**Risks**
- incorrect Production Order generation would violate source-of-truth separation
- assignment ambiguity may create accountability conflicts

**Definition of Done**
- production root creation, assignment, and visibility work end to end
- frontend reflects operational ownership without exposing financial data

---

### Sprint 5 - QR, Production Execution, Operational Diary

**Sprint Goal**
- enable QR-driven execution and diary-linked operational traceability

**Functional Scope**
- QR
- Production Execution
- Operational Diary

**Backend Tasks**
- implement QR identity and scan event handling
- implement execution transition actions tied to Production Orders
- implement diary event capture and execution-event traceability
- implement permission-aware scan outcomes

**Frontend Tasks**
- implement QR Scanner
- implement Production Order Execution screen
- implement Operational Diary screen
- implement mobile-first status-change and diary-entry flows

**Database Tasks**
- implement qr_codes, qr_events, and production_execution_events persistence
- implement active-QR and execution-state consistency rules

**API Tasks**
- implement QR APIs
- implement Production execution action endpoints under Production Order ownership

**Acceptance Criteria**
- Operational Resources can scan Production Order QR codes
- scans trigger governed execution actions
- diary entries and execution events are recorded
- mobile users can complete production actions without desktop dependence

**Risks**
- QR concurrency and retry behavior may create duplicate or invalid transitions
- poor mobile execution design could slow operational adoption

**Definition of Done**
- mobile execution works end to end
- QR authority remains exclusive to Production Order
- operational diary history is queryable and auditable

---

### Sprint 6 - Quality, Rework, Warranty

**Sprint Goal**
- establish controlled quality decisions and corrective execution flows

**Functional Scope**
- Quality
- Rework
- Warranty

**Backend Tasks**
- implement quality inspection and release/rejection workflows
- implement rework-case initiation and corrective attribution
- implement Warranty Adjustment and Warranty Execution separation
- implement evidence and decision traceability for quality-related actions

**Frontend Tasks**
- implement Quality Tasks
- implement rework task views
- implement warranty execution views
- implement blocked-release and decision-state visibility

**Database Tasks**
- implement quality_records, customer_rejections, rework_cases, warranty_adjustments, and warranty_executions persistence
- implement lineage and audit references for corrective flows

**API Tasks**
- implement Quality APIs
- implement Rework APIs
- implement Warranty APIs

**Acceptance Criteria**
- quality release/reject flows work
- rework preserves original and corrective attribution
- warranty adjustment and warranty execution remain distinct
- corrective flows preserve Production Order lineage

**Risks**
- corrective lineage may become inconsistent if versioning rules are weak
- warranty ownership may drift between commercial and operational contexts

**Definition of Done**
- quality and corrective flows work end to end
- evidence and audit requirements are preserved
- mobile and desktop roles both have the required task visibility

---

### Sprint 7 - Financial, Partial Payments, Financial Exceptions

**Sprint Goal**
- establish commercial settlement continuity without breaking source-of-truth separation

**Functional Scope**
- Financial
- Partial Payments
- Financial Exceptions

**Backend Tasks**
- implement payment lifecycle services
- implement partial allocation logic
- implement governed financial-exception flows
- implement financial audit and reconciliation entry points

**Frontend Tasks**
- implement Finance Workspace
- implement payment review and entry views
- implement partial payment allocation flows
- implement exception queue visibility

**Database Tasks**
- implement payment_records, partial_payments, and financial_exceptions persistence
- implement Service Order financial anchoring and exception traceability

**API Tasks**
- implement Financial APIs

**Acceptance Criteria**
- payments can be recorded and reviewed
- partial payments preserve allocation traceability
- financial exceptions are governed and auditable
- Production Order remains financially clean

**Risks**
- financial logic may drift into operational contexts
- exception workflows may become opaque without strong audit traces

**Definition of Done**
- finance flows work end to end
- Service Order remains the commercial and financial source of truth
- finance visibility is role-restricted and validated

---

### Sprint 8 - Fiscal

**Sprint Goal**
- establish fiscal lifecycle orchestration on top of stable commercial and financial foundations

**Functional Scope**
- Fiscal

**Backend Tasks**
- implement fiscal document lifecycle orchestration
- implement issuance, status-sync, and cancellation flows
- implement provider-adapter boundaries for fiscal integrations

**Frontend Tasks**
- implement Fiscal Workspace
- implement fiscal lifecycle visibility
- implement issuance/cancellation state handling views

**Database Tasks**
- implement fiscal_documents persistence
- implement fiscal-state traceability and branch-aware ownership

**API Tasks**
- implement Fiscal APIs

**Acceptance Criteria**
- fiscal lifecycle stages are visible and governable
- issuance and cancellation flows are supported
- fiscal-state synchronization can be tracked

**Risks**
- provider-specific integration details may slow delivery
- fiscal-state drift may create compliance and reconciliation issues

**Definition of Done**
- fiscal workflows work end to end at the orchestration level
- fiscal status remains auditable and branch-aware

---

### Sprint 9 - Pickup Authorization, Chain of Custody, Storage Locations

**Sprint Goal**
- secure retrieval, release, and storage visibility for atelier replacement readiness

**Functional Scope**
- Pickup Authorization
- Chain of Custody
- Storage Locations

**Backend Tasks**
- implement pickup authorization and release-credential flows
- implement custody event orchestration
- implement storage location assignment and retrieval history
- implement evidence linkage for release-sensitive actions

**Frontend Tasks**
- implement Pickup/Custody Workspace
- implement storage location visibility in retrieval flows
- implement pickup-authorization validation views
- implement custody and handoff visibility

**Database Tasks**
- implement pickup_authorizations, pickup_tokens, pickup_qr_codes, temporary_pickup_codes, custody_events, storage_locations, and storage_location_assignments persistence
- implement location-history and release-evidence traceability rules

**API Tasks**
- implement Pickup APIs
- implement Storage Location APIs
- implement Audit/Custody-support endpoints where needed

**Acceptance Criteria**
- pickup authorization can be created and validated
- custody events and storage locations are visible and auditable
- release flows preserve evidence and controlled handoff behavior

**Risks**
- release without strong evidence capture would create operational risk
- location-history semantics may become confusing if current versus historical location is unclear

**Definition of Done**
- pickup, custody, and storage flows work end to end
- operational retrieval visibility exists
- atelier replacement MVP cut line is technically reachable

---

### Sprint 10 - Smart Concierge, Reception Queue, Customer Portal

**Sprint Goal**
- complete the front-of-house experience for reception, customer self-service, and controlled queue/retrieval interaction

**Functional Scope**
- Smart Concierge
- Reception Queue
- Customer Portal

**Backend Tasks**
- implement reception queue orchestration
- implement customer-safe status mapping
- implement customer portal visibility boundaries
- implement concierge and pickup lookup/read-model support

**Frontend Tasks**
- implement Arrival Queue
- implement Fast Lookup
- implement Retrieval View
- implement Customer Portal screens for order tracking, approvals, warranty requests, and pickup authorization

**Database Tasks**
- implement supporting queue/read-model structures only where required by existing approved data boundaries
- extend audit/evidence support for reception and handoff flows

**API Tasks**
- implement Smart Concierge APIs
- implement Dashboard read endpoints needed by concierge/portal flows
- implement customer-facing read/action endpoints under existing domain ownership

**Acceptance Criteria**
- reception queue works for lookup and retrieval initiation
- customer portal exposes customer-safe visibility only
- concierge flow supports controlled pickup and handoff
- advanced concierge automation remains out of scope unless explicitly prioritized

**Risks**
- Smart Concierge scope may expand beyond approved base scope
- customer-facing terminology may leak internal workflow vocabulary

**Definition of Done**
- reception and customer self-service flows work end to end
- visibility and permission rules are verified for internal vs external users
- first atelier pilot can be executed with front-of-house support

---

### Sprint 11 - Migration Framework, CSV Import, Excel Import, Validation, Rollback

**Sprint Goal**
- establish governed onboarding and migration execution for pilot and rollout readiness

**Functional Scope**
- Migration Framework
- CSV Import
- Excel Import
- Validation
- Rollback

**Backend Tasks**
- implement migration orchestration boundary
- implement staging, validation, approval, activation, and rollback flows
- implement import-job lifecycle and error reporting

**Frontend Tasks**
- implement migration/admin monitoring views
- implement validation review and approval screens
- implement import error and rollback visibility

**Database Tasks**
- implement import-job and staging persistence only as required by the approved migration framework
- preserve activation-by-destination-module rule

**API Tasks**
- implement Migration APIs
- implement job/status endpoints for import execution

**Acceptance Criteria**
- CSV and Excel imports can be staged and validated
- rollback path exists for insufficient-quality activation
- activation respects destination module ownership

**Risks**
- invalid migration data may leak into operational truth
- high-volume import and validation flows may strain async execution

**Definition of Done**
- migration framework supports rehearsal-quality onboarding
- import, validation, approval, and rollback flows are auditable
- pilot expansion readiness is materially improved

---

### Sprint 12 - Performance, Hardening, Security Review, Audit Review, LGPD Validation, Production Readiness

**Sprint Goal**
- harden the platform for secure, compliant, and production-ready rollout

**Functional Scope**
- Performance
- Hardening
- Security Review
- Audit Review
- LGPD Validation
- Production Readiness

**Backend Tasks**
- optimize hotspots and read-model behavior
- complete security hardening and permission review
- complete audit coverage review
- validate retention, purpose, and access rules relevant to LGPD

**Frontend Tasks**
- complete role/visibility hardening
- refine customer-safe messaging and error handling
- complete high-risk usability tuning for QR, diary, approvals, and pickup flows

**Database Tasks**
- validate performance-sensitive paths
- validate auditability, retention, and governance-sensitive persistence behavior

**API Tasks**
- validate API security, idempotency, error semantics, and production-readiness behavior

**Acceptance Criteria**
- performance bottlenecks are addressed to release-ready level
- security and audit reviews are completed
- LGPD-sensitive flows are validated
- production rollout readiness is formally assessable

**Risks**
- security, privacy, or audit gaps may delay rollout
- production-readiness issues may surface late if pilot feedback is insufficient

**Definition of Done**
- release hardening is complete
- production milestone criteria are satisfied
- earliest production version is ready for controlled rollout

---

## 3. MVP Definition

### MVP Cut Line
- the MVP cut line is **after Sprint 9**

### Minimum features required to replace the current atelier system
- tenant and branch governance
- identity, authentication, and authorization
- CRM, customers, and measurements
- Service Orders and Service Order Items
- Delivery Date Engine
- Production Orders, Operational Resources, and Operational Assignments
- QR-driven production execution
- Operational Diary
- Quality
- Financial continuity at minimum operational level
- Pickup Authorization
- Chain of Custody
- Storage Locations

### Earliest Pilot Version
- the earliest pilot version is **after Sprint 10**
- rationale: the operational MVP is complete after Sprint 9, and Sprint 10 adds the mandatory reception queue and customer-facing support needed for a realistic atelier pilot

### Earliest Production Version
- the earliest production version is **after Sprint 12**
- rationale: production release requires hardening, security review, audit review, LGPD validation, and production-readiness closure

---

## 4. Development Environment

### Dev Environment milestone
- **after Sprint 1**
- `dev.anexsys.com.br` can be deployed after Sprint 1 with tenant, branch, identity, authentication, authorization, and portal shell foundations available for iterative development

### Homologation milestone
- **after Sprint 9**
- by this point the core atelier replacement scope is available for full internal end-to-end business validation

### Production milestone
- **after Sprint 12**
- this is the first point where hardening, security, audit, LGPD, and production-readiness work are all included in scope

### Explicit milestone answers
- `dev.anexsys.com.br` can be deployed **after Sprint 1**
- the first pilot can be executed inside the atelier **after Sprint 10**

---

## 5. Critical Dependencies

- tenant and branch enforcement must precede all business-domain implementation
- Identity and Authorization must precede protected frontend flows and APIs
- CRM and Measurements must precede Service Order intake
- Service Orders must precede Production Orders, Finance, Fiscal, Pickup, and Customer Portal tracking
- Production Orders and Operational Assignments must precede QR execution and diary flows
- QR and diary flows must precede full Quality and corrective operational validation
- Finance must precede stable Fiscal rollout
- Pickup, Custody, and Storage must precede atelier replacement MVP completion
- Smart Concierge and Customer Portal depend on stable pickup, custody, and customer-safe status mapping
- Migration framework depends on stable destination-module ownership across earlier sprints

---

## 6. Highest Risk Areas

- tenant and branch isolation failures
- authorization and visibility drift across internal vs external experiences
- Delivery Date Engine and workflow coupling
- Production Order generation and assignment accountability
- QR scan concurrency, retry behavior, and mobile usability
- quality/rework/warranty lineage integrity
- finance/fiscal integration and reconciliation discipline
- pickup/custody evidence and release-control integrity
- migration staging, validation, and rollback correctness
- LGPD-sensitive access, audit, and retention validation

---

## 7. Development Readiness Score

**Score: 95/100**

Rationale:
- product, architecture, database, API, backend, and frontend planning are already mature and aligned
- sprint boundaries can now be mapped directly to approved module ownership
- the remaining uncertainty is concentrated in execution risk, integration details, mobile/UX tuning, and hardening work rather than in planning gaps

---

## 8. Final Sprint Execution Statement

ANEXSYS is ready to start Sprint 1.

Execution conditions:
- preserve Service Order as commercial and financial truth
- preserve Production Order as operational truth
- keep Production Order QR ownership exclusive for execution
- maintain financially clean Production views
- enforce tenant, branch, workflow, audit, privacy, and permission boundaries from the first sprint
