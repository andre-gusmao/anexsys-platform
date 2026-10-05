# ANEXSYS Platform
# Enterprise Software Requirements Specification (SRS)
# Version: V1.2

## 1. Document status

This document is the authoritative functional specification for the ANEXSYS platform. It defines the business, operational, security, and integration requirements for the product and is the source of truth for all subsequent analysis, architecture, implementation, testing, and deployment work.

Version V1.2 preserves the functional baseline established in V1.0 and expanded in V1.1, and adds formal enterprise requirements for customer reception workflow, direct Service Order retrieval, physical location management, pickup authorization and evidence, SLA governance, financial exceptions, source-of-truth controls, and requirement classification.

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

The platform must provide unified operational control for businesses that execute customized work, production flows, service delivery, quality control, customer warranty events, rework, and financial tracking, with clear visibility of commitments, production status, delivery, payment collections, and cash flow.

### 2.3 Strategic product vision

ANEXSYS must become the digital operating system for companies that manage custom production and service execution with operational complexity. The platform must enable:
- standardized execution across departments
- transparent operational visibility
- control of quality, rework, and warranty events
- financial traceability per order and per item
- multi-branch management in a single SaaS instance
- customer-centric service tracking
- configurable operations for multiple industries
- compliance, auditability, and governance

### 2.4 Business value

The platform delivers value by:
- reducing operational friction between commercial, production, quality, finance, and service areas
- improving cost control and cash-flow predictability
- increasing adherence to delivery commitments
- reducing rework, warranty events, and customer dissatisfaction
- enabling management by exception and KPI visibility
- improving allocation and utilization of operational resources
- supporting a scalable SaaS model for multiple clients, industries, and branches

### 2.5 Scope

The SRS covers the following core business domains:
- SaaS multi-tenant environment
- multi-branch operating model
- multi-industry configuration and workflow customization
- user access and authorization
- CRM and customer management
- service order lifecycle
- service order items and item-level financial control
- production order lifecycle and versioning
- operational resource management
- quality control, customer rejection, rework, and warranty repair
- partial delivery and payment flows
- financial planning and actual cash flow
- payment terminal and fiscal document integration
- optional inventory and purchasing modules
- workflow engine and dynamic statuses
- delivery types and operational priorities
- QR-code operational tracking
- production bag management
- scheduling and attendance tracking
- digital approvals and customer consent
- WhatsApp integration
- Smart Concierge roadmap
- dashboards and analytics
- audit logs and security
- LGPD compliance and backup/recovery

### 2.6 Multi-segment and industry-agnostic requirement

ANEXSYS must support multiple industries through configuration, reusable business capabilities, configurable terminology, and workflow customization.

The solution must not be restricted to tailoring, apparel, garment, or any other single industry. It must be capable of supporting businesses involving customized products, service execution, production, repair, maintenance, field operations, workshops, professional services, or other operational models.

Industry-specific behavior must be implemented through configuration, templates, workflow rules, custom fields, status definitions, priority rules, and operational policies rather than by hard-coding a single profession or sector into the platform.

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
- independent workflows and status behavior
- independent operational terminology and templates

Data isolation must be enforced for all tenant-specific records, business operations, reports, and configuration.

### 3.2 Branch model

Each tenant may manage one or more branches or operational units. A branch is an organizational unit that can have:
- employees and operational resources
- customers
- service orders
- production orders
- inventory
- schedules
- attendance records
- financial movements
- production bags

Business requirements:
- a user may belong to one or more branches
- roles may be branch-specific or cross-branch
- customers may be global or branch-specific
- production and service orders may be associated with a single branch or multiple relevant branches
- reports may aggregate tenant-wide or branch-local data
- operational resources may be allocated across branches subject to permissions and operational rules

### 3.3 Branch hierarchy

The platform must support a branch hierarchy, including head office and operational branches, with optional sub-branches or departments. This hierarchy supports:
- centralized governance
- local operational control
- reporting by business unit
- transfer of work between branches
- cost and performance analysis by branch
- resource capacity planning

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
- Operational Resource Operator
- Quality Analyst
- Finance Manager
- Finance Analyst
- Inventory Manager
- Purchasing Manager
- Branch Manager
- Payroll / Attendance Manager
- Operational Resource Manager
- Auditor / Compliance Reviewer
- Support User
- External Partner / Supplier

Role names are configurable and must not assume a specific profession or industry.

### 4.2 User attributes

Each user must have:
- unique identity
- employee or operational resource profile and branch assignments
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
- access restrictions for customer, financial, attendance, biometric, and sensitive operational data

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
- VIP or priority indicators where configured

### 5.3 Customer segmentation

The system must support customer segmentation by:
- commercial profile
- geographic branch
- priority level
- order volume
- payment behavior
- service level category
- business-criticality
- customer segment or industry

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
- warranty events
- digital consent events

All interaction records must be traceable to their related customer and service order.

### 5.6 Body measurements

The platform must support recording body measurements for customers when relevant to the configured business model, including but not limited to apparel, tailoring, customization, manufacturing, fitting, healthcare-adjacent services, or other measurement-based operations.

Body measurements are an optional industry capability and must not define the overall platform domain.

Required measurements may include, but are not limited to:
- shoulders
- chest
- waist
- hips
- sleeve length
- inseam
- height
- weight
- service-specific measurements
- custom notes

Business requirements:
- measurements must be versioned over time
- a customer may have multiple measurement records
- measurements must be associated with a service type or order
- measurement record changes must be auditable
- a measurement version must be attributable to a user and timestamp
- access to measurement data must comply with privacy and least-privilege rules

---

## 6. Operational Resource Management

### 6.1 Objective

The Operational Resource Management module must manage people and other operational resources that execute, supervise, inspect, support, or otherwise contribute to service orders and production orders.

The term Operational Resource is the standard platform terminology. The platform must avoid hard-coding profession-specific or industry-specific role names into the core domain model.

An Operational Resource may be an employee, daily worker, contractor, partner resource, team, machine, workstation, or other configurable operational capacity, depending on the tenant's industry and workflow.

### 6.2 Operational Resource registration

The platform must support registration and maintenance of Operational Resources with:
- identity and profile information
- resource type
- branch and department assignments
- active/inactive status
- availability
- work schedule
- skills and specialties
- certifications where applicable
- cost or compensation references where applicable
- permitted operational activities
- historical assignments

### 6.3 Skills and specialties

The platform must support configurable skills, specialties, qualifications, and capability levels.

Requirements:
- a resource may have multiple skills
- skills may have proficiency levels
- skills may be required by a service order, item, production order, or workflow step
- the system must warn or prevent allocation when mandatory capability requirements are not met
- skills and certifications may expire and require renewal

### 6.4 Resource allocation

The platform must support allocation of Operational Resources to:
- service orders
- service order items
- production orders
- production order versions
- production batches or Production Bags
- quality inspections
- rework activities
- warranty repairs
- scheduled tasks

Resource assignment and reassignment must be auditable.

### 6.5 Productivity tracking

The platform must track productivity according to configurable tenant rules, including:
- completed quantity
- completed work units
- time spent
- planned versus actual execution
- output per period
- workload assigned versus delivered
- productivity by resource, team, branch, service type, or production type

The platform must not assume a single productivity formula. Each tenant may configure the applicable measurement method.

### 6.6 Quality performance indicators

The platform must calculate configurable quality indicators for Operational Resources and teams, including:
- quality approval rate
- defect rate
- inspection failure rate
- customer rejection rate
- warranty repair rate
- first-pass quality rate
- corrective action frequency

### 6.7 Rework indicators

The system must track rework indicators, including:
- number of rework events
- rework rate
- rework by cause
- rework by resource or team
- rework cycle time
- rework cost or effort where configured
- recurrence of the same defect

These indicators must be used for improvement and management, not as an automatic punitive mechanism without tenant-configured governance.

### 6.8 Attendance and daily worker management

Operational Resource Management must integrate with attendance tracking and daily worker management.

The system must support:
- daily worker registration
- daily worker availability
- assignment to operational activities
- attendance and presence tracking
- payment or productivity references where applicable
- history of daily work engagements
- separation of daily worker data from permanent employee data where required

### 6.9 Workload balancing

The platform must support workload balancing by:
- resource
- team
- branch
- skill
- schedule
- priority
- delivery type
- SLA commitment

The system should provide warnings when a resource or team is overloaded, underutilized, unavailable, or assigned work outside configured capacity.

### 6.10 Ranking and performance dashboards

The platform must support configurable ranking and performance views for Operational Resources and teams.

Rankings may include:
- productivity
- quality
- rework rate
- attendance
- on-time execution
- SLA adherence
- capacity utilization

Rankings must respect access permissions and privacy policies. Tenants must be able to configure whether rankings are visible individually, by team, by branch, or only to authorized management users.

### 6.11 Operational history

The platform must retain a complete operational history for each resource, including:
- assignments
- completed work
- quality results
- rework and warranty events
- attendance
- skills and qualification changes
- performance indicators
- schedule history
- transfers between branches or teams

---

## 7. Service orders

### 7.1 Service order objective

The service order is the primary operational transaction that represents the customer commitment, scope, delivery expectation, financial value, and production workflow.

### 7.2 Service order lifecycle

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
- warranty event where applicable

### 7.3 Service order header

Each service order must contain:
- tenant and branch
- customer reference
- sales representative
- created date
- expected completion date
- delivery date(s)
- delivery type
- operational priority
- status
- payment terms
- related financial records
- related production orders
- related Production Bags where applicable
- QR Code reference
- related documents
- notes and attachments

### 7.4 Service order items

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
- delivery type where different from the order
- operational priority where different from the order
- production requirement per item
- quality requirements per item
- payment applicability
- status or stage of execution
- related production order(s)
- QR Code reference
- related Production Bag where applicable

### 7.5 Item-level business rules

The platform must support item-level management for:
- production tracking
- financial allocation
- partial delivery
- partial payment
- rework treatment
- warranty repair treatment
- customer rejection and return
- item-specific quality results
- resource allocation
- QR-code traceability

### 7.6 Service order item valuation

The platform must calculate item value based on:
- unit price
- quantity
- discounts
- taxes
- freight or handling if applicable
- ad-hoc adjustments

The total service order value must reflect all relevant item values and financial adjustments.

### 7.7 Partial delivery

The platform must support partial delivery of service order items when not all items are ready to ship or complete at the same time.

Requirements:
- each delivered quantity must be traceable to a delivery event
- undelivered quantities remain open and continue to be tracked
- financial entries may be associated with each partial delivery
- partial delivery status must be reflected for both operational and financial views
- delivery may be blocked by workflow rules, quality conditions, approval requirements, or payment policies

### 7.8 Payment by item

The platform must support payments by item, not only by order total.

This means the system must allow:
- individual item pricing and payment allocation
- item-level received value
- partial item payment
- item-level outstanding balance
- item-level settlement and closure

### 7.9 Partial payments

The platform must support partial payments across the order lifecycle.

Requirements:
- payment may be received before, during, or after production
- each payment must be linked to one or more order items
- outstanding balance must be recalculated dynamically
- payment status must be visible at item and order levels
- partial payment records must be auditable

### 7.10 Expected cash flow

The platform must support expected cash flow forecasting based on:
- order values
- payment terms
- delivery schedule
- milestones
- agreed receipts
- expected collections by date

The system must allow expected inflow visualization by period, customer, branch, and item group.

### 7.11 Actual cash flow

The platform must track actual financial inflows versus expected inflows.

Requirements:
- actual cash/payment receipts must be linked to service orders and items
- variances between expected and actual cash flow must be measurable
- financial dashboards must distinguish expected vs actual
- delayed or missed collections must be visible to management

### 7.12 Delivery Types and Operational Priority

The platform must support configurable delivery types. The baseline types are:
- Normal
- Priority
- Express

Tenants may configure additional types while preserving the baseline semantics.

The platform must support Operational Priority as a distinct control that may be applied at service order, service order item, production order, Production Bag, workflow, or task level.

Delivery Type and Operational Priority requirements:
- visual identification throughout the platform
- color, icon, label, or other tenant-configurable visual indicator
- dashboard indicators
- scheduling priority
- production priority
- SLA impact
- workflow impact
- operational alerts
- filtering and reporting by delivery type and priority
- audit trail for changes

Delivery Type and Operational Priority must influence planning and alerts but must not automatically override approval, quality, safety, or compliance controls unless explicitly configured.

---

## 8. Production orders

### 8.1 Production order objective

A production order represents the execution plan for producing or completing a service order item or production group. Production orders must be linked to service order items and operational execution.

### 8.2 Production order lifecycle

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
- warranty repair required
- warranty repair in progress

### 8.3 Production order primary data

Each production order must contain:
- tenant and branch
- service order reference
- service order item reference
- production type
- planned quantity
- produced quantity
- delivery type
- operational priority
- scheduled start and end dates
- assigned team or Operational Resource
- version reference
- QR Code reference
- Production Bag reference where applicable
- linked quality control results
- linked rework records
- linked warranty repair records

### 8.4 Production order versioning

The platform must provide production order versioning to track changes in quantity, process, materials, deadlines, or technical specifications.

Requirements:
- each version must have a unique version identifier
- changes must be traceable to a user and timestamp
- the active version must be clearly identified
- historical versions must remain immutable for audit purposes
- a new version may be created when the original plan changes materially
- the system must know which service order item is associated with each version
- resource allocation and scheduling changes must be attributable to the applicable version

### 8.5 Change management

Version changes may result from:
- customer amendments
- production constraints
- quality findings
- rework decisions
- warranty repair decisions
- schedule changes
- supply variation
- Operational Resource availability

The system must distinguish between approved version revisions and draft version changes.

---

## 9. Quality control, customer rejection, rework, and warranty repair

### 9.1 Quality objective

The quality module must ensure that products and services are inspected and verified throughout production and before delivery.

### 9.2 Quality checkpoints

The platform must support quality checks at key lifecycle points, such as:
- input validation
- in-process inspection
- final inspection
- before delivery
- after customer rejection or return
- after rework
- after warranty repair

### 9.3 Quality records

Each quality record must include:
- production order or item reference
- inspection type
- inspector or Operational Resource
- date and time
- result
- defects found
- defect categories
- severity
- corrective action required
- approval or rejection decision
- linked QR Code or Production Bag where applicable

### 9.4 Customer rejection

The platform must support customer rejection events after delivery or during final acceptance.

Requirements:
- rejection must be linked to a specific item, quantity, batch, Production Bag, or lot
- reason codes must be recorded
- issue severity must be classified
- rejection status must trigger operational review
- rejection may result in rework, warranty repair, refund, credit, replacement, or dispute
- rejection must be included in quality and customer-service indicators

### 9.5 Rework

Rework represents a new operational execution required to correct a defect, deviation, or nonconformity identified before or after delivery.

The platform must support a formal rework flow.

A rework requirement may be triggered by:
- internal quality review
- customer rejection
- defect identified during inspection
- production deviation
- failed acceptance criteria

Requirements:
- rework must be traceable to the original item and original service order
- rework may require a new production order or a revision of the existing one
- rework may create a new production cycle when required
- rework actions must be assigned to a responsible Operational Resource or team
- completion of rework must be validated before release
- reworked items must carry distinct status and approval history
- rework must impact configurable productivity and quality metrics
- rework must not generate additional customer revenue unless explicitly configured for a commercial change

### 9.6 Warranty Repair

Warranty Repair is distinct from Rework.

Warranty Repair represents a customer warranty event in which the platform records a repair, correction, replacement, or service obligation covered by an applicable warranty or guarantee.

Business requirements:
- warranty repair must be linked to the customer, original service order, and affected item
- warranty repair must not generate additional revenue by default
- warranty repair must be recorded as a quality indicator and customer warranty event
- warranty eligibility and coverage rules must be configurable
- warranty repair may require operational execution and production activity
- warranty repair must have its own status, SLA, approval, and resolution history
- warranty repair may result in return, repair, replacement, credit, or other configured resolution

### 9.7 Rework versus Warranty Repair

The system must keep Rework and Warranty Repair as separate concepts, workflows, statuses, metrics, and reporting dimensions.

Comparison matrix:
- Rework: meaning = new operational execution to correct a defect or deviation; revenue by default = No; production impact = Yes, when required; quality impact = Yes.
- Warranty Repair: meaning = customer warranty event handled under warranty obligations; revenue by default = No; production impact = Yes, when required; quality impact = Yes.

Rework primarily measures internal operational correction. Warranty Repair primarily measures customer warranty responsibility and post-delivery service performance.

### 9.8 Rework reassignment

The platform must allow rework to be reassigned between Operational Resources or teams when needed.

Business requirements:
- a reassignment event must be logged
- the original responsibility and reassigned responsibility must both be captured
- due dates may be recalculated
- rework status must update accordingly
- reassignment must be auditable and visible in operational dashboards

### 9.9 Quality closure and approval

The system must prevent closing a service order item or production order as complete until all mandatory quality checks and rework or warranty repair steps are finished and approved.

---

## 10. QR Code Operational Tracking

### 10.1 Objective

The platform must provide QR Code Operational Tracking to enable fast identification, scanning, and traceability throughout execution.

### 10.2 QR Code scope

The platform must support QR Codes for:
- each Service Order
- each Service Order Item
- each Production Order
- each Production Batch or Operational Bag
- other configurable workflow objects where required

### 10.3 Scanning requirements

QR Code scanning must be supported during workflow execution for activities including:
- receiving and identifying work
- starting an operational step
- assigning or confirming an Operational Resource
- moving work between stages
- consolidating or splitting Production Bags
- quality inspection
- rework initiation
- warranty repair initiation
- delivery preparation
- partial delivery
- customer handover

### 10.4 Traceability requirements

Each scan must be traceable to:
- tenant and branch
- scanned object
- user or Operational Resource
- date and time
- workflow step or operational context
- resulting action or status change
- device or channel where available

The system must support complete operational traceability from Service Order to Service Order Item, Production Order, Production Batch or Operational Bag, quality events, delivery, rework, warranty repair, and customer confirmation.

---

## 11. Production Bag management

### 11.1 Objective

Production Bags are operational containers used to group, transport, stage, or control related work during execution. A Production Bag may represent a physical bag, box, kit, batch container, cart, package, or equivalent operational grouping, depending on the industry.

### 11.2 Bag requirements

The platform must support:
- Production Bag identification
- Bag label and QR Code
- linked Service Order Items
- linked Production Orders
- linked production batches
- responsible branch or operational area
- current status and location
- assigned Operational Resources
- creation and closure dates
- notes and attachments

### 11.3 Consolidation process

The system must support consolidating multiple Service Order Items or Production Orders into a Production Bag.

Consolidation must:
- validate that the items may be grouped
- preserve the relationship to their original orders
- record the user and time of consolidation
- update operational visibility and location
- generate or associate the applicable QR Code

### 11.4 Split process

The system must support splitting a Production Bag into multiple bags or separating selected Service Order Items or Production Orders.

The split must:
- preserve complete history
- record the reason where required
- identify the original and resulting bags
- update the location and status of affected work
- maintain item and production traceability

### 11.5 Merge process

The system must support merging Production Bags when permitted by workflow rules.

The merge must:
- preserve the history of all source bags
- identify the resulting bag
- maintain all linked order and production references
- record responsible user, date, time, and reason where applicable

### 11.6 Bag lifecycle and history

Production Bags must support a configurable lifecycle, including creation, staging, in progress, quality review, ready for delivery, delivered, closed, split, merged, and cancelled.

The platform must maintain full history of:
- creation
- QR scans
- consolidation
- split
- merge
- movement
- resource assignment
- quality events
- rework or warranty repair
- delivery
- closure

---

## 12. Delivery, financial settlement, and payments

### 12.1 Delivery model

The platform must support the delivery of a completed item, a partial quantity, or a full service order.

### 12.2 Partial delivery and settlement

Partial delivery must be independently tracked from overall completion.

Requirements:
- delivered quantity and remaining quantity must both be visible
- each delivery may be linked to a warehouse, branch movement, Production Bag, or QR-tracked event
- financial settlement may occur by delivered quantity
- open balances must be recalculated automatically

### 12.3 Payment terminal integration

The platform must support integration with payment terminals and POS-like devices for in-person payments.

Payments must originate from the Service Order workflow. The platform must prevent operational dependency on manually typing payment amounts into external payment devices.

Required capabilities:
- payment initiation from the Service Order
- full amount payment
- partial payment
- item-level payment
- deposit and installment payment where configured
- amount and allocation sent from the Service Order context
- authorization of card or payment terminal transactions
- transaction reference capture
- payment method tracking
- automatic reconciliation with Service Order payment records
- status of payment approval or rejection
- exception handling for failed transactions
- full transaction traceability

The external payment terminal must not be treated as the source of truth for the business amount. The Service Order workflow is the source of the payment request, allocation, and reconciliation context.

### 12.4 Fiscal documents

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

### 12.5 Payment by item and partial payments

The platform must support payment allocation by item as a core operating method.

This includes:
- payment allocation to specific items
- open balance by item
- multiple partial payments per item
- payment terms and due dates by item
- deposit and installment logic

### 12.6 Cash-flow planning and monitoring

The platform must support both expected and actual cash-flow reporting.

Expected cash flow includes planned incoming amounts by date and source.

Actual cash flow includes confirmed receipts and payment terminal or bank reconciliation.

The system must provide management visibility into:
- forecasted receipts by date
- actual collections
- variance by branch, customer, or order
- aging and overdue balances

---

## 13. Inventory and purchasing (optional modules)

### 13.1 Inventory objective

Inventory management is an optional module, but if enabled must support product and material tracking relevant to service production.

### 13.2 Inventory capabilities

If enabled, inventory must support:
- stock levels by item and branch
- movements in and out
- material consumption by production order
- stock reservations
- minimum and maximum stock thresholds
- batch or lot tracking where required
- inventory adjustments and cycle counts

### 13.3 Purchasing objective

Purchasing is an optional module that supports procurement of raw materials, components, or third-party service needs.

### 13.4 Purchasing capabilities

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

## 14. Workflow engine and dynamic statuses

### 14.1 Workflow engine objective

The platform must support configurable workflows that drive operational execution based on business rules.

### 14.2 Dynamic status model

Statuses must be dynamic and configurable by tenant, branch, business type, and operational process. The system must allow statuses to be customized without requiring hard-coded changes to the core platform.

Every status must allow configurable business behavior. Status configuration must be explicit, versioned, auditable, and applicable to the relevant workflow domain.

Examples of status domains:
- service order status
- production order status
- service order item status
- quality status
- rework status
- warranty repair status
- payment status
- delivery status
- customer rejection status
- Production Bag status
- approval status
- attendance status

### 14.3 Configurable status behavior parameters

Each status must support the following configurable business behavior parameters:
- Generates Revenue
- Generates Production
- Generates Fiscal Impact
- Generates Commission
- Impacts SLA
- Impacts Quality Metrics
- Impacts Productivity Metrics
- Appears on Dashboards
- Final Status Indicator
- Requires Approval
- Blocks Delivery

The parameters must be configurable by tenant and workflow context. Status behavior changes must be subject to appropriate authorization and audit logging.

### 14.4 Status behavior examples

The following examples illustrate required behavior configuration:

#### Rework
- Generates Revenue = No
- Generates Production = Yes
- Generates Fiscal Impact = No by default
- Generates Commission = No by default
- Impacts SLA = Configurable
- Impacts Quality Metrics = Yes
- Impacts Productivity Metrics = Yes
- Appears on Dashboards = Yes
- Final Status Indicator = No
- Requires Approval = Configurable
- Blocks Delivery = Yes until resolved

#### Warranty Repair
- Generates Revenue = No
- Generates Production = Yes when operational execution is required
- Generates Fiscal Impact = No by default
- Generates Commission = No by default
- Impacts SLA = Yes according to warranty policy
- Impacts Quality Metrics = Yes
- Impacts Productivity Metrics = Configurable
- Appears on Dashboards = Yes
- Final Status Indicator = No
- Requires Approval = Configurable
- Blocks Delivery = Configurable

#### Completed
- Generates Revenue = Yes when the configured business event qualifies as revenue
- Generates Production = No by default
- Generates Fiscal Impact = Yes when fiscal rules apply
- Generates Commission = Configurable
- Impacts SLA = Yes for completion measurement
- Impacts Quality Metrics = Yes where completion quality is measured
- Impacts Productivity Metrics = Yes
- Appears on Dashboards = Yes
- Final Status Indicator = Yes
- Requires Approval = Configurable
- Blocks Delivery = No by default

### 14.5 Workflow rules

The workflow engine must support:
- status transitions with permitted next states
- role-based approval gates
- automatic status updates based on events
- user notification triggers
- SLA monitoring
- escalation rules
- dependency checks between related records
- configurable conditions based on delivery type and priority
- configurable conditions based on quality, payment, approval, or resource availability
- status behavior parameters defined in section 14.3

### 14.6 Business process automation

The workflow engine must allow automated actions such as:
- creating a production order from a service order item
- notifying responsible users of rework or warranty repair
- starting quality approval after completion
- blocking final delivery while an item remains rejected
- generating payment reminders for overdue balances
- requesting digital approval from a customer
- creating operational alerts for Priority or Express work
- initiating payment from the Service Order context
- assigning or reassigning an Operational Resource
- creating or updating a Production Bag

---

## 15. Production scheduling and operational planning

### 15.1 Scheduling objective

The platform must support operational scheduling across teams, branches, Operational Resources, and other configurable resources.

### 15.2 Scheduling entities

The system must support scheduling for:
- production orders
- service orders
- service order items
- daily labor allocation
- Operational Resources
- capacity planning
- machine or resource assignment
- Production Bags
- branch-level work planning
- quality inspections
- rework and warranty repair activities

### 15.3 Scheduling requirements

The system must support:
- date and time planning
- responsible user or Operational Resource assignment
- workload balancing
- delivery type and priority overrides
- schedule conflicts and warnings
- schedule changes with audit trail
- forecast capacity by branch or department
- skill and specialty matching
- SLA-aware scheduling
- alerts for delayed, overloaded, or at-risk work

### 15.4 Daily workers

The platform must support the management of daily workers or temporary operational staff.

Requirements:
- daily workers may be assigned to specific service or production tasks
- attendance data must be separated from permanent employee records
- payment or productivity references may be associated with daily labor records
- daily worker assignments must be auditable
- daily workers must be managed as Operational Resources where applicable

---

## 16. Attendance tracking

### 16.1 Objective

The platform must support attendance tracking for employees, daily workers, and other authorized Operational Resources, including operational presence and labor accountability.

### 16.2 Attendance records

Attendance tracking must capture:
- employee / worker / Operational Resource identification
- branch and department
- date
- check-in and check-out times
- break times
- late arrival detection
- absence and overtime classification
- attendance status
- reason for absence or exception
- source of attendance capture

### 16.3 Integration with production and payroll

Attendance records must be usable for:
- labor cost analysis
- workforce productivity monitoring
- payroll integration if applicable
- work-hour validation for scheduled production tasks
- capacity utilization dashboards
- Operational Resource performance indicators

---

## 17. Digital approvals and customer consent

### 17.1 Objective

The platform must support digital approval workflows for customer confirmations, commercial decisions, service specifications, delivery acceptance, payment conditions, quality resolutions, and other configurable business events.

### 17.2 Approval capabilities

The platform must support:
- approval links
- WhatsApp approval
- digital consent
- signature capture
- photo attachments
- document and evidence attachments
- approval audit trail
- customer confirmation workflow
- expiration and revocation rules
- approval reminders
- rejection and resubmission

### 17.3 Approval traceability

Each approval must record:
- customer or approver identity
- related tenant, branch, customer, order, item, or workflow object
- approval content or version
- timestamp
- channel used
- decision
- signature or consent evidence where applicable
- attachments and photos
- IP, device, or technical evidence where legally and technically appropriate

### 17.4 Approval business rules

The workflow engine must be able to require digital approval before:
- starting or changing production
- approving a production order version
- accepting a quotation or service order
- approving a customer-specific measurement or specification
- authorizing delivery
- accepting a partial delivery
- confirming a rejection, rework, or warranty resolution
- confirming payment terms or settlement

---

## 18. Communication and external integrations

### 18.1 WhatsApp integration

The platform must support WhatsApp-based communication with customers and internal teams.

Use cases include:
- sending order confirmations
- delivery status notifications
- rework or warranty repair communication
- payment reminders
- attendance or operational messages
- customer service follow-up
- digital approval links
- customer consent and confirmation
- Smart Concierge notifications where enabled

Requirements:
- message templates must be configurable
- messages must be traceable to customer or order
- consent and communication preferences must be respected
- failed messages must be logged and monitored
- approval actions received through WhatsApp must be auditable

### 18.2 Payment terminal integration

Covered in section 12.3. Payment requests must originate from the Service Order workflow.

### 18.3 Fiscal integration

The platform must integrate with fiscal document generation and tax compliance processes as required by local regulations.

### 18.4 Messaging and notification framework

The system must support event-driven notifications via email, WhatsApp, SMS, and internal alerts when configured.

---

## 19. Smart Concierge

### 19.1 Product status

Smart Concierge is a future-approved module and must be considered in the product roadmap. It is not required for the initial baseline implementation unless explicitly prioritized for a delivery phase.

### 19.2 Objective

Smart Concierge must provide a customer-facing and front-desk operational experience that accelerates customer arrival, identification, service, and handoff.

### 19.3 Capabilities

The Smart Concierge module may provide:
- customer arrival queue
- customer profile preview
- fast access to Service Orders
- VIP customer indicators
- customer history visibility
- access control integration
- facial recognition support in future phases
- customer notification and check-in workflow
- service representative assignment
- current order and delivery status visibility

### 19.4 Governance and privacy

Smart Concierge must respect tenant configuration, access control, LGPD requirements, customer consent, and data minimization rules.

Facial recognition is not required for the initial Smart Concierge release and must remain subject to legal, privacy, security, and operational approval.

---

## 20. Facial recognition roadmap

### 20.1 Strategic objective

The platform must define a controlled optional biometric capability and a roadmap for advanced facial recognition use cases where legally and operationally appropriate.

### 20.2 Non-MVP status

Facial recognition is an optional, tenant-configurable capability and is not mandatory for baseline rollout. The architecture must support policy-gated enablement without compromising security or compliance.

### 20.3 Future use cases

Possible future features include:
- employee or Operational Resource attendance verification
- access control to restricted areas
- customer identity confirmation for sensitive service operations
- Smart Concierge check-in
- fraud prevention and identity validation

### 20.4 Compliance constraints

Implementing facial recognition must respect:
- applicable local privacy laws and labor regulations
- employee and customer consent, workplace policy, and legal governance
- data minimization and retention controls
- secure storage and explicit access restrictions
- opt-in or policy-based administrative approval
- biometric-data incident response and revocation processes

---

## 21. Dashboards and analytics

### 21.1 Dashboard objective

The platform must provide operational, commercial, financial, and quality dashboards to support decision-making.

### 21.2 Dashboard categories

Required dashboard families include:
- sales and CRM
- service order performance
- production status and schedule adherence
- quality and rework metrics
- customer rejection and warranty repair trends
- payment status and cash-flow forecast
- attendance and labor productivity
- Operational Resource performance
- branch and tenant performance
- delivery type and operational priority performance
- Production Bag and QR-code traceability status

### 21.3 Operational Resource Dashboard

The platform must provide an Operational Resource Dashboard for authorized users.

Required metrics include:
- productivity
- quality
- rework rate
- attendance
- delivery performance
- ranking
- capacity utilization
- SLA adherence

The dashboard must support filtering by:
- tenant
- branch
- department
- team
- Operational Resource
- skill or specialty
- date range
- service type
- production type
- delivery type
- operational priority

### 21.4 KPI requirements

The system should support KPIs such as:
- open service orders by status
- due deliveries by date
- production efficiency
- rework rate
- warranty repair rate
- quality pass/fail ratio
- on-time delivery rate
- payment collection rate
- overdue balances
- branch comparison metrics
- cash-flow variance
- Operational Resource productivity
- Operational Resource quality performance
- capacity utilization
- SLA adherence
- Production Bag status and aging
- QR scan and traceability exceptions

### 21.5 Real-time versus retrospective reporting

The platform must provide both operational dashboards and period-based reporting views, with clear differentiation between real-time live data and historical reporting snapshots.

### 21.6 Dashboard behavior and status visibility

Statuses configured to appear on dashboards must be visible according to their status behavior parameters. Priority, delivery type, blocked delivery, quality failure, rework, warranty repair, and approval-required conditions must be visually identifiable where relevant.

---

## 22. Audit logs and traceability

### 22.1 Objective

The platform must maintain a complete and defensible audit trail for all critical business actions.

### 22.2 Audit requirements

The system must log:
- creation, update, deletion, and cancellation of records
- status changes
- status behavior configuration changes
- approval and rejection events
- financial transactions
- quality decisions
- rework actions and reassignments
- warranty repair actions
- payment actions and terminal reconciliation
- QR Code scans
- Production Bag creation, consolidation, split, merge, and movement
- user logins, permission changes, and role modifications
- resource allocation and reassignment
- document generation and cancellation
- customer consent and digital approval events

### 22.3 Audit log metadata

Each log record must include:
- user identity or Operational Resource identity where applicable
- tenant and branch context
- timestamp
- event type
- object type and object identifier
- previous and new value where applicable
- related Service Order, Service Order Item, Production Order, Production Bag, or approval context where applicable
- reason or justification when required

### 22.4 Audit retention

Audit logs must be retained for a period aligned with legal, regulatory, and contractual requirements.

---

## 23. Security, LGPD and compliance

### 23.1 Security principles

The platform must be designed with security by default. The system must support:
- authentication with strong credentials
- secure session management
- role-based authorization
- data minimization
- least privilege access
- encrypted communication
- secure storage of sensitive data
- controlled access to customer, attendance, measurement, biometric, and financial information

### 23.2 LGPD compliance

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
- governance of digital approvals, photographs, signatures, measurements, attendance, and biometric data

### 23.3 Sensitive personal data

Sensitive data may include, but is not limited to:
- customer contact information
- body measurements
- photographs or documents related to customer service
- digital signatures and consent evidence
- employee attendance and identification data
- biometric or facial-recognition data if introduced in future phases

Such data must be governed by strict access restrictions and retention rules.

### 23.4 Privacy by design

The system must support privacy-aware handling of personal data in all modules, including CRM, quality, finance, attendance, digital approval, Smart Concierge, and Operational Resource Management.

---

## 24. Backup, recovery, and continuity

### 24.1 Backup requirements

The platform must support reliable and regularly tested backup procedures for:
- transactional data
- user and role information
- Operational Resource information
- files and attachments
- photographs and approval evidence
- configuration and workflow data
- QR-code and Production Bag traceability data
- audit logs

### 24.2 Recovery objectives

The system must define restore objectives that support:
- operational continuity after accidental loss
- disaster recovery in major incidents
- recovery of tenant-level data when required
- point-in-time restoration where supported
- preservation of audit and approval evidence

### 24.3 Business continuity

The solution must include continuity controls for:
- scheduled backups
- offsite or protected storage
- recovery testing and validation
- preventive monitoring and alerts
- incident response procedures

### 24.4 Disaster recovery readiness

The platform architecture and operational procedures must be designed to support recovery from:
- hardware failure
- ransomware or cyberattack
- data corruption
- configuration errors
- region or infrastructure outage
- loss of operational scanning or payment integration services

---

## 25. Non-functional requirements

### 25.1 Availability

The platform must support high availability for critical operational flows, with disruption tolerance aligned to tenant and business criticality.

### 25.2 Performance

The platform must support operational workflows with acceptable latency for:
- order creation
- QR-code scanning
- production tracking
- quality approval
- financial reconciliation
- dashboard loading
- search and reporting
- digital approval actions

### 25.3 Scalability

The system must support increasing user counts, branches, Operational Resources, Production Bags, QR-code events, and data volume without requiring redesign of the core functional model.

### 25.4 Maintainability

The platform must be structured so business rules can evolve without requiring invasive changes to the user interface and core workflows.

### 25.5 Observability

The platform must support logging, monitoring, alerting, and diagnostics for operational and technical teams, including workflow, integration, payment, QR-code, notification, and approval failures.

---

## 26. Functional requirements summary by domain

### 26.1 Core operational workflow

The platform must allow the following end-to-end journey:
1. customer registration and profile maintenance
2. commercial capture and order initiation
3. service order creation with item-level breakdown
4. possible measurement capture when applicable
5. delivery type and operational priority assignment
6. production planning and scheduling
7. Operational Resource allocation
8. Production Bag creation or consolidation where applicable
9. QR-code identification and operational tracking
10. execution and progress updates
11. quality check and validation
12. partial delivery where applicable
13. customer acceptance or rejection
14. rework or warranty repair when triggered
15. digital approval or customer confirmation when required
16. final delivery completion
17. item- and order-level payment processing from the Service Order workflow
18. fiscal document issuance and accounting synchronization
19. dashboards, forecasts, and reporting
20. audit log retention and compliance review

### 26.2 Cross-cutting requirements

All modules must support:
- tenant and branch segregation
- industry-agnostic configuration
- user access and authorization
- Operational Resource allocation where applicable
- statuses and workflow transitions
- configurable status behavior
- delivery type and operational priority where applicable
- QR-code traceability where applicable
- audit logs
- document association and attachments
- digital approvals where applicable
- reporting and KPI extraction

---

## 27. Assumptions and constraints

### 27.1 Assumptions

- The platform will serve businesses with operational complexity across production, service, and finance.
- Clients may operate multiple branches.
- Payment and financial flows are central to the operating model.
- Some tenants may require inventory and purchasing modules, while others may not.
- The platform will evolve from a modular monolith into a more service-oriented solution only when scale or operational demands justify it.
- Different industries will use different terminology, workflows, quality rules, scheduling methods, and productivity measures.
- Operational Resources may be people, teams, machines, workstations, contractors, or other configurable capacity types.
- Body measurements, Production Bags, facial recognition, Smart Concierge, and inventory may be enabled only for relevant tenants or phases.

### 27.2 Constraints

- Functional correctness is prioritized over implementation speed.
- Business rules must be explicit and auditable.
- Regulatory and privacy obligations must be met before sensitive data is enabled in production.
- The platform must avoid hard-coded assumptions that prevent tenant personalization.
- The platform must not rely on role-specific professional terminology as a core domain assumption.
- Payment amounts must originate from the Service Order workflow rather than manual entry into external payment terminals.
- Workflow status behavior must be configurable and versioned.

---

## 28. Definition of done for functional acceptance

A feature or module is considered functionally complete when:
- the process is fully described in terms of user roles, Operational Resources, steps, and system events
- status transitions are defined and enforced
- status business behavior parameters are defined and tested
- auditability is in place
- QR-code traceability is implemented where applicable
- exception scenarios are handled
- financial impacts are recorded correctly
- privacy and security requirements are satisfied
- tenant and branch segregation is enforced
- delivery type and operational priority behavior is verified where applicable
- resource allocation and workload impact are measurable where applicable
- reporting requirements are identified and measurable

---

## 29. Open items and future enhancements

The following items are recognized as future or phase-based expansion areas and are not required to be fully implemented in the baseline release:
- advanced AI-based demand forecasting
- facial recognition attendance, Smart Concierge identification, or access control
- advanced predictive maintenance
- deeper ERP-type financial integration
- advanced robotics or automated production triggers
- full supplier portal and vendor self-service
- next-level customer mobile experience
- advanced optimization of Operational Resource allocation
- predictive quality and rework analytics
- automated capacity and scheduling optimization

These items should be tracked separately as roadmap initiatives, not included as baseline mandatory requirements unless explicitly approved.

Smart Concierge is an approved future module and must remain represented in product planning even when not included in the initial implementation phase.

---

## 30. Approval and governance

This SRS is the functional baseline for ANEXSYS. Any subsequent changes must be evaluated through a formal change-control process and reflected in updated versioning of the specification.

The following groups shall validate business requirements before implementation:
- product leadership
- operations management
- finance leadership
- quality leadership
- IT and platform architecture
- compliance and legal stakeholders
- representatives of applicable tenant industries

---

## 31. Document control

- Document name: ANEXSYS Platform SRS
- Version: V1.2
- Status: Expanded functional specification
- Extends: SRS_MASTER_V1.1.md
- Owner: Product / Business Requirements
- Review cadence: at least once per major phase or when a business rule changes materially

This document preserves the V1.0 and V1.1 functional baseline and adds the V1.2 requirements. It constitutes the functional source of truth for ANEXSYS and must be used before any architecture, database, workflow, or implementation design is developed.


---

## 32. Customer Reception and Smart Concierge Workflow

### 32.1 Objective

The platform must provide a formal customer reception workflow that structures customer arrival, identification, queueing, and service initiation with full traceability.

For consistency with section 19, the mandatory scope in this section is the reception workflow itself. Smart Concierge advanced capabilities remain future-approved unless explicitly prioritized for a delivery phase.

### 32.2 Digital reception queue

The system must provide a digital reception queue with:
- customer arrival registration
- customer identification
- queue ordering by arrival time
- reception dashboard visibility
- service initiation by attendant
- wait-time tracking
- reception audit trail

Queue statuses must include:
- Waiting
- Called
- In Service
- No Show
- Completed

### 32.3 Identification channels

Customer identification in reception must support:
- customer name
- phone number
- WhatsApp number
- CPF
- customer code
- QR Code
- optional Facial Recognition

For formal requirement traceability, identification channels are defined as: customer name, phone number, WhatsApp number, CPF, customer code, QR Code, and optional Facial Recognition.

Facial recognition in reception is allowed only when the tenant has enabled it under a valid legal basis and customer biometric consent/policy conditions required by applicable law are satisfied.

Facial recognition is optional and must follow strict workflow rules:
- it must not automatically create a Service Order
- it must not automatically open customer records
- it only identifies a potential customer
- identified customers enter the reception queue
- customer records open only when an attendant starts service

### 32.4 Reception dashboard and visible queue information

The reception queue view (row plus selection detail panel) must provide customer context in arrival-time order and include, when available:
- customer name
- optional photo
- open Service Orders
- ready-for-pickup Service Orders
- completed Service Orders
- warranty cases
- financial pending issues
- VIP status
- last visit

Visibility control rules:
- Pre-service queue rows must show only minimal identifiers and high-level flags.
- Detailed operational and financial fields (open/ready/completed Service Orders, warranty cases, financial pending issues) are visible in the queue detail panel only for authorized roles after explicit customer selection by the attendant.
- Full customer-record access remains restricted to attendant service start.
- When customer identification is potential-only (for example, a facial-recognition candidate), the dashboard may show queue-level preview indicators without opening the full customer record.

### 32.5 Non-identified customer workflow

When the platform cannot identify a customer at arrival, the system must allow a temporary queue entry with:
- temporary queue identity
- temporary photo when captured
- arrival timestamp

Before service starts, minimal registration must collect:
- mandatory Full Name
- mandatory Mobile Phone / WhatsApp with DDD
- optional CPF
- optional CEP
- optional Email
- optional Birth Date
- optional Notes

### 32.6 Service initiation and reason classification

Attendants must start service directly from the reception queue, and the system must capture the primary service reason:
- New Service Order
- Pickup
- Warranty
- Consultation
- Payment
- Delivery
- Other

Service start must register the servicing attendant and timestamp in the reception audit trail.

### 32.7 Scope classification boundary

For implementation and classification clarity:
- Sections 32.2, 32.4, 32.5, and 32.6 are mandatory baseline requirements.
- Section 32.3 identification channels are mandatory for non-biometric identifiers, while facial recognition remains optional and policy-gated.
- Smart Concierge advanced automation remains future-approved unless explicitly prioritized for a delivery phase.

### 32.8 Smart Concierge future-scope note

This section title is intentionally combined for requirement traceability. Mandatory requirements in section 32 are reception-focused, while Smart Concierge advanced automation remains future scope and is formally classified under section 19.

---

## 33. Direct Service Order Retrieval Workflow (Independent of Reception Queue)

### 33.1 Objective

The platform must support direct Service Order retrieval without requiring reception queue participation.

### 33.2 Search and retrieval criteria

Direct retrieval must support search by:
- Service Order Number
- Customer Name
- Phone Number
- QR Code
- Customer Code

### 33.3 Business purpose

This workflow exists to support fast Service Order retrieval and delivery operations when queue registration is not required.

---

## 34. Physical Item Location Management

### 34.1 Objective

The platform must manage physical storage and operational location references for tracked items across service and production workflows.

### 34.2 Location structure

The location model must support hierarchical structures composed of:
- Area
- Room
- Corridor
- Row
- Shelf
- Cabinet
- Drawer
- Bin

Examples of valid location references include:
- Row A / Shelf 03
- Row B / Shelf 07

### 34.3 Functional requirements

The platform must support:
- current location assignment
- location history
- transfers between locations
- location audit trail
- search by location attributes

Location data must be visible on:
- Service Orders
- Service Order Items
- Production Bags

---

## 35. Third-Party Pickup Authorization

### 35.1 Objective

The platform must support controlled pickup authorization for customers and authorized third parties.

### 35.2 Eligible collectors

Authorized collectors may include:
- family members
- employees
- delivery drivers
- couriers
- other third parties

### 35.3 Authorization methods

Supported authorization methods must include:
- QR Code Pickup Authorization
- Pickup Token
- Temporary Pickup Code
- Remote Customer Approval

Authorization belongs to the customer. The customer may share the authorization according to configured policy.

### 35.4 Validity and traceability

Authorization controls must support:
- configurable validity duration
- explicit expiration date/time
- one-time or policy-based reuse rules
- full traceability for each pickup

### 35.5 Pickup audit requirements

Pickup authorization and release events must log:
- authorized customer
- collector
- date
- time
- Service Order
- releasing user
- authorization method
- device information where available

### 35.6 Remote approval workflow

Remote Customer Approval must provide explicit approve/reject actions to the customer, and the decision must be logged with timestamp and actor context.

---

## 36. Pickup Evidence and Chain of Custody

### 36.1 Objective

The platform must support pickup evidence capture to maintain chain-of-custody traceability.

### 36.2 Evidence types

Supported pickup evidence types include:
- Digital Approval
- Pickup Token
- Pickup QR Code
- Temporary Code
- CCTV Reference
- Camera Snapshot
- Audit Logs

### 36.3 Capture rules at pickup confirmation

Every pickup confirmation must generate minimum mandatory custody evidence:
- pickup confirmation timestamp
- Service Order reference
- collector identification or declared collector identity
- releasing user
- authorization/evidence method used
- immutable audit-log event identifier

On pickup confirmation, the system may:
- capture an integrated-camera snapshot
- record a CCTV reference

When such evidence is captured, the system must store:
- date
- time
- camera identifier
- Service Order
- pickup event reference

All pickup evidence must be linked to the corresponding Service Order.

Pickup evidence containing camera snapshots, image references, or CCTV references must follow sensitive-data controls, including restricted access by role, purpose-based usage, and retention/deletion policy enforcement.

---

## 37. Physical Access Control (Optional Enterprise Module)

### 37.1 Module status and scope

Physical Access Control is an optional enterprise module for tenants that require integrated control of physical entry points.

### 37.2 Controlled assets and functions

The module must support doors, gates, and turnstiles, including:
- remote opening and closing
- access event logging
- attendance integration
- Smart Concierge integration

### 37.3 Authentication methods

Supported authentication methods include:
- QR Code
- PIN
- RFID
- Biometrics
- Facial Recognition
- Mobile App

### 37.4 Safety and governance rules

Automatic opening is optional and tenant-configurable.

Facial recognition alone must not require automatic unlocking. The module must support manual approval workflows and physical override controls.

### 37.5 Example flow

Example operational flow:
customer identified -> additional approved factor or manual approval -> optional automatic access -> queue registration -> reception notification.

---

## 38. Formal Definitions: User versus Operational Resource

### 38.1 Definitions

- User: person with system access.
- Operational Resource: entity capable of performing work.

### 38.2 Operational Resource examples

Examples include:
- Employee
- Contractor
- Temporary Worker
- Machine
- Workstation
- Team

### 38.3 Relationship and independence rules

- A User may be an Operational Resource.
- A User may not be an Operational Resource.
- An Operational Resource may not be a User.
- Resource assignment and user permissions remain independent.

---

## 39. SLA Model

### 39.1 SLA lifecycle events

The platform must support the SLA event model:
- SLA Start
- SLA Pause
- SLA Resume
- SLA Complete
- SLA Violation

### 39.2 Calendar and time controls

SLA calculation and monitoring must support:
- Business Calendars
- Branch Calendars
- Holidays
- Branch Time Zones

### 39.3 SLA applicability

SLA controls apply to:
- Service Orders
- Production Orders
- Warranty Repairs
- Rework
- Deliveries

### 39.4 SLA trigger rules by domain

To make SLA behavior implementation-ready, the platform must support configurable trigger mapping per workflow status/event:
- Service Orders: SLA Start when order status enters an active execution state; SLA Pause during customer-pending or external-blocked states; SLA Resume when active processing restarts; SLA Complete at delivery/completion closure; SLA Violation when elapsed business time exceeds configured threshold.
- Production Orders: SLA Start when production is released; SLA Pause when waiting for material/dependency or approved hold; SLA Resume on production restart; SLA Complete on production completion approval; SLA Violation on threshold breach.
- Warranty Repairs: SLA Start when warranty case is accepted; SLA Pause when waiting for customer input/asset return; SLA Resume when repair execution resumes; SLA Complete on warranty resolution confirmation; SLA Violation on threshold breach.
- Rework: SLA Start when rework is opened; SLA Pause when blocked by dependency or customer action; SLA Resume on reassignment/restart; SLA Complete on rework quality approval; SLA Violation on threshold breach.
- Deliveries: SLA Start when item/order enters ready-for-delivery state; SLA Pause for approved delivery holds; SLA Resume when dispatch process reactivates; SLA Complete at delivery confirmation; SLA Violation on threshold breach.

Trigger configuration must be tenant-aware, branch-aware, and auditable.

---

## 40. Financial Exception Management

### 40.1 Objective

The platform must provide explicit workflows for financial exceptions to ensure operational and accounting traceability.

### 40.2 Supported exception workflows

The system must support workflow handling for:
- Refunds
- Chargebacks
- Reversals
- Overpayments
- Underpayments
- Duplicate Payments
- Failed Settlements
- Payment Allocation Corrections

Each exception workflow must register reason, approver where required, related Service Order context, financial impact, and audit evidence.

---

## 41. Financial Source of Truth

### 41.1 Source-of-truth allocation

The platform must formalize financial source-of-truth responsibilities as follows:
- Service Order = Business Source of Truth
- Payment Gateway / Payment Terminal = Authorization Source
- Bank Reconciliation = Settlement Source
- Fiscal System = Tax Source
- Accounting System = Accounting Source
- Cash Flow Reporting = Reporting Source

### 41.2 Consistency rule

Financial workflows and reports must preserve consistency across these sources and trace all reconciliation breaks.

The Reporting Source classification for Cash Flow Reporting represents a derived reporting-consumption layer, not an independent transactional authority.

### 41.3 Conflict-resolution precedence

When sources disagree, the system must apply the following precedence per disputed dimension:
- Requested commercial amount and business intent: Service Order.
- Payment authorization state: Payment Gateway / Payment Terminal.
- Settlement confirmation and received amount: Bank Reconciliation.
- Tax document status and tax values: Fiscal System.
- Accounting posting status and ledger classification: Accounting System.
- Analytical aggregations and KPI presentation: Cash Flow Reporting, derived from reconciled upstream sources.

---

## 42. Requirement Classification Model

### 42.1 Classification structure

Each requirement or sub-feature entry in the classification matrix must be classified as exactly one of:
- Mandatory: required baseline capability for enterprise operation
- Optional: tenant-configurable or phase-selective capability
- Future: approved roadmap capability not required in baseline delivery

Parent feature domains may be decomposed into child entries with different classifications, but each listed matrix entry must still have exactly one classification.

### 42.2 Classification matrix (V1.2)

Domain-to-classification matrix:
- Product vision and product purpose — Mandatory
- SaaS multi-tenant model — Mandatory
- Multi-company and group scenarios — Mandatory
- Multi-branch model and hierarchy — Mandatory
- User profiles and permissions — Mandatory
- User impersonation and auditability controls — Mandatory
- CRM — Mandatory
- Customers — Mandatory
- Body measurements — Optional
- Service Orders — Mandatory
- Service Order Items — Mandatory
- Production Orders — Mandatory
- Production Order versioning — Mandatory
- Quality control — Mandatory
- Customer rejection flow — Mandatory
- Rework flow — Mandatory
- Rework reassignment — Mandatory
- Warranty repair flow — Mandatory
- Partial delivery — Mandatory
- Payment by item — Mandatory
- Partial payments — Mandatory
- Expected cash flow — Mandatory
- Actual cash flow — Mandatory
- Payment terminal integration — Mandatory
- Fiscal documents — Mandatory
- Inventory module — Optional
- Purchasing module — Optional
- Workflow engine — Mandatory
- Dynamic statuses — Mandatory
- Status behavior parameters — Mandatory
- Delivery type configuration — Mandatory
- Operational priority model — Mandatory
- Production scheduling — Mandatory
- Attendance tracking — Mandatory
- Operational Resource management — Mandatory
- QR Code operational tracking — Mandatory
- Production Bag management — Mandatory
- Digital approvals and customer consent — Mandatory
- WhatsApp integration — Mandatory
- Communication and notification framework — Mandatory
- Facial recognition reception identification (optional and policy-gated) — Optional
- Advanced facial recognition roadmap (section 20.3) — Future
- Dashboards and analytics — Mandatory
- Audit logs and traceability — Mandatory
- LGPD compliance — Mandatory
- Security governance — Mandatory
- Backup and recovery — Mandatory
- Customer Reception Workflow (section 32 baseline requirements) — Mandatory
- Smart Concierge module roadmap scope (section 19) — Future
- Direct Service Order retrieval workflow — Mandatory
- Physical Item Location Management — Mandatory
- Third-Party Pickup Authorization — Mandatory
- Pickup Evidence and Chain of Custody — Mandatory
- Physical Access Control — Optional
- User versus Operational Resource formal definitions — Mandatory
- SLA Model — Mandatory
- Financial Exception Management — Mandatory
- Financial Source of Truth — Mandatory
- Requirement Classification Model — Mandatory

---

## 43. V1.1 to V1.2 Delta Summary

V1.2 preserves the complete V1.1 baseline and formalizes/expands enterprise requirements for:
- terminology normalization to Operational Resource and profession-agnostic wording
- customer reception operational workflow and Smart Concierge readiness/governance boundaries
- direct Service Order retrieval independent from queue flow
- physical location management for tracked items
- third-party pickup authorization with remote approval options
- pickup evidence and chain-of-custody controls
- optional enterprise physical access control integration
- formal User versus Operational Resource definitions
- SLA model and calendar/time-zone controls
- financial exception workflows
- financial source-of-truth governance
- requirement classification model and matrix
- SRS architecture-readiness definition scoring method

---

## 44. New Functional Requirements List

V1.2 adds the following new functional requirements:
1. Digital reception queue lifecycle with defined statuses and auditability.
2. Multi-channel customer identification for reception including optional facial recognition constraints.
3. Reception dashboard with queue-visible customer context and authorized detail-panel access to operational/financial indicators.
4. Temporary non-identified customer queue handling and minimum registration rules.
5. Direct Service Order retrieval workflow independent of queue participation.
6. Hierarchical physical item location management with history and transfer traceability.
7. Third-party pickup authorization methods with customer-controlled sharing and expiry.
8. Remote customer approval decision capture for third-party pickup.
9. Pickup evidence and chain-of-custody records linked to Service Orders.
10. Optional physical access control integration with non-mandatory automatic unlocking.
11. Formal User versus Operational Resource definitions and independence rules.
12. Standard SLA event lifecycle and calendar-aware computation model.
13. Explicit financial exception workflows for advanced reconciliation scenarios.
14. Financial source-of-truth model across business, authorization, settlement, tax, accounting, and reporting layers.
15. Formal requirement classification model with Mandatory/Optional/Future classification.

---

## 45. Updated Business Rules List

The following business rules are formally reinforced or introduced in V1.2:
- The platform must avoid hard-coding profession-specific or industry-specific role names into the core domain model.
- Customer identification by facial recognition is optional and cannot auto-create Service Orders.
- Customer identification by facial recognition cannot auto-open customer records.
- Customer records open in reception only when an attendant starts service.
- Reception queue order must follow arrival timestamp.
- Third-party pickup must require explicit customer authorization by approved methods.
- Pickup authorizations must be time-bounded and fully auditable.
- Pickup evidence must be linked to Service Order events when captured.
- Physical access automatic opening is optional and tenant-configurable.
- Facial recognition alone must not force automatic physical unlocking.
- SLA calculations must respect business calendars, branch calendars, holidays, and branch time zones.
- Financial exception events must follow explicit workflows with auditability.
- Financial reconciliation and reporting must honor the defined source-of-truth split across systems.

---

## 46. Updated SRS Architecture-Readiness Definition Score

SRS architecture-readiness definition scoring method for V1.2 is defined by the checklist and formula in this section.

Objective scoring method:
- The score is computed from a binary checklist of 20 SRS-scoped architecture-readiness controls (each item = 5 points).
- Formula: `(implemented_controls / 20) * 100`.
- Current assessment values must be recorded in the versioned assessment entry below.
- Scope note: this score measures SRS completeness/readiness definition quality only; it does not claim implementation or production readiness.

Derived checklist summary of scored controls (non-authoritative; source of truth remains the referenced sections):
1. [Implemented] Terminology normalization in role/resource model (sections 4 and 6).
2. [Implemented] Reception digital queue lifecycle (section 32.2).
3. [Implemented] Reception status model (section 32.2).
4. [Implemented] Reception identification channels and constraints (section 32.3).
5. [Implemented] Reception dashboard queue-visible context (section 32.4).
6. [Implemented] Non-identified customer workflow and minimal registration (section 32.5).
7. [Implemented] Attendant service start and reason capture (section 32.6).
8. [Implemented] Direct Service Order retrieval independent of queue (section 33).
9. [Implemented] Physical item location hierarchy and transfer/history (section 34).
10. [Implemented] Third-party pickup authorization and remote approval (section 35).
11. [Implemented] Pickup evidence and chain-of-custody requirements (section 36).
12. [Implemented] Physical access control optional module governance (section 37).
13. [Implemented] Formal User versus Operational Resource definitions (section 38).
14. [Implemented] SLA lifecycle model and trigger mapping (section 39).
15. [Implemented] Financial exception workflows (section 40).
16. [Implemented] Financial source-of-truth model (section 41).
17. [Implemented] Requirement classification structure and matrix (section 42).
18. [Implemented] Delta summary and new requirements traceability artifacts (sections 43 and 44).
19. [Implemented] Updated business-rules consolidation (section 45).
20. [Implemented] Updated architecture-readiness scoring method and governance definition (section 46).

Assessment method and ownership:
- Assessment owner: Product / Business Requirements with Architecture and Compliance review.
- Update cadence: each SRS version change or major business-rule revision.
- Acceptance criteria: each checklist control must be explicitly mapped to a section in this SRS and marked implemented/not-implemented.
- Governance rule: this score is informational for architecture readiness planning and does not replace formal release approval gates; Product Leadership and Architecture Governance jointly approve, accept with conditions, or override the score rationale.

### 46.1 Versioned assessment entry (V1.2)

- Assessment date/version: 2026-09-20 / V1.2 release baseline
- Checklist result: all 20 controls marked implemented
- Computed score: **100/100**

---

## 47. Modified Sections List

The following areas were modified or added in V1.2:
- Header and document status version references (V1.2)
- Section 4 users/roles terminology adjustment
- Section 6 terminology statement normalization
- Section 31 document control updates
- Section 32 Customer Reception and Smart Concierge Workflow (new)
- Section 33 Direct Service Order Retrieval Workflow (new)
- Section 34 Physical Item Location Management (new)
- Section 35 Third-Party Pickup Authorization (new)
- Section 36 Pickup Evidence and Chain of Custody (new)
- Section 37 Physical Access Control (new, optional module)
- Section 38 Formal Definitions: User versus Operational Resource (new)
- Section 39 SLA Model (new)
- Section 40 Financial Exception Management (new)
- Section 41 Financial Source of Truth (new)
- Section 42 Requirement Classification Model (new)
- Section 43 V1.1 to V1.2 Delta Summary (new)
- Section 44 New Functional Requirements List (new)
- Section 45 Updated Business Rules List (new)
- Section 46 Updated SRS Architecture-Readiness Definition Score (new)
- Section 47 Modified Sections List (new)
