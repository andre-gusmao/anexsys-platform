STATUS: MANDATORY FUTURE-STATE ARCHITECTURAL RULE

DATE: 2026-09-22

PURPOSE:
This document becomes the source of truth for all future ANEXSYS modules regarding organizational scope, master data ownership, operational ownership, authorization scope, and future holding readiness.

CLARIFICATION:
This directive defines the approved future-state architecture and future evolution path.

It does not require immediate refactoring of the current Tenant, Company, or Branch implementation.

Current product development must continue using the existing Company/Branch structure until a future dedicated evolution initiative is approved.

---

# ANEXSYS Platform
# MASTER_MULTI_COMPANY_ARCHITECTURE_V1

## 1. Purpose

This document defines the mandatory future-state multi-company architecture directive for ANEXSYS.

This document defines:
- organizational scope principles
- master data ownership principles
- operational ownership principles
- authorization scope principles
- future holding-readiness principles
- reporting scope principles

This document does not define:
- database schemas
- table models
- API contracts
- infrastructure
- deployment topology
- implementation sequencing
- immediate refactoring of current organizational structures

---

## 2. Executive Summary

ANEXSYS must be designed with a future-state target that supports:
- Multi Company
- Multi Branch
- Future Holding Structures
- Consolidated Reporting

The architectural direction must prevent future structural rework caused by incorrect ownership boundaries.

The mandatory organizational model is:
- Holding Group = future superior consolidation layer
- Company = legal and managerial operating entity
- Branch = local operating unit

This model is the approved target state for future evolution.

It is not an instruction to immediately replace the current live organizational implementation.

The mandatory data ownership model is:
- Master Data = global and reusable
- Operational Data = company- and branch-contextual

The mandatory access model is:
- Company access and Branch access belong directly to the User Access Scope
- Communities do not define company ownership
- Communities support grouping and collaboration only

---

## 3. Core Principle

ANEXSYS must support, by architecture and not by exception:
- multiple companies inside the same environment
- multiple branches per company
- future holding structures above companies
- consolidated reporting across branches and companies

This requirement is mandatory and non-negotiable for every future module.

It must be used as directional guidance for future-compatible design, not as an instruction to stop current development and refactor the existing platform immediately.

---

## 4. Levels of Organization

### 4.1 Level 1 — Holding Group (future)

Illustrative examples:
- Grupo Gusmão
- Grupo XYZ

### 4.2 Level 2 — Company

Illustrative examples:
- BPI Governança
- Atelier Iza Gusmão

### 4.3 Level 3 — Branch

Illustrative examples:
- Perdizes
- Higienópolis
- Pinheiros

### 4.4 Mandatory hierarchy rule

The target organizational hierarchy is:

Holding  
-> Company  
-> Branch

Even before the Holding layer is activated in production, future modules should preserve this expansion path whenever practical.

---

## 5. Master Data Principle

Master Data must be global.

Illustrative examples:
- Customers
- Suppliers
- Body Parts
- Measurement Units
- Cities
- States
- Countries
- Postal Codes

Master Data must not belong to Branches.

Master Data may be shared between Companies inside the same ANEXSYS environment.

Visibility and usage restrictions for Master Data must be controlled by authorization and access policy, never by forced duplication.

### 5.1 Architectural rule

The platform must treat Master Data as reusable reference truth.

The architecture must avoid coupling Master Data identity to:
- Branch
- local branch registration ownership
- operational event ownership

---

## 6. Customer Domain Rule

Customer is a Master Data entity.

Customer must never be duplicated because of Branch.

Illustrative example:

Customer: Maria Silva

May be attended at:
- Perdizes
- Higienópolis
- Pinheiros

without duplicate registrations.

### 6.1 Ownership rule

The Customer belongs to shared Master Data.

The Branch association belongs only to transactions that involve the customer, never to the customer identity itself.

### 6.2 Architectural consequence

Customer registration, search, identity, history, and future analytics must preserve customer uniqueness independently from the branch where operational activity occurs.

---

## 7. Operational Data Principle

Operational entities must carry organizational execution context.

Every operational entity must store:
- Company
- Branch

Illustrative examples:
- Service Requests
- Service Orders
- Production Orders
- Deliveries
- Financial Entries
- Fiscal Documents

### 7.1 Ownership rule

The operational event belongs to the Branch.

The customer does not.

### 7.2 Architectural consequence

Operational reporting, audit, workflow routing, scheduling, finance, production, and fiscal traceability must be branch-aware and company-aware from origin.

---

## 8. Authorization Model

### 8.1 Mandatory rule

Company and Branch access must not be granted through Communities.

Company and Branch access must belong directly to the User.

### 8.2 Correct model

User  
├─ Company Access  
├─ Branch Access  
├─ Communities  
├─ Roles  
└─ Permissions

### 8.3 Responsibilities

Communities:
- functional grouping
- collaboration
- visibility groups

Roles:
- functional responsibilities

Permissions:
- allowed actions

User Access Scope:
- Companies
- Branches

### 8.4 Architectural consequence

Company assignment and Branch assignment must remain user-scoped.

Communities may enrich collaboration and visibility, but they must not become the ownership anchor of organizational access.

---

## 9. Future Holding Structure

The platform must support future structures such as:

Holding  
├─ Company A  
├─ Company B  
└─ Company C

Future consolidated reporting must support:
- Consolidated Revenue
- Consolidated Cash Flow
- Consolidated DRE
- Consolidated Financial Statements
- Consolidated Production Indicators

### 9.1 Architectural consequence

Even when Master Data is shared, companies must remain identifiable inside all operational transactions.

This is mandatory so that holding-level consolidation becomes possible without structural redesign.

---

## 10. Reporting Model

Every operational record must support:
- Holding
- Company
- Branch

This must allow:
- Branch Reports
- Company Reports
- Holding Reports

without data migration.

### 10.1 Reporting rule

The reporting model must be additive by organizational level.

The architecture must never force a future migration merely to distinguish:
- what happened in the branch
- what belongs to the company
- what consolidates at holding level

---

## 11. Non-Negotiable Rules

1. Customer must never be duplicated because of Branch.
2. Company and Branch permissions belong to User Access Scope.
3. Communities must not determine Company ownership.
4. Master Data must be reusable.
5. Operational records must always carry Company and Branch context.
6. Future Holding consolidation must be possible without refactoring.

---

## 12. Mandatory Directive for Future Modules

Every future ANEXSYS module must be reviewed against this directive before implementation approval.

No new module may:
- branch-own shared Master Data
- use Communities as a substitute for Company Access
- omit Company context from operational records
- assume Tenant and Company are permanently the same concept
- block future holding consolidation

If any new proposal conflicts with this directive, this directive prevails.

### 12.1 Current implementation clarification

The current platform architecture remains valid for ongoing delivery.

At present:
- no database refactoring is required
- no entity refactoring is required
- no migration effort is required
- no API restructuring is required
- no authorization restructuring is required

This directive must therefore be used as:
- future-state guidance
- architectural review guidance
- evolution guidance for future holding support

It must not be interpreted as a requirement for immediate structural change in the current platform baseline.
