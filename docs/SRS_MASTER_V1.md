# ANEXSYS Platform
# Enterprise Software Requirements Specification (SRS)
# Version: V1.0

## 1. Document status

This document is the authoritative functional specification for the ANEXSYS platform. It defines the business, operational, security, and integration requirements for the product and is the source of truth for all subsequent analysis, architecture, implementation, testing, and deployment work.

This document intentionally excludes:
- database entity definitions
- ER diagrams
- table schemas
- physical implementation details
- infrastructure topology
- technical design decisions

The purpose of this SRS is to define what the platform must do, not how it will be implemented.

---

## 2. Product overview

### 2.1 Product name
ANEXSYS Platform

### 2.2 Product purpose
ANEXSYS is a SaaS platform for integrated operational excellence, designed to manage service orders, production, quality, finance, customer service, attendance, and business operations across one or more branches of a company.

The platform must provide unified operational control for business units that execute customized work, production flows, quality control, customer rework, and financial tracking, with clear visibility of commitments, production status, delivery, payment collections, and cash flow.

### 2.3 Strategic product vision
ANEXSYS must become the digital operating system for companies that manage custom production and service execution with operational complexity. The platform must enable:
- standardized execution across departments
- transparent operational visibility
- control of quality and rework
- financial traceability per order and per item
- multi-branch management in a single SaaS instance
- customer-centric service tracking
- compliance, auditability, and governance

### 2.4 Business value
The platform delivers value by:
- reducing operational friction between commercial, production, quality, finance, and service areas
- improving cost control and cash-flow predictability
- increasing adherence to delivery commitments
- reducing rework and customer dissatisfaction
- enabling management by exception and KPI visibility
- supporting a scalable SaaS model for multiple clients and multiple branches

### 2.5 Scope
The SRS covers the following core business domains:
- SaaS multi-tenant environment
- multi-branch operating model
- user access and authorization
- CRM and customer management
- service order lifecycle
- production order lifecycle and versioning
- quality control and rework
- partial delivery and payment flows
- financial planning and actual cash flow
- payment terminal and fiscal document integration
- optional inventory and purchasing modules
- workflow engine and dynamic statuses
- scheduling and attendance tracking
- WhatsApp integration
- dashboards and analytics
- audit logs and security
- LGPD compliance and backup/recovery

---

## 3. SaaS operating model

### 3.1 Tenant model
ANEXSYS is implemented as a SaaS platform with a multi-tenant architecture.

Each tenant represents one legal customer or company instance of the platform. Each tenant has:
- a unique tenant identifier
- independent users
- independent business data
- independent configuration
- independent roles and permissions
- independent document numbering rules
- independent branch structure

Data isolation must be enforced for all tenant-specific records, business operations, reports, and configuration.

### 3.2 Branch model
Each tenant may manage one or more branches or operational units. A branch is an organizational unit that can have:
- employees
- customers
- service orders
- production orders
- inventory
- schedules
- attendance records
- financial movements

Business requirements:
- a user may belong to one or more branches
- roles may be branch-specific or cross-branch
- customers may be global or branch-specific
- production and service orders may be associated with a single branch or multiple relevant branches
- reports may aggregate tenant-wide or branch-local data

### 3.3 Branch hierarchy
The platform must support a branch hierarchy, including head office and operational branches, with optional sub-branches or departments. This hierarchy supports:
- centralized governance
- local operational control
- reporting by business unit
- transfer of work between branches
- cost and performance analysis by branch

### 3.4 Multi-company and group scenarios
The platform must be capable of supporting a group structure where a holding company manages multiple companies under the same SaaS instance, while preserving secure data separation.

---

## 4. Users and roles

### 4.1 User profiles
The platform must manage multiple user profiles with role-based access control.

Required user roles include, but are not limited to:
- Platform Administrator
- Tenant Administrator
- Commercial Manager
- Sales Representative
- Customer Service Agent
- Production Supervisor
- Production Operator
- Quality Analyst
- Finance Manager
- Finance Analyst
- Inventory Manager
- Purchasing Manager
- Branch Manager
- Payroll / Attendance Manager
- Auditor / Compliance Reviewer
- Support User
- External Partner / Supplier

### 4.2 User attributes
Each user must have:
- unique identity
- employee profile and branch assignments
- active/inactive status
- contact data
- work schedule
- role assignments
- permissions by module and data scope
- validation and audit history

### 4.3 Role and permission model
The platform must support:
- role-based access control (RBAC)
- permission scopes by tenant, branch, department, or functional module
- read/write restrictions by object type and status
- approval authority by workflow step
- segregation of duties where required

### 4.4 User impersonation and auditability
For support and compliance purposes, administrators must be able to investigate user actions while preserving a complete audit trail. Access to impersonation or elevated support actions must be strictly controlled and logged.

---

## 5. CRM and customer management

### 5.1 CRM domain objective
The CRM module must centralize business relationships and customer interactions across sales, service, and operational follow-up.

### 5.2 Customer master data
The platform must manage customer records with:
- customer legal name
- profile type (individual or company)
- branch relationship
- primary and secondary contacts
- phone, email, WhatsApp, and communication preferences
- customer classification
- credit limits and payment terms
- assigned sales representative
- service history
- billing and document data

### 5.3 Customer segmentation
The system must support customer segmentation by:
- commercial profile
- geographic branch
- priority level
- order volume
- payment behavior
- service level category
- business-criticality

### 5.4 Leads and opportunities (optional but recommended)
The platform should provide a sales pipeline capability with:
- leads
- opportunities
- conversion stages
- expected revenue
- associated responsible seller
- next action date

### 5.5 Customer interactions
The platform must log:
- calls
- messages
- meetings
- follow-ups
- service complaints
- approvals and customer confirmations

All interaction records must be traceable to their related customer and service order.

### 5.6 Body measurements
The platform must support recording body measurements for customers when relevant to the business model, such as apparel, tailoring, customization, manufacturing, or personal fit services.

Required measurements may include, but are not limited to:
- shoulders
- chest
- waist
- hips
- sleeve length
- inseam
- height
- weight
- garment-specific measurements
- custom notes

Business requirements:
- measurements must be versioned over time
- a customer may have multiple measurement records
- measurements must be associated with a service type or order
- measurement record changes must be auditable
- a measurement version must be attributable to a user and timestamp

---

## 6. Service orders

### 6.1 Service order objective
The service order is the primary operational transaction that represents the customer commitment, scope, delivery expectation, financial value, and production workflow.

### 6.2 Service order lifecycle
A service order must support the lifecycle from capture to completion, including:
- creation
- validation
- quoting/approval
- production planning
- execution
- quality review
- partial delivery
- final delivery
- closure
- cancellation
- dispute or rejection

### 6.3 Service order header
Each service order must contain:
- tenant and branch
- customer reference
- sales representative
- created date
- expected completion date
- delivery date(s)
- priority and urgency
- status
- payment terms
- related financial records
- related production orders
- related documents
- notes and attachments

### 6.4 Service order items
A service order may include one or many service order items.

Each item must have:
- item code or product/service identifier
- description
- quantity
- unit price
- discount and adjustments
- subtotal
- taxes and fees
- total value
- item category
- delivery expectation per item
- production requirement per item
- quality requirements per item
- payment applicability
- status or stage of execution
- related production order(s)

### 6.5 Item-level business rules
The platform must support item-level management for:
- production tracking
- financial allocation
- partial delivery
- partial payment
- rework treatment
- customer rejection and return
- item-specific quality results

### 6.6 Service order item valuation
The platform must calculate item value based on:
- unit price
- quantity
- discounts
- taxes
- freight or handling if applicable
- ad-hoc adjustments

The total service order value must reflect all relevant item values and financial adjustments.

### 6.7 Partial delivery
The platform must support partial delivery of service order items when not all items are ready to ship or complete at the same time.

Requirements:
- each delivered quantity must be traceable to a delivery event
- undelivered quantities remain open and continue to be tracked
- financial entries may be associated with each partial delivery
- partial delivery status must be reflected for both operational and financial views

### 6.8 Payment by item
The platform must support payments by item, not only by order total.

This means the system must allow:
- individual item pricing and payment allocation
- item-level received value
- partial item payment
- item-level outstanding balance
- item-level settlement and closure

### 6.9 Partial payments
The platform must support partial payments across the order lifecycle.

Requirements:
- payment may be received before, during, or after production
- each payment must be linked to one or more order items
- outstanding balance must be recalculated dynamically
- payment status must be visible at item and order levels
- partial payment records must be auditable

### 6.10 Expected cash flow
The platform must support expected cash flow forecasting based on:
- order values
- payment terms
- delivery schedule
- milestones
- agreed receipts
- expected collections by date

The system must allow expected inflow visualization by period, customer, branch, and item group.

### 6.11 Actual cash flow
The platform must track actual financial inflows versus expected inflows.

Requirements:
- actual cash/payment receipts must be linked to service orders and items
- variances between expected and actual cash flow must be measurable
- financial dashboards must distinguish expected vs actual
- delayed or missed collections must be visible to management

---

## 7. Production orders

### 7.1 Production order objective
A production order represents the execution plan for producing or completing a service order item or production group. Production orders must be linked to service order items and operational execution.

### 7.2 Production order lifecycle
A production order must support lifecycle states such as:
- created
- planned
- approved
- scheduled
- in progress
- blocked
- paused
- quality review
- ready for delivery
- completed
- cancelled
- rework required
- rework in progress

### 7.3 Production order primary data
Each production order must contain:
- tenant and branch
- service order reference
- service order item reference
- production type
- planned quantity
- produced quantity
- priority
- scheduled start and end dates
- assigned team or responsible user
- version reference
- linked quality control results
- linked rework records

### 7.4 Production order versioning
The platform must provide production order versioning to track changes in quantity, process, materials, deadlines, or technical specifications.

Requirements:
- each version must have a unique version identifier
- changes must be traceable to a user and timestamp
- the active version must be clearly identified
- historical versions must remain immutable for audit purposes
- a new version may be created when the original plan changes materially
- the system must know which service order item is associated with each version

### 7.5 Change management
Version changes may result from:
- customer amendments
- production constraints
- quality findings
- rework decisions
- schedule changes
- supply variation

The system must distinguish between approved version revisions and draft version changes.

---

## 8. Quality control

### 8.1 Quality objective
The quality module must ensure that products and services are inspected and verified throughout production and before delivery.

### 8.2 Quality checkpoints
The platform must support quality checks at key lifecycle points, such as:
- input validation
- in-process inspection
- final inspection
- before delivery
- after customer rejection or return

### 8.3 Quality records
Each quality record must include:
- production order or item reference
- inspection type
- inspector
- date and time
- result
- defects found
- defect categories
- severity
- corrective action required
- approval or rejection decision

### 8.4 Customer rejection
The platform must support customer rejection events after delivery or during final acceptance.

Requirements:
- rejection must be linked to a specific item or lot
- reason codes must be recorded
- issue severity must be classified
- rejection status must trigger operational review
- rejection may result in rework, refund, credit, replacement, or dispute

### 8.5 Rework flow
The platform must support a formal rework flow.

A rework requirement may be triggered by:
- internal quality review
- customer rejection
- defect identified during inspection
- production deviation

Requirements:
- rework must be traceable to the original item and original service order
- rework may require a new production order or a revision of the existing one
- rework actions must be assigned to a responsible user or team
- completion of rework must be validated before release
- reworked items must carry distinct status and approval history

### 8.6 Rework reassignment
The platform must allow rework to be reassigned between teams or users when needed.

Business requirements:
- a reassignment event must be logged
- the original responsibility and reassigned responsibility must both be captured
- due dates may be recalculated
- rework status must update accordingly
- reassignment must be auditable and visible in operational dashboards

### 8.7 Quality closure and approval
The system must prevent closing a service order item or production order as complete until all mandatory quality checks and rework steps are finished and approved.

---

## 9. Delivery, financial settlement, and payments

### 9.1 Delivery model
The platform must support the delivery of a completed item, a partial quantity, or a full service order.

### 9.2 Partial delivery and settlement
Partial delivery must be independently tracked from overall completion.

Requirements:
- delivered quantity and remaining quantity must both be visible
- each delivery may be linked to a warehouse or branch movement
- financial settlement may occur by delivered quantity
- open balances must be recalculated automatically

### 9.3 Payment terminal integration
The platform must support integration with payment terminals and POS-like devices for in-person payments.

Required capabilities:
- authorization of card or payment terminal transactions
- transaction reference capture
- payment method tracking
- reconciliation with service order payment records
- status of payment approval or rejection
- exception handling for failed transactions

### 9.4 Fiscal documents
The platform must support issuance and association of fiscal documents such as:
- invoices
- receipts
- service notes
- credit notes
- cancellation documents
- debit notes

Requirements:
- document number and issuance date must be traceable
- document status must be visible
- fiscal documents may be generated per order or per item
- document links to payment records must be maintained
- invalid or voided fiscal documents must be retained for legal and audit purposes

### 9.5 Payment by item and partial payments
The platform must support payment allocation by item as a core operating method.

This includes:
- payment allocation to specific items
- open balance by item
- multiple partial payments per item
- payment terms and due dates by item
- deposit and installment logic

### 9.6 Cash-flow planning and monitoring
The platform must support both expected and actual cash-flow reporting.

Expected cash flow includes planned incoming amounts by date and source.
Actual cash flow includes confirmed receipts and payment terminal or bank reconciliation.

The system must provide management visibility into:
- forecasted receipts by date
- actual collections
- variance by branch, customer, or order
- aging and overdue balances

---

## 10. Inventory and purchasing (optional modules)

### 10.1 Inventory objective
Inventory management is an optional module, but if enabled must support product and material tracking relevant to service production.

### 10.2 Inventory capabilities
If enabled, inventory must support:
- stock levels by item and branch
- movements in and out
- material consumption by production order
- stock reservations
- minimum and maximum stock thresholds
- batch or lot tracking where required
- inventory adjustments and cycle counts

### 10.3 Purchasing objective
Purchasing is an optional module that supports procurement of raw materials, components, or third-party service needs.

### 10.4 Purchasing capabilities
If enabled, the purchasing module must support:
- purchase requisitions
- purchase orders
- supplier management
- item selection and quantity proposals
- receipt of goods
- integration with inventory movement
- supplier invoice matching
- price variation tracking

---

## 11. Workflow engine and dynamic statuses

### 11.1 Workflow engine objective
The platform must support configurable workflows that drive operational execution based on business rules.

### 11.2 Dynamic status model
Statuses must be dynamic and configurable by tenant, branch, and business type. The system must allow statuses to be customized without requiring hard-coded changes to the core platform.

Examples of status domains:
- service order status
- production order status
- item status
- quality status
- rework status
- payment status
- delivery status
- customer rejection status

### 11.3 Workflow rules
The workflow engine must support:
- status transitions with permitted next states
- role-based approval gates
- automatic status updates based on events
- user notification triggers
- SLA monitoring
- escalation rules
- dependency checks between related records

### 11.4 Business process automation
The workflow engine must allow automated actions such as:
- creating a production order from a service order item
- notifying responsible users of rework
- starting quality approval after completion
- blocking final delivery while an item remains rejected
- generating payment reminders for overdue balances

---

## 12. Production scheduling and operational planning

### 12.1 Scheduling objective
The platform must support operational scheduling across teams, branches, and resources.

### 12.2 Scheduling entities
The system must support scheduling for:
- production orders
- service orders
- daily labor allocation
- capacity planning
- machine or resource assignment
- branch-level work planning

### 12.3 Scheduling requirements
The system must support:
- date and time planning
- responsible user assignment
- workload balancing
- priority overrides
- schedule conflicts and warnings
- schedule changes with audit trail
- forecast capacity by branch or department

### 12.4 Daily workers
The platform must support the management of daily workers or temporary operational staff.

Requirements:
- daily workers may be assigned to specific service or production tasks
- attendance data must be separated from permanent employee records
- payment or productivity references may be associated with daily labor records
- daily worker assignments must be auditable

---

## 13. Attendance tracking

### 13.1 Objective
The platform must support attendance tracking for employees and daily workers, including operational presence and labor accountability.

### 13.2 Attendance records
Attendance tracking must capture:
- employee / worker identification
- branch and department
- date
- check-in and check-out times
- break times
- late arrival detection
- absence and overtime classification
- attendance status
- reason for absence or exception

### 13.3 Integration with production and payroll
Attendance records must be usable for:
- labor cost analysis
- workforce productivity monitoring
- payroll integration if applicable
- work-hour validation for scheduled production tasks

---

## 14. Communication and external integrations

### 14.1 WhatsApp integration
The platform must support WhatsApp-based communication with customers and internal teams.

Use cases include:
- sending order confirmations
- delivery status notifications
- rework or rejection communication
- payment reminders
- attendance or operational messages
- customer service follow-up

Requirements:
- message templates must be configurable
- messages must be traceable to customer or order
- consent and communication preferences must be respected
- failed messages must be logged and monitored

### 14.2 Payment terminal integration
Covered in section 9.3 and 9.4.

### 14.3 Fiscal integration
The platform must integrate with fiscal document generation and tax compliance processes as required by local regulations.

### 14.4 Messaging and notification framework
The system must support event-driven notifications via email, WhatsApp, SMS, and internal alerts when configured.

---

## 15. Facial recognition roadmap

### 15.1 Strategic objective
The platform must define a roadmap for future biometric or facial recognition capabilities where legally and operationally appropriate.

### 15.2 Non-MVP status
Facial recognition is not a baseline functional requirement for the initial SRS release, but the architecture must be designed to allow future extension without compromising security or compliance.

### 15.3 Future use cases
Possible future features include:
- employee attendance verification
- access control to restricted areas
- customer identity confirmation for sensitive service operations
- fraud prevention and identity validation

### 15.4 Compliance constraints
Implementing facial recognition must respect:
- applicable local privacy laws and labor regulations
- employee consent, workplace policy, and legal governance
- data minimization and retention controls
- secure storage and explicit access restrictions
- opt-in or policy-based administrative approval

---

## 16. Dashboards and analytics

### 16.1 Dashboard objective
The platform must provide operational, commercial, financial, and quality dashboards to support decision-making.

### 16.2 Dashboard categories
Required dashboard families include:
- sales and CRM
- service order performance
- production status and schedule adherence
- quality and rework metrics
- customer rejection and complaint trends
- payment status and cash-flow forecast
- attendance and labor productivity
- branch and tenant performance

### 16.3 KPI requirements
The system should support KPIs such as:
- open service orders by status
- due deliveries by date
- production efficiency
- rework rate
- quality pass/fail ratio
- on-time delivery rate
- payment collection rate
- overdue balances
- branch comparison metrics
- cash-flow variance

### 16.4 Real-time vs retrospective reporting
The platform must provide both operational dashboards and period-based reporting views, with clear differentiation between real-time live data and historical reporting snapshots.

---

## 17. Audit logs and traceability

### 17.1 Objective
The platform must maintain a complete and defensible audit trail for all critical business actions.

### 17.2 Audit requirements
The system must log:
- creation, update, deletion, and cancellation of records
- status changes
- approval and rejection events
- financial transactions
- quality decisions
- rework actions and reassignments
- payment actions
- user logins, permission changes, and role modifications
- document generation and cancellation

### 17.3 Audit log metadata
Each log record must include:
- user identity
- tenant and branch context
- timestamp
- event type
- object type and object identifier
- previous and new value where applicable
- reason or justification when required

### 17.4 Audit retention
Audit logs must be retained for a period aligned with legal, regulatory, and contractual requirements.

---

## 18. Security, LGPD and compliance

### 18.1 Security principles
The platform must be designed with security by default. The system must support:
- authentication with strong credentials
- secure session management
- role-based authorization
- data minimization
- least privilege access
- encrypted communication
- secure storage of sensitive data

### 18.2 LGPD compliance
ANEXSYS must support compliance with Brazilian data protection requirements, including LGPD principles.

Business and technical requirements include:
- explicit collection of data only for legitimate purposes
- consent and preference management where required
- secure storage and access control for personal data
- ability to identify data subjects and manage their rights
- retention scheduling and data deletion policies
- support for data corrections and updates
- traceable access to personal data
- restricted sharing of personal information

### 18.3 Sensitive personal data
Sensitive data may include, but is not limited to:
- customer contact information
- body measurements
- photographs or documents related to customer service
- employee attendance and identification data

Such data must be governed by strict access restrictions and retention rules.

### 18.4 Privacy by design
The system must support privacy-aware handling of personal data in all modules, including CRM, quality, finance, and attendance.

---

## 19. Backup, recovery, and continuity

### 19.1 Backup requirements
The platform must support reliable and regularly tested backup procedures for:
- transactional data
- user and role information
- files and attachments
- configuration and workflow data
- audit logs

### 19.2 Recovery objectives
The system must define restore objectives that support:
- operational continuity after accidental loss
- disaster recovery in major incidents
- recovery of tenant-level data when required
- point-in-time restoration where supported

### 19.3 Business continuity
The solution must include continuity controls for:
- scheduled backups
- offsite or protected storage
- recovery testing and validation
- preventive monitoring and alerts
- incident response procedures

### 19.4 Disaster recovery readiness
The platform architecture and operational procedures must be designed to support recovery from:
- hardware failure
- ransomware or cyberattack
- data corruption
- configuration errors
- region or infrastructure outage

---

## 20. Non-functional requirements

### 20.1 Availability
The platform must support high availability for critical operational flows, with disruption tolerance aligned to tenant and business criticality.

### 20.2 Performance
The platform must support operational workflows with acceptable latency for:
- order creation
- production tracking
- quality approval
- financial reconciliation
- dashboard loading
- search and reporting

### 20.3 Scalability
The system must support increasing user counts, branches, and data volume without requiring redesign of the core functional model.

### 20.4 Maintainability
The platform must be structured so business rules can evolve without requiring invasive changes to the user interface and core workflows.

### 20.5 Observability
The platform must support logging, monitoring, alerting, and diagnostics for operational and technical teams.

---

## 21. Functional requirements summary by domain

### 21.1 Core operational workflow
The platform must allow the following end-to-end journey:
1. customer registration and profile maintenance
2. commercial capture and order initiation
3. service order creation with item-level breakdown
4. possible measurement capture when applicable
5. production planning and scheduling
6. execution and progress updates
7. quality check and validation
8. partial delivery where applicable
9. customer acceptance or rejection
10. rework when triggered
11. final delivery completion
12. item- and order-level payment processing
13. fiscal document issuance and accounting synchronization
14. dashboards, forecasts, and reporting
15. audit log retention and compliance review

### 21.2 Cross-cutting requirements
All modules must support:
- tenant and branch segregation
- user access and authorization
- statuses and workflow transitions
- audit logs
- document association and attachments
- reporting and KPI extraction

---

## 22. Assumptions and constraints

### 22.1 Assumptions
- The platform will serve businesses with operational complexity across production, service, and finance.
- Clients may operate multiple branches.
- Payment and financial flows are central to the operating model.
- Some tenants may require inventory and purchasing modules, while others may not.
- The platform will evolve from a modular monolith into a more service-oriented solution only when scale or operational demands justify it.

### 22.2 Constraints
- Functional correctness is prioritized over implementation speed.
- Business rules must be explicit and auditable.
- Regulatory and privacy obligations must be met before sensitive data is enabled in production.
- The platform must avoid hard-coded assumptions that prevent tenant personalization.

---

## 23. Definition of done for functional acceptance
A feature or module is considered functionally complete when:
- the process is fully described in terms of user roles, steps, and system events
- status transitions are defined and enforced
- auditability is in place
- exception scenarios are handled
- financial impacts are recorded correctly
- privacy and security requirements are satisfied
- tenant and branch segregation is enforced
- reporting requirements are identified and measurable

---

## 24. Open items and future enhancements
The following items are recognized as future or phase-based expansion areas and are not required to be fully implemented in the baseline release:
- advanced AI-based demand forecasting
- facial recognition attendance or access control
- advanced predictive maintenance
- deeper ERP-type financial integration
- advanced robotics or automated production triggers
- full supplier portal and vendor self-service
- next-level customer mobile experience

These items should be tracked separately as roadmap initiatives, not included as baseline mandatory requirements unless explicitly approved.

---

## 25. Approval and governance
This SRS is the functional baseline for ANEXSYS. Any subsequent changes must be evaluated through a formal change-control process and reflected in updated versioning of the specification.

The following groups shall validate business requirements before implementation:
- product leadership
- operations management
- finance leadership
- quality leadership
- IT and platform architecture
- compliance and legal stakeholders

---

## 26. Document control
- Document name: ANEXSYS Platform SRS
- Version: V1.0
- Status: Baseline functional specification
- Owner: Product / Business Requirements
- Review cadence: at least once per major phase or when a business rule changes materially

This document constitutes the functional source of truth for ANEXSYS and must be used before any architecture, database, workflow, or implementation design is developed.
