STATUS: BASELINE APPROVED

DATE: 2026-09-20

PURPOSE:
Frozen reference version approved before conceptual database modeling.

---

# ANEXSYS Platform
# Enterprise Software Requirements Specification (SRS)
# Version: V1.3

## 1. Document status

This document is the authoritative functional specification for the ANEXSYS platform. It defines the business, operational, security, and integration requirements for the product and is the source of truth for all subsequent analysis, architecture, implementation, testing, and deployment work.

Version V1.3 extends the functional baseline established in V1.0, V1.1, and V1.2, and adds formal enterprise requirements for Service Order versus Production Order separation, visually managed production deadlines, production bag/container business demarcation, operational diary execution support, refined warranty and rework attribution models, expanded pickup controls, and broader chain-of-custody accountability.

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
- physical production bag/container handling
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
- physical production bag/container usage

Business requirements:
- a user may belong to one or more branches
- roles may be branch-specific or cross-branch
- customers may be global or branch-specific
- each production order and each service order must have a single owning branch, while cross-branch participation may be represented only through references, transfers, or related-branch context
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
- production batches or physical bag/container handling tasks where applicable
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

### 6.12 Piece-based productivity model

The primary productivity metric must be Pieces Produced, not the number of Service Orders or physical bag/container counts.

Illustrative productivity example:
- Service Order A = 10 pieces
- Service Order B = 2 pieces
- productivity result = 12 pieces produced

Ranking and performance rules:
- Operational rankings must be based on Pieces Produced
- Operational rankings must also consider Quality Indicators
- Operational rankings must also consider Rework Indicators
- Operational rankings must also consider Warranty Indicators
- Service Order counts and physical bag/container counts may be used as secondary workload references, but not as the primary productivity result

---

## 7. Service orders

### 7.1 Service order objective

The Service Order is the commercial, financial, and customer-facing document that represents the customer commitment, scope, delivery expectation, financial value, customer approvals, customer communications, warranty relationship, and production origination context.

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
- Commercial Responsible
- Technical Measurement Responsible
- created date
- expected completion date
- delivery commitment date(s)
- delivery type
- operational priority
- status
- financial values
- discounts and financial adjustments
- payment terms
- payment records
- warranty records
- customer approval records
- customer communication records
- fiscal references
- related production orders
- related physical bag/container reference where applicable
- QR Code reference
- related documents
- notes and attachments

Responsibility requirements for each Service Order:
- Commercial Responsible
  - purpose: customer service and commercial responsibility
  - default: logged user
  - editable: yes
  - mandatory at Service Order creation
- Technical Measurement Responsible
  - purpose: measurements, markings, and technical evaluation
  - may differ from Commercial Responsible
  - editable: yes
  - mandatory before production release when technical measurement or marking is required
- Operational Responsible
  - defined through Production Order execution
- Quality Responsible
  - defined through Quality workflow

The platform must support separated accountability for commercial service, technical measurement, operational execution, and quality validation.

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
- related physical bag/container reference where applicable

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
- Standard
- Priority
- Express

Priority and Express may apply a configurable surcharge.

Supported surcharge methods:
- Fixed value
- Percentage

Tenants may configure additional types while preserving the baseline semantics of Standard, Priority, and Express.

The platform must support Operational Priority as a distinct control that may be applied at service order, service order item, production order, physical bag/container context where used, workflow, or task level.

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

Delivery Type must affect:
- Workflow
- Scheduling
- Dashboards
- Alerts
- SLA

### 7.12.1 Delivery Date Engine

The platform shall automatically suggest delivery dates.

The default suggestion must be calculated from the Service Order creation date/time in the applicable branch time zone.

Default rule:
- the suggested date must be the same weekday in the immediately following calendar week, which is exactly 7 calendar days later

The platform must automatically consider:
- Holidays
- Branch Calendars
- Tenant Calendars

Calendar conflict rule:
- a date is valid only when it is a working day in the applicable Branch Calendar and Tenant Calendar and is not marked as non-working by an applicable Holiday rule
- when any applicable Branch Calendar, Tenant Calendar, or Holiday rule marks the date as non-working, that date must be treated as non-working

If the calculated date falls on a non-working day, the system must automatically move the date to the next valid business day.

The final calendar-adjusted suggested date becomes the Promised Delivery Date / delivery commitment date used by downstream scheduling, SLA, and Production Buffer / Safety Window calculations unless it is later changed through an authorized business action.

### 7.13 Service Order versus Production Order

The platform must maintain Service Order and Production Order as separate but linked documents with different business purposes.

Service Order (SO) requirements:
- commercial, financial, and customer-facing record
- customer reference and customer commitments
- financial values, discounts, payments, and balances
- delivery commitment date
- warranty records
- customer approvals
- customer communications
- fiscal references

Production Order (PO) requirements:
- operational execution document generated from a Service Order
- service instructions
- piece descriptions
- measurements
- photos
- observations
- priority
- delivery target date
- QR Code
- workflow information
- Operational Resource assignment

Production Orders must never display prices, discounts, margins, profit, commissions, payment information, or other financial information.

---

## 8. Production orders

### 8.1 Production order objective

A Production Order is the operational execution document generated from a Service Order to produce or complete one or more authorized service order items. Exactly one base Production Order must be generated per Service Order, and that Production Order may cover one or more authorized Service Order Items within the same Service Order scope. It must remain operational in purpose and must never become the customer-facing or financial source document.

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
- originating Service Order reference
- originating Service Order Item reference set or authorized item-scope reference
- production type
- service instructions
- piece description
- measurements
- photos or visual references
- observations
- planned quantity
- produced quantity
- delivery type
- operational priority
- customer delivery target date
- scheduled start and end dates
- assigned team or Operational Resource
- workflow information and current status context
- version reference
- QR Code reference
- physical bag/container reference where applicable
- linked quality control results
- linked rework records
- linked warranty execution records where applicable

Production Orders must never display prices, discounts, margins, profit, commissions, payment information, or other financial information.

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

### 8.6 Production Order visual delivery date

Each Production Order must display the customer delivery date in a highly visible visual format that supports production-line execution without opening the full document in detail.

Visual-delivery-date requirements:
- the day number must be visually dominant
- the month may appear smaller beside or beneath the day number
- the format must remain readable from a distance
- the format must remain visible in production-line displays and operational camera views
- the display must support visual production management and fast deadline recognition
- highly visible indicators such as `[ EXPRESS ]`, `[ WARRANTY ]`, `[ REWORK ]`, and `[ PRIORITY ]` must be supported when applicable
- the printed Production Order document must remain financially clean and must not display prices, discounts, margins, profit, commissions, payment information, or other financial data

Illustrative format example: large day number `26` with smaller month `SEP` beneath or beside it.

When a Production Order is printed for operational floor use and placed in a physical bag/container, that printed operational copy must support an A5 format.

### 8.7 Production buffer / safety window

The platform must support a configurable Production Buffer / Safety Window whose purpose is to allow internal quality review and correction before the customer commitment date.

Buffer requirements:
- configuration must be tenant-specific
- baseline example defaults are Standard = 3 days, Priority = 2 days, Express = 0 days
- the system must calculate Promised Delivery Date
- the system must calculate Internal Production Deadline
- the system must calculate Internal Quality Deadline
- derived internal deadlines must support planning, alerting, and workload sequencing

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
- linked Production Order QR Code and physical bag/container context where applicable

### 9.4 Customer rejection

The platform must support customer rejection events after delivery or during final acceptance.

Requirements:
- rejection must be linked to a specific item, quantity, batch, physical bag/container context, or lot
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

### 9.10 Rework Attribution Model

The platform must support formal rework attribution rules.

Attribution requirements:
- when an Operational Resource causes a failure, that original resource must receive the applicable rework indicator, quality penalty, and performance impact according to tenant rules
- when a different Operational Resource performs the correction, the corrective resource must receive productivity credit and piece-count credit for the corrective execution
- the corrective resource must not receive the rework penalty or the quality penalty caused by the original failure
- the system must retain the original responsible resource, corrective resource, and complete rework history
- attribution records must remain auditable in quality, productivity, and ranking views

### 9.11 Warranty model refinement

The warranty model must distinguish between Warranty Adjustment and Warranty Execution.

Warranty Adjustment requirements:
- represents a customer fit adjustment after delivery
- examples include too long, too short, too loose, and too tight

Warranty Execution requirements:
- represents a service execution failure or operational defect after delivery
- examples include seam reopened, zipper failure, or repair failed

Additional warranty rules:
- warranty periods must be tenant-configurable with a suggested default of 7 days
- warranty start date must be the actual pickup or delivery date
- the system must preserve separate tracking, reporting, and indicators for Warranty Adjustment and Warranty Execution

---

## 10. QR Code Operational Tracking

### 10.1 Objective

The platform must provide QR Code Operational Tracking to enable fast identification, scanning, and traceability throughout execution.

### 10.2 QR Code scope

The platform must support QR Codes for:
- each Service Order
- each Service Order Item
- each Production Order
- each Production Batch or other configurable workflow object where required
- other configurable workflow objects where required

For production execution, QR Codes belong to Production Orders.

### 10.3 Scanning requirements

QR Code scanning must be supported during workflow execution for activities including:
- receiving and identifying work
- starting an operational step
- assigning or confirming an Operational Resource
- starting execution by scanning the Production Order QR Code
- assuming operational responsibility by scanning the Production Order QR Code
- updating production status by scanning the Production Order QR Code
- updating the Operational Diary by scanning the Production Order QR Code
- moving work between stages
- confirming physical bag/container usage context when operationally necessary, always through the Production Order QR Code context
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

The system must support complete operational traceability from Service Order to Service Order Item, Production Order, physical bag/container context where used, quality events, delivery, rework, warranty repair, and customer confirmation.

---

## 11. Production Bag management

### 11.1 Objective

The Production Bag is a physical container used to store the pieces belonging to a Service Order and the printed operational Production Order copy (A5).

The Production Bag is not a primary business entity. The primary operational execution entity is the Production Order.

### 11.2 Bag requirements

The platform must support:
- linked Service Order
- linked Service Order Items
- linked Production Orders
- responsible branch or operational area where physically relevant
- current physical status and location when the bag/container is used
- notes and attachments

The bag/container itself does not require:
- business numbering
- independent QR Code
- independent business identity

### 11.3 Production Bag business rules

The following rules are mandatory:
- the Production Bag may be used as a physical container when operationally useful
- the bag/container stores the pieces belonging to a Service Order
- the bag/container stores the printed operational Production Order copy (A5)
- the bag/container must not become the primary governed execution object

The following conditions are prohibited:
- treating the Production Bag as an independent primary business entity
- assigning independent business numbering to the Production Bag
- assigning an independent QR Code to the Production Bag
- treating the Production Bag as a standalone QR-tracked business identity

### 11.4 Production Order execution responsibility

Operational responsibility must be defined through Production Order execution, not through bag ownership.

Execution requirements:
- QR Codes belong to Production Orders
- the Operational Resource scans the Production Order QR Code to start execution
- the Operational Resource scans the Production Order QR Code to assume responsibility
- the Operational Resource scans the Production Order QR Code to update production status
- the Operational Resource scans the Production Order QR Code to update the Operational Diary

### 11.5 Physical handling restrictions

Because the bag is a physical container rather than a primary business entity, bag handling must preserve the traceability of the linked Service Order and Production Order without creating a separate business-governance model.

Physical handling rules:
- any bag/container replacement must preserve traceability through the linked Service Order and Production Order context
- any operational use of the bag/container must not break piece retrieval visibility
- any movement or storage event may be recorded as physical traceability context without creating an independent bag business identity

### 11.6 Bag lifecycle and history

When used, a physical Production Bag/container may support operational lifecycle visibility such as staging, in progress, quality review, ready for delivery, delivered, closed, rework support, warranty support, and cancelled.

The platform must maintain full history of:
- physical association when used
- movement
- quality events
- rework or warranty repair
- storage
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
- each delivery may be linked to a warehouse, branch movement, physical bag/container context, or QR-tracked event
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

The external payment terminal must not be treated as the source of truth for the business amount. The Service Order workflow is the source of the payment request, allocation, and reconciliation context. Financial settlement information belongs to the Service Order context and must not be displayed on Production Orders.

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

Fiscal references remain part of the Service Order business context and must not be displayed on Production Orders.

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
- physical bag/container status where used
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
- associating a physical bag/container or updating its location/handling context when used

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
- physical bag/container handling where used
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
- Operational Diary
- branch and tenant performance
- delivery type and operational priority performance
- physical bag/container location visibility and QR-code traceability status

### 21.3 Operational Resource Dashboard

The platform must provide an Operational Resource Dashboard for authorized users.

Required metrics include:
- Pieces Produced as the primary productivity metric
- quality indicators
- rework indicators
- warranty indicators
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
- pieces produced
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
- physical bag/container location and aging visibility
- QR scan and traceability exceptions

### 21.5 Real-time versus retrospective reporting

The platform must provide both operational dashboards and period-based reporting views, with clear differentiation between real-time live data and historical reporting snapshots.

### 21.6 Dashboard behavior and status visibility

Statuses configured to appear on dashboards must be visible according to their status behavior parameters. Priority, delivery type, blocked delivery, quality failure, rework, warranty repair, and approval-required conditions must be visually identifiable where relevant.

### 21.7 Operational Diary

The platform must provide an Operational Diary that allows Operational Resources to execute work directly from a mobile device without requiring constant consultation of a printed Production Order.

Operational Diary views:
- Synthetic View: pieces completed today, Service Orders completed, reworks, warranty repairs, and quality indicators
- Analytical View: every assigned Production Order or operational task showing parent Service Order number, customer, physical bag/container reference or location where applicable, piece description, service description, measurements, photos, delivery date, priority, and current status

Operational Diary execution updates must be driven by Production Order QR Code scanning, not by independent bag/container scanning.

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
- physical bag/container association, replacement when applicable, and movement
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
- related Service Order, Service Order Item, Production Order, physical bag/container context, or approval context where applicable
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
- QR-code and physical bag/container location traceability data
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

The system must support increasing user counts, branches, Operational Resources, physical bag/container references, QR-code events, and data volume without requiring redesign of the core functional model.

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
8. optional physical bag/container association where operationally useful
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
- Body measurements, physical Production Bags/containers, facial recognition, Smart Concierge, and inventory may be enabled only for relevant tenants or phases.

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
- Version: V1.3
- Status: Expanded functional specification
- Extends: SRS_MASTER_V1.2.md
- Owner: Product / Business Requirements
- Review cadence: at least once per major phase or when a business rule changes materially

This document preserves the V1.0, V1.1, and V1.2 functional baseline and adds the V1.3 requirements. It constitutes the functional source of truth for ANEXSYS and must be used before any architecture, database, workflow, or implementation design is developed.


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

This recognized-customer queue visibility is mandatory to support customers who arrive only for pickup.

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

This workflow exists to support fast Service Order retrieval and delivery operations when queue registration is not required, and it must remain independently usable without any dependency on reception-queue participation.

---

## 34. Physical Item Location Management

### 34.1 Objective

The platform must manage physical storage and operational location references for tracked items across service and production workflows.

Service Orders may be physically stored in the supported location hierarchy, and the selected location must remain visible during retrieval.

### 34.2 Location structure

The location model must support a hierarchical structure composed of:
- Area
- Corridor
- Row
- Shelf
- Cabinet
- Drawer

To preserve V1.2-compatible structures, the model may also support optional extended levels such as Room and Bin when a tenant requires them.

Tenants may configure additional subordinate labels when needed, provided the baseline hierarchy above remains supported.

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
- Item View
- Pickup Process
- Direct Service Order Retrieval
- Search Results

Location must be visible during retrieval.

---

## 35. Third-Party Pickup Authorization

### 35.1 Objective

The platform must support controlled pickup authorization for customers and authorized third parties.

### 35.2 Eligible collectors

Authorized collectors may include:
- family members
- employees
- courier companies
- motorcycle couriers
- other third parties

### 35.3 Authorization methods

Supported authorization methods must include:
- Pickup Token
- Pickup QR Code
- Temporary Pickup Code
- Remote Approval

Authorization belongs to the customer. The customer may share the authorization according to configured policy.

### 35.4 Validity and traceability

Authorization controls must support:
- configurable validity duration
- explicit expiration date/time
- one-time or policy-based reuse rules
- full traceability for each pickup

### 35.5 Pickup audit requirements

Pickup authorization and release events must log:
- customer
- authorized person
- date
- time
- Service Order
- released-by user
- authorization method
- device information where available

### 35.6 Remote approval workflow

Remote Customer Approval must provide explicit approve/reject actions to the customer, and the decision must be logged with timestamp and actor context.

---

## 36. Chain of Custody and Pickup Evidence

### 36.1 Objective

The platform must support end-to-end chain-of-custody traceability across intake, production, quality, rework, warranty, storage, delivery, and pickup.

### 36.2 Chain-of-custody scope

The chain of custody must track auditable critical events including:
- intake and customer handoff
- Production Order generation and execution
- quality review
- rework events
- warranty events
- storage location changes
- delivery preparation
- pickup completion

Every critical event in this lifecycle must be auditable.

### 36.3 Evidence types

Supported custody and pickup evidence types include:
- Digital Approval
- Pickup Token
- Pickup QR Code
- Temporary Code
- CCTV Reference
- Camera Snapshot
- Audit Logs

### 36.4 Capture rules at pickup confirmation

Every pickup confirmation must generate minimum mandatory custody evidence:
- pickup confirmation timestamp
- Service Order reference
- collector identification or declared collector identity
- releasing user
- authorization/evidence method used
- immutable audit-log event identifier

### 36.5 Camera integration

On pickup completion, the system may capture a camera snapshot or register a CCTV reference for evidence retention and operational security.

When such evidence is captured, the system must store:
- camera identifier
- Service Order
- event
- date
- time

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

Production Orders are operational execution documents only and must never become a source of truth for prices, discounts, margins, commissions, payment information, or fiscal values.

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

### 42.2 Classification matrix (V1.3)

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
- Service Order versus Production Order separation — Mandatory
- Service Order Items — Mandatory
- Production Orders — Mandatory
- Production Order versioning — Mandatory
- Production Order visual delivery date — Mandatory
- Production Buffer / Safety Window — Mandatory
- Quality control — Mandatory
- Customer rejection flow — Mandatory
- Rework flow — Mandatory
- Rework reassignment — Mandatory
- Rework Attribution Model — Mandatory
- Warranty repair flow — Mandatory
- Warranty Adjustment and Warranty Execution distinction — Mandatory
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
- Piece-based productivity model — Mandatory
- Operational Diary — Mandatory
- QR Code operational tracking — Mandatory
- Physical Production Bag / Container Handling — Mandatory
- Production Order-based execution responsibility and bag/container visibility — Mandatory
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
- Chain of Custody and core Pickup Evidence — Mandatory
- Pickup camera/CCTV evidence integration — Optional
- Physical Access Control — Optional
- User versus Operational Resource formal definitions — Mandatory
- SLA Model — Mandatory
- Financial Exception Management — Mandatory
- Financial Source of Truth — Mandatory
- Requirement Classification Model — Mandatory

---

## 43. Historical V1.1 to V1.2 Delta Summary (Preserved from V1.2)

The following sections are preserved historical appendix content copied forward from V1.2 for traceability inside the V1.3 master document.

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

## 44. Historical V1.2 New Functional Requirements List (Preserved from V1.2)

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

## 45. Historical V1.2 Updated Business Rules List (Preserved from V1.2)

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

## 46. Historical V1.2 Architecture-Readiness Definition Score (Preserved from V1.2)

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

- Historical assessment date/version: 2026-09-20 / V1.2 release baseline
- Checklist result: all 20 controls marked implemented
- Computed score: **100/100**

---

## 47. Historical V1.2 Modified Sections List (Preserved from V1.2)

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


---

## 48. V1.3 Update Delta Summary

### 48.1 Updated topics in this change
- Production Bag final model changes
- Service Order responsibility model additions
- Delivery Date Engine additions
- Delivery Type taxonomy and surcharge updates
- Production Order printed document updates
- Physical Storage Location updates

### 48.2 Production Bag final model changes
- The Production Bag is redefined as a physical container, not a primary business entity.
- The primary operational execution entity is the Production Order.
- The bag/container stores Service Order pieces and the printed Production Order (A5).
- Production Bags no longer require independent business numbering, independent QR Codes, or independent business identity.
- Production execution responsibility and Operational Diary updates are driven by Production Order QR Code scanning.

### 48.3 Service Order responsibility model additions
- Service Orders now require Commercial Responsible and Technical Measurement Responsible fields.
- Commercial Responsible defaults to the logged user and remains editable.
- Technical Measurement Responsible is editable and may differ from Commercial Responsible.
- Operational Responsible is defined through Production Order execution.
- Quality Responsible is defined through the Quality workflow.

### 48.4 Delivery Date Engine additions
- The platform shall automatically suggest delivery dates by using a default calculation that is exactly 7 calendar days after the source date.
- Holidays, Branch Calendars, and Tenant Calendars must be considered automatically.
- Dates that fall on non-working days must move to the next valid business day.

### 48.5 Delivery Type taxonomy and surcharge updates
- Delivery Types are normalized to Standard, Priority, and Express.
- Priority and Express may apply configurable surcharge by Fixed value or Percentage.
- Delivery Type impact is formalized across Workflow, Scheduling, Dashboards, Alerts, and SLA.

### 48.6 Production Order printed document updates
- Production Orders must display a large delivery day number and a smaller month.
- Highly visible indicators such as `[ EXPRESS ]`, `[ WARRANTY ]`, `[ REWORK ]`, and `[ PRIORITY ]` are required when applicable.
- The printed operational Production Order copy used with the bag/container must support an A5 format.
- Production Orders remain financially clean and must not display financial data.

### 48.7 Physical Storage Location updates
- Service Orders may be physically stored by Area, Corridor, Row, Shelf, Cabinet, and Drawer.
- Location visibility is reinforced for retrieval, Direct Service Order Retrieval, Pickup Process, and Search Results.

### 48.8 Sections modified
- Section 1 Document status
- Section 2 Product overview
- Section 3 SaaS operating model
- Section 6 Operational Resource Management
- Section 7 Service orders
- Section 8 Production orders
- Section 9 Quality control, customer rejection, rework, and warranty repair
- Section 10 QR Code Operational Tracking
- Section 11 Production Bag management
- Section 12 Delivery, financial settlement, and payments
- Section 14 Workflow engine and dynamic statuses
- Section 15 Production scheduling and operational planning
- Section 21 Dashboards and analytics
- Section 22 Audit logs and traceability
- Section 24 Backup, recovery, and continuity
- Section 25 Non-functional requirements
- Section 26 Functional requirements summary by domain
- Section 27 Assumptions and constraints
- Section 34 Physical Item Location Management
- Section 42 Requirement Classification Model
- Section 48 V1.3 Update Delta Summary

---

## 49. Updated SRS Completeness Score

**Score: 97/100**

Rationale:
- V1.3 now covers the major functional boundaries between commercial documents, operational execution, physical bag/container usage, productivity, warranty, pickup, and chain-of-custody control at enterprise level.
- The document is intentionally still functional-only and avoids database, API, and implementation design, which is appropriate for the SRS scope.
- A small residual gap remains for tenant-by-tenant policy decisions such as exact default governance exceptions, ranking formulas, and evidence-retention durations that should be confirmed before downstream design decisions are frozen.

---

## 50. Updated Architecture Readiness Score

**Score: 96/100**

Rationale:
- The functional model now provides enough separation of concerns for architecture design across Service Orders, Production Orders, physical bag/container usage, quality, warranty, pickup, and mobility-oriented operational execution.
- Internal deadline computation, Production Order-centered execution responsibility, and end-to-end custody events are now specified well enough to support architecture decomposition and bounded-context definition.
- This score is informational only and not a release gate; final architecture still depends on confirming the remaining business-policy gaps listed below.

---

## 51. Updated Database Readiness Score

**Score: 94/100**

Rationale:
- The functional rules now define clearer data boundaries for core entities such as Service Order, Production Order, warranty cases, rework attribution, custody events, pickup authorization, and physical bag/container context.
- Auditability requirements are materially stronger, which improves downstream database readiness for history and accountability modeling.
- Remaining uncertainty is limited mainly to configurable policy ranges, final classification vocabularies, and tenant-specific retention/governance choices that should be settled before schema design begins.

---

## 52. Remaining Gaps Before Architecture Design

- Confirm the tenant policy for when physical bags/containers are used or replaced operationally while preserving Service Order and Production Order traceability.
- Confirm the tenant-configurable policy set for warranty periods, priority defaults, and Production Buffer defaults when tenants do not override them.
- Confirm whether Pickup Process visibility must expose full location hierarchy to all pickup roles or only to authorized pickup/reception roles.
- Confirm the exact governance of ranking formulas when Pieces Produced, Quality Indicators, Rework Indicators, and Warranty Indicators conflict in weighting.
- Confirm retention-policy ownership for camera snapshots and CCTV references by tenant, branch, and legal/compliance policy.

---

## 53. Modified and Added Sections List

- Header and document status version references (V1.3)
- Section 2 Product overview (scope terminology update)
- Section 3 SaaS operating model (branch scope terminology update)
- Section 6 Operational Resource Management (container-reference consistency update)
- Section 7 Service orders (responsibility model, delivery types, Delivery Date Engine)
- Section 8 Production orders (printed-document and delivery-visibility update)
- Section 9 Quality control, customer rejection, rework, and warranty repair (Production Order QR-code consistency update)
- Section 10 QR Code Operational Tracking (Production Order QR-code ownership update)
- Section 11 Production Bag management (final physical-container model)
- Section 12 Delivery, financial settlement, and payments (container-reference consistency update)
- Section 14 Workflow engine and dynamic statuses (container-context consistency update)
- Section 15 Production scheduling and operational planning (container-context consistency update)
- Section 21 Dashboards and analytics (Operational Diary and visibility update)
- Section 22 Audit logs and traceability (container-context consistency update)
- Section 24 Backup, recovery, and continuity (traceability terminology update)
- Section 25 Non-functional requirements (scalability terminology update)
- Section 26 Functional requirements summary by domain (journey consistency update)
- Section 27 Assumptions and constraints (scope terminology update)
- Section 34 Physical Item Location Management (retrieval visibility update)
- Section 42 Requirement Classification Model (matrix terminology update)
- Section 48 V1.3 Update Delta Summary (updated)
- Section 49 Updated SRS Completeness Score (consistency update)
- Section 50 Updated Architecture Readiness Score (consistency update)
- Section 51 Updated Database Readiness Score (consistency update)
- Section 52 Remaining Gaps Before Architecture Design (consistency update)
- Section 53 Modified and Added Sections List (updated)
