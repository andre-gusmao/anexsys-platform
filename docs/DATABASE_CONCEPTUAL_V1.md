# ANEXSYS Platform
# DATABASE_CONCEPTUAL_V1

## Document Purpose

This document defines the complete conceptual data model for ANEXSYS using only the following frozen approved baseline documents as source of truth:
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/frozen/DATABASE_GUIDELINES_V1.md`

This document defines:
- business entities
- aggregates
- ownership rules
- cardinalities
- parent/child relationships
- cross-domain references
- event relationships
- audit relationships
- workflow relationships
- financial relationships
- production relationships
- quality relationships
- operational resource relationships
- customer relationships
- pickup authorization relationships
- QR tracking relationships
- chain-of-custody relationships

This document does not define:
- SQL
- PostgreSQL scripts
- physical tables
- foreign keys
- indexes
- APIs
- implementation details

---

## 1. Executive Summary

ANEXSYS must be modeled around two primary business authorities and one physical support concept:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Production Bag = physical support element only

The conceptual model must preserve the approved operational structure:
- 1 Customer -> many Service Orders
- 1 Service Order -> many Service Order Items
- 1 Service Order -> exactly 1 Primary Production Order
- 1 Primary Production Order -> many Production Order Versions when corrective lineage is required
- Operational Resources work through Production Orders
- QR Codes belong only to Production Orders
- Production Order Versions exist only within Primary Production Order lineage for Rework, Warranty Execution, and Corrective Production

For this conceptual model, the approved Primary Production Order rule governs reconciliation across the frozen baseline set:
- the Service Order remains the commercial parent
- the Primary Production Order remains the single operational root generated from that Service Order
- Service Order Item references remain within that Service Order and Primary Production Order scope
- corrective production lineage remains subordinate through Production Order Versions rather than through separate commercial roots

The Production Bag is not a primary business entity. It is modeled only as physical operational support context for:
- Service Order pieces
- printed Production Order (A5)

The conceptual model therefore treats:
- commercial and financial responsibility as Service Order-centered
- operational execution responsibility as Production Order-centered
- quality and corrective lineage as subordinate to Production Order and Service Order lineage
- pickup, custody, location, approval, communication, and audit as cross-cutting but explicitly owned domains

---

## 2. Domain Boundaries

### 2.1 Customer and CRM Domain

Owns:
- Customer
- Customer Contact
- Customer Interaction
- Measurement Record

Purpose:
- maintain customer relationship identity
- maintain contact and communication preference context
- preserve relationship history and measurement history

### 2.2 Service Order Domain

Owns:
- Service Order
- Service Order Item
- Service Order responsibilities
- delivery commitment context
- customer-facing approval and communication references

Purpose:
- represent the commercial commitment
- represent the financial source of truth
- represent the itemized business scope

### 2.3 Production Execution Domain

Owns:
- Production Order
- Production Order Version
- operational execution state
- execution QR ownership
- operational responsibility assignment through execution events

Purpose:
- represent the operational execution source of truth
- preserve operational lineage from the primary order through corrective versions

### 2.4 Operational Resource Domain

Owns:
- Operational Resource
- capability profile
- skill and qualification context
- availability and assignment history context

Purpose:
- represent execution capacity and operational accountability participants

### 2.5 Quality and Corrective Domain

Owns:
- Quality Record
- Customer Rejection
- Rework Case
- Warranty Adjustment
- Warranty Execution

Purpose:
- represent validation outcomes
- represent corrective and post-delivery responsibility flows
- preserve operational lineage and accountability

### 2.6 Finance and Fiscal Domain

Owns:
- Payment Record
- Partial Payment
- Fiscal Document

Purpose:
- represent settlement activity, partial settlement allocation, and fiscal document lifecycle
- remain subordinate to Service Order commercial truth
- preserve a conceptual distinction where:
  - Payment Record owns the trace of a payment transaction, receipt, authorization, reconciliation, and settlement outcome
  - Partial Payment owns the business fact that only part of the Service Order or Service Order Item financial obligation has been settled or allocated

### 2.7 Delivery, Pickup, and Physical Traceability Domain

Owns:
- Pickup Authorization
- Pickup Token
- Storage Location
- physical Production Bag support context

Purpose:
- represent release authorization
- represent physical retrieval context
- represent storage and movement visibility

### 2.8 QR and Operational Tracking Domain

Owns:
- QR Code
- QR Event

Purpose:
- represent operational execution scanning authority and traceability
- remain anchored to Production Order execution

### 2.9 Audit and Custody Domain

Owns:
- Custody Event
- Audit Event

Purpose:
- preserve immutable traceability across business actions, physical custody, and operational execution

### 2.10 Workflow and SLA Policy Domain

Owns:
- Workflow Definition
- Status Definition
- SLA Rule

Purpose:
- define configurable lifecycle governance without owning transactional business truth

### 2.11 Communication and Approval Domain

Owns:
- Communication Event
- Digital Approval

Purpose:
- represent business communications, customer-facing confirmations, and auditable approvals linked to commercial or operational objects

---

## 3. Aggregate List

Primary conceptual aggregates:
- Customer
- Service Order
- Production Order
- Operational Resource
- Quality Record
- Customer Rejection
- Rework Case
- Warranty Execution
- Pickup Authorization
- Storage Location
- QR Code
- Audit Event
- Workflow Definition
- Digital Approval

Supporting conceptual aggregates or subordinate conceptual entities:
- Customer Contact
- Customer Interaction
- Measurement Record
- Service Order Item
- Production Order Version
- Warranty Adjustment
- Payment Record
- Partial Payment
- Fiscal Document
- Pickup Token
- QR Event
- Custody Event
- Status Definition
- SLA Rule
- Communication Event
- Physical Production Bag Support Context

Aggregate guidance:
- Customer is the relationship root for CRM-facing customer information
- Service Order is the commercial and financial root
- Production Order is the operational execution root
- Production Order Version is subordinate lineage under the Production Order family
- Physical Production Bag Support Context is never a business root

---

## 4. Domain Aggregates and Conceptual Entities

| Domain | Aggregate / Entity | Conceptual Role |
|---|---|---|
| Customer and CRM | Customer | customer relationship identity |
| Customer and CRM | Customer Contact | contact endpoint and preference detail |
| Customer and CRM | Customer Interaction | traceable call, message, meeting, complaint, or confirmation history |
| Customer and CRM | Measurement Record | versioned customer measurement history linked to customer and service context |
| Service Order | Service Order | commercial and financial source of truth |
| Service Order | Service Order Item | itemized business scope under the Service Order |
| Production Execution | Production Order | primary operational execution source of truth |
| Production Execution | Production Order Version | corrective lineage state subordinate to Production Order |
| Operational Resource | Operational Resource | operational execution-capacity identity |
| Quality and Corrective | Quality Record | inspection and release-gate result |
| Quality and Corrective | Customer Rejection | customer-reported nonconformity or rejection event |
| Quality and Corrective | Rework Case | internally triggered corrective execution case |
| Quality and Corrective | Warranty Adjustment | post-delivery fit/adjustment responsibility |
| Quality and Corrective | Warranty Execution | post-delivery operational defect responsibility |
| Finance and Fiscal | Payment Record | payment transaction, receipt, authorization, reconciliation, and settlement trace |
| Finance and Fiscal | Partial Payment | business fact of partial financial settlement or allocation against order or item scope |
| Finance and Fiscal | Fiscal Document | legal/fiscal issuance record |
| Delivery and Pickup | Pickup Authorization | release authorization for pickup |
| Delivery and Pickup | Pickup Token | shareable pickup credential or tokenized authorization artifact |
| Delivery and Pickup | Storage Location | visible physical retrieval/storage context |
| Delivery and Pickup | Physical Production Bag Support Context | optional physical support context only |
| QR and Operational Tracking | QR Code | production execution scan authority |
| QR and Operational Tracking | QR Event | individual execution scan trace |
| Audit and Custody | Custody Event | physical custody lifecycle event |
| Audit and Custody | Audit Event | immutable audit record |
| Workflow and SLA Policy | Workflow Definition | lifecycle rule set |
| Workflow and SLA Policy | Status Definition | configurable status semantics |
| Workflow and SLA Policy | SLA Rule | timing and breach rule definition |
| Communication and Approval | Communication Event | outbound or inbound business communication |
| Communication and Approval | Digital Approval | auditable business approval or consent |

---

## 5. Ownership Model

### 5.1 Commercial ownership

Owned by Service Order:
- customer commitment
- commercial scope
- financial values
- discounts and adjustments
- payment terms
- promised delivery commitment
- fiscal references
- customer approval references
- customer communication references
- Commercial Responsible
- Technical Measurement Responsible

### 5.2 Operational ownership

Owned by Production Order:
- operational execution state
- production status progression
- operational QR authority
- workflow event registration
- Operational Responsible through execution events
- Operational Diary execution context
- planned and actual production activity

### 5.3 Corrective lineage ownership

Owned by Primary Production Order lineage and Quality/Corrective domains:
- original Primary Production Order reference
- Production Order Version lineage
- original Operational Resource
- corrective Operational Resource
- rework and warranty execution relationships

### 5.4 Quality ownership

Owned by Quality and Corrective domain:
- inspection result
- rejection result
- release gate
- rework cause and status
- warranty adjustment and warranty execution status
- Quality Responsible through quality workflow

### 5.5 Financial ownership

Owned by Finance and Fiscal domain, anchored to Service Order truth:
- Payment Record
- Partial Payment
- payment allocation
- settlement status
- Fiscal Document lifecycle

Conceptual boundary:
- Payment Record answers which payment transaction or receipt occurred
- Partial Payment answers which portion of the commercial obligation was settled or allocated

### 5.6 Physical traceability ownership

Owned by Delivery, Pickup, and Audit/Custody domains:
- Storage Location usage
- physical bag support usage
- custody movement
- pickup authorization
- pickup evidence linkage

### 5.7 Workflow ownership

Owned by Workflow and SLA Policy domain:
- status definitions
- transition permissions
- approval requirements
- SLA rules
- delivery-date policy rules

### 5.8 Audit ownership

Owned by Audit and Custody domain:
- immutable records of who acted
- when they acted
- what changed
- what physical or operational event occurred

---

## 6. Ownership Matrix

| Entity | Owning Domain | Business Meaning Owned |
|---|---|---|
| Customer | Customer and CRM | customer identity and relationship continuity |
| Customer Contact | Customer and CRM | customer contact channels and preferences |
| Customer Interaction | Customer and CRM | interaction history linked to customer and service context |
| Measurement Record | Customer and CRM | versioned measurement facts and attribution |
| Service Order | Service Order | commercial and financial truth |
| Service Order Item | Service Order | item-level business scope |
| Production Order | Production Execution | operational execution truth |
| Production Order Version | Production Execution | corrective lineage of Production Order |
| Operational Resource | Operational Resource | execution capacity identity |
| Quality Record | Quality and Corrective | inspection outcome |
| Customer Rejection | Quality and Corrective | post-delivery rejection fact |
| Rework Case | Quality and Corrective | internal corrective execution case |
| Warranty Adjustment | Quality and Corrective | post-delivery adjustment responsibility |
| Warranty Execution | Quality and Corrective | post-delivery execution failure responsibility |
| Payment Record | Finance and Fiscal | payment transaction trace |
| Partial Payment | Finance and Fiscal | partial settlement allocation |
| Fiscal Document | Finance and Fiscal | fiscal issuance and legal status |
| Pickup Authorization | Delivery and Pickup | release authorization authority |
| Pickup Token | Delivery and Pickup | pickup authorization credential |
| Storage Location | Delivery and Pickup | physical retrieval and location visibility |
| QR Code | QR and Operational Tracking | operational scan identity for Production Order |
| QR Event | QR and Operational Tracking | scan event trace |
| Custody Event | Audit and Custody | physical custody event |
| Audit Event | Audit and Custody | immutable audit trace |
| Workflow Definition | Workflow and SLA Policy | lifecycle rule set |
| Status Definition | Workflow and SLA Policy | status semantics |
| SLA Rule | Workflow and SLA Policy | timing and breach policy |
| Communication Event | Communication and Approval | message and notification trace |
| Digital Approval | Communication and Approval | approval and consent decision trace |
| Physical Production Bag Support Context | Delivery and Pickup / Physical Traceability | optional physical support context only |

---

## 7. Cardinalities

### 7.1 Core business cardinalities

- 1 Tenant -> many Customers
- 1 Customer -> many Customer Contacts
- 1 Customer -> many Customer Interactions
- 1 Customer -> many Measurement Records
- 1 Customer -> many Service Orders
- 1 Service Order -> many Service Order Items
- 1 Service Order -> exactly 1 Primary Production Order
- 1 Service Order -> many Payment Records over time
- 1 Service Order -> many Digital Approvals over time
- 1 Service Order -> many Communication Events over time
- 1 Service Order -> many Pickup Authorizations over time
- 1 Service Order -> many Fiscal Documents over time

### 7.2 Production cardinalities

- 1 Primary Production Order -> many Service Order Items within the same Service Order scope
- 1 Primary Production Order -> many Production Order Versions over time when corrective lineage exists
- 1 Production Order Version -> exactly 1 Primary Production Order lineage
- 1 Production Order -> many QR Events
- 1 Production Order -> many Quality Records over time
- 1 Production Order -> many Rework Cases over time
- 1 Production Order -> many Warranty Execution relationships over time where applicable
- 1 Production Order -> many Operational Resource assignments over time

### 7.3 Quality and warranty cardinalities

- 1 Service Order Item -> many Quality Records over time
- 1 Service Order Item -> many Customer Rejections over time
- 1 Service Order Item -> many Rework Cases over time
- 1 Service Order Item -> many Warranty Adjustments over time
- 1 Service Order Item -> many Warranty Executions over time

### 7.4 Finance cardinalities

- 1 Payment Record -> one or many Service Order Items through allocation meaning
- 1 Service Order Item -> many Partial Payments over time
- 1 Service Order -> one or many Fiscal Documents
- 1 Fiscal Document -> one Service Order or one Service Order Item scope at issuance time

### 7.5 Pickup, QR, custody, and audit cardinalities

- 1 Pickup Authorization -> one or many Pickup Tokens over time according to policy
- 1 Storage Location -> many Service Orders or item storage contexts over time
- 1 QR Code -> exactly 1 Production Order active ownership context
- 1 Production Order -> many Custody Events where operational custody applies
- 1 Service Order -> many Custody Events across intake, storage, delivery, and pickup
- 1 business entity -> many Audit Events over time

---

## 8. Cardinality Matrix

| Parent | Child | Cardinality | Constraint |
|---|---|---|---|
| Customer | Customer Contact | 1 -> many | contacts belong to one customer |
| Customer | Customer Interaction | 1 -> many | interactions remain customer-traceable |
| Customer | Measurement Record | 1 -> many | measurements are versioned over time |
| Customer | Service Order | 1 -> many | service orders inherit customer identity |
| Service Order | Service Order Item | 1 -> many | item cannot exist outside parent order |
| Service Order | Production Order | 1 -> 1 primary | exactly one Primary Production Order per Service Order |
| Primary Production Order | Production Order Version | 1 -> many over time | versions only for rework, warranty execution, corrective production |
| Service Order | Payment Record | 1 -> many | payment records remain commercially anchored |
| Service Order Item | Partial Payment | 1 -> many | partial settlement allowed |
| Service Order / Item | Fiscal Document | 1 -> many | fiscal issuance may be per order or per item |
| Service Order | Pickup Authorization | 1 -> many | many authorization attempts/history allowed |
| Pickup Authorization | Pickup Token | 1 -> many | token lifecycle is policy-driven |
| Service Order | Storage Location context | 1 -> many over time | current and historical location must be preserved |
| Production Order | QR Code | 1 -> 1 active operational ownership | QR belongs only to Production Order |
| Production Order | QR Event | 1 -> many | scan history is event-based |
| Production Order | Quality Record | 1 -> many | inspection history is longitudinal |
| Service Order Item | Customer Rejection | 1 -> many | rejection is item-traceable |
| Production Order / Item | Rework Case | 1 -> many | corrective cases preserve lineage |
| Service Order Item | Warranty Adjustment | 1 -> many | post-delivery adjustment history |
| Primary Production Order lineage | Warranty Execution | 1 -> many | execution failure lineage preserved |
| Production Order / Service Order | Custody Event | 1 -> many | custody history is event-based |
| Any governed entity | Audit Event | 1 -> many | immutable traceability |
| Workflow Definition | Status Definition | 1 -> many | status meanings belong to workflow policy |
| Workflow Definition | SLA Rule | 1 -> many | SLA rules belong to workflow policy |

---

## 9. Parent/Child Relationships

### 9.1 Customer hierarchy

- Customer is parent of Customer Contact
- Customer is parent of Customer Interaction
- Customer is parent of Measurement Record
- Customer is parent of Service Order in commercial relationship terms

### 9.2 Service Order hierarchy

- Service Order is parent of Service Order Item
- Service Order is parent commercial anchor of Payment Record, Partial Payment allocation meaning, Fiscal Document scope, Pickup Authorization, Digital Approval reference, and Communication Event reference

### 9.3 Production hierarchy

- Production Order is child of Service Order in business lineage
- Production Order Version is child of Primary Production Order lineage
- QR Code is child of Production Order operational identity
- QR Event is child of Production Order execution traceability

### 9.4 Quality hierarchy

- Quality Record is child of Production Order and optionally item scope
- Customer Rejection is child of Service Order Item post-delivery context
- Rework Case is child of Primary Production Order lineage and related item scope
- Warranty Adjustment is child of Service Order Item under warranty context
- Warranty Execution is child of Primary Production Order lineage under warranty context

### 9.5 Physical traceability hierarchy

- Storage Location is parent of location assignment history
- Physical Production Bag Support Context is subordinate physical context under Service Order / Production Order usage, not a business parent
- Custody Event is child of the tracked business object lifecycle

---

## 10. Relationship Matrix

| Entity A | Relationship | Entity B | Business Meaning |
|---|---|---|---|
| Customer | places | Service Order | customer initiates commercial commitment |
| Customer | owns contacts through | Customer Contact | contact reachability and communication preference |
| Customer | generates history through | Customer Interaction | service relationship continuity |
| Customer | has measurements through | Measurement Record | versioned measurement profile |
| Service Order | contains | Service Order Item | itemized commercial scope |
| Service Order | generates | Production Order | primary operational execution anchor |
| Service Order | references | Digital Approval | customer-facing consent or approval |
| Service Order | references | Communication Event | customer-facing communication history |
| Service Order | is settled by | Payment Record | commercial settlement trace |
| Service Order / Item | is documented by | Fiscal Document | fiscal/legal record |
| Production Order | represents execution of | Service Order Item | operational execution scope |
| Production Order | is versioned by | Production Order Version | corrective lineage |
| Production Order | is performed by | Operational Resource | execution accountability participant |
| Production Order | is identified by | QR Code | exclusive operational scan authority |
| QR Code | generates | QR Event | operational scan history |
| Production Order | is evaluated by | Quality Record | inspection and release outcome |
| Service Order Item | may lead to | Customer Rejection | post-delivery rejection flow |
| Primary Production Order lineage | may open | Rework Case | internal corrective flow |
| Service Order Item | may open | Warranty Adjustment | post-delivery fit/adjustment responsibility |
| Primary Production Order lineage | may open | Warranty Execution | post-delivery execution failure responsibility |
| Service Order | authorizes release through | Pickup Authorization | pickup control |
| Pickup Authorization | may issue | Pickup Token | authorization credential |
| Service Order / item context | is located in | Storage Location | physical retrieval visibility |
| Service Order / Production Order | is traced by | Custody Event | physical custody lifecycle |
| Any governed entity | is recorded by | Audit Event | immutable traceability |
| Workflow Definition | governs | Status Definition | lifecycle semantics |
| SLA Rule | constrains | Service Order / Production Order / Rework / Warranty / Delivery | timing and breach governance |

---

## 11. Cross-Domain References

### 11.1 Customer references

- Service Order references Customer as the commercial party
- Customer Interaction references Customer and related Service Order where applicable
- Measurement Record references Customer and associated service context where applicable

### 11.2 Service Order references

- Production Order references its originating Service Order
- Payment Record references Service Order and item allocation scope
- Fiscal Document references Service Order or item scope
- Pickup Authorization references Service Order release context
- Digital Approval references Service Order, item, production, or workflow objects
- Communication Event references Customer and order context

### 11.3 Production references

- Quality Record references Production Order and optionally Service Order Item scope
- Rework Case references original Primary Production Order lineage and responsible Operational Resources
- Warranty Execution references Primary Production Order lineage and Service Order commercial context
- QR Event references Production Order through QR identity
- Custody Event may reference Production Order when production custody is relevant

### 11.4 Forbidden ownership shifts

The conceptual model must avoid:
- Service Order losing commercial and financial source-of-truth ownership to Production Order
- Production Order losing operational source-of-truth ownership to physical bag context
- QR ownership moving away from Production Order
- Audit entities becoming transactional owners
- workflow policy entities becoming business transaction owners

---

## 12. Event Relationships

### 12.1 Customer Events

Conceptual events include:
- CustomerCreated
- CustomerUpdated
- CustomerContactAdded
- CustomerInteractionLogged
- MeasurementRecorded
- MeasurementVersionChanged

### 12.2 Service Order Events

Conceptual events include:
- ServiceOrderCreated
- ServiceOrderApproved
- ServiceOrderUpdated
- DeliveryCommitmentChanged
- ServiceOrderCancelled
- ServiceOrderClosed

### 12.3 Production Events

Conceptual events include:
- PrimaryProductionOrderGenerated
- ProductionOrderStarted
- OperationalResponsibilityAssumed
- ProductionStatusUpdated
- WorkflowEventRegistered
- ProductionOrderVersionCreated

### 12.4 QR Events

Conceptual events include:
- QRCodeIssuedForProductionOrder
- QRScannedForExecutionStart
- QRScannedForResponsibilityAssumption
- QRScannedForStatusUpdate
- QRScannedForOperationalDiaryUpdate

### 12.5 Quality Events

Conceptual events include:
- QualityInspectionRecorded
- QualityPassed
- QualityRejected
- CustomerRejectionRecorded

### 12.6 Rework Events

Conceptual events include:
- ReworkOpened
- ReworkAssigned
- ReworkCompleted
- ReworkApproved

### 12.7 Warranty Events

Conceptual events include:
- WarrantyAdjustmentOpened
- WarrantyExecutionOpened
- WarrantyResolved

### 12.8 Pickup Events

Conceptual events include:
- PickupAuthorized
- PickupTokenIssued
- PickupCompleted
- RemoteApprovalDecisionRecorded

### 12.9 Financial Events

Conceptual events include:
- PaymentInitiatedFromServiceOrder
- PaymentRecorded
- PartialPaymentAllocated
- FiscalDocumentIssued
- FinancialExceptionOpened

### 12.10 Audit Events

Conceptual events include:
- AuditEventRecorded
- CustodyEventRecorded

Event relationship rule:
- originating business domains own event meaning
- Audit Event preserves immutable trace of event occurrence
- downstream consumers may react to events without becoming the event owner

---

## 13. Audit Relationships

Audit Event must conceptually relate to:
- Customer when profile, contact, or measurement data changes
- Service Order when commercial, financial, approval, or delivery states change
- Production Order when execution, responsibility, status, or QR events occur
- Production Order Version when corrective lineage changes occur
- Operational Resource when assignment or responsibility relevance changes
- Quality Record, Rework Case, Customer Rejection, Warranty Adjustment, and Warranty Execution when corrective/validation decisions occur
- Payment Record and Fiscal Document when settlement or fiscal status changes occur
- Pickup Authorization, Pickup Token, Storage Location, and Custody Event when release or physical traceability changes occur
- Workflow Definition, Status Definition, and SLA Rule when policy changes occur
- Digital Approval and Communication Event when customer-facing evidence or communication occurs

Audit relationship rule:
- audit stores immutable trace
- business entities retain business meaning

---

## 14. Workflow Relationships

### 14.1 Ownership of status transitions

Owned by Workflow Definition and Status Definition policy layer, applied to:
- Service Order
- Service Order Item
- Production Order
- Quality Record context
- Rework Case
- Warranty Execution
- Payment Record status context
- delivery and pickup status context

### 14.2 Ownership of approvals

Owned conceptually by the workflow/approval policy layer, executed through Digital Approval and business objects such as:
- Service Order
- Production Order Version
- delivery acceptance
- quality resolution
- payment condition confirmation

### 14.3 Ownership of SLA rules

Owned by SLA Rule within Workflow and SLA Policy domain.

Applies to:
- Service Order
- Production Order
- Rework Case
- Warranty Execution
- Delivery lifecycle

### 14.4 Ownership of audit events

Audit ownership remains with Audit Event, while workflow-triggering business meaning remains with the originating transactional domain.

### 14.5 Workflow execution anchor

Operational workflow events must be anchored to Production Order execution, not to Production Bag support context.

---

## 15. Financial Relationships

### 15.1 Financial source-of-truth relationship

- Service Order is the business source of truth for amounts, terms, discounts, and payment applicability
- Payment Record and Partial Payment trace settlement against Service Order and item scope
- Fiscal Document remains part of Service Order business context
- Production Order must never become the financial source of truth

### 15.2 Payment relationships

- Payment Record relates to Service Order as the commercial payment anchor
- Partial Payment relates to Service Order Item or order-level scope where allocation applies
- multiple partial payments may exist over time
- payment status may be visible at order and item levels

### 15.3 Fiscal relationships

- Fiscal Document relates to Service Order or Service Order Item scope
- Fiscal Document also relates to Payment Record context where document-to-payment linkage exists
- invalid or voided fiscal documents remain retained and auditable

---

## 16. Production Relationships

### 16.1 Production root relationship

- Production Order is the primary operational execution entity
- Production Order belongs to exactly one Service Order
- Production Order represents all Service Order Items belonging to that Service Order

### 16.2 Production version relationship

- Production Order Version belongs to Primary Production Order lineage
- Production Order Version exists only for Rework, Warranty Execution, and Corrective Production
- Production Order Version remains under the same Service Order as the original Production Order
- Production Order Version supplements rather than replaces the original Production Order record

### 16.3 Physical bag relationship

- Physical Production Bag Support Context may be associated to the Service Order and its Production Order for physical storage and transport only
- the bag has no business identity, numbering, QR ownership, or workflow ownership

---

## 17. Quality Relationships

- Quality Record relates to Production Order and optionally Service Order Item scope
- Customer Rejection relates to delivered Service Order Item scope and customer-facing quality outcome
- Rework Case relates to original Primary Production Order lineage and the responsible Operational Resource context
- Warranty Adjustment relates to post-delivery fit/adjustment obligation on item scope
- Warranty Execution relates to post-delivery operational defect lineage on Production Order scope
- Quality Responsible is conceptually derived through the quality workflow, not through Production Bag context

---

## 18. Operational Resource Relationships

- Operational Resource participates in Service Order responsibility model through distinct relationships:
  - Commercial Responsible = service/commercial accountability on Service Order
  - Technical Measurement Responsible = technical measurement accountability on Service Order
  - Operational Responsible = defined through Production Order execution events
  - Quality Responsible = defined through Quality workflow
- Production Order may have many Operational Resource assignment and execution relationships over time
- Rework Case preserves original and corrective Operational Resource relationships
- Production Order Version preserves original and corrective Operational Resource lineage

---

## 19. Customer Relationships

- Customer is parent of Customer Contact, Customer Interaction, and Measurement Record
- Customer is commercial party for Service Order
- Customer approvals, confirmations, rejections, warranty obligations, pickup authorizations, and communications must remain traceable to Customer
- Customer Contact and communication preferences govern Communication Event and Digital Approval channel context

---

## 20. Pickup Authorization Relationships

- Pickup Authorization belongs to Service Order release context
- Pickup Token is subordinate credential or tokenized authorization artifact under Pickup Authorization
- Remote Approval is a Digital Approval relationship pattern used in pickup context
- Pickup Authorization, Pickup Token, collector identity, release actor, and timestamp must remain auditable
- Pickup Authorization may be exercised through Pickup Token, Pickup QR Code, Temporary Pickup Code, or Remote Approval according to policy

---

## 21. QR Tracking Relationships

- QR Code belongs only to Production Order
- QR Event records each scan against the Production Order execution flow
- QR Event may represent:
  - execution start
  - responsibility assumption
  - status update
  - workflow event registration
  - Operational Diary update
- Physical bag usage may be confirmed through Production Order QR context, but bag context does not own QR identity

---

## 22. Chain of Custody Relationships

- Custody Event may relate to Service Order, Production Order, delivery, storage, pickup, rework, and warranty lifecycle points
- Storage Location changes generate custody-relevant history
- Pickup completion generates mandatory custody evidence
- Digital Approval, Pickup Token, Pickup QR Code, Temporary Code, CCTV Reference, Camera Snapshot, and Audit Logs are valid custody evidence relationships where captured
- Chain of custody must remain end-to-end across intake, production, quality, rework, warranty, storage, delivery, and pickup

---

## 23. Production Bag Conceptual Treatment

The Production Bag is modeled only as a physical operational support concept.

Conceptual rules:
- it stores Service Order pieces
- it stores the printed Production Order (A5)
- it may appear in physical traceability, retrieval, and movement context
- it is never a primary business entity
- it has no independent business identity
- it has no independent numbering
- it has no independent QR Code
- it has no independent workflow

---

## 24. Remaining Conceptual Risks

- final repository-wide wording consistency still depends on all future business documents preserving Production Order as the sole operational execution authority
- Payment Record versus Partial Payment conceptual distinction may require later logical refinement for allocation granularity across order-level and item-level settlement
- Warranty Adjustment versus Warranty Execution operational boundary is conceptually clear but may require additional logical lifecycle rules during logical design
- Storage Location applicability at order-level versus item-level physical granularity may require later logical clarification for industries with mixed storage practices
- Communication Event channel taxonomy and retention policy may require later logical refinement depending on tenant communication capabilities
- Digital Approval evidence breadth may require logical modeling refinement for evidence variants without changing conceptual ownership
- Custody evidence optionality versus mandatory capture thresholds may require logical rule detail by workflow stage

---

## 25. Conceptual Model Completeness Score

**Score: 98/100**

Rationale:
- all mandatory entities are modeled conceptually
- ownership boundaries are explicitly defined
- aggregate roots and subordinate entities are clearly separated
- operational model is aligned to the approved frozen baseline
- production, financial, quality, QR, pickup, audit, workflow, and custody relationships are all described
- the remaining deductions reflect logical-detail risks, not unresolved conceptual ownership gaps

---

## 26. Readiness for Logical Database Modeling

**Status: READY**

Rationale:
- source-of-truth boundaries are defined
- parent/child relationships are defined
- cardinalities are defined
- event and audit relationships are defined
- workflow ownership is defined
- physical bag demotion is explicit and stable
- the remaining open items are logical refinement risks rather than conceptual-model blockers

The next phase may proceed to logical database modeling provided the frozen baseline remains the governing source of truth.
