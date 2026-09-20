# ANEXSYS Platform
# DATABASE_GUIDELINES_V1

## Document Purpose

This document defines the conceptual data-modeling guidelines for ANEXSYS based on `docs/SRS_MASTER_V1.3.md` and the approved production model provided for this task.

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

Authoring note:
- `docs/ARQUITETURA_V1.md` was not present in the current repository clone at authoring time
- therefore, this guideline is grounded in `docs/SRS_MASTER_V1.3.md` plus the explicitly approved production model for this task
- where current SRS wording and the explicitly approved production model differ, this document adopts the approved production model as the governing rule for conceptual database modeling

---

## Executive Summary

ANEXSYS should be modeled as a set of bounded business domains with clear ownership boundaries.

For conceptual database design, the approved production model in this document is authoritative for Production Bag, Production Order, and operational-responsibility cardinalities.

The core business flow is:
- Customer owns the commercial relationship
- Service Order owns the commercial commitment, financial truth, and customer-facing lifecycle
- Production Bag owns the governed physical-production grouping for exactly one Service Order and one Customer
- Production Order owns operational execution inside the Production Bag scope
- Operational Resource owns execution capacity and responsibility history
- Quality, Rework, and Warranty own post-execution validation and correction records
- Finance owns settlement and exception records, but the Service Order remains the business source of truth for commercial amounts
- Workflow owns configurable lifecycle rules
- Audit owns immutable cross-domain traceability

The approved production model governs the conceptual database boundary:
- 1 Customer -> many Service Orders
- 1 Service Order -> exactly 1 Production Bag
- 1 Production Bag -> exactly 1 Customer
- 1 Production Bag -> exactly 1 current Primary Operational Resource
- 1 Production Bag may contain multiple Service Order Items belonging to the same Service Order
- 1 Production Bag may contain multiple Production Orders belonging to the same Service Order
- responsibility transfers must be auditable

The main conceptual rule is separation of ownership:
- Service Order owns commercial and financial meaning
- Production Order owns operational execution meaning
- Production Bag owns governed physical grouping and current primary operational accountability
- cross-domain consumers may reference, but must not redefine, another domain's source-of-truth data

---

## 1. Conceptual Modeling Principles

### 1.1 Source-of-truth discipline

Each core business fact must have exactly one owning domain.

### 1.2 Aggregate boundary discipline

Each aggregate must protect its own invariants, lifecycle, and internal consistency.

### 1.3 Cross-domain reference discipline

Cross-domain relationships should use stable business identities and explicit references rather than shared ownership of mutable state.

### 1.4 Auditability by design

Responsibility changes, workflow transitions, QR-triggered execution events, quality decisions, and financial exceptions must all be traceable to an owning domain and an immutable audit trail.

### 1.5 Separation of commercial and operational data

Production execution data must not become the source of truth for prices, discounts, payment status, commissions, margins, or profit.

### 1.6 Conceptual-model precedence

This document is the governing conceptual data-modeling interpretation for downstream database analysis.

When `docs/SRS_MASTER_V1.3.md` contains operational wording that differs from the explicitly approved production model for this task, the approved production model in this guideline takes precedence for aggregates, ownership, and cardinalities.

---

## 2. Bounded Contexts and Domain Ownership

| Bounded Context | Primary Responsibility | Owns | Does Not Own |
|---|---|---|---|
| Tenant and Branch Governance | Tenant scope, branch structure, tenant-specific policy boundary | Tenant, Branch, tenant-level configuration scope | Commercial orders, operational execution, financial settlement details |
| Identity and Access | User identity, roles, permissions, access scope | User, Role, Permission Scope, access policy | Operational productivity, commercial ownership, audit meaning |
| Customer and CRM | Customer relationship and interaction history | Customer, customer profile, contact data, communication history | Production execution, financial settlement logic |
| Service Order Management | Commercial commitment and customer-facing order lifecycle | Service Order, Service Order Item, delivery commitment, commercial responsibility, technical measurement responsibility | Production execution state, quality inspection outcomes, payment authorization outcomes |
| Production Execution | Governed operational grouping and execution control | Production Bag, Production Order, Production Order Version, execution assignment, bag responsibility transfer history | Commercial price truth, settlement truth |
| Operational Resource Management | Execution capacity and resource accountability | Operational Resource, skills, availability, assignment history, productivity indicators | Service Order financial meaning, quality approval rules |
| Quality and Corrective Flows | Quality validation and corrective case ownership | Quality Record, Customer Rejection, Rework, Warranty Adjustment, Warranty Execution | Commercial pricing, branch governance |
| Delivery and Pickup | Handover, retrieval, location visibility, collector authorization | Pickup Authorization, Pickup Evidence, physical retrieval context, location visibility usage | Commercial valuation, production planning |
| Finance and Settlement | Payment, reconciliation, financial exception handling | Payment Allocation, Settlement Record, Financial Exception, cash-flow reporting inputs | Operational execution truth |
| Workflow and SLA Policy | Configurable lifecycle rules and time-policy logic | Workflow Definition, Status Definition, Transition Policy, SLA Policy, delivery-date calculation policy | Customer identity, commercial line values, physical custody evidence |
| Audit and Traceability | Immutable cross-domain traceability | Audit Event, QR Scan Event, Chain-of-Custody Event | Business meaning of the originating transaction |
| Reporting and Analytics | Read-model and KPI consolidation | Derived KPI views, dashboards, analytical projections | Transactional source-of-truth facts |

---

## 3. Aggregate Model

| Aggregate Root | Bounded Context | Core Responsibility | Key Invariants |
|---|---|---|---|
| Tenant | Tenant and Branch Governance | Defines top-level business isolation boundary | One tenant governs its own branches, users, policies, and business data scope |
| Branch | Tenant and Branch Governance | Defines operational unit and local calendar/policy scope | Branch belongs to exactly one Tenant |
| Customer | Customer and CRM | Owns the customer relationship identity | Customer belongs to one Tenant and may interact across one or more Branches according to policy |
| Service Order | Service Order Management | Owns the commercial commitment and customer-facing lifecycle | Service Order belongs to exactly one Customer and exactly one Tenant; owns the official commercial commitment |
| Service Order Item | Service Order Management | Owns item-level commercial and operational scope inside the Service Order | Item cannot exist outside a Service Order |
| Production Bag | Production Execution | Owns governed production grouping for one Service Order | Exactly one Service Order, exactly one Customer, exactly one current Primary Operational Resource |
| Production Order | Production Execution | Owns operational execution for work released from the Service Order | Must belong to exactly one Service Order and exactly one Production Bag; must not cross Service Order boundaries |
| Operational Resource | Operational Resource Management | Owns execution-capacity identity | Resource lifecycle and capability history are owned centrally |
| Quality Record | Quality and Corrective Flows | Owns inspection outcome and release gate result | Must reference the production or item scope it validates |
| Rework Case | Quality and Corrective Flows | Owns corrective execution caused by an internal defect | Must preserve original responsibility and corrective responsibility |
| Warranty Case | Quality and Corrective Flows | Owns post-delivery responsibility under warranty | Must remain linked to original Service Order and affected item scope |
| Pickup Authorization | Delivery and Pickup | Owns third-party collection authorization | Authorization belongs to the Customer context for a Service Order delivery event |
| Physical Location Assignment | Delivery and Pickup | Owns current retrieval/storage reference | Must preserve visible current location and location history |
| Financial Exception | Finance and Settlement | Owns non-standard financial correction flows | Must preserve reason, approver, impact, and Service Order context |
| Workflow Definition | Workflow and SLA Policy | Owns status and transition policy | Rules are tenant-aware, auditable, and separate from transactional data |
| Audit Event | Audit and Traceability | Owns immutable traceability record | Must preserve actor, time, object, action, and context |
| Chain-of-Custody Event | Audit and Traceability | Owns custody-stage evidence trail | Must preserve object context, stage, actor, time, and evidence linkage |

---

## 4. Cardinalities and Relationships

### 4.1 Core commercial relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Tenant -> Branch | 1 -> many | A Tenant may operate many Branches |
| Tenant -> Customer | 1 -> many | A Tenant may own many Customers |
| Customer -> Service Order | 1 -> many | A Customer may have many Service Orders |
| Service Order -> Service Order Item | 1 -> many | A Service Order contains one or more items when itemization is applicable |
| Service Order -> Delivery Commitment | 1 -> one active commitment at a time | Commitment history may exist, but one active commitment governs execution |

### 4.2 Approved production model relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Service Order -> Production Bag | 1 -> 1 | Every Service Order has exactly one governed Production Bag |
| Production Bag -> Customer | many -> 1 | Every Production Bag belongs to exactly one Customer; a Customer may have many Bags through many Service Orders |
| Production Bag -> Current Primary Operational Resource | many -> 1 | Every Production Bag has exactly one current Primary Operational Resource |
| Production Bag -> Responsibility Transfer History | 1 -> many | Every transfer event must be retained for auditability |
| Production Bag -> Service Order Item | 1 -> many | A Bag may contain many Service Order Items, but all must belong to the same Service Order |
| Production Bag -> Production Order | 1 -> many | A Bag may contain many Production Orders, but all must belong to the same Service Order |
| Service Order -> Production Order | 1 -> many | A Service Order may generate many Production Orders within its single Bag |
| Production Order -> Production Bag | many -> 1 | Every Production Order belongs to exactly one Production Bag |
| Production Order -> Service Order | many -> 1 | Every Production Order belongs to exactly one Service Order |

### 4.3 Operational and corrective relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Production Order -> Operational Resource Assignment | many -> many over time | Multiple assignments may occur historically, but each assignment event is explicit and auditable |
| Production Order -> QR Code | 1 -> 1 active operational code | The operational execution QR belongs to the Production Order |
| Quality Record -> Production Order | many -> 1 | Many inspections may exist for one Production Order |
| Quality Record -> Service Order Item | many -> 1 when item-scoped | Item-level quality remains anchored to the parent item |
| Rework Case -> Original Service Order | many -> 1 | Rework must remain traceable to the original Service Order |
| Rework Case -> Original Operational Resource | many -> 1 | Original responsibility must be preserved |
| Rework Case -> Corrective Operational Resource | many -> 1 | Corrective execution responsibility must be preserved |
| Warranty Case -> Original Service Order | many -> 1 | Warranty must remain linked to original commercial commitment |
| Warranty Case -> Affected Item Scope | many -> 1 | Warranty responsibility must remain tied to the affected item or operational scope |

### 4.4 Delivery, finance, and audit relationships

| Relationship | Cardinality | Guideline |
|---|---|---|
| Service Order -> Payment Allocation | 1 -> many | Multiple payments and allocations may apply to one Service Order |
| Service Order Item -> Payment Allocation | 1 -> many | Item-level payment allocation is allowed |
| Service Order -> Pickup Authorization | 1 -> many over time | Many authorizations may exist historically, but release uses one valid authorization path |
| Service Order -> Physical Location Assignment | 1 -> many over time | Current location and history must both be preserved |
| Aggregate -> Audit Event | 1 -> many | Any governed aggregate may generate many audit events |
| Aggregate -> Chain-of-Custody Event | 1 -> many where custody applies | Custody history is event-based and auditable |
| Workflow Definition -> Transactional Aggregate | 1 -> many | One workflow policy may govern many aggregates of the same type |

---

## 5. Relationship Rules

### 5.1 Service Order to Production boundary

The Service Order is the parent commercial aggregate.

The Production Bag and all Production Orders under that bag must remain inside the Service Order boundary and must not mix data from another Service Order.

### 5.2 Customer consistency rule

Because `1 Service Order -> exactly 1 Production Bag` and `1 Production Bag -> exactly 1 Customer`, every item and Production Order associated with that bag must inherit the same Customer through the owning Service Order.

### 5.3 Primary operational accountability rule

At any moment, a Production Bag has exactly one current Primary Operational Resource.

Historical transfers do not create simultaneous primary ownership.

### 5.4 Responsibility transfer rule

Responsibility transfer is a business event inside the Production Execution domain.

A transfer must preserve:
- previous primary resource
- new primary resource
- transfer reason
- transfer timestamp
- actor who performed the transfer
- related bag and service-order context

### 5.5 Production Order containment rule

A Production Order may not span multiple Service Orders or multiple Production Bags.

### 5.6 Financial isolation rule

Production Order and Production Bag relationships may reference Service Order context, but neither becomes the source of truth for commercial values or settlement state.

---

## 6. Entity Responsibilities

### 6.1 Customer
- owns customer identity and relationship continuity
- owns customer-facing profile and contact context
- does not own order lifecycle or production execution

### 6.2 Service Order
- owns the commercial commitment
- owns delivery commitment baseline
- owns customer approvals and communication context
- owns financial source-of-truth references for business amounts
- owns Commercial Responsible and Technical Measurement Responsible assignments

### 6.3 Service Order Item
- owns item-level scope, quantity, valuation, and delivery applicability
- owns item-level production need inside the Service Order
- owns item-level links to production, quality, payment allocation, warranty, and rejection history

### 6.4 Production Bag
- owns governed grouping of one Service Order's production scope
- owns current Primary Operational Resource
- owns responsibility transfer history
- owns the invariant that all contained items and Production Orders belong to the same Service Order and Customer

### 6.5 Production Order
- owns operational execution state
- owns execution QR identity
- owns planned and produced quantities
- owns operational assignment, status progression, and execution history
- must remain free of financial source-of-truth ownership

### 6.6 Operational Resource
- owns execution-capacity identity and capability profile
- owns assignment history, skill profile, and availability context
- participates in production, quality, rework, and warranty flows without owning those aggregates

### 6.7 Quality Record
- owns inspection result and release-gate decision
- owns defects, findings, and corrective-action requirement records

### 6.8 Rework Case
- owns corrective flow for internally originated defects
- owns original-responsibility and corrective-responsibility attribution

### 6.9 Warranty Case
- owns post-delivery customer responsibility under warranty
- owns the distinction between Warranty Adjustment and Warranty Execution

### 6.10 Pickup Authorization and Evidence
- own third-party collection authorization and proof-of-release context
- own linkage to the Service Order release event

### 6.11 Workflow Definition and SLA Policy
- own configurable status models, transition rules, time controls, and policy behavior
- do not own transactional business facts generated by execution

### 6.12 Audit and Custody Events
- own immutable traceability
- do not replace the transactional aggregates they describe

---

## 7. Data Ownership Rules

### 7.1 Commercial ownership

Commercial data belongs to the Service Order domain.

This includes:
- customer commitment
- item pricing and adjustments
- payment applicability
- delivery type at the commercial level
- promised delivery commitment

### 7.2 Operational ownership

Operational execution data belongs to the Production Execution domain.

This includes:
- Production Bag composition
- current Primary Operational Resource for the bag
- Production Order lifecycle and execution
- operational QR usage
- execution timestamps and production progress

### 7.3 Quality ownership

Inspection outcomes, defects, rework initiation, warranty execution evidence, and release gates belong to the Quality and Corrective Flows domain.

### 7.4 Financial ownership

Payment allocations, settlement state, reconciliation outputs, and financial exceptions belong to the Finance and Settlement domain.

The Service Order remains the business source of truth for requested commercial amounts.

### 7.5 Workflow ownership

Status definitions, transition permissions, SLA triggers, and delivery-date calculation policies belong to the Workflow and SLA Policy domain.

### 7.6 Audit ownership

The immutable record of what happened belongs to the Audit and Traceability domain.

The meaning of why it happened remains owned by the originating business domain.

---

## 8. Cross-Domain Reference Rules

### 8.1 General rule

A consuming domain may reference another domain's aggregate identity, but may not take over ownership of that aggregate's core meaning.

### 8.2 Required reference rules

- Customer may be referenced by Service Orders, warranty cases, pickup authorization, and CRM interactions.
- Service Order may be referenced by Production Bag, Production Orders, quality records, rework, warranty, delivery, pickup, and finance.
- Service Order Item may be referenced by Production Orders, quality records, payments, rework, and warranty.
- Production Bag may be referenced by Production Orders, custody events, location events, and dashboards.
- Production Order may be referenced by quality, rework, warranty execution, QR scans, and operational diary records.
- Operational Resource may be referenced by Production Bag, Production Order assignment, quality inspection, rework, warranty execution, and ranking views.
- Workflow definitions may be referenced by all transactional aggregates that require lifecycle control.
- Audit events may reference any aggregate, but do not own transactional state.

### 8.3 Forbidden cross-domain ownership patterns

The model must avoid:
- Finance becoming the owner of production execution state
- Production becoming the owner of commercial price truth
- Audit becoming the owner of workflow state
- Reporting becoming the owner of transactional truth
- Quality becoming the owner of customer master data

---

## 9. Audit Ownership

### 9.1 Audit boundary

Audit is a dedicated cross-cutting domain, but not the owner of business meaning.

### 9.2 Audit-owned records

Audit must own immutable records for:
- create, update, delete, and cancel actions
- status changes
- responsibility transfers
- Production Order QR execution events
- quality decisions
- rework reassignment
- warranty actions
- payment and exception actions
- pickup authorization and release events
- location changes

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
- `ProductionBagAssigned`, `ProductionBagTransferred`, and `ProductionOrderStarted` belong to Production Execution.
- `OperationalResourceAssigned` belongs to Production Execution, with Operational Resource referenced as participant.
- `QualityPassed`, `QualityRejected`, `ReworkOpened`, and `WarrantyExecutionOpened` belong to Quality and Corrective Flows.
- `PaymentAllocated`, `SettlementConfirmed`, and `FinancialExceptionOpened` belong to Finance and Settlement.
- `PickupAuthorized` and `PickupCompleted` belong to Delivery and Pickup.
- `WorkflowStatusChanged` and `SLAViolated` belong to the domain that owns the affected aggregate, while Workflow and SLA Policy own the governing rules behind the change.
- `AuditEventRecorded` and `CustodyEventRecorded` belong to Audit and Traceability.

### 10.3 Event propagation rule

Downstream consumers may react to events, but the originating domain remains the source of truth for the event's business meaning.

---

## 11. Workflow Ownership

### 11.1 Workflow policy ownership

Workflow and SLA Policy owns:
- status definitions
- allowed transitions
- approval requirements
- SLA trigger logic
- delivery-date suggestion policy
- escalation rules
- visibility rules driven by status configuration

### 11.2 Business lifecycle ownership

The business aggregate still owns its own current lifecycle state.

Examples:
- Service Order owns current commercial status.
- Production Order owns current execution status.
- Production Bag owns current bag status and current Primary Operational Resource.
- Rework owns current corrective status.
- Warranty owns current warranty-resolution status.

### 11.3 Workflow-to-aggregate rule

Workflow definitions govern many transactional aggregates of the same type, but they do not replace aggregate ownership.

---

## 12. Approved Production Model for Conceptual Data Design

The following model is mandatory for conceptual data design in this version of the guideline and takes precedence for conceptual ownership and cardinality decisions in this document:

- 1 Customer -> many Service Orders
- 1 Service Order -> exactly 1 Production Bag
- 1 Production Bag -> exactly 1 Customer
- 1 Production Bag -> exactly 1 current Primary Operational Resource
- 1 Production Bag may contain multiple Service Order Items belonging to the same Service Order
- 1 Production Bag may contain multiple Production Orders belonging to the same Service Order
- responsibility transfers must be auditable

Conceptual implications:
- Production Bag is a governed aggregate, not just a convenience reference
- the bag is the controlled grouping boundary for the Service Order's production scope
- bag composition may vary over time, but bag ownership and customer consistency must not be violated
- parallel operational work may exist through multiple Production Orders inside the same Bag, but current bag primacy remains singular at any point in time
- transfer history must preserve both original and current responsibility lineage

---

## 13. Final Modeling Guidance

The conceptual model should be treated as a business-ownership map before any schema design begins.

The recommended order for downstream detailed modeling is:
1. confirm bounded contexts
2. confirm aggregate roots and invariants
3. confirm approved cardinalities
4. confirm ownership of commercial, operational, financial, and audit facts
5. confirm event boundaries and workflow boundaries
6. only then derive logical and physical persistence models

No physical schema decision should violate the ownership boundaries defined in this document.
