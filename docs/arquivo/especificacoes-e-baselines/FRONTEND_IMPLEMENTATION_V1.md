# ANEXSYS Platform
# FRONTEND_IMPLEMENTATION_V1

## Document Purpose

This document defines the complete frontend implementation blueprint of ANEXSYS using the following source of truth:
- `/docs/releases/BASELINE_V3.0.md`
- `/docs/FRONTEND_ARCHITECTURE_V1.md`
- `/docs/API_DESIGN_V1.md`
- `/docs/BACKEND_IMPLEMENTATION_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`

This document defines:
- frontend technology decisions
- channel implementation structure
- sprint implementation order
- screen implementation catalog
- navigation implementation structure
- visibility implementation rules
- MVP cut line
- DEV and pilot readiness milestones

This document does not define:
- source code
- React components
- UI mockups
- visual prototypes

---

## 1. Executive Summary

ANEXSYS frontend implementation must translate the approved business model, API boundaries, and backend sequencing into four coordinated channels:
- Administrative Portal
- Operational Mobile Portal
- Customer Portal
- Smart Concierge

The frontend must preserve the approved platform truth model:
- Service Order is the commercial and customer-facing truth
- Production Order is the operational execution truth
- Production Order QR is the operational execution QR authority
- the physical bag is support-only context

Frontend implementation should start with platform access, shell, and navigation, then expand through customer, service-order, production, QR, quality, finance, fiscal, custody/pickup, and finally customer-experience channels.

The frontend MVP cut line for realistic atelier operation in this blueprint is:
- **after Frontend Sprint 10**

The earliest state where André can start navigating the system and validating UX is:
- **after Frontend Sprint 1**

Rationale:
- Frontend Sprint 1 introduces login, session management, tenant selection, branch selection, and navigation shell
- this is the first point where real navigation, layout, role context, and shell usability can be validated in-browser

---

## 2. Frontend Technology Blueprint

### 2.1 React

Approved choice:
- React

Justification:
- ANEXSYS requires multi-channel UI composition, reusable stateful screens, dense administrative tables, mobile task views, and controlled visibility behavior
- React supports strong component reuse across Administrative Portal, Operational Mobile Portal, Customer Portal, and Smart Concierge without forcing identical interaction patterns
- React is suitable for incremental sprint-by-sprint delivery with shared primitives and domain-oriented screen composition

### 2.2 Next.js

Approved choice:
- Next.js

Justification:
- ANEXSYS needs browser-access deployment, route-driven channel separation, controlled authenticated areas, and customer-facing entry points
- Next.js supports a unified web frontend for internal and customer-facing channels while preserving strong route organization
- it is suitable for `dev.anexsys.com.br` publication, authenticated app shells, customer-safe pages, and future SEO-neutral or secure portal entry points

Implementation rule:
- use one frontend codebase with route-separated channels
- preserve clear channel isolation inside the route and layout structure

### 2.3 TypeScript

Approved choice:
- TypeScript

Justification:
- ANEXSYS has many bounded contexts, rich status models, strict visibility rules, and many permission-sensitive actions
- TypeScript reduces drift between API contracts, form payloads, route parameters, and screen state
- it is mandatory for preserving consistency across administrative, operational, and customer-facing flows

### 2.4 State Management Strategy

Approved strategy:
- server state separated from client UI state
- query/mutation caching for API-backed state
- lightweight local state for session, shell context, filters, and transient UI behavior

Recommended structure:
- server state: TanStack Query
- app shell state: React Context plus reducer-based channel/session context
- local screen state: component-local state for temporary UI interactions

Justification:
- ANEXSYS is dominated by server-owned workflow data, queues, orders, assignments, approvals, and histories
- server truth must not be copied into large client-side stores unnecessarily
- shell state still needs centralized control for authenticated user, tenant, branch, channel context, and selected dashboard/list filters

### 2.5 Forms Strategy

Approved strategy:
- schema-driven forms with controlled submission lifecycle
- reusable domain form sections for customer, Service Order, Production Order filters, approvals, pickup, and warranty flows

Recommended structure:
- React Hook Form for form orchestration
- shared form composition per business domain

Justification:
- ANEXSYS has many data-entry workflows with validation, partial editing, draft-like flows, and permission-sensitive actions
- forms must be fast, low-re-render, and reusable across create/edit/review screens

### 2.6 Validation Strategy

Approved strategy:
- frontend validation for immediate UX feedback
- backend validation remains authoritative
- visibility and workflow rules must always be confirmed server-side

Recommended structure:
- Zod schemas aligned to API request contracts
- normalized error handling for validation, authorization, workflow, and concurrency responses

Justification:
- ANEXSYS forms include identity, Service Order, measurement, production, pickup, finance, and approval actions
- the frontend must reduce avoidable submission failures without attempting to replace backend authority

### 2.7 Authentication Strategy

Approved strategy:
- JWT-backed authenticated sessions aligned with `/api/v1/auth`
- login first, then tenant and branch context confirmation where applicable
- role, permission, tenant, and branch visibility enforced by both shell behavior and server responses

Implementation rules:
- session bootstrap must read authenticated principal and effective access
- tenant and branch context must be visible in internal channels
- customer portal must use customer-safe session behavior
- future OTP and SSO flows must fit the same auth shell without redesigning navigation

### 2.8 API Consumption Strategy

Approved strategy:
- versioned HTTP API consumption under `/api/v1`
- domain-oriented API client organization
- command endpoints treated as explicit actions, not generic field patches

Recommended structure:
- typed API client by domain family
- query hooks for reads
- mutation hooks for workflow actions
- explicit handling of tenant header, auth token, and branch-aware filters

Justification:
- ANEXSYS APIs are domain-aligned and permission-sensitive
- action endpoints such as approve, reject, assign, start, pause, complete, reissue, resolve, and handoff must remain explicit in the frontend implementation

### 2.9 Responsive Strategy

Required execution rule:
- responsive design is mandatory
- desktop first for administrative users
- mobile first for Operational Resources

Channel rule:
- Administrative Portal prioritizes wide-screen productivity
- Operational Mobile Portal prioritizes one-hand execution and rapid scanning
- Customer Portal prioritizes plain-language mobile-friendly self-service
- Smart Concierge prioritizes fast desk/reception interactions with optional tablet use

---

## 3. Application Channels Implementation Plan

### 3.1 Administrative Portal

Purpose:
- main internal desktop workspace

Primary capabilities:
- dashboards
- CRM
- Service Orders
- production oversight
- quality review
- finance
- fiscal
- pickup and custody
- reports
- workflow management
- settings

Implementation rule:
- desktop-first layouts
- dense lists and structured detail pages
- branch and tenant context always visible where relevant

### 3.2 Operational Mobile Portal

Purpose:
- main operational execution channel

Primary capabilities:
- assignment visibility
- QR scanning
- production execution
- operational diary
- quality actions
- rework execution
- warranty execution

Implementation rule:
- mobile-first
- task-first
- minimal typing
- visible deadlines, priorities, and allowed actions

### 3.3 Customer Portal

Purpose:
- secure customer self-service

Primary capabilities:
- order tracking
- approval center
- pickup authorization
- warranty requests
- order history

Implementation rule:
- plain-language only
- customer-safe statuses only
- no internal workflow leakage

### 3.4 Smart Concierge

Purpose:
- mandatory reception and pickup-support interface

Primary capabilities:
- reception queue
- customer identification
- customer search
- direct order search
- pickup assistance
- retrieval support

Implementation rule:
- reception-focused
- limited to approved scope
- must not drift into unrestricted automation or internal deep-management complexity

---

## 4. Frontend Sprint Roadmap

### Frontend Sprint 1

Scope:
- Login
- Session Management
- Tenant Selection
- Branch Selection
- Navigation Shell

Primary outcome:
- first browser-navigable application shell

Validation value:
- André can start navigating the system and validating UX after this sprint

### Frontend Sprint 2

Scope:
- Customer Directory
- Customer Profile
- Measurements
- Customer History

Primary outcome:
- first usable CRM workflow

### Frontend Sprint 3

Scope:
- Service Order List
- Service Order Details
- Service Order Creation
- Service Order Edit
- Service Order Items

Primary outcome:
- commercial front-office flow becomes usable

### Frontend Sprint 4

Scope:
- Production Order Workspace
- Assigned Production Orders
- Production Details
- Operational Resource Workspace

Primary outcome:
- production visibility becomes usable on desktop and mobile support flows

### Frontend Sprint 5

Scope:
- QR Scanner
- Operational Diary
- Production Execution Screens

Primary outcome:
- operational execution becomes usable on mobile

### Frontend Sprint 6

Scope:
- Quality Queue
- Quality Inspection
- Rework Screens
- Warranty Screens

Primary outcome:
- corrective and quality flows become usable

### Frontend Sprint 7

Scope:
- Finance Workspace
- Payment Screens
- Cash Flow
- Financial Exceptions

Primary outcome:
- finance-facing internal workflows become usable

### Frontend Sprint 8

Scope:
- Fiscal Workspace
- Fiscal Document Management

Primary outcome:
- fiscal lifecycle handling becomes usable

### Frontend Sprint 9

Scope:
- Pickup Authorization
- Custody Timeline
- Storage Location Screens

Primary outcome:
- release, retrieval, and custody flows become usable

### Frontend Sprint 10

Scope:
- Smart Concierge
- Reception Queue
- Customer Portal
- Approval Center

Primary outcome:
- reception workflow and customer-facing support complete the atelier-ready frontend MVP

---

## 5. Implementation Order Logic

Frontend implementation order must follow source-of-truth dependency order:

1. identity, access, shell, and context
2. CRM and measurements
3. Service Orders
4. Production Orders and Operational Resources
5. QR and execution
6. quality, rework, warranty
7. finance
8. fiscal
9. pickup and custody
10. Smart Concierge and Customer Portal

Reason:
- Service Orders must precede Production Orders, Finance, Fiscal, Pickup, and Customer Portal tracking
- Smart Concierge and Customer Portal depend on stable pickup, custody, visibility mapping, and customer-safe status behavior

---

## 6. Service Order Experience Implementation Plan

### 6.1 Customer Selection

Implementation plan:
- fast search by name, phone, WhatsApp, document, and history
- recent customers
- branch-aware suggestions
- duplicate warning before selection or creation

### 6.2 Measurements

Implementation plan:
- structured measurement capture inside Service Order workflow
- direct visibility of latest measurement version
- measurement history drill-down from customer profile
- measurement reuse where allowed

### 6.3 Technical Responsible

Implementation plan:
- explicit field in Service Order creation and edit
- visible attribution in detail view
- editable with audit-relevant action affordance

### 6.4 Commercial Responsible

Implementation plan:
- explicit field in Service Order creation and edit
- default to logged-in user when appropriate
- visible in order detail and list summaries where relevant

### 6.5 Delivery Date Engine

Implementation plan:
- suggested delivery date shown during order creation and edit
- recalculation action exposed in Service Order context
- explanation block for calendar and rule-driven date changes when relevant

### 6.6 Delivery Type Selection

Implementation plan:
- Standard, Priority, and Express selection in Service Order workflow
- visible indicators in list, detail, and downstream linked views
- surcharge visibility remains in Service Order and finance-aware contexts only

### 6.7 Item Management

Implementation plan:
- add items
- edit items
- duplicate items
- group items where useful
- item notes
- item-level deadline and operational-priority visibility

---

## 7. Production Order Experience Implementation Plan

### 7.1 Production Order Visualization

Implementation plan:
- operational header
- linked Service Order reference
- assignment state
- execution status
- version visibility

### 7.2 Visual Delivery Date

Implementation plan:
- prominent delivery deadline
- urgency marker
- visible operational priority marker

### 7.3 Operational Instructions

Implementation plan:
- concise instruction block
- visible quality notes
- visible rework or warranty context where relevant

### 7.4 Piece Details

Implementation plan:
- clear piece or item scope
- grouped operational execution context
- direct readability without CRM deep navigation

### 7.5 Measurements

Implementation plan:
- execution-friendly measurement snapshot
- no full finance or CRM overload in operational screens

### 7.6 Photos

Implementation plan:
- evidence or reference-photo visibility
- compact preview in operational views
- support for quality and execution context

### 7.7 QR Code

Implementation plan:
- visible Production Order QR presentation
- scan-driven execution entry
- quick transition from scan result to allowed actions

### 7.8 Financial Isolation Rule

Mandatory rule:
- Production Order views must remain financially clean
- no prices, discounts, margins, commissions, payment information, or profit visibility

---

## 8. Operational Diary Implementation Plan

### 8.1 Summary View

Must support:
- Pieces Produced
- Service Orders Completed
- Rework
- Warranty

UI purpose:
- fast self-performance and workload understanding for the Operational Resource

### 8.2 Analytical View

Must support:
- Service Order
- Piece Description
- Service Description
- Measurements
- Photos
- Status
- Priority
- Delivery Date

UI purpose:
- detailed execution traceability and diary review by order and piece context

### 8.3 Interaction Rule

- diary actions must be reachable from execution flow, not isolated in a distant menu
- diary must support quick-note and event-history behavior

---

## 9. Smart Concierge Implementation Plan

### 9.1 Reception Queue

Implementation plan:
- waiting queue
- called state
- in-service state
- completion state
- branch-aware board

### 9.2 Customer Identification

Implementation plan:
- identify by name
- phone
- WhatsApp
- CPF
- customer code
- QR code

### 9.3 Customer Search

Implementation plan:
- fast lookup by customer identity or recent arrivals
- direct search result summaries for customer and order context

### 9.4 Direct Order Search

Implementation plan:
- search by Service Order number
- search by pickup code
- search by pickup credential QR path where supported

### 9.5 Pickup Assistance

Implementation plan:
- authorization validation
- retrieval-ready indication
- storage-location visibility
- handoff completion support

### 9.6 Visibility Rule

Mandatory rule:
- Smart Concierge must display only customer-visible or reception-authorized information
- it must not expose internal quality commentary, restricted finance analysis, or deep operational-only diagnostics

---

## 10. Customer Portal Implementation Plan

### 10.1 Order Tracking

Implementation plan:
- order list
- current customer-safe status
- delivery expectation
- approval state
- pickup readiness

### 10.2 Approval Center

Implementation plan:
- pending approvals
- approval history
- approve and reject actions
- plain-language explanations

### 10.3 Pickup Authorization

Implementation plan:
- create authorization
- authorize third-party pickup
- view credential state
- revoke authorization where allowed

### 10.4 Warranty Requests

Implementation plan:
- request creation
- progress tracking
- resolution-state visibility

### 10.5 Order History

Implementation plan:
- prior Service Orders
- prior approvals
- prior pickup or delivery states

### 10.6 Customer Language Rule

Mandatory rule:
- customer portal must expose customer-safe statuses only
- no internal quality failures
- no internal workflow codes
- no operational assignment visibility
- no internal audit details

---

## 11. Visibility Model Implementation Rules

### 11.1 Internal Status

- internal statuses may remain rich and workflow-specific
- internal screens may expose operational, quality, pickup, and finance details according to permission

### 11.2 External Status

- external statuses must be mapped from safe public workflow meaning
- external labels must avoid blame, rejection jargon, or internal-only terminology

### 11.3 Customer Visibility

- only customer-safe statuses
- approval, pickup, delivery, and warranty-resolution visibility allowed
- no internal quality commentary
- no restricted finance analysis

### 11.4 Operational Visibility

- assignments, instructions, measurements, diary actions, deadlines, and allowed transitions visible
- pricing and finance data hidden

### 11.5 Management Visibility

- cross-domain dashboards
- branch comparison
- SLA risk
- quality and exception oversight
- tenant and branch scope rules preserved

### 11.6 Example Mapping Rule

Example:
- Internal Status: `Rejected By Quality`
- Customer View: `In Final Adjustment`

Implementation rule:
- the frontend must consume mapped public status, not infer public wording from internal raw status labels

---

## 12. Navigation Structure

### 12.1 Administrative Portal

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
- alerts or inbox
- user menu

### 12.2 Operational Mobile Portal

Primary navigation:
- My Work
- Assigned Orders
- QR Scanner
- Diary
- Quality
- Rework
- Warranty

Task navigation:
- quick scan
- recent scans
- today or overdue filter
- assignment and status actions

### 12.3 Customer Portal

Primary navigation:
- My Orders
- Approvals
- Warranty
- Pickup Authorization
- History
- Profile

Support navigation:
- order search
- notifications or messages
- secure sign-in and recovery

### 12.4 Smart Concierge

Primary navigation:
- Arrival Queue
- Fast Lookup
- Retrieval View
- Pickup Validation
- Handoff Completion

---

## 13. Screen Catalog

### 13.1 Administrative Portal

- Login
- Tenant and Branch Context Selection
- Dashboard
- CRM Timeline
- Customer Directory
- Customer Profile
- Measurement History
- Service Order List
- Service Order Detail
- Service Order Create and Edit
- Production Overview
- Finance Workspace
- Fiscal Workspace
- Reports Workspace
- Workflow Management
- Settings
- Pickup and Custody Workspace

### 13.2 Operational Mobile Portal

- Mobile Login
- My Work
- Assigned Production Orders
- QR Scanner
- Production Order Execution
- Operational Diary
- Quality Tasks
- Rework Tasks
- Warranty Execution Tasks

### 13.3 Customer Portal

- Customer Login
- Order Tracking
- Approval Center
- Warranty Requests
- Pickup Authorization
- Order History
- Profile

### 13.4 Smart Concierge

- Arrival Queue
- Fast Lookup
- Retrieval View
- Pickup Authorization Validation
- Handoff Completion

---

## 14. Design System Direction

### 14.1 Color Strategy

- neutral base for dense administrative workspaces
- high-contrast action colors for workflow commands
- controlled semantic colors for statuses and alerts
- customer-facing palette must feel calmer and simpler than internal operational palettes

### 14.2 Typography

- high readability for dense tables on desktop
- large touch-friendly hierarchy for mobile operational actions
- clear contrast between primary identifiers, status, deadline, and supporting metadata

### 14.3 Status Colors

- use semantic status groupings rather than arbitrary per-screen variations
- delayed, blocked, rejected, approved, in-progress, and completed states must remain visually consistent across channels

### 14.4 Delivery Type Colors

- Standard: neutral/default emphasis
- Priority: strong but controlled urgency emphasis
- Express: highest urgency emphasis

### 14.5 Rework Indicators

- explicit corrective indicator
- must visually distinguish original execution from corrective flow

### 14.6 Warranty Indicators

- explicit warranty marker
- visually distinct from rework

### 14.7 QR Indicators

- scan-ready affordance
- validation success, failure, and retry states
- clear link between scan result and next allowed action

### 14.8 Design System Rule

- no critical meaning may rely on color alone
- all critical workflow states must also use labels, icons, or structural emphasis

---

## 15. MVP UI Definition

### 15.1 Minimum frontend required to run ANEXSYS inside the atelier

The minimum UI required is:
- Frontend Sprint 1 shell and access foundation
- Frontend Sprint 2 CRM basics
- Frontend Sprint 3 Service Order workflow
- Frontend Sprint 4 Production workspace
- Frontend Sprint 5 QR and operational execution
- Frontend Sprint 6 Quality, rework, and warranty operational flows
- Frontend Sprint 7 Finance internal controls
- Frontend Sprint 8 Fiscal internal controls
- Frontend Sprint 9 Pickup, custody, and storage visibility
- Frontend Sprint 10 Reception Queue, Smart Concierge, Customer Portal, and Approval Center

### 15.2 MVP cut line

The official atelier-replacement MVP cut line is:
- **after Frontend Sprint 10**

Reason:
- Sprint 10 is the first point where reception workflow and customer-facing support complete the realistic atelier operating loop

---

## 16. DEV Environment Readiness

### 16.1 Earliest frontend deployment

- **after Frontend Sprint 1**

Reason:
- login, session management, tenant selection, branch selection, and navigation shell are enough to publish the first browser-navigable frontend shell at `dev.anexsys.com.br`

### 16.2 Earliest usable environment

- **after Frontend Sprint 1**

Reason:
- this is the first state where André and the team can enter the application, switch context, navigate structure, and validate shell UX

### 16.3 Earliest pilot environment

- **after Frontend Sprint 10**

Reason:
- the pilot requires reception workflow, customer portal support, pickup visibility, QR execution, and customer-safe status mapping

---

## 17. Frontend Readiness Score

**Score: 94/100**

Rationale:
- business and operational channel boundaries are explicit
- API ownership is mature enough to drive screen ownership and route structure
- source-of-truth separation is clear enough to avoid UX authority drift
- remaining risk is concentrated in public-status wording refinement, mobile execution behavior, and dashboard-density tuning rather than structural uncertainty

---

## 18. Final Frontend Readiness Statement

ANEXSYS is ready to start frontend implementation.

Implementation conditions:
- preserve Service Order as customer-facing commercial truth
- preserve Production Order as operational execution truth
- keep Production Order QR as the operational execution scan authority
- keep Production Order views financially clean
- keep Customer Portal visibility strictly customer-safe
- keep Smart Concierge bounded to approved reception and pickup-support scope

---

## 19. Explicit Output Summary

### 19.1 Executive Summary

- ANEXSYS frontend should be implemented as one multi-channel web frontend with four channels
- the implementation sequence must follow the approved business and backend dependency order
- the complete atelier-ready frontend MVP is after Frontend Sprint 10

### 19.2 Frontend Sprint Roadmap

- Frontend Sprint 1: access and shell
- Frontend Sprint 2: CRM
- Frontend Sprint 3: Service Orders
- Frontend Sprint 4: production workspace
- Frontend Sprint 5: QR and execution
- Frontend Sprint 6: quality, rework, warranty
- Frontend Sprint 7: finance
- Frontend Sprint 8: fiscal
- Frontend Sprint 9: pickup and custody
- Frontend Sprint 10: Smart Concierge and Customer Portal

### 19.3 Screen Catalog

- defined in Section 13 for all four channels

### 19.4 Navigation Structure

- defined in Section 12 for desktop, mobile, customer portal, and Smart Concierge

### 19.5 MVP Cut Line

- **after Frontend Sprint 10**

### 19.6 Earliest `dev.anexsys.com.br` milestone

- **after Frontend Sprint 1**

### 19.7 Earliest pilot milestone

- **after Frontend Sprint 10**

### 19.8 Frontend Readiness Score

- **94/100**

---

## 20. Explicit Answer

### After which frontend sprint can André start navigating the system and validating UX?

**After Frontend Sprint 1.**

Reason:
- Frontend Sprint 1 is the first sprint that delivers login, session management, tenant selection, branch selection, and the navigation shell
- that is the earliest point where browser navigation, context switching, information architecture, and shell usability can be validated with real flows
