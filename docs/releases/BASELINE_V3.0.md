# BASELINE_V3.0

## Baseline information

- Version: `BASELINE_V3.0`
- Status: `APPROVED`
- Date: `2026-09-20`
- Project: `ANEXSYS`
- Positioning: `Excelência Operacional Integrada`

## Purpose of the baseline

This document marks the completion of the Product Definition, Architecture, Database Design, and Backend Planning phases of ANEXSYS.

It records the approved functional, architectural, data-modeling, API, backend-architecture, backend-implementation, and backend-planning baseline for the next delivery stages.

## Approved documents

All document paths in this section are repository-root paths and intentionally use a leading `/`.

- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/frozen/DATABASE_GUIDELINES_V1.md`
- `/docs/DATABASE_CONCEPTUAL_V1.md`
- `/docs/DATABASE_LOGICAL_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`
- `/docs/API_DESIGN_V1.md`
- `/docs/BACKEND_ARCHITECTURE_V1.md`
- `/docs/BACKEND_IMPLEMENTATION_V1.md`
- `/docs/working/MIGRATION_AND_ONBOARDING_V1.md`

## Approved decisions

### Multi-Tenant SaaS
- ANEXSYS is approved as a multi-tenant SaaS platform.
- Each tenant owns independent data, configuration, numbering rules, roles, workflows, and calendars.

### Multi-Branch
- Each tenant may operate one or more branches.
- Service Orders and Production Orders have a single owning branch, while governed cross-branch participation remains controlled by explicit references or transfers.

### Service Order model
- Service Order is the commercial and financial source of truth.
- Service Order owns commercial commitment, customer-facing responsibility, delivery commitment, and downstream financial anchoring.

### Production Order model
- Production Order is the operational execution source of truth.
- Each Service Order generates exactly one base Production Order, with corrective lineage represented through Production Order Versions rather than new commercial roots.

### Operational Resource model
- Operational Resource is the approved execution-capacity concept.
- Operational responsibility is defined through Production Order execution, assignment, and audit traceability.

### Delivery Date Engine
- Delivery Date Engine is approved.
- Delivery commitments must be calculated automatically using day-of-week rules, holidays, branch calendars, and tenant calendars, with movement to the next valid business day when required.

### Piece-Based Productivity
- Piece-based productivity is approved and mandatory.
- Operational and corrective execution must preserve productivity attribution and piece-count accountability where applicable.

### QR Traceability
- QR ownership belongs exclusively to Production Orders for operational execution.
- Operational Resources scan the Production Order QR Code to start execution, assume responsibility, update status, and record operational-diary activity.

### Chain of Custody
- Chain of Custody is approved as a mandatory business capability.
- Physical handoff, storage, release, and evidence events must remain auditable across operational and pickup flows.

### Third Party Pickup
- Third-party pickup authorization is approved.
- Pickup credentials, remote approval options, and evidence traceability are part of the approved control model.

### Smart Concierge
- Smart Concierge remains an approved future module.
- Reception workflow is mandatory, while advanced concierge automation remains roadmap scope unless explicitly prioritized.

### Workflow Engine
- Workflow Definition, Status Definition, SLA rules, approval control, escalation logic, and visibility rules are approved platform concepts.
- Workflow policy governs transactional domains without replacing their source-of-truth ownership.

### Finance and Fiscal Separation
- Financial truth remains anchored to Service Order.
- Finance and Fiscal are separate governed domains, and Production Order must not become the source of prices, discounts, payment information, margins, commissions, or profit.

### Warranty model
- Warranty Adjustment and Warranty Execution are distinct approved concepts.
- Warranty Adjustment remains commercially anchored, while Warranty Execution remains operationally linked to Production Order lineage.

### Rework model
- Rework remains a separate approved corrective-execution concept.
- Rework preserves original responsibility, corrective responsibility, quality attribution, and operational lineage.

## Project status

- SRS Readiness: `97/100`
- Architecture Readiness: `96/100`
- Database Readiness: `94/100`
- API Readiness: `96/100`
- Backend Readiness: `95/100`

Status interpretation:
- the business specification is complete enough to govern downstream delivery
- the architecture direction is mature enough to support module and boundary implementation
- the database design is mature enough to support backend persistence implementation
- the API design is explicit enough to guide service and endpoint ownership
- the backend planning baseline is mature enough to support implementation sequencing and sprint execution

## Next phase

- Frontend Architecture
- Frontend Implementation
- Development Environment
- Sprint Execution
- Pilot Deployment

## Final baseline statement

BASELINE_V3.0 formally records the approved Product Definition, Architecture, Database Design, and Backend Planning baseline of ANEXSYS and authorizes transition into frontend planning and delivery execution preparation.
