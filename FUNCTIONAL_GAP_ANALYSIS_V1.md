# FUNCTIONAL_GAP_ANALYSIS_V1

## 1. Objective

This document compares the current ANEXSYS implementation against the approved business requirements and delivery roadmap.

Current confirmed state:
- platform boots successfully
- database migrations executed successfully
- bootstrap executed successfully
- administrator login works
- backend domain modules exist for the approved delivery roadmap
- frontend currently exposes only the Sprint 1 administrative shell and placeholder workspaces

Primary comparison basis:
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/releases/BASELINE_V3.0.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/SPRINT_EXECUTION_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/FRONTEND_IMPLEMENTATION_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/CURRENT_APPLICATION_STATUS.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/FRONTEND_SPRINT_1_IMPLEMENTATION_REPORT.md`

---

## 2. Executive Summary

ANEXSYS is structurally advanced on the backend and foundationally usable in Sprint 1 frontend access.

However, the product is **not yet a minimally usable pilot version** from an operational business perspective because:
- most business domains have backend APIs but no real frontend workspaces
- the current frontend still lacks the main operational menus and end-to-end transactional screens
- dashboards are still placeholders
- Customer Portal and Smart Concierge are backend-ready but not frontend-ready
- the approved roadmap explicitly states the earliest pilot milestone is **after Frontend Sprint 10**

Current overall conclusion:
- **technical platform foundation:** strong
- **domain backend implementation:** broad but mostly backend-centered
- **business-operational usability:** still partial
- **pilot readiness:** not reached yet

---

## 3. Implemented Features

Implemented and confirmed at repository level:

### Platform foundation
- tenant-safe backend boot
- successful database migrations
- successful bootstrap path
- administrator login
- SaaS login redesign foundations
- company/branch context handling
- frontend Sprint 1 login, shell, and access-aware navigation skeleton

### Backend business domains with APIs
- Customers and measurements
- Service Orders
- Production Orders
- QR execution endpoints
- Quality / Rework / Warranty
- Finance
- Fiscal
- Pickup and Custody
- Customer Portal backend APIs
- Smart Concierge backend APIs
- Permissions, roles, branch scopes, and communities backend APIs

### Frontend currently available
- Login
- Company/branch context selection
- Dashboard placeholder
- Company placeholder
- Branch placeholder
- Users & Access placeholder

---

## 4. Partially Implemented Features

These areas exist in code but are not yet complete from an approved business-usage perspective:

- Customers: backend exists, but no real frontend CRM screens
- Employees: operational-resource backend exists, but no employee-facing master-data UI
- Companies: backend CRUD exists, but no real management workspace
- Branches: backend CRUD exists, but no real management workspace
- Permissions: backend exists, but no management UI
- Communities: backend exists, but no management UI/menu
- Service Orders: backend exists, but no operational/commercial UI
- Production Orders: backend exists, but no operational desktop/mobile UI
- Financial Module: backend exists, but no finance UI or dashboards
- Customer Portal: backend exists, but no portal frontend
- Smart Concierge: backend exists, but no concierge frontend
- Status Management: domain statuses exist indirectly, but no approved generic status/workflow management UI or governance console exists

---

## 5. Missing Features

Not found as implemented business capabilities in current repository state:

- Product master-data domain
- Service catalog master-data domain
- Employee master-data workspace separate from operational-resource internals
- Generic workflow-definition management
- Generic status-definition management
- SLA management workspace
- operational dashboards with real read models
- Smart Concierge frontend channel
- Customer Portal frontend channel
- end-to-end administrative business workspaces beyond Sprint 1 placeholders

---

## 6. Functional Classification Matrix

| Feature | Classification | Current state summary |
|---|---|---|
| Customers | PARTIAL | Backend customer and measurement APIs exist, but CRM screens, search UX, profile UX, and measurement workflow UI are still missing. |
| Products | NOT STARTED | No product module, no product APIs, no product screens, no product menu. |
| Services | NOT STARTED | No service catalog module, no service master-data APIs, no service screens, no service menu. |
| Employees | PARTIAL | Operational Resources backend exists for execution capacity, but there is no real employee master-data workspace or frontend flow. |
| Status Management | PARTIAL | Domain statuses exist inside implemented modules, but no approved configurable status/workflow/SLA administration capability is available. |
| Companies | PARTIAL | Tenant backend CRUD exists and the UI exposes a placeholder company area, but no real company-management workspace is available. |
| Branches | PARTIAL | Branch backend CRUD exists and branch selector works, but there is no real branch-management workspace. |
| Permissions | PARTIAL | Roles, permissions, and enforcement exist in backend, but management UI is still placeholder-only. |
| Communities | PARTIAL | Communities are implemented in backend and effective access, but there is no user-facing menu or maintenance screen. |
| Service Orders | PARTIAL | Strong backend exists, including items, approval, cancellation, delivery-date recalculation, and timeline, but no usable frontend commercial flow exists. |
| Production Orders | PARTIAL | Backend generation, lifecycle, print, QR, and versioning exist, but no operational desktop/mobile production UI exists. |
| Financial Module | PARTIAL | Finance and fiscal APIs exist, but no finance dashboard, payment workspace, exception workspace, or fiscal screens exist in frontend. |
| Customer Portal | PARTIAL | Backend APIs are implemented, but no customer-facing portal UI is present. |
| Smart Concierge | PARTIAL | Backend APIs are implemented, but no reception/concierge frontend UI is present. |

### Important note

For the requested business areas, **none should currently be classified as READY** when measured against the approved business requirements as an end-user-capable product capability.

READY today applies primarily to:
- platform startup
- migrations
- bootstrap
- administrator login
- Sprint 1 access shell foundations

---

## 7. Missing Menus

Current visible administrative navigation is limited to:
- Dashboard
- Companies
- Branches
- Users & Access

Missing business menus for a minimally usable operational product:
- Customers / CRM
- Products
- Services
- Employees / Operational Resources
- Communities
- Service Orders
- Production Orders
- Quality
- Rework
- Warranty
- Finance
- Fiscal
- Pickup
- Custody / Storage
- Customer Portal administration / support
- Smart Concierge / Reception
- Dashboards / queues by business domain
- Workflow / Status / SLA governance

---

## 8. Missing Master Data Screens

Missing or placeholder-only master-data screens:
- Customer directory
- Customer profile
- Measurement history / measurement registration
- Product catalog
- Service catalog
- Employee / operational-resource management
- Company management
- Branch management
- Communities management
- Roles / permissions management beyond placeholder shell
- status-definition management
- workflow-definition management

---

## 9. Missing Dashboards

Currently available dashboard state:
- administrative dashboard placeholder only

Missing business dashboards:
- delayed Service Orders dashboard
- production queue dashboard
- quality / rework / warranty dashboard
- pending deliveries dashboard
- finance alerts dashboard
- pickup / custody retrieval dashboard
- Smart Concierge reception queue dashboard
- customer-safe portal summary dashboard

---

## 10. Missing Workflows

Missing end-to-end user-facing workflows include:
- CRM customer registration and maintenance workflow
- measurement registration workflow
- Service Order create/edit/detail workflow
- Service Order approval workflow UI
- delivery-date suggestion visibility workflow
- Production Order list/detail/scheduling workflow UI
- QR scan and execution workflow UI
- operational diary / production mobile workflow
- quality approve/reject/rework/warranty workflow UI
- payment registration and finance exception handling workflow UI
- fiscal document lifecycle UI
- pickup authorization workflow UI
- custody location assignment and retrieval workflow UI
- customer approval center frontend
- customer pickup authorization frontend
- customer warranty request frontend
- Smart Concierge check-in and handoff frontend

---

## 11. Shortest Path to a Minimally Usable Pilot Version

### Short answer

The shortest path is **not** to create more backend modules.

The shortest path is to **turn the already-implemented backend APIs into real end-to-end frontend and mobile workflows in the approved sprint order**.

### Practical shortest path

1. Complete the missing business frontend from Sprint 2 onward, reusing the existing backend modules.
2. Prioritize only the workflows required for atelier replacement and pilot operation.
3. Avoid introducing new domains before the existing approved MVP path is surfaced in UI.

### Minimum priority sequence

#### Step 1 — Back-office operational minimum
Implement real screens and menus for:
- Customers
- Measurements
- Service Orders
- Production Orders
- Operational Resources

#### Step 2 — Execution and traceability minimum
Implement usable execution flows for:
- QR scan
- production execution
- operational diary
- quality / rework / warranty actions

#### Step 3 — Delivery and release minimum
Implement usable flows for:
- pickup authorization
- custody / storage location visibility
- retrieval support
- pending delivery visibility

#### Step 4 — Financial continuity minimum
Implement internal flows for:
- payments
- financial summary
- partial payments
- financial exceptions

#### Step 5 — Mandatory pilot front-of-house completion
Implement the missing pilot-critical channels:
- Smart Concierge reception workflow
- Customer Portal support flows
- approval center / customer-safe status visibility

### Final conclusion

According to the approved roadmap, the **official shortest path to a minimally usable pilot version is to complete the frontend MVP through Frontend Sprint 10**, because:
- backend coverage already exists across most required domains
- the main blocker is missing business UI and end-to-end workflow exposure
- the approved planning explicitly states the earliest realistic pilot milestone is **after Frontend Sprint 10**

So the shortest path is:

**finish the missing frontend and workflow layers on top of the existing backend, especially Sprints 2 through 10, without reopening core architecture.**
