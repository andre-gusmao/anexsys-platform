# BASELINE_V2.0

## Baseline information

- Version: `BASELINE_V2.0`
- Date: `2026-09-20`
- Status: `APPROVED`
- Project: `ANEXSYS`
- Positioning: `Excelência Operacional Integrada`

## Purpose of the baseline

This document marks the completion of the Business, Architecture, and Database Design phases of ANEXSYS.

It records the approved functional, architectural, data-modeling, physical-database, and onboarding baseline that now governs the next delivery phases.

## Frozen documents

Canonical frozen source documents for this baseline:

- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/frozen/DATABASE_GUIDELINES_V1.md`

## Repository design document locations

Current repository design document locations referenced by this baseline:

- `/docs/DATABASE_CONCEPTUAL_V1.md`
- `/docs/DATABASE_LOGICAL_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`

Working repository reference:

- `/docs/working/MIGRATION_AND_ONBOARDING_V1.md`

## Approved business decisions

### Core source-of-truth model
- Service Order is the commercial and financial source of truth.
- Production Order is the operational execution source of truth.
- The physical bag/container is support-only physical context and must not become an independent business authority.

### Operational Resource model
- Operational Resource is the standard platform execution-capacity concept.
- Operational responsibility is defined through Production Order execution and audit events.
- Original versus corrective operational attribution must be preserved for rework and warranty execution.

### Production Order versioning
- Each Service Order generates exactly one base Production Order.
- Corrective execution lineage is preserved through Production Order Versions for rework, warranty execution, and corrective production.
- Versioning refines the original operational lineage and does not create a new commercial anchor.

### QR Code ownership
- QR Codes belong exclusively to Production Orders.
- Operational Resources scan the Production Order QR Code to start execution, assume responsibility, update production status, and update the Operational Diary.

### Chain of Custody
- Chain of Custody is an approved mandatory business capability.
- Physical handoff, storage, release, and evidence events must remain auditable across service, pickup, and operational flows.

### Third-party pickup authorization
- Third-party pickup authorization is approved.
- Pickup authorization, release credentials, remote approval options, and evidence traceability are part of the approved control model.

### Smart Concierge
- Smart Concierge remains an approved future module.
- Reception workflow is mandatory; advanced Smart Concierge automation remains roadmap scope unless explicitly prioritized.

### Multi-Tenant SaaS
- ANEXSYS is approved as a multi-tenant SaaS platform.
- Each tenant owns independent data, configuration, numbering rules, roles, workflows, and branch structure.

### Multi-Branch
- Each tenant may operate one or more branches.
- Service Orders and Production Orders have a single owning branch, while cross-branch participation is handled through governed references or transfers.

### Workflow Engine
- Workflow Definition, Status Definition, SLA policy, approval control, escalation logic, and visibility rules are approved architectural and data-design concepts.
- Workflow policy governs transactional domains without replacing their source-of-truth ownership.

### Financial ownership model
- Financial truth remains anchored to Service Order.
- Production Order must not become the source of truth for prices, discounts, payment information, commissions, margins, or profit.
- Payment, fiscal, and exception flows remain subordinate to Service Order commercial truth.

### Warranty model
- Warranty Adjustment and Warranty Execution are distinct approved concepts.
- Warranty Adjustment remains commercially anchored.
- Warranty Execution remains operationally linked to Production Order lineage.

### Rework model
- Rework remains a separate approved corrective-execution concept.
- Rework preserves original responsibility, corrective responsibility, quality attribution, and operational lineage.

### Delivery Date Engine
- Delivery Date Engine is approved.
- Delivery dates must be calculated automatically using day-of-week rules, holidays, branch calendars, and tenant calendars, with automatic movement to the next valid business day when needed.

### Piece-based productivity
- Piece-based productivity is approved and mandatory.
- Corrective execution and operational performance indicators must preserve productivity attribution and piece-count accountability where applicable.

## Project status

- SRS Completeness Score: `97/100`
- Architecture Readiness Score: `96/100`
- Database Readiness Score: `94/100`

Status interpretation:
- the business specification is complete enough to govern implementation planning
- the architecture direction is mature enough to drive backend architecture definition
- the database design has progressed through conceptual, logical, and physical phases across the approved repository artifact set and is ready for backend-oriented refinement

## Next phase

The next approved phase is:

- `BACKEND_ARCHITECTURE_V1`

Followed by:

- `API_DESIGN_V1`
- `BACKEND_IMPLEMENTATION_V1`
- `FRONTEND_ARCHITECTURE_V1`

## Final baseline statement

BASELINE_V2.0 formally freezes the approved Business, Architecture, and Database Design baseline of ANEXSYS and authorizes transition into backend architecture and delivery planning.
