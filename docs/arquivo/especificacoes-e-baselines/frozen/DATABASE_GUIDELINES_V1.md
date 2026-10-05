STATUS: BASELINE APPROVED

DATE: 2026-09-20

PURPOSE:
Frozen reference version approved before conceptual database modeling.

---

# ANEXSYS Platform
# DATABASE_GUIDELINES_V1

## Document Purpose

This document defines the conceptual data-modeling guidelines for ANEXSYS according to the approved final operational model.

This document defines:
- domain ownership
- aggregates
- cardinalities
- relationships
- bounded contexts
- entity responsibilities
- data ownership rules
- cross-domain references
- audit ownership
- event ownership
- workflow ownership

This document does not define:
- physical tables
- SQL
- schemas
- APIs
- infrastructure

---

## Executive Summary

ANEXSYS must be modeled with three clearly separated conceptual authorities:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Physical Bag = physical support element only

Core approved model:
- 1 Customer -> many Service Orders
- 1 Service Order -> many Service Order Items
- 1 Service Order -> exactly 1 Primary Production Order
- the Primary Production Order represents all Service Order Items of that Service Order
- Production Order versioning exists only for rework, warranty execution, and corrective production
- the physical bag is only a storage and transport container for Service Order pieces and the printed Production Order (A5)
- QR Codes belong exclusively to the Production Order
- Operational Resources assume responsibility through Production Order QR-driven execution events

Reconciliation note:
- for downstream conceptual and logical modeling, the one-Service-Order-to-one-Production-Order rule supersedes earlier singular item-origin wording; Service Order Item references inside the Production Order are traceability references to item scope, not item-level Production Order cardinality.

This guideline treats the Production Order as the operational root and treats the physical bag only as optional physical context.

---

## 1. Conceptual Modeling Principles

### 1.1 Source-of-truth discipline

Each core business fact must have exactly one owning domain.

### 1.2 Commercial versus operational separation

Commercial and financial truth belongs to the Service Order domain.

Operational execution truth belongs to the Production Order domain.

### 1.3 Physical support demotion

The physical bag is not a primary business entity and must not be modeled as an independent workflow or business authority.

### 1.4 Version lineage discipline

Corrective production history must preserve lineage back to the original Production Order rather than creating disconnected operational records.

In this guideline, `Production Order` is the lineage umbrella term for the Primary Production Order plus its corrective versions.

### 1.5 Audit-first responsibility model

Operational responsibility must be traceable through Production Order execution events, especially QR-driven start, assumption, status update, workflow event registration, and Operational Diary updates.

---

## 2. Bounded Contexts and Domain Ownership

| Bounded Context | Primary Responsibility | Owns | Does Not Own |
|---|---|---|---|
| Tenant and Branch Governance | Tenant scope, branch scope, branch-local policy | Tenant, Branch, tenant policy scope | Commercial orders, production execution, financial settlement |
| Identity and Access | Access control and permission scope | User, Role, Permission Scope | Commercial truth, operational truth |
| Customer and CRM | Customer relationship and interaction continuity | Customer, contact profile, communication history | Production execution, settlement logic |
| Service Order Management | Commercial and financial business commitment | Service Order, Service Order Item, commercial responsibility, technical measurement responsibility, delivery commitment | Operational execution truth, quality approval truth |
| Production Execution | Operational execution and version lineage | Primary Production Order, Production Order Version lineage, execution assignments, execution events, Production Order QR ownership | Commercial pricing truth, independent bag authority |
| Operational Resource Management | Operational capacity and skills | Operational Resource, availability, skills, qualification history, productivity indicators | Service Order financial truth, workflow policy ownership |
| Quality and Corrective Flows | Inspection and corrective operational outcomes | Quality Record, Rework, Warranty Adjustment, Warranty Execution, corrective attribution | Customer master ownership, financial truth |
| Delivery and Pickup | Retrieval and handover control | Pickup Authorization, Pickup Evidence, physical location visibility, physical bag usage context | Production execution truth, pricing truth |
| Finance and Settlement | Settlement and financial exception handling | Payment Allocation, Settlement Record, Financial Exception | Production execution state |
| Workflow and SLA Policy | Rules that govern status and timing behavior | Workflow Definition, Status Definition, Transition Policy, SLA Policy | Transactional ownership of Service Orders or Production Orders |
| Audit and Traceability | Immutable cross-domain traceability | Audit Event, QR Scan Event, Chain-of-Custody Event | Commercial ownership, operational ownership |
| Reporting and Analytics | Derived analytical views | KPI projections, dashboards, analytical read models | Transactional source-of-truth facts |

---

## 3. Aggregate Model

| Aggregate Root | Bounded Context | Core Responsibility | Key Invariants |
|---|---|---|---|
| Tenant | Tenant and Branch Governance | Top-level business isolation boundary | One tenant governs its own branches, users, and policy scope |
| Branch | Tenant and Branch Governance | Operational unit and local business-calendar boundary | Branch belongs to exactly one Tenant |
| Customer | Customer and CRM | Customer relationship identity | Customer belongs to one Tenant and may have many Service Orders |
| Service Order | Service Order Management | Commercial and financial source of truth | Belongs to exactly one Customer and exactly one Tenant |
| Service Order Item | Service Order Management | Item-level scope inside the Service Order | Cannot exist outside its parent Service Order |
| Primary Production Order | Production Execution | Operational execution source of truth for a Service Order | Every Service Order generates exactly one Primary Production Order |
| Production Order Version | Production Execution | Corrective lineage state for the original Production Order | Exists only for rework, warranty execution, or corrective production and remains tied to the original Production Order |
| Operational Resource | Operational Resource Management | Execution-capacity identity | Resource capability and availability are owned centrally |
| Quality Record | Quality and Corrective Flows | Inspection result and quality decision | Must reference the relevant Production Order or item scope |
| Rework Case | Quality and Corrective Flows | Corrective flow for internal defects | Must preserve original and corrective operational responsibility |
| Warranty Case | Quality and Corrective Flows | Post-delivery responsibility under warranty | Must remain linked to original Service Order and operational lineage |
| Pickup Authorization | Delivery and Pickup | Third-party collection authorization | Authorization exists in Service Order delivery context |
| Physical Location Assignment | Delivery and Pickup | Current and historical retrieval/storage context | Must preserve current visibility and history |
| Physical Bag Context | Delivery and Pickup | Optional physical storage/transport context | Has no independent business identity, QR, or workflow |
| Financial Exception | Finance and Settlement | Exceptional financial correction flow | Must preserve Service Order context, reason, approver, and impact |
| Workflow Definition | Workflow and SLA Policy | Lifecycle and timing policy | Rules are tenant-aware, auditable, and separate from transactional ownership |
| Audit Event | Audit and Traceability | Immutable traceability record | Must preserve actor, time, object, action, and context |
| Chain-of-Custody Event | Audit and Traceability | Physical and handoff traceability record | Must preserve object context, stage, actor, time, and evidence linkage |

---

## 4. Cardinalities and Relationships

### 4.1 Core commercial relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Tenant -> Branch | 1 -> many | A Tenant may operate many Branches |
| Tenant -> Customer | 1 -> many | A Tenant may own many Customers |
| Customer -> Service Order | 1 -> many | A Customer may have many Service Orders |
| Service Order -> Service Order Item | 1 -> many | A Service Order contains multiple Service Order Items |
| Service Order -> Primary Production Order | 1 -> 1 | Every Service Order generates exactly one Primary Production Order |

### 4.2 Production execution relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Primary Production Order -> Service Order | many -> 1 | Each Primary Production Order belongs to exactly one Service Order |
| Primary Production Order -> Service Order Item | 1 -> many | The Primary Production Order represents all items belonging to the Service Order |
| Primary Production Order -> Production Order Version | 1 -> many over time | Versions exist only when corrective lineage is required and remain under the same Service Order lineage |
| Production Order Version -> Original Production Order | many -> 1 | Every corrective version must trace back to the original Production Order and supplements the original lineage rather than replacing the original record |
| Production Order -> Operational Resource Assignment | many -> many over time | Responsibility is event-based and auditable |
| Production Order -> QR Code | 1 -> 1 active operational code | QR ownership belongs exclusively to the Production Order |
| Physical Bag Context -> Service Order | many -> 1 when used | A physical bag follows the Service Order context |
| Physical Bag Context -> Production Order | many -> 1 when used | A physical bag follows the Production Order context |

Conceptual lineage rule:
- the Primary Production Order is the root operational record for the Service Order
- Production Order Versions are subordinate lineage records linked to that Primary Production Order
- corrective versions do not create a second primary operational anchor for the same Service Order

### 4.3 Quality and corrective relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Quality Record -> Production Order | many -> 1 | Many inspections may exist for one Production Order lineage |
| Quality Record -> Service Order Item | many -> 1 when item-scoped | Item-level quality stays anchored to item scope |
| Rework Case -> Original Production Order | many -> 1 | Rework must preserve original operational lineage |
| Rework Case -> Original Operational Resource | many -> 1 | Original responsibility must be preserved |
| Rework Case -> Corrective Operational Resource | many -> 1 | Corrective responsibility must be preserved |
| Warranty Case -> Original Service Order | many -> 1 | Warranty remains tied to the commercial source of truth |
| Warranty Case -> Production Order Lineage | many -> 1 | Warranty execution must remain tied to operational lineage |

### 4.4 Delivery, finance, and audit relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Service Order -> Payment Allocation | 1 -> many | Multiple financial allocations may apply to one Service Order |
| Service Order Item -> Payment Allocation | 1 -> many | Item-level financial allocation is supported |
| Service Order -> Pickup Authorization | 1 -> many over time | Historical authorization paths may exist |
| Service Order -> Physical Location Assignment | 1 -> many over time | Current location and history must both be preserved |
| Aggregate -> Audit Event | 1 -> many | Any governed aggregate may emit many audit events |
| Aggregate -> Chain-of-Custody Event | 1 -> many where custody applies | Custody history is event-based and auditable |
| Workflow Definition -> Transactional Aggregate | 1 -> many | One workflow policy may govern many aggregates of the same type |

---

## 5. Relationship Rules

### 5.1 Service Order boundary rule

The Service Order is the parent commercial aggregate.

All Service Order Items and the Primary Production Order lineage must remain inside the Service Order boundary.

### 5.2 Production Order operational rule

The Production Order is the operational source of truth.

Operational status, responsibility, workflow events, QR execution, and diary updates must be anchored to the Production Order.

### 5.3 Physical bag rule

The physical bag is only a physical container.

It may be associated with Service Order and Production Order context, but it must not become:
- a source of truth
- an independent workflow owner
- an independent QR owner
- an independent business identity

### 5.4 Versioning rule

Production Order versioning is permitted only for:
- rework
- warranty execution
- corrective production

### 5.5 Version preservation rule

Every corrective version must preserve:
- Original Production Order
- Original Operational Resource
- Corrective Operational Resource
- Audit history

Every corrective version remains under the same Service Order as the Primary Production Order.

Corrective versions supplement the original operational lineage for rework, warranty execution, or corrective production and do not replace the existence of the original Production Order.

### 5.6 Financial isolation rule

Production Order data may reference Service Order context, but it must not become the source of truth for prices, discounts, payment status, commissions, margins, or profit.

---

## 6. Entity Responsibilities

### 6.1 Customer
- owns customer identity and relationship continuity
- may be linked to multiple Service Orders
- does not own production execution

### 6.2 Service Order
- owns the commercial commitment
- owns the financial source of truth
- owns customer-facing lifecycle meaning
- owns item scope
- owns promised delivery commitment

### 6.3 Service Order Item
- owns item-level commercial scope
- owns item-level execution applicability inside the parent Service Order
- participates in production, quality, delivery, payment, warranty, and rejection flows

### 6.4 Primary Production Order
- owns operational execution state
- owns operational QR identity
- owns assignment history and status progression
- owns workflow event registration and Operational Diary update context
- may contain all Service Order Items belonging to the same Service Order

### 6.5 Production Order Version
- owns corrective lineage state for rework, warranty execution, and corrective production
- must remain linked to the original Production Order
- must preserve original and corrective operational accountability

### 6.6 Operational Resource
- owns execution-capacity identity and capability profile
- participates in assignment, execution, quality, rework, and warranty flows
- does not own the commercial source of truth

### 6.7 Physical Bag Context
- represents only physical support usage
- holds pieces and printed Production Order copy (A5)
- has no independent business, QR, or workflow authority

### 6.8 Quality and Corrective Entities
- own inspection outcomes, defects, rework, warranty execution, and corrective attribution
- preserve operational lineage back to the Production Order

### 6.9 Financial Exception
- owns exceptional financial correction flows
- remains anchored to Service Order commercial truth

### 6.10 Audit and Custody Events
- own immutable traceability
- do not replace transactional source-of-truth ownership

---

## 7. Data Ownership Rules

### 7.1 Commercial ownership

Commercial and financial truth belongs to the Service Order domain.

This includes:
- customer commitment
- pricing and adjustments
- payment applicability
- delivery commitment
- financial exception business context

### 7.2 Operational ownership

Operational execution truth belongs to the Production Order domain.

This includes:
- execution responsibility
- execution QR ownership
- production status
- workflow events
- Operational Diary update context
- version lineage

### 7.3 Physical context ownership

Physical bag and location usage belong to delivery/pickup or physical-traceability context, not to core operational truth ownership.

### 7.4 Quality ownership

Inspection outcomes, rework, warranty execution, and corrective attribution belong to the Quality and Corrective Flows domain.

### 7.5 Workflow ownership

Workflow and SLA policy own rules, not transactional execution truth.

### 7.6 Audit ownership

Audit owns immutable records of what happened.

The originating business domain owns the meaning of what happened.

---

## 8. Cross-Domain Reference Rules

### 8.1 General rule

A consuming domain may reference another domain's aggregate identity, but may not assume ownership of that aggregate's source-of-truth fields.

### 8.2 Required reference rules

- Customer may be referenced by Service Orders, warranty cases, pickup authorization, and CRM interactions.
- Service Order may be referenced by Production Orders, quality records, warranty, delivery, pickup, and finance.
- Service Order Item may be referenced by Production Order execution scope, quality, delivery, payment allocation, rework, and warranty.
- Production Order may be referenced by quality, rework, warranty execution, QR scans, chain-of-custody events, and operational diary records.
- Production Order Version may be referenced by corrective flows and audit records.
- Physical Bag Context may be referenced by custody, movement, pickup, and location visibility when physically used.
- Operational Resource may be referenced by assignment, quality inspection, rework, warranty execution, and ranking views.
- Workflow definitions may be referenced by all aggregates that require lifecycle governance.
- Audit events may reference any aggregate without taking transactional ownership.

### 8.3 Forbidden ownership patterns

The model must avoid:
- Finance owning production execution state
- Production owning commercial price truth
- Physical Bag Context owning operational truth
- Audit owning workflow state
- Reporting owning transactional truth

---

## 9. Audit Ownership

### 9.1 Audit boundary

Audit is a dedicated cross-cutting domain and does not replace business-domain ownership.

### 9.2 Audit-owned records

Audit must preserve immutable records for:
- create, update, delete, and cancel actions
- status changes
- Production Order QR execution events
- operational responsibility assumption events
- workflow event registration
- Operational Diary updates
- quality decisions
- rework and warranty corrective lineage
- payment and exception actions
- pickup authorization and release events
- physical location or bag movement context when applicable

### 9.3 Audit reference rule

Each audit event must point back to:
- owning bounded context
- aggregate type
- aggregate identity
- actor identity
- timestamp
- event/action type
- prior and resulting state where applicable

---

## 10. Event Ownership

### 10.1 Originating-domain rule

A business event is owned by the domain where the business fact originates.

### 10.2 Event ownership examples

- `ServiceOrderCreated`, `ServiceOrderApproved`, and `DeliveryCommitmentChanged` belong to Service Order Management.
- `PrimaryProductionOrderGenerated`, `ProductionOrderStarted`, `OperationalResponsibilityAssumed`, `ProductionStatusUpdated`, and `WorkflowEventRegistered` belong to Production Execution.
- `ProductionOrderVersionCreated` belongs to Production Execution and exists only for rework, warranty execution, or corrective production.
- `QualityPassed`, `QualityRejected`, `ReworkOpened`, and `WarrantyExecutionOpened` belong to Quality and Corrective Flows.
- `PaymentAllocated`, `SettlementConfirmed`, and `FinancialExceptionOpened` belong to Finance and Settlement.
- `PickupAuthorized` and `PickupCompleted` belong to Delivery and Pickup.
- `PhysicalBagAssociated` and `PhysicalBagMoved` are physical-traceability events only and do not create independent bag business authority.
- `AuditEventRecorded` and `CustodyEventRecorded` belong to Audit and Traceability.

### 10.3 Event propagation rule

Downstream consumers may react to events, but the originating domain remains the source of truth for the event's business meaning.

---

## 11. Workflow Ownership

### 11.1 Workflow policy ownership

Workflow and SLA Policy own:
- status definitions
- allowed transitions
- approval requirements
- SLA trigger logic
- delivery-date policy
- escalation rules
- visibility rules driven by configuration

### 11.2 Transactional workflow ownership

The current lifecycle state remains owned by the relevant transactional aggregate.

Examples:
- Service Order owns current commercial status.
- Production Order owns current execution status.
- Rework owns current corrective status.
- Warranty owns current warranty-resolution status.
- Physical Bag Context owns no independent workflow state.

### 11.3 Workflow execution anchor

Workflow events triggered by operational work must be registered against the Production Order.

---

## 12. Approved Final Operational Model for Conceptual Data Design

The following model is mandatory for conceptual data design in this guideline:

- The physical production bag is not a primary business entity.
- The primary operational execution entity is the Production Order.
- The physical production bag is only a physical storage and transport container used to hold Service Order pieces and the printed Production Order (A5).
- The physical production bag does not require business numbering, independent QR Code, independent business identity, or independent workflow.
- QR Codes belong exclusively to the Production Order.
- Operational Resources scan the Production Order QR Code to start execution, assume operational responsibility, update production status, register workflow events, and update the Operational Diary.
- 1 Customer may have multiple Service Orders.
- 1 Service Order contains multiple Service Order Items.
- 1 Service Order generates exactly 1 Primary Production Order.
- The Primary Production Order represents all Service Order Items belonging to that Service Order.
- Production Order versioning is used only for rework, warranty execution, and corrective production.
- Corrective versions remain under the same Service Order and supplement the original Production Order lineage rather than replacing the original record.

---

## 13. Final Modeling Guidance

The conceptual model should be used as a business-ownership map before any logical or physical persistence design begins.

Recommended downstream order:
1. confirm bounded contexts
2. confirm source-of-truth ownership
3. confirm Primary Production Order cardinality per Service Order
4. confirm version-lineage rules
5. confirm audit and workflow event ownership
6. only then derive logical and physical persistence structures

No downstream design should promote the physical bag to an independent business authority.
