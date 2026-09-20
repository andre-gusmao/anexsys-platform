# ANEXSYS Platform
# FRONTEND_ARCHITECTURE_V1

## Document Purpose

This document defines the complete frontend architecture of ANEXSYS using the following approved documents as source of truth:
- `/docs/releases/BASELINE_V3.0.md`
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/BACKEND_ARCHITECTURE_V1.md`
- `/docs/API_DESIGN_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`

This document defines:
- frontend design principles
- user experience structure
- application channels
- navigation and screen organization
- desktop strategy
- mobile strategy
- customer portal strategy
- visibility and permission behavior
- frontend readiness

This document does not define:
- source code
- React components
- wireframes
- visual design system tokens
- implementation backlog

---

## 1. Executive Summary

ANEXSYS frontend architecture must translate the approved business and backend model into a multi-channel user experience that is:
- fast for high-frequency operational tasks
- simple for customer-service and finance workflows
- mobile-capable for operational execution
- secure for tenant, branch, and role-based visibility
- consistent across administrative, operational, customer, and concierge channels

The frontend must preserve the approved source-of-truth model:
- Service Order is the commercial and customer-facing truth
- Production Order is the operational execution truth
- the physical bag/container is optional support-only context

The frontend should therefore be structured as four coordinated experience channels:
- Administrative Portal
- Operational Mobile Portal
- Customer Portal
- Smart Concierge Interface

The architecture is ready to support frontend implementation because the domain boundaries, API ownership, operational flows, QR authority, workflow behavior, and visibility rules are already mature enough to drive screen design and navigation.

---

## 2. Design Principles

### 2.1 Simplicity
- each screen should have one clear operational purpose
- high-risk actions should use explicit action language and visible confirmations
- customer-facing screens should minimize internal terminology

### 2.2 Speed
- the frontend must reduce clicks for repetitive branch and floor operations
- list, search, scan, assign, update-status, approve, and retrieve actions should be optimized for short task cycles
- dashboards and queues should expose actionable summaries before drill-down

### 2.3 Mobile-first where appropriate
- operational execution, QR scanning, diary updates, quality tasks, rework, warranty execution, and pickup verification must work effectively on mobile
- the Operational Resource must be able to execute assigned work using only a mobile device

### 2.4 Desktop-first where appropriate
- administration, CRM, financial review, fiscal workflows, reporting, workflow design, and settings should prioritize desktop productivity
- large data tables, multi-step service-order pricing flows, and management dashboards should assume wider screens first

### 2.5 Accessibility
- support keyboard navigation for desktop-heavy users
- preserve readable contrast, status differentiation, and non-color-only indicators
- mobile task flows should support large tap targets and clear scan-state feedback

### 2.6 Multi-tenant support
- tenant context must be visible in administrative channels
- tenant-level settings, terminology, statuses, calendars, and workflows must appear consistent without leaking cross-tenant data

### 2.7 Multi-branch support
- branch context must be explicit in lists, dashboards, orders, and operational queues
- branch switching must be controlled and visible for users with multi-branch scope

---

## 3. User Experience Map

### 3.1 Platform Administrator
- primary channel: Administrative Portal
- main goals: platform governance, tenant lifecycle, support visibility, compliance oversight
- UX focus: tenant-wide controls, audit visibility, high-trust administration

### 3.2 Tenant Administrator
- primary channel: Administrative Portal
- main goals: configure branches, roles, workflows, calendars, visibility rules, and operational policies
- UX focus: settings, workflow configuration, branch governance, user administration

### 3.3 Branch Manager
- primary channels: Administrative Portal, selected mobile review
- main goals: branch performance, workload, SLA, delivery risk, resource productivity
- UX focus: branch dashboards, queue visibility, intervention actions, escalation visibility

### 3.4 Customer Service
- primary channel: Administrative Portal
- main goals: customer lookup, Service Order creation, follow-up, approvals, pickup readiness
- UX focus: fast customer search, service workflow progression, clear communication state

### 3.5 Finance
- primary channel: Administrative Portal
- main goals: payments, partial payments, financial exceptions, reconciliation, fiscal visibility
- UX focus: financially dense tables, exception queues, payment-history clarity

### 3.6 Quality
- primary channels: Administrative Portal, Operational Mobile Portal
- main goals: inspection, rejection, release, rework initiation, warranty execution tracking
- UX focus: decision clarity, evidence visibility, blocked-release warnings

### 3.7 Operational Resource
- primary channel: Operational Mobile Portal
- main goals: see assignments, scan QR, execute work, update status, record diary activity, complete quality/rework/warranty tasks
- UX focus: one-hand operation, fast scanning, minimal typing, visible deadlines and priorities

### 3.8 Customer
- primary channel: Customer Portal
- main goals: track Service Orders, review approvals, authorize pickup, request warranty support, view history
- UX focus: plain language, delivery visibility, secure self-service, status transparency

---

## 4. Application Channels

### 4.1 Administrative Portal
Purpose:
- primary desktop-oriented interface for internal users
- supports management, CRM, Service Orders, Finance, Fiscal, dashboards, workflow, and settings

### 4.2 Operational Mobile Portal
Purpose:
- mobile-first interface for Operational Resources and mobile quality users
- supports assignment viewing, QR scanning, execution updates, diary entries, quality actions, rework, and warranty execution

### 4.3 Customer Portal
Purpose:
- self-service visibility for customer tracking, approvals, history, pickup authorization, and warranty requests

### 4.4 Smart Concierge Interface
Purpose:
- reception and arrival-management interface for queue, lookup, retrieval, and controlled pickup support

---

## 5. Desktop Experience

### 5.1 Dashboard
- executive KPI view
- branch and tenant filters
- SLA alerts
- delivery risk indicators
- quality and financial summaries

### 5.2 CRM
- customer relationship timeline
- interactions
- segmentation
- communication preferences
- measurement history access

### 5.3 Customers
- customer directory
- customer profile
- contacts
- measurements
- Service Order history
- warranty history

### 5.4 Service Orders
- order list
- order detail
- item management
- pricing and approval state
- delivery commitment
- linked Production Order visibility

### 5.5 Financial
- payment entry and review
- partial payment allocation
- receivable visibility
- exception queues
- reconciliation status

### 5.6 Fiscal
- fiscal-document lifecycle
- issuance/cancellation state
- branch-aware fiscal visibility

### 5.7 Reports
- management reports
- productivity reports
- quality reports
- financial reports
- custody and pickup reports

### 5.8 Settings
- tenant settings
- branch settings
- user and permission management
- calendars
- templates
- notification behavior

### 5.9 Workflow Management
- workflow definitions
- status definitions
- SLA rules
- approval gates
- visibility behavior previews

---

## 6. Operational Mobile Experience

### 6.1 Operational Diary
- personal task timeline
- diary-entry creation
- event history per Production Order
- quick notes and completion markers

### 6.2 Assigned Production Orders
- today view
- overdue view
- priority view
- deadline-first ordering
- assignment acceptance and handoff visibility

### 6.3 QR Scanner
- scan Production Order QR
- instant validation result
- permission-aware next actions
- offline/retry state messaging where needed

### 6.4 Production Execution
- Production Order header
- visible delivery date
- piece and item visibility
- measurements
- instructions
- photos/evidence
- status-change actions

### 6.5 Quality Tasks
- inspection queue
- approve/reject actions
- defect/evidence registration
- blocked-release visibility

### 6.6 Rework
- rework queue
- original versus corrective attribution visibility
- reassignment state
- resolution recording

### 6.7 Warranty Execution
- warranty execution tasks
- linked customer/order context
- operational correction flow
- completion and evidence recording

### 6.8 Mobile operating rule
- every Operational Resource critical task must be executable on mobile without requiring desktop access

---

## 7. Service Order Experience

### 7.1 Creation workflow
- select or create customer
- define Service Order scope
- add service items
- register measurements
- calculate delivery date
- price and review
- request or capture approval
- confirm order creation

### 7.2 Customer selection
- fast search by name, phone, WhatsApp, document, or history
- recent customers and branch-aware suggestions
- duplicate-warning behavior

### 7.3 Service item management
- add, edit, remove, duplicate, and group items
- item-level notes, deadlines, and quality requirements

### 7.4 Technical measurement registration
- structured measurement capture
- version visibility
- technical-responsible attribution
- measurement reuse where allowed

### 7.5 Delivery Date Engine
- show suggested delivery date
- explain affected rule context when relevant
- expose branch/holiday/calendar impact in user-readable form

### 7.6 Pricing workflow
- commercial pricing review remains in Service Order context only
- financial information must not spill into Production Order views

### 7.7 Approval workflow
- visible approval status
- digital-approval request actions
- blocked progression if approval is required but missing

---

## 8. Production Experience

### 8.1 Production Order visualization
- operational header
- linked Service Order reference
- visible status and assignment state
- visible delivery date and priority markers

### 8.2 Piece visibility
- clear display of pieces or covered item scope
- grouping by operational execution context

### 8.3 Technical instructions
- concise operational instructions
- quality notes
- rework/warranty context where applicable

### 8.4 Measurements
- measurement snapshot visibility in operational format
- no need to open full CRM context for basic execution

### 8.5 Photos
- evidence, reference, or execution-support photo visibility

### 8.6 Delivery date display
- prominent display of customer deadline
- visible internal urgency and operational priority

### 8.7 Operational status updates
- explicit action buttons for permitted transitions
- diary update support
- responsibility assumption through QR-linked operational flow

### 8.8 Financial isolation rule
- Production Order screens must remain financially clean and must not expose prices, discounts, commissions, payment information, margins, or profit

---

## 9. Smart Concierge Experience

### 9.1 Customer arrival queue
- waiting queue
- called/in-service/complete states
- branch-aware arrival board

### 9.2 Identification methods
- customer name
- phone
- WhatsApp
- CPF
- customer code
- order number
- pickup code
- QR Code
- QR-based pickup credential
- optional facial-recognition integration where enabled
- fast manual lookup

### 9.3 Queue management
- arrival registration
- priority handling where configured
- reassignment between attendants
- retrieval-ready indicators

### 9.4 Fast customer lookup
- search by name, phone, order number, pickup authorization, or recent arrivals

### 9.5 Pickup workflow
- locate authorization
- validate credential
- confirm release readiness
- capture evidence and complete handoff

### 9.6 Direct Service Order retrieval
- direct jump from queue or lookup to Service Order summary, pickup status, and storage location visibility

---

## 10. Customer Portal

### 10.1 Service Order tracking
- order list
- current status
- delivery expectation
- approval pending/completed state
- pickup readiness visibility

### 10.2 Digital approvals
- approve or reject requested items or changes
- see approval history and pending actions in plain language

### 10.3 Warranty requests
- create warranty request
- track warranty progress
- view resolution state

### 10.4 Order history
- prior Service Orders
- prior approvals
- prior pickup or delivery states

### 10.5 Pickup authorization
- generate or receive pickup authorization where allowed
- assign third-party pickup
- view credential status

### 10.6 Customer-portal language rule
- customer portal must expose customer-safe statuses and must not expose internal-only operational, financial, or quality details unless explicitly approved for customer visibility

---

## 11. Dashboards

### 11.1 Management dashboard
- revenue and workload summaries
- branch comparison
- delivery-risk overview
- SLA breaches
- quality and rework indicators

### 11.2 Financial dashboard
- expected versus actual collections
- overdue values
- exception counts
- reconciliation status

### 11.3 Operational Resources dashboard
- workload
- assignment volume
- productivity
- completion indicators

### 11.4 Quality dashboard
- approvals
- rejections
- rework counts
- warranty events
- first-pass quality indicators

### 11.5 Production dashboard
- active Production Orders
- delayed production
- queue by status
- QR-driven execution visibility
- delivery urgency

### 11.6 Smart Concierge dashboard
- arrivals waiting
- pickup queue
- retrieval delays
- unresolved release blocks

---

## 12. Permission Visibility Model

### 12.1 Internal visibility
- internal users may see statuses according to role, branch, and object-state permissions
- financial data is limited to authorized commercial/finance roles
- quality findings are visible to quality, management, and explicitly authorized operations
- operational details are visible to relevant branch and execution roles

### 12.2 Customer visibility
- customers see only customer-safe statuses
- customers do not see internal financial analysis, productivity, blame attribution, or internal quality commentary
- customers may see approval, delivery, pickup, and warranty-resolution states

### 12.3 Operational Resource visibility
- Operational Resources see assignments, production instructions, deadlines, measurements, allowed statuses, diary history, and relevant quality actions
- Operational Resources must not see unnecessary commercial pricing or restricted finance data

### 12.4 Management visibility
- management users may see cross-domain dashboards, escalations, branch comparisons, and governed exception details according to branch and tenant scope

### 12.5 Visibility by information type

#### Statuses
- internal statuses may be richer than customer-facing statuses
- customer-facing statuses must be mapped from workflow-safe public states

#### Financial information
- full financial information belongs to Service Order and finance-facing screens only
- Production Order and operational mobile views must remain financially clean

#### Operational information
- operational information is fully visible to relevant internal execution roles
- customers see only translated progress states where appropriate

#### Quality information
- detailed quality findings are internal by default
- customer-facing quality visibility should be limited to decision outcomes, warranty state, or approved communication summaries

---

## 13. Navigation Model

### 13.1 Desktop navigation

Primary navigation:
- Dashboard
- CRM
- Customers
- Service Orders
- Production
- Quality
- Finance
- Fiscal
- Pickup & Custody
- Reports
- Workflow Management
- Settings

Context navigation:
- tenant selector where authorized
- branch selector where authorized
- global search
- alerts/inbox
- user menu

### 13.2 Mobile navigation

Primary navigation:
- My Work
- Assigned Orders
- QR Scanner
- Diary
- Quality
- Rework
- Warranty

Task navigation:
- persistent quick-scan action
- recent scans
- today/overdue filter
- assignment/status actions

### 13.3 Customer Portal navigation

Primary navigation:
- My Orders
- Approvals
- Warranty
- Pickup Authorization
- History
- Profile

Support navigation:
- order search
- notifications/messages
- secure sign-in/profile recovery

---

## 14. Screen Catalog

### Administrative Portal
- Login
- Tenant/Branch Context Selection
- Dashboard
- CRM Timeline
- Customer Directory
- Customer Profile
- Measurement History
- Service Order List
- Service Order Detail
- Service Order Create/Edit
- Production Overview
- Finance Workspace
- Fiscal Workspace
- Reports Workspace
- Workflow Management
- Settings
- Pickup/Custody Workspace

### Operational Mobile Portal
- Mobile Login
- My Work
- Assigned Production Orders
- QR Scanner
- Production Order Execution
- Operational Diary
- Quality Tasks
- Rework Tasks
- Warranty Execution Tasks

### Customer Portal
- Customer Login
- Order Tracking
- Approval Center
- Warranty Requests
- Pickup Authorization
- Order History
- Profile

### Smart Concierge Interface
- Arrival Queue
- Fast Lookup
- Retrieval View
- Pickup Authorization Validation
- Handoff Completion

---

## 15. Mobile Strategy

- mobile is mandatory for operational execution
- QR scanning is a first-class interaction, not a secondary tool
- high-frequency tasks must minimize typing and page transitions
- operational status updates, diary registration, quality checks, rework, and warranty execution must be achievable from one device
- mobile views should prioritize deadline, assignment, instruction, measurement, and allowed-action clarity

---

## 16. Desktop Strategy

- desktop is the primary administrative and analytical workspace
- complex workflows should use split views, dense tables, and structured detail pages
- customer service, finance, fiscal, workflow management, and dashboards should optimize for wide-screen productivity
- desktop should serve as the configuration and exception-resolution control center

---

## 17. Customer Portal Strategy

- customer experience must be plain-language and low-friction
- visibility must remain limited to customer-safe information
- order tracking, approvals, warranty requests, and pickup authorization should be self-service first
- customer portal flows must reduce support load without exposing internal operational complexity

---

## 18. Remaining UX Risks

- public-versus-internal status mapping may become confusing if workflow vocabularies expand too far.
- mobile execution may suffer if QR scanning, poor connectivity, and diary updates are not carefully optimized together.
- Service Order screens may become too dense if pricing, approval, measurement, and delivery commitment are not separated cleanly.
- Smart Concierge may expand beyond its approved base scope if reception, queue, and access-control flows are not clearly bounded.
- dashboard density may reduce actionability if management, finance, production, and quality KPIs are not role-prioritized.
- customer portal messaging may expose too much internal workflow terminology unless public-status language is explicitly governed.

---

## 19. Frontend Readiness Score

**Score: 94/100**

Rationale:
- the business and operational model is explicit enough to drive channel separation and screen ownership
- backend architecture and API ownership boundaries are mature enough to support frontend navigation and visibility design
- the source-of-truth split between Service Orders, Production Orders, Finance, Quality, Pickup, and Custody is clear enough to prevent UX authority drift
- remaining deductions apply mainly to future visual-system detail, public-status wording refinement, offline/mobile execution behavior, and dashboard density tuning rather than to structural frontend uncertainty

---

## 20. Final Frontend Readiness Statement

ANEXSYS is ready to start frontend implementation.

Implementation conditions:
- frontend implementation must preserve Service Order as customer-facing commercial truth
- frontend implementation must preserve Production Order as operational execution truth
- operational mobile flows must support full Production Order execution through mobile and QR interaction
- Production Order views must remain financially clean
- customer-facing visibility must remain strictly governed by permission and public-status rules
