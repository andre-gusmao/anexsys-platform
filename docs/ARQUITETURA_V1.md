# ANEXSYS Platform
# Business Architecture Specification
# Version: V1

## 1. Document status

This document is the business architecture view of the ANEXSYS platform and is derived exclusively from `docs/SRS_MASTER_V1.3.md`.

This document intentionally excludes:
- database design
- ER diagrams
- table schemas
- API definitions
- implementation details
- infrastructure topology
- deployment architecture
- runtime technology choices

The objective is to define the business structure, responsibilities, flows, and governance boundaries required before any technical or data architecture work begins.

---

## 2. Architectural scope and purpose

The ANEXSYS business architecture must support a multi-tenant SaaS platform for operational excellence across service execution, production, quality, customer service, finance, attendance, and operational governance.

The architecture must support:
- tenant separation and branch governance
- commercial and operational document separation
- customer-centric service management
- production execution control
- quality, rework, and warranty management
- financial control and fiscal traceability
- operational resource accountability
- QR-based traceability and custody control
- digital approvals and customer communication
- auditability, privacy, and compliance

---

## 3. Domain boundaries

### 3.1 Commercial and customer domain

Responsibilities:
- customer master data and segmentation
- sales and opportunity tracking
- customer interaction log
- customer approvals and consent
- VIP, priority, and communication preferences
- customer service follow-up
- measurement records and customer history

Primary business objects:
- Customer
- Customer Contact
- Customer Interaction
- Measurement Record
- Customer Segment
- Opportunity

Boundary:
- this domain owns customer relationship and commercial context
- it does not own operational execution details that belong to production or quality

### 3.2 Service Order domain

Responsibilities:
- commercial commitment to the customer
- order capture and validation
- order value, discounts, payment terms, and balances
- delivery commitment
- fiscal references and customer-facing documentation
- customer approvals and communications
- item-level financial allocation
- expected and actual cash flow context

Primary business objects:
- Service Order
- Service Order Item
- Financial Adjustment
- Payment Allocation
- Delivery Commitment
- Fiscal Document Reference

Boundary:
- this domain owns customer-facing commercial intent and financial accountability
- it is the source of truth for financial and customer-facing commitments

### 3.3 Production domain

Responsibilities:
- operational execution from Service Order inputs
- piece-level work planning and execution
- production bag governance
- production priority and delivery visibility
- operational instructions and observations
- quantity tracking and versioning
- visual delivery-date management

Primary business objects:
- Production Order
- Production Order Version
- Production Bag
- Work Instruction
- Production Status
- Delivery Target

Boundary:
- this domain owns execution and operational control
- it must not display price, margin, profit, payment, or financial information to operational users

### 3.4 Quality, rework, and warranty domain

Responsibilities:
- inspection checkpoints
- quality approval or rejection
- customer rejection handling
- rework execution and comparison to original failure
- warranty repair handling
- warranty adjustment and warranty execution tracking
- quality performance indicators

Primary business objects:
- Quality Record
- Rework Case
- Warranty Case
- Warranty Adjustment
- Warranty Execution
- Defect Record

Boundary:
- quality decisions are operationally critical but must be auditable
- rework and warranty are distinct domains and must not be merged in reporting or status flow

### 3.5 Financial and fiscal domain

Responsibilities:
- payment tracking
- partial payment handling
- item-level settlement
- expected cash flow
- actual cash flow
- fiscal document references and legal compliance
- overdue and collection monitoring

Primary business objects:
- Payment Record
- Settlement Record
- Cash Flow Forecast
- Cash Flow Actual
- Fiscal Document
- Collection Event

Boundary:
- this domain is commercial in nature
- it is not equivalent to production execution and must remain distinct from operational production records

### 3.6 QR, custody, and traceability domain

Responsibilities:
- QR Code identification and traceability
- operational scan events
- custody tracking across intake, production, quality, storage, delivery, and pickup
- evidence retention for customer pickup and operational security
- chain-of-custody audit trail

Primary business objects:
- QR Code
- Scan Event
- Custody Event
- Evidence Record
- Pickup Event

Boundary:
- this domain provides traceability and evidence, not primary business value creation
- it must rely on service, production, quality, and financial domains for business meaning

### 3.7 Operational Resource and attendance domain

Responsibilities:
- operational resource registration
- skills, certifications, and availability
- assignment and reassignment
- productivity, quality, and rework indicators
- attendance tracking and daily worker management
- capacity planning and scheduling

Primary business objects:
- Operational Resource
- Skill
- Certification
- Assignment
- Attendance Record
- Daily Worker
- Productivity Metric

Boundary:
- this domain owns execution capability and workforce accountability
- it is not the customer-facing or financial domain

### 3.8 Inventory and purchasing domain (optional)

Responsibilities:
- inventory management if enabled
- purchase requisitions and orders if enabled
- supplier management
- material movement and stock control

Primary business objects:
- Inventory Item
- Stock Movement
- Purchase Requisition
- Purchase Order
- Supplier

Boundary:
- optional module, activated by tenant configuration
- it supports production and operations but is not mandatory to the core operating model

### 3.9 Workflow, configuration, and status domain

Responsibilities:
- tenant-specific workflow configuration
- status transitions by domain
- delivery type and operational priority rules
- approval gates
- SLA logic
- alerting and escalation

Primary business objects:
- Workflow Definition
- Status Definition
- Status Transition
- Approval Rule
- SLA Rule
- Priority Rule

Boundary:
- this domain defines the operating logic but does not replace the business domain ownership of records

### 3.10 Security, audit, and compliance domain

Responsibilities:
- tenant segregation
- user access control
- role and permission management
- audit log retention
- LGPD controls
- data minimization and retention policy
- support and investigation controls
- privacy and subject-rights tracing

Primary business objects:
- User
- Role
- Permission
- Audit Log
- Privacy Record
- Access Event

Boundary:
- this domain cross-cuts all domains and must enforce policy consistently

### 3.11 Communication and customer service domain

Responsibilities:
- WhatsApp integration
- email and SMS notifications
- customer reminders
- order updates and pickup notifications
- digital approvals and consent tracking
- Smart Concierge routing support

Primary business objects:
- Communication Event
- Message Template
- Notification Rule
- Approval Request

Boundary:
- this domain is a business interaction layer, not a replacement for the commercial or operational domains

### 3.12 Physical access, pickup, and location domain

Responsibilities:
- pickup queues and recognized customer retrieval flow
- location hierarchy and storage visibility
- third-party pickup authorization
- pickup evidence and camera references
- controlled retrieval and handover

Primary business objects:
- Pickup Queue
- Pickup Authorization
- Storage Location
- Handover Event
- Camera Evidence

Boundary:
- this domain is necessary for customer collection and operational accountability
- it must remain connected to Service Order and customer state

---

## 4. Context map

The following context map describes business interactions among the main domains.

### 4.1 Core interaction model

Customer domain interacts with:
- Service Order domain for order creation and service commitment
- Communication domain for notifications and approvals
- Security domain for customer consent and privacy rules

Service Order domain interacts with:
- Customer domain for customer identity and commitments
- Production domain for operational execution planning
- Financial domain for payment, settlement, and forecast
- Fiscal domain for document references and compliance
- Workflow domain for status logic and approval gates
- Audit domain for change traceability

Production domain interacts with:
- Service Order domain for source commitments
- Operational Resource domain for staffing and productivity
- Quality domain for in-process and final inspection
- QR/Custody domain for traceability and evidence
- Workflow domain for status transitions
- Location domain for physical movement and storage

Quality domain interacts with:
- Production domain for defect and completion validation
- Rework/Warranty domain for correction and service recovery
- Customer domain for rejection and complaint handling
- Audit domain for quality decisions

Financial domain interacts with:
- Service Order domain for values and balances
- Customer domain for collections and customer status
- Fiscal domain for legal documentation
- Audit domain for payment traceability

Operational Resource domain interacts with:
- Production domain for work assignment
- Attendance domain for presence and labor records
- Quality domain for inspection and rework responsibilities
- Performance dashboard domain for productivity ranking
- Security domain for access and role enforcement

Workflow domain interacts with:
- all operating domains
- it governs transitions, approval gates, SLA logic, and alerts

Security and audit domains cross-cut all domains.

### 4.2 Domain relationship summary

- Customer → Service Order → Production Order → Quality/Rework/Warranty → Delivery/Pickup
- Customer → Service Order → Financial/Fiscal
- Production → Operational Resource → Productivity/Attendance
- Workflow → all operational objects
- Security/Audit → all records and decisions
- QR/Custody → chain of evidence across operational flow

---

## 5. Module decomposition

### 5.1 Customer and CRM module

Purpose:
- manage customer master data
- maintain customer interactions and approvals
- support customer segmentation and prioritization
- hold measurement and service history

Key responsibilities:
- customer onboarding
- customer classification
- VIP and priority management
- communication preferences
- interaction tracking
- measurement versioning

### 5.2 Service Order management module

Purpose:
- manage commercial and customer-facing commitments
- coordinate item values, payments, and delivery expectations
- maintain fiscal references and customer approval history

Key responsibilities:
- service order creation and validation
- item and valuation management
- partial delivery and partial payment handling
- collection expectations
- customer communication and approval history

### 5.3 Production management module

Purpose:
- convert service commitments into executable production work
- manage work instructions, quantities, priority, and timing
- maintain visual delivery management and production deadlines

Key responsibilities:
- Production Order creation
- Production Order versioning
- Production Bag governance
- priority and date planning
- status progression and work release

### 5.4 Quality and rework management module

Purpose:
- enforce inspection and approval rules
- manage rework and warranty recovery flows

Key responsibilities:
- quality checkpoints
- defect logging
- rejection handling
- rework and warranty case creation
- closure and approval conditions

### 5.5 Financial and fiscal module

Purpose:
- maintain commercial financial accountability
- support cash-flow planning and reconciliation
- track payment records and fiscal references

Key responsibilities:
- expected cash flow
- actual collections
- payment allocation by item
- partial payment handling
- fiscal document references and legal traceability

### 5.6 Operational Resource management module

Purpose:
- manage workforce and operational capacity
- allocate resource to work
- track productivity and quality performance

Key responsibilities:
- resource registration and skill matrix
- assignment and reassignment
- attendance management
- daily worker handling
- performance dashboards and rankings

### 5.7 QR and custody module

Purpose:
- provide operational traceability and evidence
- support chain-of-custody and pickup control

Key responsibilities:
- QR scanning and event logging
- bag and object identity tracking
- custody progression
- evidence capture and retention

### 5.8 Workflow and status governance module

Purpose:
- unify operational decision rules across business domains

Key responsibilities:
- status rules and transitions
- approval gates
- delivery type and priority rules
- SLA configuration
- alerts and escalations

### 5.9 Security, audit, and compliance module

Purpose:
- enforce data segregation, least privilege, and auditability
- support privacy and legal obligations

Key responsibilities:
- RBAC and authorization
- tenant and branch isolation
- audit log retention
- privacy controls and retention
- support investigation capability

### 5.10 Communication and pickup orchestration module

Purpose:
- coordinate customer communication and operational handover events

Key responsibilities:
- WhatsApp and notifications
- direct Service Order retrieval and queue visibility
- pickup authorization and release
- customer verification and evidence

---

## 6. Logical architecture

The business architecture is organized in four logical layers.

### 6.1 Business interaction layer

This layer governs customer-facing and operational interaction.

It contains:
- CRM
- Service Order lifecycle
- customer pickup and retrieval
- communication and approvals
- customer service

### 6.2 Execution layer

This layer governs operational conversion of intent into production execution.

It contains:
- Production Order management
- Production Bag governance
- operational scheduling
- resource assignment
- quality and rework execution
- warranty repair execution

### 6.3 Financial and compliance layer

This layer governs commercial and legal accountability.

It contains:
- financial values and payments
- expected/actual cash flow
- fiscal references
- audit and compliance policy
- privacy and retention rules

### 6.4 Governance and control layer

This layer governs cross-cutting enterprise policy.

It contains:
- workflow rules and status logic
- SLA logic
- authorities and approvals
- security policies
- tenant and branch governance
- traceability and evidence retention

### 6.5 Architectural intent

The architecture must preserve the separation between:
- commercial intent
- operational execution
- evidence and traceability
- financial accountability
- governance and control

This separation is a core architectural principle and must remain visible in all domain definitions.

---

## 7. Core entities catalog

The following catalog is conceptual and intentionally avoids database design.

### 7.1 Tenant and governance entities
- Tenant
- Branch
- Department
- User
- Role
- Permission
- Workflow Definition
- Status Definition
- SLA Rule

### 7.2 Customer and commercial entities
- Customer
- Customer Contact
- Customer Segment
- Customer Interaction
- Measurement Record
- Opportunity
- Customer Approval

### 7.3 Service Order entities
- Service Order
- Service Order Item
- Financial Adjustment
- Payment Allocation
- Delivery Commitment
- Tax/Fiscal Reference
- Customer Communication Record

### 7.4 Production entities
- Production Order
- Production Order Version
- Production Bag
- Work Instruction
- Delivery Target
- Production Status
- Visual Delivery Date
- Safety Window

### 7.5 Quality, rework, and warranty entities
- Quality Record
- Quality Checkpoint
- Customer Rejection
- Rework Case
- Warranty Case
- Warranty Adjustment
- Warranty Execution
- Defect Record

### 7.6 Financial entities
- Payment Record
- Partial Payment
- Cash Flow Forecast
- Cash Flow Actual
- Fiscal Document
- Settlement Record
- Collection Event

### 7.7 Operational Resource entities
- Operational Resource
- Skill
- Certification
- Assignment
- Daily Worker
- Attendance Record
- Productivity Metric
- Ranking View

### 7.8 Traceability and evidence entities
- QR Code
- Scan Event
- Custody Event
- Evidence Record
- Pickup Event
- Camera Reference
- Storage Location
- Pickup Authorization

### 7.9 Communication and approval entities
- Message Template
- Notification Rule
- Digital Approval
- Customer Consent Record
- Pickup Token
- Remote Approval

### 7.10 Optional module entities
- Inventory Item
- Stock Movement
- Supplier
- Purchase Requisition
- Purchase Order

---

## 8. Relationship matrix

The matrix below describes the business relationships without implying database structure.

| Domain / Entity | Related domain / entity | Relationship |
|---|---|---|
| Tenant | Branch | one tenant owns many branches |
| Tenant | User | one tenant manages many users |
| Tenant | Workflow Definition | one tenant configures many workflows |
| Customer | Service Order | one customer may have many service orders |
| Service Order | Service Order Item | one service order owns many items |
| Service Order | Production Order | one service order may generate many production orders |
| Service Order | Payment Record | one service order may have many payments |
| Service Order | Fiscal Document | one service order may have many fiscal references |
| Service Order | Production Bag | one service order may be associated with one governed bag |
| Production Order | Production Order Version | one production order has many versions |
| Production Order | Quality Record | one production order may have many quality results |
| Production Order | Rework Case | one production order may trigger many rework cases |
| Production Order | Warranty Case | one production order may relate to many warranty events |
| Production Order | QR Code | one production order has one or more QR references |
| Production Bag | Operational Resource | one production bag has one primary responsible resource |
| Production Bag | Storage Location | one production bag may have a current physical location |
| Operational Resource | Assignment | one resource has many assignments |
| Operational Resource | Productivity Metric | one resource may have many productivity measures |
| Operational Resource | Attendance Record | one resource may have many attendance records |
| Customer | Measurement Record | one customer may have many measurements |
| Customer | Pickup Authorization | one customer may authorize many third-party collections |
| Customer | Communication Event | one customer may have many communication events |
| Quality Record | Rework Case | quality findings may trigger rework |
| Rework Case | Warranty Case | some events may become warranty cases |
| Service Order Item | Delivery Commitment | one item may have many deliveries |
| Service Order Item | Payment Allocation | one item may have many payment allocations |
| Service Order | Pickup Event | one service order may have many pickup events |
| Production Bag | Custody Event | one bag may have many custody events |
| QR Code | Scan Event | one QR reference may have many scan events |
| Audit Log | All domains | all domains contribute to the audit trail |
| Security Policy | All domains | all domains must honor tenant, branch, and role restrictions |

---

## 9. Security model

### 9.1 Security principles

The business security model must enforce:
- tenant isolation
- branch-level segregation where required
- least-privilege authorization
- role-based access control
- separation of duties for sensitive decisions
- auditability of all critical actions
- privacy by design
- data minimization
- explicit consent and communication preferences

### 9.2 Authorization domains

Security obligations vary by domain:
- Customer and commercial data may be restricted to commercial roles
- Financial records may be restricted to finance and authorized management roles
- Production data may be restricted to operational roles and supervisors
- Quality and rework decisions require controlled approvals
- Warranty records require customer and service privacy controls
- Attendance and operational resource data require strict role separation
- QR and custody evidence require restricted operational access

### 9.3 Risk-based control model

The platform must distinguish:
- public or shared operational data
- customer-specific data
- payment and fiscal data
- attendance and labor data
- sensitive personal data
- evidence and security logs

Access to sensitive records must be monitored and auditable.

### 9.4 Privacy and LGPD model

The business model must support:
- consent management
- retention policies
- access traceability
- purpose limitation
- subject-rights management
- secure handling of measurement, attendance, and customer-contact data
- data minimization across customer, production, and finance domains

---

## 10. Tenant model

The platform is designed for a multi-tenant SaaS operating model.

Each tenant has:
- isolated business data
- isolated configuration
- isolated workflow definitions
- independent branch structures
- independent users and permissions
- independent document numbering rules
- independent status behavior
- independent operational terminology and templates

Tenant governance must ensure:
- one tenant cannot access another tenant’s records
- configuration is not shared across tenants unless explicitly designed
- branch structure and data partitioning remain tenant-specific
- reporting and dashboards are tenant-scoped

---

## 11. Branch model

The branch model supports multi-branch operations within a tenant.

Branches may represent:
- head office
- retail units
- operational centers
- production units
- service points
- regional or local operating entities

Branch responsibilities include:
- local operational control
- local quality governance
- local attendance and labor management
- local resource allocation
- local inventory if enabled
- local service and delivery execution

Branch hierarchy must support:
- tenant-level oversight
- branch-level operation
- department or sub-branch specialization
- cross-branch transfer of work or resources
- branch-wise reporting and cost visibility

---

## 12. Workflow model

The workflow model is domain-driven and configurable by tenant.

### 12.1 Core workflow principles

- each business domain owns its workflow states
- workflows must be configurable without rewriting the core platform
- transitions must be auditable
- approvals may be required at specific stages
- SLA logic must be connected to relevant workflow steps
- priority and delivery type may affect planning and alerting
- workflow events must feed dashboards and operational views

### 12.2 Base workflow domains

- Customer and sales flow
- Service Order flow
- Production flow
- Quality flow
- Rework flow
- Warranty flow
- Delivery and pickup flow
- Payment and settlement flow
- Inventory and purchasing flow (optional)

### 12.3 Workflow rules

Each workflow domain must support:
- allowed next states
- approval gates
- user and role restrictions
- operational alerts
- SLA timers
- event-driven notifications
- status history and traceability

### 12.4 Delivery type and priority model

The document establishes baseline delivery types:
- Normal
- Priority
- Express

Operational priority must be configurable and may apply across:
- service orders
- items
- production orders
- production bags
- workflow steps
- tasks

The priority model influences:
- scheduling
- alerting
- SLA treatment
- dashboard indicators
- operational decision support

---

## 13. Event model

The business architecture must support a broad event fabric across the lifecycle of work.

### 13.1 Event categories

- customer events
- order events
- production events
- quality events
- rework events
- warranty events
- payment events
- custody events
- pickup events
- approval events
- communication events
- audit events
- location events

### 13.2 Event requirements

Every important event must carry:
- event type
- date and time
- tenant and branch context
- object reference
- actor or user context
- related object or resource context
- prior status and resulting status
- reason or justification when required
- evidence reference when applicable

### 13.3 Event usage

Events support:
- operational dashboards
- performance metrics
- audit trails
- workflow progression
- exception monitoring
- customer communication sequencing
- service-line accountability

---

## 14. Financial domains

### 14.1 Financial domain purpose

The financial domain owns commercial value, payment accountability, forecast, collections, and fiscal references.

### 14.2 Core financial responsibilities

- value capture at Service Order and Service Order Item level
- payment terms and partial payment control
- expected cash flow planning
- actual receipt tracking
- discrepancy analysis between expected and actual inflows
- overdue and missed collection monitoring
- fiscal and document references

### 14.3 Financial object boundaries

The following objects remain financial in nature:
- Service Order value
- item-unit and item-total value
- payment allocations
- settlement and closure records
- collections and due dates
- fiscal document references

Production execution records must not be used as the source of value disclosure, because the platform explicitly separates operational execution from financial visibility.

---

## 15. Production domains

### 15.1 Production domain purpose

The production domain owns the transformation of service commitments into operational work.

### 15.2 Core production responsibilities

- create Production Orders from Service Orders
- manage work instructions and observations
- handle item and piece-level execution
- calculate production deadlines and safety windows
- assign Operational Resources and teams
- maintain version history
- track production status, rework, and quality closure
- support visual management of delivery dates

### 15.3 Production-specific objects

- Production Order
- Production Order Version
- Production Bag
- Work Instruction
- Production Status
- Safety Window
- Visual Delivery Date

### 15.4 Production boundaries

The production domain must not serve as the financial authoring system. It must be bounded by operational execution only.

---

## 16. Operational Resource domains

### 16.1 Purpose

The Operational Resource domain is responsible for operational capability, assignment, attendance, productivity, and accountability.

### 16.2 Core responsibilities

- resource registration and historical tracking
- assignment to service or production work
- skill and certification management
- workload balancing
- productivity measurement
- attendance and daily worker support
- quality and rework accountability
- ranking and decision support

### 16.3 Operational accountability model

The architecture must maintain attribution between:
- original responsible resource
- current responsible resource
- corrective resource
- rework origin and rework completion history

This accountability must remain distinct from commercial and financial ownership.

### 16.4 Productivity model

The business architecture recognizes that the primary productivity metric is Pieces Produced.

The domain must support:
- piece-based productivity evaluation
- quality indicators
- rework indicators
- warranty indicators
- branch and team comparison
- operational ranking without exposing commercial data

---

## 17. Architectural principles

The business architecture must be guided by the following principles:

1. Customer-facing and operational-facing records must remain intentionally separated.
2. Production execution must not leak financial information.
3. One customer, one primary bag, one primary resource is the governing production-bag principle.
4. Every critical business event must be auditable.
5. Operational accountability must survive transfers, reassignments, and rework cases.
6. Privacy and legal compliance must be enforced as a first-class enterprise domain.
7. Delivery type and operational priority must affect planning and alerts without bypassing governance controls.
8. QR traces and custody records must support operational evidence, not replace business ownership.
9. Optional modules must not distort the core domain model unless enabled by tenant configuration.
10. The architecture must remain configurable across industries and operational formats.

---

## 18. Constraints and assumptions

### 18.1 Functional constraints

- SaaS multi-tenant model is mandatory.
- Branch structure is mandatory within each tenant.
- Financial and operational data must be separated by business intent.
- Production governance is mandatory.
- Quality and rework require explicit traceability.
- The platform must support multi-industry configuration.

### 18.2 Business assumptions

- Not all tenants require inventory or purchasing modules.
- Some customers may require special handling for pickup, storage, and third-party authorization.
- Customer-facing and operational workflow may overlap but must remain distinct in formal ownership.
- A tenant may operate multiple branches with local resource allocation.

---

## 19. Architectural summary

ANEXSYS is architected as a business platform with clear domain separation across customer, service, production, quality, financial, resource, traceability, and governance domains.

The core architectural design principle is:
- commercial intent belongs to the Service Order domain
- operational execution belongs to the Production domain
- evidence and traceability belong to the QR and custody domain
- workforce accountability belongs to the Operational Resource domain
- legal and policy enforcement belongs to the security and audit domain

This separation supports operational discipline, financial integrity, customer trust, and enterprise governance.

---

## 20. Open business architecture decisions before technical design

The following business decisions are still required before database design or implementation work:

1. whether one Service Order may contain multiple Production Bags, or whether one governed bag is a strict rule
2. whether a Production Order may span multiple service-order items or must be constrained to a single item
3. exact treatment of bag split/merge and historical ownership transitions
4. exact SLA event and pause logic by workflow type
5. explicit definition of financial exception approval flows
6. exact evidence retention model for QR, pickup, and camera events
7. exact approval hierarchy for quality closure, warranty closure, and customer rejection
8. governance of item-level partial completion and partial collection

These items are not implementation concerns; they are unresolved business architecture decisions that must be clarified before technical design.

---

## 21. Source-of-truth alignment

This architecture document is aligned to the following business architecture principles expressed in `SRS_MASTER_V1.3.md`:
- Service Order and Production Order are distinct documents with different purposes
- Production Orders must not expose commercial or financial information
- Production Bag governance enforces clear accountability and item isolation
- Operational Resource accountability is distinct from customer-facing commercial responsibility
- QR and custody tracking are mandatory for operational evidence and auditability
- workflow, security, and compliance are cross-cutting governance domains

This document is intentionally limited to business architecture and does not define database, API, or technical infrastructure design.


