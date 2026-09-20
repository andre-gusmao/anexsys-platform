# ANEXSYS Platform
# BACKEND_CODING_PLAN_V1

## Document Purpose

This repository-carried backend coding-plan document remains part of the approved downstream design baseline referenced by `BASELINE_V3.0`.

This document defines the backend execution roadmap for ANEXSYS using the following approved documents as source of truth:
- `/docs/releases/BASELINE_V2.0.md`
- `/docs/BACKEND_ARCHITECTURE_V1.md`
- `/docs/API_DESIGN_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`
- `/docs/working/MIGRATION_AND_ONBOARDING_V1.md`

This document defines:
- implementation phase order
- sprint planning sequence
- MVP scope
- migration timing within the roadmap
- acceptance-oriented delivery progression

This document does not define:
- source code
- NestJS classes
- controllers
- runtime implementation details

---

## 1. Executive Summary

ANEXSYS should be implemented in business-risk order, not only in technical convenience order.

The recommended roadmap starts with:
- tenant, branch, identity, and authorization foundations
- customer and measurement continuity
- Service Order commercial truth
- Production Order operational truth
- QR, custody, and storage traceability
- quality and corrective execution
- finance and fiscal continuity
- pickup and custody release controls
- Smart Concierge and physical access foundations

The roadmap must preserve the approved platform rules:
- Service Order remains the commercial and financial source of truth
- Production Order remains the operational execution source of truth
- the physical bag/container remains support-only physical context
- QR authority for production execution remains exclusive to Production Orders

The implementation sequence should favor:
- early security and tenancy enforcement
- early operational continuity for the atelier replacement target
- staged migration readiness before go-live activation
- progressive introduction of advanced controls after the core order and execution flows are stable

---

## 2. Implementation Principles

### 2.1 Source-of-truth sequencing
- commercial truth must be operational before financial and fiscal expansion
- operational truth must be stable before QR, quality, and corrective execution scale-up

### 2.2 Governance-first sequencing
- multi-tenant, branch, identity, authentication, and authorization must precede business-domain coding

### 2.3 Traceability-first execution
- audit, responsibility, diary, QR, custody, and pickup controls must be introduced before enterprise expansion features

### 2.4 Migration-aware delivery
- migration tooling should arrive before final go-live phases so customers can validate data continuity in parallel with coding completion

### 2.5 MVP replacement discipline
- the MVP must replace the current atelier system only when it supports commercial intake, operational execution, delivery commitment, traceability, and controlled release

---

## 3. Implementation Phases

## Phase 1 - Multi-Tenant Foundation, Branches, Identity, Authentication, Authorization

### Goal
- establish the secure operating foundation for every later module

### Scope
- Multi-Tenant Foundation
- Branches
- Identity
- Authentication
- Authorization

### Why first
- every later API, workflow, and job depends on tenant and branch isolation
- all sensitive business writes depend on authenticated and authorized access

### Exit criteria
- tenant context is mandatory
- branch scope is enforceable
- authenticated sessions work
- role and permission controls exist
- audit capture for access-sensitive actions is active

---

## Phase 2 - Customers, CRM, Measurements

### Goal
- establish customer continuity and measurement history before order entry

### Scope
- Customers
- CRM
- Measurements

### Why here
- Service Orders depend on customers and technical measurement references
- migration onboarding can begin validating customer and measurement datasets early

### Exit criteria
- customer master records are manageable
- contacts and interaction history are usable
- measurement records support attribution and version visibility

---

## Phase 3 - Service Orders, Service Order Items, Delivery Date Engine

### Goal
- establish the commercial and delivery-commitment core

### Scope
- Service Orders
- Service Order Items
- Delivery Date Engine

### Why here
- Service Order is the commercial source of truth
- downstream production, finance, fiscal, pickup, and custody all depend on Service Order existence and ownership

### Exit criteria
- Service Orders can be created and managed
- Service Order Items can be associated and tracked
- delivery commitments can be calculated using the approved date-engine rules
- Commercial Responsible and Technical Measurement Responsible flows are usable

---

## Phase 4 - Production Orders, Production Order Versioning, Operational Resources, Operational Diary

### Goal
- establish operational execution truth

### Scope
- Production Orders
- Production Order Versioning
- Operational Resources
- Operational Diary

### Why here
- operational execution cannot start before commercial truth exists
- QR execution, quality, rework, and warranty execution depend on stable Production Order behavior

### Exit criteria
- one base Production Order can be generated from each Service Order
- corrective lineage can be represented through Production Order versioning
- Operational Resources can assume execution responsibility
- operational diary events are captured against Production Order execution

---

## Phase 5 - QR Tracking, Custody Events, Storage Location

### Goal
- add execution traceability and retrieval control

### Scope
- QR Tracking
- Custody Events
- Storage Location

### Why here
- QR scans must operate on stable Production Order execution
- custody and storage controls become reliable only after operational roots exist

### Exit criteria
- Production Order QR identity is usable
- operational scans trigger permitted execution actions
- custody events are recorded
- storage locations support retrieval visibility

---

## Phase 6 - Quality, Rework, Warranty

### Goal
- add controlled correction and post-execution quality governance

### Scope
- Quality
- Rework
- Warranty

### Why here
- quality decisions depend on operational execution and QR traceability
- rework and warranty execution depend on Production Order lineage and responsibility tracking

### Exit criteria
- inspection and release/rejection flows work
- rework cases preserve corrective lineage
- warranty flows distinguish commercial adjustment from operational warranty execution

---

## Phase 7 - Finance, Partial Payments, Financial Exceptions

### Goal
- add commercial settlement continuity

### Scope
- Finance
- Partial Payments
- Financial Exceptions

### Why here
- financial records must remain anchored to Service Order truth
- partial settlement and exception logic should be added only after core commercial and operational flows are stable

### Exit criteria
- payment records are manageable
- partial payments preserve allocation traceability
- financial exceptions support governed correction

---

## Phase 8 - Fiscal

### Goal
- add formal fiscal lifecycle capability

### Scope
- Fiscal

### Why here
- fiscal issuance depends on stable Service Order, payment, and branch context
- fiscal integration should not block earlier atelier replacement capability

### Exit criteria
- fiscal lifecycle orchestration exists
- issuance and cancellation flows are governable
- fiscal-state visibility is available for authorized users

---

## Phase 9 - Pickup Authorization, Third Party Pickup, Chain of Custody

### Goal
- secure delivery release and final handoff controls

### Scope
- Pickup Authorization
- Third Party Pickup
- Chain of Custody

### Why here
- release controls depend on completed commercial, operational, quality, and financial context
- third-party pickup and custody evidence are high-sensitivity controls best added after the base execution flows are stable

### Exit criteria
- pickup authorization can be created and validated
- third-party release credentials are controllable
- release evidence and custody traceability are auditable

---

## Phase 10 - Smart Concierge, Customer Queue, Physical Access Control Foundations

### Goal
- complete the operational perimeter with reception and access-support capabilities

### Scope
- Smart Concierge
- Customer Queue
- Physical Access Control Foundations

### Why here
- these capabilities are valuable, but they are not required before the core atelier replacement path exists
- access-control foundations should build on already stable identity, pickup, and custody rules

### Exit criteria
- reception queue orchestration is available
- basic concierge flow is operational
- physical access integration foundations are prepared for enterprise rollout

---

## 4. Sprint Plan

## Sprint 1 - Foundation and Access Control

### Goal
- establish tenant, branch, identity, authentication, and authorization foundations

### Dependencies
- approved backend architecture
- approved API ownership model
- approved multi-tenant and multi-branch physical model

### Risks
- weak tenant isolation would contaminate every later module
- incomplete permission modeling would create rework across all write APIs

### Acceptance Criteria
- tenant and branch context are mandatory for governed operations
- authenticated sessions and token lifecycle are operational
- roles and permissions can be managed
- audit exists for critical authentication and authorization actions

---

## Sprint 2 - Customer and Measurement Continuity

### Goal
- deliver customer, contact, CRM, and measurement management

### Dependencies
- Sprint 1

### Risks
- incomplete customer identity rules can create migration duplicates
- poor measurement attribution can destabilize Service Order execution later

### Acceptance Criteria
- customers can be created and maintained
- contacts and interactions are usable
- measurement records are version-aware and attributable
- branch and tenant scope remain enforced

---

## Sprint 3 - Service Order Core

### Goal
- deliver Service Order and Service Order Item lifecycle foundations

### Dependencies
- Sprint 2

### Risks
- weak Service Order ownership rules would break finance and production sequencing
- responsibility fields may drift if accountability rules are not explicit

### Acceptance Criteria
- Service Orders can be opened and managed
- Service Order Items can be attached and maintained
- Commercial Responsible and Technical Measurement Responsible are supported
- Service Order remains the commercial source of truth

---

## Sprint 4 - Delivery Date Engine and Commercial Readiness

### Goal
- add delivery commitment calculation and workflow-ready scheduling behavior

### Dependencies
- Sprint 3
- branch and tenant calendar capability from Sprint 1

### Risks
- incorrect non-working-day handling would undermine promised delivery reliability
- workflow coupling may become brittle if date logic is not centralized

### Acceptance Criteria
- delivery dates are suggested automatically
- holidays, branch calendars, and tenant calendars affect calculation
- invalid non-working dates move to the next valid business day
- delivery type and commitment data are usable in Service Order flow

---

## Sprint 5 - Production Order and Operational Resource Core

### Goal
- deliver Production Order generation, versioning, Operational Resource readiness, and diary-linked execution foundation

### Dependencies
- Sprint 3
- Sprint 4

### Risks
- incorrect Production Order generation would break the operational source-of-truth model
- resource assignment rules may become inconsistent without clear responsibility transitions

### Acceptance Criteria
- base Production Order generation from Service Order works
- Production Order versioning is available for corrective lineage
- Operational Resources can be managed and assigned
- operational diary events can be captured against execution

---

## Sprint 6 - QR, Custody, and Storage Traceability

### Goal
- deliver Production Order QR flows, custody events, and storage location visibility

### Dependencies
- Sprint 5

### Risks
- QR misuse could incorrectly transfer authority away from Production Orders
- storage and custody visibility may become unreliable without strict event ownership

### Acceptance Criteria
- Production Order QR codes support governed scan actions
- scan events are attributable to Operational Resources
- custody events can be recorded
- storage location visibility is available for retrieval workflows

---

## Sprint 7 - Quality, Rework, and Warranty

### Goal
- deliver quality validation and corrective execution control

### Dependencies
- Sprint 5
- Sprint 6

### Risks
- quality rejection and corrective lineage can become inconsistent if versioning rules are weak
- warranty flows may mix commercial and operational ownership if not separated

### Acceptance Criteria
- quality release and rejection flows exist
- rework cases preserve original and corrective attribution
- warranty adjustment and warranty execution are distinct and usable
- audit and operational lineage remain intact

---

## Sprint 8 - Finance and Settlement Control

### Goal
- deliver payments, partial payments, and financial exceptions

### Dependencies
- Sprint 3
- Sprint 7

### Risks
- financial logic may incorrectly drift into Production Order ownership
- exception handling can become opaque without audit and Service Order anchoring

### Acceptance Criteria
- payment records are manageable
- partial payment allocation is traceable
- financial exception flows are governed
- financial truth remains anchored to Service Order

---

## Sprint 9 - Fiscal Lifecycle

### Goal
- deliver fiscal orchestration

### Dependencies
- Sprint 8
- branch governance foundations from Sprint 1

### Risks
- external fiscal dependencies may slow delivery
- fiscal state drift can create compliance and reconciliation issues

### Acceptance Criteria
- fiscal lifecycle stages are visible
- issuance and cancellation orchestration are supported
- fiscal state is traceable and auditable

---

## Sprint 10 - Pickup and Chain of Custody Release Control

### Goal
- deliver secure release authorization and third-party pickup controls

### Dependencies
- Sprint 6
- Sprint 7
- Sprint 8

### Risks
- release without evidence or authorization would create severe operational risk
- third-party pickup flows may fail if custody and identity controls are weak

### Acceptance Criteria
- pickup authorization can be issued
- third-party pickup credentials are supported
- chain-of-custody release events are auditable
- release flows preserve evidence linkage

---

## Sprint 11 - Smart Concierge and Access Foundations

### Goal
- deliver Smart Concierge base flows, customer queueing, and physical access-control foundations

### Dependencies
- Sprint 1
- Sprint 10

### Risks
- concierge scope may expand beyond MVP needs
- physical access integration can create external dependency drag

### Acceptance Criteria
- reception queue workflow exists
- Smart Concierge base handoff flow is usable
- physical access control foundations are defined for integration use

---

## Sprint 12 - Migration Hardening and Go-Live Readiness

### Goal
- complete migration tooling readiness, validation cycles, and replacement readiness review

### Dependencies
- Sprints 2 through 10

### Risks
- weak migration validation may block customer confidence
- missing historical continuity may delay atelier replacement

### Acceptance Criteria
- migration inputs can be validated and staged
- onboarding rollback and correction paths are defined
- pilot migration rehearsal is possible
- go-live readiness can be assessed against MVP scope

---

## 5. MVP Definition

The minimum version capable of replacing the current atelier system should include:
- Multi-Tenant Foundation
- Branches
- Identity
- Authentication
- Authorization
- Customers
- CRM
- Measurements
- Service Orders
- Service Order Items
- Delivery Date Engine
- Production Orders
- Production Order Versioning
- Operational Resources
- Operational Diary
- QR Tracking
- Custody Events
- Storage Location
- Quality
- Pickup Authorization
- Third Party Pickup
- Chain of Custody

### MVP rationale

This is the smallest credible replacement because it supports:
- secure access
- customer and measurement continuity
- order intake
- promised delivery handling
- operational execution
- QR-driven production actions
- quality control
- physical retrieval visibility
- controlled customer release

### Items outside MVP but recommended after replacement readiness
- Rework if not already required by pilot operations
- Warranty advanced flows
- Finance expansion beyond basic continuity controls
- Fiscal integration if a staged compliance rollout is acceptable
- Smart Concierge advanced automation
- physical access-control integrations

### MVP replacement condition

ANEXSYS can replace the current atelier system when the MVP supports:
- commercial intake through Service Orders
- operational execution through Production Orders
- responsibility and diary capture
- QR-driven production control
- retrieval and storage visibility
- quality decision recording
- auditable pickup release

---

## 6. Migration Strategy

### 6.1 When migration tools should enter the roadmap

Migration tooling should enter active implementation in **Phase 2** and should become operationally useful by **Phase 3**, even though full go-live migration depends on later phases.

### 6.2 Recommended migration timing by phase

#### Phase 1
- define migration governance, staging principles, and validation ownership
- do not begin business-data activation yet

#### Phase 2
- introduce migration support for Customers, Contacts, CRM history, and Measurements
- start duplicate detection, CPF, phone, email, and address validation paths

#### Phase 3
- enable Service Order import and commercial continuity validation
- begin pilot onboarding for priority customer data sets

#### Phase 4
- extend migration capability to Operational Resources and open operational commitments tied to Production Order readiness

#### Phase 5
- add storage-location and custody-support migration where retrieval continuity is required

#### Phase 6
- enable migration support for active Rework and Warranty obligations when needed

#### Phase 7
- introduce financial continuity migration for open balances, receivables, and partial settlement states

#### Phase 8
- add fiscal-status migration only if legacy continuity demands it

#### Phase 9
- validate pickup-authorization and custody-sensitive go-live scenarios for customers with controlled release requirements

#### Phase 10
- finalize onboarding acceleration flows for reception and access-support scenarios

### 6.3 Migration operating model

Migration should follow this operating sequence:
- staging import
- sanitization and normalization
- validation review
- approval for activation
- controlled activation by destination module
- rollback path when activation quality is insufficient

### 6.4 Migration priority for atelier replacement

Priority migration scope for replacement readiness:
- active customers and contacts
- current measurements
- open Service Orders
- active Operational Resources
- open financial obligations when required for continuity
- storage and retrieval references where operationally necessary

Historical enrichment may follow after go-live for:
- older interactions
- closed orders
- older measurements beyond minimum operational need
- archived corrective histories

---

## 7. Recommended Release Decision

### Recommended first release target
- release the MVP after Sprints 1 through 10 are accepted and migration rehearsal is successful

### Recommended post-MVP hardening target
- use Sprint 11 and Sprint 12 to complete operational hardening, onboarding readiness, and enterprise expansion controls

### Recommended sequencing rule
- do not advance release replacement claims based only on finance, fiscal, or concierge completeness if the Production Order, QR, custody, and pickup controls are not yet stable

---

## 8. Final Coding Plan Statement

ANEXSYS backend coding should begin with governance and source-of-truth foundations, then advance through commercial truth, operational truth, traceability, corrective controls, financial continuity, and final release governance.

The recommended roadmap is designed to reach atelier replacement safely without sacrificing the approved architectural boundaries, QR ownership rules, audit requirements, or migration discipline.
