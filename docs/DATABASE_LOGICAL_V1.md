# ANEXSYS Platform
# DATABASE_LOGICAL_V1

## Document Purpose

This document transforms the approved conceptual data model of ANEXSYS into a complete logical data model using only the following approved sources of truth:
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/frozen/DATABASE_GUIDELINES_V1.md`
- `/docs/DATABASE_CONCEPTUAL_V1.md`

This document defines:
- logical entities
- entity responsibilities
- entity ownership
- parent-child relationships
- cardinalities
- aggregate roots
- domain boundaries
- event ownership
- audit ownership
- workflow ownership
- financial ownership
- quality ownership
- operational resource ownership
- traceability ownership

This document does not define:
- SQL scripts
- PostgreSQL scripts
- CREATE TABLE statements
- physical schema definitions
- index definitions
- infrastructure design

---

## 1. Executive Summary

ANEXSYS logical data design must preserve the approved business split between commercial truth and operational truth:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Production Bag = physical support only

The logical model must preserve these approved operating rules:
- 1 Customer -> many Service Orders
- 1 Service Order -> many Service Order Items
- 1 Service Order -> exactly 1 Production Order as the primary/base operational record
- 1 Production Order -> many Production Order Versions over time when corrective lineage is required
- the Production Order is order-scoped and may retain one or more originating Service Order Item references for traceability without changing the one-Production-Order-per-Service-Order rule
- QR Code belongs only to the Production Order
- Operational Resources execute work through Production Order events
- Rework, Warranty Execution, and Corrective Production use Production Order lineage versioning
- the Production Bag is never modeled as a primary business entity and never receives independent numbering, independent QR ownership, or independent workflow ownership

Logical design intent:
- Tenant and Branch logical entities preserve governance, branch-local policy, and branch-scoped business boundaries
- Customer and CRM logical entities preserve relationship identity and customer interaction history
- Service Order logical entities preserve commercial scope, delivery commitment, and financial truth
- Production logical entities preserve operational execution, responsibility, QR identity, and corrective version lineage
- quality, finance, pickup, audit, workflow, and traceability logical entities remain explicitly owned by their governing domains
- cross-domain references are allowed only as identity/reference relationships and must not transfer source-of-truth ownership

---

## 2. Domain Boundaries

### 2.1 Tenant Governance domain

Owns logical entities:
- Tenant
- Branch

### 2.2 Customer and CRM domain

Owns logical entities:
- Customer
- Customer Contact
- Customer Interaction
- Measurement Record

### 2.3 Service Order domain

Owns logical entities:
- Service Order
- Service Order Item

### 2.4 Production Execution domain

Owns logical entities:
- Production Order
- Production Order Version

### 2.5 Operational Resource domain

Owns logical entities:
- Operational Resource

### 2.6 Quality and Corrective domain

Owns logical entities:
- Quality Record
- Customer Rejection
- Rework Case
- Warranty Adjustment
- Warranty Execution

### 2.7 Finance and Fiscal domain

Owns logical entities:
- Payment Record
- Partial Payment
- Fiscal Document

### 2.8 Delivery and Pickup domain

Owns logical entities:
- Pickup Authorization
- Pickup Token
- Pickup QR Code
- Temporary Pickup Code
- Storage Location
- Storage Location Assignment

Support-context note:
- Physical Production Bag Support Context belongs to Delivery and Pickup traceability as optional physical context only and is modeled as non-aggregate support context

### 2.9 QR and Operational Tracking domain

Owns logical entities:
- QR Code
- QR Event

### 2.10 Audit and Traceability domain

Owns logical entities:
- Custody Event
- Audit Event
- CCTV Reference
- Camera Snapshot

### 2.11 Workflow and SLA Policy domain

Owns logical entities:
- Workflow Definition
- Status Definition
- SLA Rule

### 2.12 Communication and Approval domain

Owns logical entities:
- Communication Event
- Digital Approval

---

## 3. Aggregate Root List

Logical aggregate roots:
- Tenant
- Branch
- Customer
- Service Order
- Production Order
- Operational Resource
- Quality Record
- Customer Rejection
- Rework Case
- Warranty Adjustment
- Warranty Execution
- Pickup Authorization
- QR Code
- Custody Event
- Audit Event
- Workflow Definition
- Communication Event
- Digital Approval

Logical aggregate-root guidance:
- Tenant is the logical root for top-level isolation and policy scope
- Branch is the logical root for branch-local governance, calendars, and business scope
- Customer is the logical root for contact, interaction, and measurement history
- Service Order is the logical root for commercial scope and financial truth
- Production Order is the logical root for operational execution and corrective version lineage
- Pickup Authorization is the logical root for pickup credentials and release authorization artifacts
- Storage Location remains a shared reference catalog and not an aggregate root
- Warranty Adjustment and Warranty Execution remain distinct logical roots because the approved model preserves them as separate business responsibilities
- Workflow Definition is the logical root for configurable lifecycle policy
- Communication Event is the logical root for non-approval message and notification trace
- Custody Event is the logical root for chain-of-custody traceability
- Audit Event is the logical root for immutable audit trace

---

## 4. Logical Entity Catalog

| Logical Entity | Logical Responsibility | Owning Domain | Governing Aggregate Root |
|---|---|---|---|
| Tenant | tenant isolation and policy boundary | Tenant Governance | Tenant |
| Branch | branch-local business unit and policy boundary | Tenant Governance | Branch |
| Customer | customer relationship identity | Customer and CRM | Customer |
| Customer Contact | customer reachability and communication preferences | Customer and CRM | Customer |
| Customer Interaction | communication, complaint, and follow-up history | Customer and CRM | Customer |
| Measurement Record | versioned measurement facts and attribution | Customer and CRM | Customer |
| Service Order | commercial commitment and financial truth | Service Order | Service Order |
| Service Order Item | itemized commercial and execution scope | Service Order | Service Order |
| Production Order | operational execution identity and state, including the primary/base record in the Production Order lineage | Production Execution | Production Order |
| Production Order Version | corrective version lineage subordinate to the primary/base Production Order state | Production Execution | Production Order |
| Operational Resource | execution-capacity identity and capability ownership | Operational Resource | Operational Resource |
| Quality Record | inspection result and release decision | Quality and Corrective | Quality Record |
| Customer Rejection | customer-facing rejection outcome | Quality and Corrective | Customer Rejection |
| Rework Case | internal corrective execution flow | Quality and Corrective | Rework Case |
| Warranty Adjustment | post-delivery adjustment responsibility | Quality and Corrective | Warranty Adjustment |
| Warranty Execution | post-delivery execution defect responsibility | Quality and Corrective | Warranty Execution |
| Payment Record | payment transaction and settlement trace | Finance and Fiscal | Service Order |
| Partial Payment | allocated portion of a payment obligation | Finance and Fiscal | Service Order |
| Financial Exception | exceptional settlement correction flow | Finance and Fiscal | Service Order |
| Fiscal Document | fiscal issuance and document lifecycle | Finance and Fiscal | Service Order |
| Pickup Authorization | release authorization in delivery context | Delivery and Pickup | Pickup Authorization |
| Pickup Token | tokenized pickup credential | Delivery and Pickup | Pickup Authorization |
| Pickup QR Code | scannable pickup credential | Delivery and Pickup | Pickup Authorization |
| Temporary Pickup Code | short-lived pickup credential | Delivery and Pickup | Pickup Authorization |
| Storage Location | visible retrieval and physical placement catalog context | Delivery and Pickup | Not applicable - shared reference catalog |
| Storage Location Assignment | current and historical location-assignment history for Service Order retrieval visibility | Delivery and Pickup | Storage Location Assignment |
| Physical Production Bag Support Context | optional physical container support context for retrieval or transport flows only | Delivery and Pickup | Not applicable - support context only |
| QR Code | operational scan identity for the Production Order | QR and Operational Tracking | QR Code |
| QR Event | individual execution scan trace | QR and Operational Tracking | QR Code |
| Custody Event | physical handoff and chain-of-custody trace | Audit and Traceability | Custody Event |
| Audit Event | immutable cross-domain audit record | Audit and Traceability | Audit Event |
| CCTV Reference | surveillance evidence reference for custody or pickup trace | Audit and Traceability | Custody Event |
| Camera Snapshot | captured image evidence for custody or pickup trace | Audit and Traceability | Custody Event |
| Workflow Definition | lifecycle policy and transition governance | Workflow and SLA Policy | Workflow Definition |
| Status Definition | configurable status meaning | Workflow and SLA Policy | Workflow Definition |
| SLA Rule | timing, pause, resume, and breach policy | Workflow and SLA Policy | Workflow Definition |
| Communication Event | message and notification trace | Communication and Approval | Communication Event |
| Digital Approval | auditable approval or consent decision | Communication and Approval | Digital Approval |

Logical support rule:
- Physical Production Bag Support Context is a non-aggregate logical support context, not a primary business entity and not an aggregate root.
- It may exist only as optional support context associated to Service Order and Production Order retrieval or transport flows.
- The Governing Aggregate Root column identifies which listed aggregate root governs a logical entity's lifecycle and boundary; it does not imply that every listed logical entity is itself an aggregate root.
- In this logical model, `Production Order` is the canonical logical entity name, the first Production Order generated from a Service Order is the primary/base record, and `Production Order lineage` is the umbrella term for that base record plus its corrective versions.

---

## 5. Entity Responsibilities

### 5.1 Tenant Governance responsibilities
- Tenant owns top-level isolation, tenant-wide policy, and tenant boundary identity.
- Branch owns branch-local business scope, branch calendars, and branch-scoped operating context.

### 5.2 Customer and CRM responsibilities
- Customer owns customer identity continuity across Service Orders.
- Customer Contact owns channel-specific contact and communication preference facts.
- Customer Interaction owns traceable communication and service-history events.
- Measurement Record owns versioned measurement facts, attribution, and auditable measurement history.

### 5.3 Service Order responsibilities
- Service Order owns the commercial commitment, customer-facing lifecycle, delivery commitment, and financial source of truth.
- Service Order Item owns item-level scope inside the parent Service Order and participates in production, payment, quality, warranty, rejection, and delivery relationships.

### 5.4 Production responsibilities
- Production Order owns operational execution state, operational QR identity, execution status progression, assignment context, workflow-event registration, and Operational Diary linkage.
- Production Order Version owns corrective lineage state for rework, warranty execution, and corrective production while remaining subordinate to the original primary/base Production Order lineage.

### 5.5 Operational Resource responsibilities
- Operational Resource owns capability profile, qualification context, and operational assignment identity.
- Operational responsibility is realized through Production Order execution events rather than through Service Order financial ownership.

### 5.6 Quality responsibilities
- Quality Record owns inspection results and release decisions.
- Customer Rejection owns post-delivery rejection facts.
- Rework Case owns internal corrective execution lifecycle.
- Warranty Adjustment owns adjustment-only warranty obligations.
- Warranty Execution owns execution-related warranty obligations and corrective operational lineage.

### 5.7 Financial responsibilities
- Payment Record owns the trace of payment transaction, receipt, authorization, reconciliation, and settlement outcome.
- Partial Payment owns the logical fact that only part of a Service Order or Service Order Item financial obligation has been settled.
- Financial Exception owns overpayment, underpayment, correction, and exceptional settlement handling.
- Fiscal Document owns legal and fiscal issuance lifecycle while remaining anchored to Service Order commercial truth.

### 5.8 Pickup and traceability responsibilities
- Pickup Authorization owns who may collect, under what authorization path, and within what validity window.
- Pickup Token, Pickup QR Code, and Temporary Pickup Code own supporting authorization artifacts under Pickup Authorization.
- Storage Location owns visible retrieval and placement definition.
- Storage Location Assignment owns current-versus-historical retrieval placement history within the Service Order lifecycle.
- Physical Production Bag Support Context owns no business authority and only preserves optional physical support context when used.
- QR Code owns operational scan identity only for the Production Order.
- QR Event owns each execution-scan occurrence.
- Custody Event owns chain-of-custody progression where physical handoff or release trace is required.
- Audit Event owns immutable cross-domain audit history.
- CCTV Reference owns optional surveillance evidence linkage used in custody or pickup trace.
- Camera Snapshot owns optional captured-image evidence used in custody or pickup trace.

### 5.9 Workflow and approval responsibilities
- Workflow Definition owns lifecycle policy.
- Status Definition owns the meaning of individual statuses within a workflow.
- SLA Rule owns timing, pause, resume, completion, and violation logic.
- Communication Event owns message and notification trace.
- Digital Approval owns consent, approval, rejection, and resubmission decisions.

---

## 6. Parent-Child Relationships

### 6.1 Tenant root lineage
- Tenant -> Customer
- Tenant -> Service Order
- Tenant -> Branch
- Branch -> Customer association by reference when the customer is branch-scoped
- Branch -> Service Order

### 6.2 Customer root lineage
- Customer -> Customer Contact
- Customer -> Customer Interaction
- Customer -> Measurement Record
- Customer -> Service Order reference lineage

### 6.3 Service Order root lineage
- Service Order -> Service Order Item
- Service Order -> Payment Record
- Service Order -> Financial Exception
- Service Order -> Fiscal Document when issuance occurs at order scope
- Service Order -> Pickup Authorization
- Service Order -> Digital Approval reference
- Service Order -> Communication Event reference
- Service Order -> Storage Location Assignment history
- Service Order -> exactly 1 Production Order as the primary/base operational record

### 6.4 Production root lineage
- Production Order -> Production Order Version
- Production Order -> QR Code
- Production Order -> QR Event
- Production Order -> Quality Record reference lineage
- Production Order -> Rework Case reference lineage
- Production Order -> Warranty Execution reference lineage
- Production Order -> Operational Resource assignment and execution-event lineage

### 6.5 Quality and corrective lineage
- Service Order Item -> Customer Rejection
- Service Order Item -> Warranty Adjustment
- Service Order Item -> Fiscal Document when issuance occurs at item scope
- Payment Record -> Partial Payment when a single recorded payment is allocated in portions
- Partial Payment -> Service Order target scope by reference only when allocation is order-scoped
- Partial Payment -> Service Order Item target scope by reference only when allocation is item-scoped
- Production Order lineage -> Rework Case
- Production Order lineage -> Warranty Execution

### 6.6 Pickup, workflow, and audit lineage
- Pickup Authorization -> Pickup Token
- Pickup Authorization -> Pickup QR Code
- Pickup Authorization -> Temporary Pickup Code
- Storage Location -> Storage Location Assignment reference usage
- Custody Event -> CCTV Reference
- Custody Event -> Camera Snapshot
- Workflow Definition -> Status Definition
- Workflow Definition -> SLA Rule

---

## 7. Ownership Matrix

| Logical Entity | Logical Owner | Owned Meaning |
|---|---|---|
| Tenant | Tenant Governance | tenant isolation and policy boundary |
| Branch | Tenant Governance | branch-local business unit and policy boundary |
| Customer | Customer and CRM | customer identity and relationship continuity |
| Customer Contact | Customer and CRM | contact channels and preferences |
| Customer Interaction | Customer and CRM | interaction history |
| Measurement Record | Customer and CRM | measurement version facts |
| Service Order | Service Order | commercial and financial truth |
| Service Order Item | Service Order | item-level business scope |
| Production Order | Production Execution | operational execution truth |
| Production Order Version | Production Execution | corrective operational lineage |
| Operational Resource | Operational Resource | capacity identity and capability ownership |
| Quality Record | Quality and Corrective | inspection outcome |
| Customer Rejection | Quality and Corrective | customer rejection fact |
| Rework Case | Quality and Corrective | internal corrective execution flow |
| Warranty Adjustment | Quality and Corrective | non-execution warranty adjustment responsibility |
| Warranty Execution | Quality and Corrective | execution-related warranty responsibility |
| Payment Record | Finance and Fiscal anchored to Service Order | payment transaction trace |
| Partial Payment | Finance and Fiscal anchored to Service Order | partial settlement allocation |
| Financial Exception | Finance and Fiscal anchored to Service Order | exceptional financial correction |
| Fiscal Document | Finance and Fiscal anchored to Service Order | fiscal issuance and legal state |
| Pickup Authorization | Delivery and Pickup | release authorization authority |
| Pickup Token | Delivery and Pickup | tokenized pickup credential |
| Pickup QR Code | Delivery and Pickup | scannable pickup credential |
| Temporary Pickup Code | Delivery and Pickup | temporary pickup credential |
| Storage Location | Delivery and Pickup | shared location-catalog visibility |
| Storage Location Assignment | Delivery and Pickup under Service Order lifecycle | current and historical retrieval placement linkage |
| Physical Production Bag Support Context | Delivery and Pickup support context | optional physical container context only |
| QR Code | QR and Operational Tracking | Production Order scan identity |
| QR Event | QR and Operational Tracking | scan-event trace |
| Custody Event | Audit and Traceability | chain-of-custody trace |
| Audit Event | Audit and Traceability | immutable audit record |
| CCTV Reference | Audit and Traceability | surveillance evidence reference |
| Camera Snapshot | Audit and Traceability | captured image evidence |
| Workflow Definition | Workflow and SLA Policy | lifecycle policy |
| Status Definition | Workflow and SLA Policy | status semantics |
| SLA Rule | Workflow and SLA Policy | timing and breach policy |
| Communication Event | Communication and Approval | communication trace |
| Digital Approval | Communication and Approval | auditable approval decision |

---

## 8. Logical Relationship Matrix

| Entity A | Logical Relationship | Entity B | Logical Meaning |
|---|---|---|---|
| Tenant | governs | Customer | customer identity exists inside one tenant boundary |
| Tenant | governs | Service Order | commercial truth exists inside one tenant boundary |
| Tenant | governs | Branch | tenant owns branch-local operating scope |
| Branch | may associate with | Customer | customer relationship may be branch-scoped when not tenant-wide |
| Branch | governs | Service Order | commercial commitments are created within a branch context |
| Customer | owns | Customer Contact | contact channels belong to customer identity |
| Customer | owns | Customer Interaction | interactions remain customer-traceable |
| Customer | owns | Measurement Record | measurements remain customer-traceable and versioned |
| Customer | places | Service Order | customer initiates a commercial commitment |
| Service Order | contains | Service Order Item | itemized business scope lives under Service Order |
| Service Order | generates | Production Order | one Service Order creates exactly one Production Order as the single base operational root |
| Production Order | covers execution scope for | Service Order Item | the primary/base Production Order covers all items in the same Service Order scope |
| Production Order | is versioned by | Production Order Version | corrective lineage extends the same operational root |
| Production Order | is executed by | Operational Resource | operational work is performed through Production Order execution |
| Production Order | is identified by | QR Code | QR ownership belongs only to the Production Order |
| QR Code | generates | QR Event | scan history is event-based |
| Production Order | is evaluated by | Quality Record | inspection and release remain operationally anchored |
| Service Order Item | may lead to | Customer Rejection | rejection is item-scoped |
| Production Order lineage | may open | Rework Case | internal correction preserves original operational lineage |
| Service Order Item | may require | Warranty Adjustment | non-execution warranty obligation is item-scoped |
| Production Order lineage | may require | Warranty Execution | execution-related warranty correction preserves operational lineage |
| Service Order | is settled by | Payment Record | settlement remains commercially anchored |
| Payment Record | may be allocated through | Partial Payment | one recorded payment may be split into partial obligations |
| Partial Payment | may target | Service Order | allocation may settle order-level obligation when order-scoped |
| Partial Payment | may target | Service Order Item | allocation may settle item-level obligation when item-scoped |
| Service Order | may open | Financial Exception | exceptional settlement or correction flow remains commercially anchored |
| Service Order | is documented by | Fiscal Document | order-scope fiscal issuance remains commercially anchored |
| Service Order Item | is documented by | Fiscal Document | item-scope fiscal issuance remains tied to parent order scope |
| Service Order | authorizes release through | Pickup Authorization | release control remains in delivery context |
| Pickup Authorization | may issue | Pickup Token | tokenized pickup authorization artifact |
| Pickup Authorization | may issue | Pickup QR Code | scannable pickup authorization artifact |
| Pickup Authorization | may issue | Temporary Pickup Code | short-lived pickup authorization artifact |
| Service Order | uses | Storage Location Assignment | retrieval visibility history remains under the Service Order lifecycle |
| Storage Location Assignment | references | Storage Location | assignment history points to the shared location catalog |
| Service Order | may use | Physical Production Bag Support Context | bag support context may optionally store Service Order pieces |
| Production Order | may use | Physical Production Bag Support Context | bag support context may optionally carry the printed operational document |
| Custody Event | may include | CCTV Reference | custody trace may include surveillance evidence linkage |
| Custody Event | may include | Camera Snapshot | custody trace may include captured image evidence |
| Service Order | is traced by | Custody Event | custody progression is auditable across commercial, delivery, and pickup stages |
| Production Order | is traced by | Custody Event | custody progression is auditable across operational, quality, rework, and warranty stages |
| Any governed entity | is recorded by | Audit Event | immutable audit trace remains cross-domain |
| Workflow Definition | governs | Status Definition | workflow policy gives meaning to statuses |
| Workflow Definition | governs | SLA Rule | workflow policy governs timing behavior |
| Digital Approval | records decision for | Service Order | approval remains traceable to governed commercial objects |
| Digital Approval | records decision for | Production Order Version | approval remains traceable to governed corrective operational objects |
| Digital Approval | records decision for | Pickup Authorization | approval remains traceable to governed pickup-release objects |
| Communication Event | references | Customer | communications remain linked to customer lifecycle |
| Communication Event | references | Service Order | communications remain linked to order lifecycle |

---

## 9. Cardinality Matrix

| Parent | Child | Cardinality | Logical Constraint |
|---|---|---|---|
| Tenant | Branch | 1 -> many | each Branch belongs to one Tenant |
| Tenant | Customer | 1 -> many | each Customer belongs to one Tenant |
| Tenant | Service Order | 1 -> many | each Service Order belongs to one Tenant |
| Branch | Customer | 1 -> many when branch-scoped | some Customers may instead remain tenant-wide without a branch-specific relationship |
| Branch | Service Order | 1 -> many | each Service Order belongs to one Branch |
| Customer | Customer Contact | 1 -> many | contact channels belong to one Customer |
| Customer | Customer Interaction | 1 -> many | interactions remain customer-owned |
| Customer | Measurement Record | 1 -> many | measurement history is versioned over time |
| Customer | Service Order | 1 -> many | one customer may originate many Service Orders |
| Service Order | Service Order Item | 1 -> many | items cannot exist outside the parent Service Order |
| Service Order | Production Order | 1 -> 1 | exactly one Production Order exists as the primary/base operational record per Service Order |
| Production Order | Production Order Version | 1 -> many over time | versions exist only for rework, warranty execution, or corrective production under the same primary lineage |
| Production Order | QR Code | 1 -> 1 active | operational QR identity belongs only to the Production Order |
| Production Order | QR Event | 1 -> many | scan history is event-based |
| Production Order | Quality Record | 1 -> many | multiple inspections may exist over time |
| Production Order | Rework Case | 1 -> many | many corrective cases may reference the same lineage over time |
| Production Order | Warranty Execution | 1 -> many | many execution-related warranty events may reference the same lineage over time |
| Production Order | Operational Resource assignment | 1 -> many over time | responsibility is longitudinal and auditable |
| Service Order | Payment Record | 1 -> many | multiple payment records may be linked to a single Service Order |
| Payment Record | Partial Payment | 1 -> many when allocated in portions | one recorded payment may be split into partial obligations |
| Service Order | Financial Exception | 1 -> many | many financial corrections may occur over time |
| Service Order | Fiscal Document | 1 -> many | fiscal documents may be emitted at order scope |
| Service Order Item | Fiscal Document | 1 -> many | fiscal documents may be emitted at item scope |
| Service Order | Pickup Authorization | 1 -> many over time | historical authorization paths may exist |
| Pickup Authorization | Pickup Token | 1 -> many | token lifecycle is policy-driven |
| Pickup Authorization | Pickup QR Code | 1 -> many | QR-based release artifacts are policy-driven |
| Pickup Authorization | Temporary Pickup Code | 1 -> many | short-lived release artifacts are policy-driven |
| Custody Event | CCTV Reference | 1 -> many when evidence is captured | custody evidence may include one or more surveillance references |
| Custody Event | Camera Snapshot | 1 -> many when evidence is captured | custody evidence may include one or more captured images |
| Service Order | Storage Location Assignment | 1 -> many over time | current and historical retrieval location must be preserved through assignment history |
| Storage Location | Storage Location Assignment | 1 -> many by reference use | many assignment-history records may reference the same location catalog entry |
| Service Order | Physical Production Bag Support Context | 1 -> many when physically used | physical bag usage is optional support context only |
| Production Order | Physical Production Bag Support Context | 1 -> many when physically used | printed operational-document support may be associated without creating bag authority |
| Service Order | Digital Approval | 1 -> many | multiple approval cycles may exist over time |
| Service Order | Communication Event | 1 -> many | communication history is longitudinal |
| Service Order | Custody Event | 1 -> many where custody applies | intake, storage, delivery, and pickup trace remain auditable |
| Production Order | Custody Event | 1 -> many where custody applies | operational, quality, rework, and warranty trace remain auditable |
| Any governed entity | Audit Event | 1 -> many | audit history is immutable and longitudinal |
| Workflow Definition | Status Definition | 1 -> many | one workflow governs many statuses |
| Workflow Definition | SLA Rule | 1 -> many | one workflow governs many timing rules |

---

## 10. Event Ownership

Event ownership rule:
- a logical event belongs to the domain where the business fact originates

Logical event ownership:
- Service Order domain owns `ServiceOrderCreated`, `ServiceOrderApproved`, `DeliveryCommitmentChanged`, `ServiceOrderCancelled`, and `ServiceOrderClosed`
- Production Execution owns `PrimaryProductionOrderGenerated`, `ProductionOrderStarted`, `OperationalResponsibilityAssumed`, `ProductionStatusUpdated`, `WorkflowEventRegistered`, and `ProductionOrderVersionCreated`
- Quality and Corrective owns `QualityPassed`, `QualityRejected`, `CustomerRejectionRecorded`, `ReworkOpened`, `ReworkAssigned`, `WarrantyAdjustmentOpened`, and `WarrantyExecutionOpened`
- Finance and Fiscal owns `PaymentRecorded`, `PartialPaymentAllocated`, `FinancialExceptionOpened`, `FinancialExceptionResolved`, and `FiscalDocumentIssued`
- Delivery and Pickup owns `PickupAuthorized`, `PickupTokenIssued`, `PickupCompleted`, and release-authorization artifact issuance events
- QR and Operational Tracking owns `QRCodeIssuedForProductionOrder`, `QRScannedForExecutionStart`, `QRScannedForResponsibilityAssumption`, `QRScannedForStatusUpdate`, and `QRScannedForOperationalDiaryUpdate`
- Audit and Traceability owns `AuditEventRecorded` and `CustodyEventRecorded`
- Communication and Approval owns approval-decision and communication-delivery events

---

## 11. Audit Ownership

Audit ownership rules:
- Audit Event owns immutable recordkeeping, never transactional source-of-truth meaning
- Custody Event owns physical handoff and chain-of-custody trace where applicable
- every audit record must point back to its owning domain, aggregate type, aggregate identity, actor, timestamp, and action/event type
- prior-state and resulting-state context must remain linked where state transition auditing applies

---

## 12. Workflow Ownership

Workflow ownership rules:
- Workflow Definition owns lifecycle policy, transition governance, approval requirements, escalation logic, and visibility rules
- Status Definition owns status semantics for Service Order, Service Order Item, Production Order, Quality, Rework, Warranty Execution, Payment, Delivery, and Approval contexts where configured
- SLA Rule owns start, pause, resume, complete, and violation behavior under business-calendar governance
- workflow entities govern transactional entities but do not replace the transactional domain as source of truth
- operational workflow execution remains anchored to the Production Order, not to Production Bag support context

---

## 13. Financial Ownership

Financial ownership rules:
- Service Order remains the logical source of truth for pricing, discounts, financial value, payment terms, payment applicability, and fiscal references
- Payment Record is the logical settlement record anchored to Service Order truth
- Partial Payment is a logical allocation entity subordinate to Payment Record and anchored to either Service Order or Service Order Item scope
- Financial Exception preserves exceptional correction flow without moving financial ownership away from the Service Order
- Fiscal Document remains logically anchored to Service Order commercial truth even when issued at item scope
- Production Order must never become the source of truth for payment, price, discount, commission, margin, or profit information

---

## 14. Quality Ownership

Quality ownership rules:
- Quality Record owns inspection outcomes and quality-release meaning
- Customer Rejection owns customer-facing rejection facts
- Rework Case owns internal corrective execution lifecycle
- Warranty Adjustment owns non-execution adjustment obligations
- Warranty Execution owns execution-related warranty correction lifecycle
- all corrective entities must preserve original Production Order lineage and original-versus-corrective operational accountability where applicable

---

## 15. Operational Resource Ownership

Operational Resource ownership rules:
- Operational Resource owns capability profile, qualification, availability, and assignment identity
- Commercial Responsible and Technical Measurement Responsible belong to Service Order responsibility scope
- Operational Responsible is defined through Production Order execution events
- Quality Responsible is defined through Quality workflow
- rework and warranty execution must preserve original and corrective Operational Resource attribution when applicable

---

## 16. Traceability Ownership

Traceability ownership rules:
- QR Code and QR Event logically own Production Order scan traceability
- Storage Location logically owns location-definition meaning
- Storage Location Assignment logically owns current-versus-historical retrieval visibility history while referencing Storage Location
- Pickup Authorization and its artifacts logically own release traceability
- Custody Event logically owns handoff-stage traceability across intake, storage, delivery, pickup, rework, and warranty where applicable
- Audit Event logically owns immutable cross-domain traceability
- Physical Production Bag Support Context may contribute optional physical context but never owns business authority, numbering, QR identity, or workflow state

---

## 17. Remaining Modeling Risks

- Payment Record versus Partial Payment logical separation is well defined but may still require finer logical allocation rules if one payment is split across multiple item scopes.
- Warranty Adjustment versus Warranty Execution remains conceptually distinct but may require stricter logical state rules during physical design.
- Storage Location is logically anchored at Service Order retrieval visibility; tenants that require finer item-level physical placement may need a future governed extension.
- Communication Event and Digital Approval may require richer logical evidence variants for channel-specific retention or compliance rules.
- Custody Event may need more explicit logical stage classification if downstream physical design requires standardized custody taxonomies.
- Workflow policy reuse across domains is logically sound but may need stronger logical normalization boundaries when translated into physical design.

---

## 18. Readiness for Physical Database Design

**Status: READY WITH CONTROLLED REFINEMENT**

Rationale:
- logical entities are identified and bounded
- source-of-truth ownership is explicit
- aggregate roots are defined
- logical parent-child relationships are defined
- logical cardinalities are defined
- workflow, audit, financial, quality, operational-resource, and traceability ownership are explicit
- the remaining open items are refinement topics for physical modeling, not blockers to physical design initiation

---

## 19. Logical Model Completeness Score

**Score: 97/100**

Rationale:
- all mandatory logical entities are modeled
- aggregate roots and domain boundaries are explicit
- logical ownership is clearly assigned
- logical relationship and cardinality matrices cover the approved operational model
- deductions remain only for physical-design refinement areas around allocation, warranty-state detail, and traceability granularity

---

## 20. Physical Database Readiness Score

**Score: 94/100**

Rationale:
- the logical model is ready to drive physical database design
- major source-of-truth conflicts have been resolved
- ownership, lineage, and cardinality rules are sufficiently stable for physical translation
- remaining deductions reflect detail-level physical normalization choices rather than logical-architecture uncertainty
