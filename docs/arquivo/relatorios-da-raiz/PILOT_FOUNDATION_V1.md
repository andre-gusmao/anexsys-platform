# PILOT_FOUNDATION_V1

## 1. Objective

This document defines the minimum foundation required to make ANEXSYS pilot-capable, based on the approved roadmap and the current implementation state.

Primary references:
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/SPRINT_EXECUTION_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/FRONTEND_IMPLEMENTATION_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/FUNCTIONAL_GAP_ANALYSIS_V1.md`
- `/home/runner/work/anexsys-platform/anexsys-platform/docs/releases/BASELINE_V3.0.md`

---

## 2. Current Confirmed Foundation

Confirmed working foundations:
- platform boots successfully
- database migrations execute successfully
- bootstrap executes successfully
- administrator login works
- backend domain modules already cover the approved roadmap breadth
- frontend Sprint 1 shell is available for login, company/branch context, and basic administrative navigation

This means ANEXSYS already has a strong **technical foundation**.

It does **not** yet have a complete **pilot foundation**.

---

## 3. Approved Pilot Milestone

Approved roadmap milestone:
- the earliest realistic pilot version is **after Sprint 10**
- the official atelier-replacement MVP cut line is **after Sprint 10**
- the internal back-office operational readiness checkpoint is **after Sprint 9**

Reason:
- Sprint 9 completes the operational back-office loop
- Sprint 10 adds the mandatory reception workflow, Smart Concierge support, Customer Portal support, and customer-facing operational closure required for a realistic atelier pilot

---

## 4. Minimum Pilot Foundation

The minimum pilot foundation is not defined by backend modules alone.

It requires the combination of:
- stable backend domain ownership
- end-to-end frontend workflows
- operational traceability
- front-of-house reception support
- customer-safe visibility
- minimum finance continuity
- minimum pickup and custody continuity

### 4.1 Mandatory business foundation for pilot

A pilot-capable version must support at minimum:
- tenant and branch governance
- identity, authentication, and authorization
- CRM, customers, and measurements
- Service Orders and Service Order Items
- Delivery Date Engine usage in commercial flow
- Production Orders and Operational Resources
- QR-driven production execution
- Operational Diary
- Quality / corrective execution support
- minimum finance continuity
- Pickup Authorization
- Chain of Custody
- Storage Locations
- Reception Queue
- reception lookup and controlled handoff workflow
- customer-safe visibility through portal/support channels

---

## 5. What Is Already Foundationally Ready

### 5.1 Technical foundation already in place
- backend modular monolith structure
- PostgreSQL migrations and persistence
- tenant/branch isolation model
- SaaS login and context-selection foundation
- permissions, roles, branch scopes, and communities in backend

### 5.2 Backend business foundation already in place
- Customers and measurements APIs
- Service Orders APIs
- Production Orders and QR APIs
- Quality / Rework / Warranty APIs
- Finance APIs
- Fiscal APIs
- Pickup / Custody APIs
- Customer Portal APIs
- Smart Concierge APIs

### 5.3 Frontend foundation already in place
- login screen
- company/branch context selector
- administrative shell
- access-aware navigation skeleton
- basic placeholder routes for company, branch, and users/access

---

## 6. What Is Still Missing for Pilot Foundation

The main missing foundation is **business-operational frontend completion**.

### 6.1 Missing back-office business workspaces
- Customers / CRM screens
- Measurements screens
- Service Order screens
- Production Order screens
- Operational Resource screens
- Quality / Rework / Warranty screens
- Finance screens
- Fiscal screens
- Pickup / Custody / Storage screens

### 6.2 Missing dashboards and queues
- delayed orders dashboard
- production queue dashboard
- quality / rework / warranty dashboard
- pending delivery dashboard
- finance alerts dashboard
- pickup / retrieval dashboard
- Smart Concierge reception queue dashboard

### 6.3 Missing front-of-house and customer-facing pilot foundation
- Smart Concierge frontend
- Customer Portal frontend
- Approval Center frontend
- customer-safe status visibility flows
- reception handoff UX

### 6.4 Missing governance workspaces
- Communities management UI
- real roles/permissions management UI
- workflow/status/SLA governance UI

---

## 7. Pilot Foundation Sequence

The shortest route to pilot is to complete the foundation in this order:

### Phase 1 — Commercial intake foundation
Implement:
- Customers UI
- Measurements UI
- Service Orders UI
- delivery-date suggestion visibility

Outcome:
- the commercial front-office intake loop becomes usable

### Phase 2 — Operational execution foundation
Implement:
- Production Orders UI
- Operational Resources UI
- QR scan and execution UI
- Operational Diary UI

Outcome:
- the operational execution loop becomes usable

### Phase 3 — Corrective and quality foundation
Implement:
- Quality UI
- Rework UI
- Warranty UI

Outcome:
- post-execution validation and corrective handling become usable

### Phase 4 — Release and custody foundation
Implement:
- Pickup Authorization UI
- Custody / Storage Location UI
- retrieval visibility and handoff support

Outcome:
- delivery release and controlled custody become usable

### Phase 5 — Financial continuity foundation
Implement:
- payment UI
- financial summary UI
- partial-payment UI
- financial exception UI

Outcome:
- minimum financial continuity exists for pilot operations

### Phase 6 — Front-of-house pilot completion
Implement:
- Smart Concierge frontend
- Customer Portal frontend
- Approval Center frontend
- customer-safe status mapping and visibility

Outcome:
- ANEXSYS becomes realistically pilot-capable inside the atelier

---

## 8. Practical Pilot Readiness Definition

ANEXSYS should be considered pilot-ready only when all of the following are true:
- staff can log in and select valid company/branch context
- customers and measurements can be registered and consulted in UI
- Service Orders can be created and managed in UI
- Production Orders can be executed through QR-driven operational flow
- quality and corrective cases can be handled in UI
- pickup, custody, and storage can be controlled in UI
- minimum finance continuity exists in UI
- reception can operate through Smart Concierge workflow
- customers can interact through the portal/support-facing flow where required

---

## 9. Current Pilot Foundation Assessment

Current assessment:
- technical foundation: **READY**
- backend business foundation: **READY** for most approved domains
- frontend business foundation: **PARTIAL**
- pilot foundation: **NOT READY**

Main blocker:
- the current repository has broad backend capability, but the missing frontend and end-to-end workflow layer prevents practical pilot operation

---

## 10. Final Conclusion

The foundation for a pilot is already structurally present in backend architecture, persistence, authentication, and domain APIs.

The missing pilot foundation is primarily the **workflow-complete frontend and operational UX layer**.

Therefore:
- the shortest path to pilot is to stop expanding backend scope
- reuse the implemented backend modules
- complete the missing frontend and end-to-end workflows through the approved Sprint 10 MVP line

Final pilot-foundation statement:

**ANEXSYS becomes pilot-capable only after the current technical/backend foundation is converted into complete business-operational workflows and front-of-house support, with the approved earliest realistic milestone remaining after Sprint 10.**
