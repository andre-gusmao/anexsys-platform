# ANEXSYS Platform
# API_DESIGN_V1

## Document Purpose

This repository-carried API design document remains part of the approved downstream design baseline referenced by `BASELINE_V3.0`.

This document defines the complete API architecture of ANEXSYS using the following approved documents as source of truth:
- `/docs/releases/BASELINE_V2.0.md`
- `/docs/frozen/SRS_MASTER_V1.3.md`
- `/docs/frozen/ARQUITETURA_V1.md`
- `/docs/DATABASE_CONCEPTUAL_V1.md`
- `/docs/DATABASE_LOGICAL_V1.md`
- `/docs/DATABASE_PHYSICAL_V1.md`

This document defines:
- API principles
- domain API boundaries
- endpoint families
- request ownership
- response ownership
- security requirements by API family
- cross-domain API rules

This document does not define:
- source code
- NestJS controllers
- DTO implementation
- database migrations
- runtime implementation details

---

## 1. Executive Summary

ANEXSYS API design must preserve the approved source-of-truth architecture:
- Service Order = commercial and financial source of truth
- Production Order = operational execution source of truth
- Physical Bag = support-only physical context

The API architecture must therefore:
- expose domain-aligned APIs instead of process-fragmented endpoints
- preserve clear write ownership by bounded context
- allow read composition without transferring source-of-truth authority
- enforce tenant and branch security on every request
- expose workflow, QR, pickup, audit, and notification-sensitive operations with explicit authorization

The recommended API style is:
- versioned REST-style HTTP APIs under `/api/v1`
- command-oriented endpoints for sensitive workflow actions
- resource-oriented endpoints for master and transactional data
- asynchronous job/status endpoints for imports, heavy processing, and deferred actions

This API design is downstream of the approved business, architecture, database, and backend baseline and is intended to guide implementation without generating controllers or code.

---

## 2. API Principles

### 2.1 Versioning principle
- public application APIs should be published under `/api/v1`
- breaking changes must create a new version namespace rather than silent behavioral drift

### 2.2 Source-of-truth principle
- Service Order write APIs own commercial and financial truth
- Production Order write APIs own operational execution truth
- physical bag support context may be exposed only as optional traceability context and must never become an independent operational root

### 2.3 Ownership principle
- every write endpoint must have one owning module
- cross-domain writes must be orchestrated through the owning module, not through direct foreign-domain mutation

### 2.4 Request ownership principle
- request ownership identifies which bounded context validates the write intent, enforces invariants, and commits the authoritative change

### 2.5 Response ownership principle
- response ownership identifies which bounded context owns the meaning of the returned state
- a response may include cross-domain reference summaries, but those summaries must not override the owning domain's source-of-truth fields

### 2.6 Tenant and branch principle
- every authenticated API call must resolve tenant context
- branch-scoped operations must validate branch eligibility before any write or sensitive read

### 2.7 Security principle
- all authenticated APIs require JWT-backed identity
- branch, tenant, role, permission, and object-state checks must be enforced server-side
- sensitive APIs must be audit-emitting by default

### 2.8 Workflow principle
- lifecycle changes should be expressed through explicit action endpoints when the operation has workflow meaning
- direct field mutation must not bypass workflow rules, approvals, or SLA behavior

### 2.9 Query principle
- collection endpoints should support filtering, sorting, pagination, and status/date scopes where relevant
- dashboard and audit APIs should be read-oriented projections and must not become write backdoors

### 2.10 Idempotency and async principle
- retry-sensitive commands should support idempotent semantics where external or financial side effects exist
- long-running imports, notification dispatch, reconciliation, and batch actions should expose job-oriented APIs

### 2.11 Error and traceability principle
- the API platform should expose consistent error categories for validation, authorization, workflow, concurrency, and integration failures
- all critical write APIs must produce audit traceability

---

## 3. Authentication APIs

### Purpose
- authenticate users
- establish tenant-aware identity
- support password, WhatsApp OTP, Email OTP, and future SSO entry points
- manage token/session lifecycle

### Main endpoints
- `POST /api/v1/auth/login/password`
- `POST /api/v1/auth/login/otp/email/request`
- `POST /api/v1/auth/login/otp/email/verify`
- `POST /api/v1/auth/login/otp/whatsapp/request`
- `POST /api/v1/auth/login/otp/whatsapp/verify`
- `POST /api/v1/auth/token/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/sso/start`
- `POST /api/v1/auth/sso/callback`

### Request ownership
- Identity and Access

### Response ownership
- Identity and Access for authenticated principal, token/session state, tenant scope, and branch-scope selection prerequisites

### Security requirements
- public login endpoints must use anti-abuse controls and audit failed attempts
- token issuance and refresh must support revocation
- impersonation or support-login variants must be separately authorized and audited

---

## 4. Authorization APIs

### Purpose
- manage roles, permissions, branch scopes, and tenant-level access governance
- expose effective-permission inspection for clients and administration flows

### Main endpoints
- `GET /api/v1/authorization/roles`
- `POST /api/v1/authorization/roles`
- `GET /api/v1/authorization/roles/{roleId}`
- `PATCH /api/v1/authorization/roles/{roleId}`
- `GET /api/v1/authorization/permissions`
- `POST /api/v1/authorization/role-assignments`
- `DELETE /api/v1/authorization/role-assignments/{assignmentId}`
- `POST /api/v1/authorization/branch-scopes`
- `DELETE /api/v1/authorization/branch-scopes/{scopeId}`
- `GET /api/v1/authorization/effective-permissions/me`
- `GET /api/v1/authorization/effective-permissions/users/{userId}`

### Request ownership
- Identity and Access

### Response ownership
- Identity and Access for role, permission, and scope state

### Security requirements
- tenant-admin or explicitly delegated authorization-management rights required
- changes to permissions, scopes, or elevated grants must be audit-critical events
- effective-permissions APIs must hide unauthorized branch or tenant scopes

---

## 5. Tenant APIs

### Purpose
- manage tenant identity, lifecycle, tenant-wide policy references, and top-level governance data

### Main endpoints
- `GET /api/v1/tenants`
- `POST /api/v1/tenants`
- `GET /api/v1/tenants/{tenantId}`
- `PATCH /api/v1/tenants/{tenantId}`
- `POST /api/v1/tenants/{tenantId}/activate`
- `POST /api/v1/tenants/{tenantId}/deactivate`
- `GET /api/v1/tenants/{tenantId}/settings`
- `PATCH /api/v1/tenants/{tenantId}/settings`
- `GET /api/v1/tenants/{tenantId}/calendars`

### Request ownership
- Tenant Management

### Response ownership
- Tenant Management for tenant identity and tenant policy data

### Security requirements
- platform-admin or tenant-governance rights depending on scope
- no cross-tenant access except explicitly authorized platform administration
- activation and policy changes must be audited

---

## 6. Branch APIs

### Purpose
- manage branch identity, hierarchy, calendars, status, and branch-local governance

### Main endpoints
- `GET /api/v1/branches`
- `POST /api/v1/branches`
- `GET /api/v1/branches/{branchId}`
- `PATCH /api/v1/branches/{branchId}`
- `POST /api/v1/branches/{branchId}/activate`
- `POST /api/v1/branches/{branchId}/deactivate`
- `GET /api/v1/branches/{branchId}/calendar`
- `PATCH /api/v1/branches/{branchId}/calendar`
- `GET /api/v1/branches/{branchId}/children`

### Request ownership
- Branch Management

### Response ownership
- Branch Management for branch identity, hierarchy, and branch-policy state

### Security requirements
- tenant-admin or branch-governance permission required
- branch-calendar changes are workflow/SLA-relevant and must be audited
- callers may only access branches inside their tenant scope

---

## 7. Customer APIs

### Purpose
- manage customer master records, contact data, and customer interaction history

### Main endpoints
- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `GET /api/v1/customers/{customerId}`
- `PATCH /api/v1/customers/{customerId}`
- `POST /api/v1/customers/{customerId}/contacts`
- `PATCH /api/v1/customers/{customerId}/contacts/{contactId}`
- `GET /api/v1/customers/{customerId}/interactions`
- `POST /api/v1/customers/{customerId}/interactions`
- `GET /api/v1/customers/{customerId}/service-orders`

### Request ownership
- CRM

### Response ownership
- CRM for customer identity, contacts, communication preferences, and interaction history

### Security requirements
- authenticated tenant access required
- branch visibility rules apply when customer scope is branch-limited
- personally identifiable data access must honor least-privilege controls

---

## 8. Measurement APIs

### Purpose
- manage versioned customer measurement records and technical measurement attribution

### Main endpoints
- `GET /api/v1/customers/{customerId}/measurements`
- `POST /api/v1/customers/{customerId}/measurements`
- `GET /api/v1/measurements/{measurementId}`
- `PATCH /api/v1/measurements/{measurementId}`
- `GET /api/v1/service-orders/{serviceOrderId}/measurements`

### Request ownership
- CRM

### Response ownership
- CRM for measurement version history and attribution

### Security requirements
- measurement access is sensitive-data access
- technical-measurement, customer-service, or explicitly delegated rights required
- all measurement create/update actions must be auditable

---

## 9. Service Order APIs

### Purpose
- manage commercial lifecycle, items, responsibilities, promised delivery commitment, and customer-facing references

### Main endpoints
- `GET /api/v1/service-orders`
- `POST /api/v1/service-orders`
- `GET /api/v1/service-orders/{serviceOrderId}`
- `PATCH /api/v1/service-orders/{serviceOrderId}`
- `POST /api/v1/service-orders/{serviceOrderId}/items`
- `PATCH /api/v1/service-orders/{serviceOrderId}/items/{itemId}`
- `POST /api/v1/service-orders/{serviceOrderId}/approve`
- `POST /api/v1/service-orders/{serviceOrderId}/cancel`
- `POST /api/v1/service-orders/{serviceOrderId}/delivery-date/recalculate`
- `GET /api/v1/service-orders/{serviceOrderId}/timeline`

### Request ownership
- Service Orders

### Response ownership
- Service Orders for commercial scope, financial anchor, delivery commitment, Commercial Responsible, and Technical Measurement Responsible

### Security requirements
- authenticated tenant access with Service Order create/read/update rights
- financial or approval-sensitive fields require elevated permissions
- delivery-date recalculation must honor workflow, calendar, and authorization rules

---

## 10. Production Order APIs

### Purpose
- manage Production Order generation, operational lifecycle, scheduling, execution state, and corrective version lineage

### Main endpoints
- `GET /api/v1/production-orders`
- `GET /api/v1/production-orders/{productionOrderId}`
- `POST /api/v1/service-orders/{serviceOrderId}/production-order/generate`
- `PATCH /api/v1/production-orders/{productionOrderId}`
- `POST /api/v1/production-orders/{productionOrderId}/schedule`
- `POST /api/v1/production-orders/{productionOrderId}/start`
- `POST /api/v1/production-orders/{productionOrderId}/pause`
- `POST /api/v1/production-orders/{productionOrderId}/complete`
- `POST /api/v1/production-orders/{productionOrderId}/versions`
- `GET /api/v1/production-orders/{productionOrderId}/versions`
- `GET /api/v1/production-orders/{productionOrderId}/print-view`

### Request ownership
- Production Orders

### Response ownership
- Production Orders for operational execution state, scheduling, QR-linked execution context, and version lineage

### Security requirements
- operational execution rights required
- production write actions must enforce workflow permission, branch scope, and object-state checks
- print-view responses must remain financially clean

---

## 11. Operational Resource APIs

### Purpose
- manage Operational Resource identity, skills, availability, branch scopes, and assignment readiness

### Main endpoints
- `GET /api/v1/operational-resources`
- `POST /api/v1/operational-resources`
- `GET /api/v1/operational-resources/{resourceId}`
- `PATCH /api/v1/operational-resources/{resourceId}`
- `GET /api/v1/operational-resources/{resourceId}/skills`
- `POST /api/v1/operational-resources/{resourceId}/skills`
- `GET /api/v1/operational-resources/{resourceId}/availability`
- `PATCH /api/v1/operational-resources/{resourceId}/availability`
- `GET /api/v1/operational-resources/{resourceId}/assignments`

### Request ownership
- Operational Resources

### Response ownership
- Operational Resources for capability, qualification, branch scope, and availability state

### Security requirements
- resource-management rights required for writes
- cross-branch assignment visibility must be scope-checked
- productivity or performance-sensitive views may require management-level permission

---

## 12. Quality APIs

### Purpose
- manage quality inspections, release decisions, and quality workflow outcomes

### Main endpoints
- `GET /api/v1/quality-records`
- `POST /api/v1/quality-records`
- `GET /api/v1/quality-records/{qualityRecordId}`
- `PATCH /api/v1/quality-records/{qualityRecordId}`
- `POST /api/v1/quality-records/{qualityRecordId}/approve`
- `POST /api/v1/quality-records/{qualityRecordId}/reject`
- `GET /api/v1/production-orders/{productionOrderId}/quality`

### Request ownership
- Quality

### Response ownership
- Quality for inspection result, defects, release status, and quality accountability

### Security requirements
- quality-specific permission required
- quality closure and rejection decisions must be auditable
- writes must enforce linkage to valid Production Order or item scope

---

## 13. Rework APIs

### Purpose
- manage rework initiation, attribution, reassignment, and corrective closure

### Main endpoints
- `GET /api/v1/rework-cases`
- `POST /api/v1/rework-cases`
- `GET /api/v1/rework-cases/{reworkCaseId}`
- `PATCH /api/v1/rework-cases/{reworkCaseId}`
- `POST /api/v1/rework-cases/{reworkCaseId}/assign`
- `POST /api/v1/rework-cases/{reworkCaseId}/reassign`
- `POST /api/v1/rework-cases/{reworkCaseId}/close`
- `GET /api/v1/rework-cases/{reworkCaseId}/attribution`

### Request ownership
- Rework

### Response ownership
- Rework for internal corrective execution state and original-versus-corrective attribution

### Security requirements
- quality/rework authority required
- reassignment and closure are audit-critical
- rework writes must preserve original Production Order lineage and original/corrective responsibility

---

## 14. Warranty APIs

### Purpose
- manage Warranty Adjustment and Warranty Execution flows as distinct responsibilities

### Main endpoints
- `GET /api/v1/warranty-adjustments`
- `POST /api/v1/warranty-adjustments`
- `GET /api/v1/warranty-adjustments/{warrantyAdjustmentId}`
- `PATCH /api/v1/warranty-adjustments/{warrantyAdjustmentId}`
- `GET /api/v1/warranty-executions`
- `POST /api/v1/warranty-executions`
- `GET /api/v1/warranty-executions/{warrantyExecutionId}`
- `PATCH /api/v1/warranty-executions/{warrantyExecutionId}`
- `POST /api/v1/warranty-executions/{warrantyExecutionId}/resolve`

### Request ownership
- Warranty

### Response ownership
- Warranty for post-delivery warranty responsibility state

### Security requirements
- warranty-management rights required
- warranty-execution writes must preserve Service Order and Production Order lineage
- no revenue-generating default behavior may be implied without authorized commercial flow

---

## 15. Financial APIs

### Purpose
- manage payment records, partial allocations, balances, and financial exceptions anchored to Service Orders

### Main endpoints
- `GET /api/v1/payments`
- `POST /api/v1/payments`
- `GET /api/v1/payments/{paymentId}`
- `POST /api/v1/payments/{paymentId}/allocations`
- `GET /api/v1/service-orders/{serviceOrderId}/financial-summary`
- `GET /api/v1/service-orders/{serviceOrderId}/partial-payments`
- `POST /api/v1/financial-exceptions`
- `GET /api/v1/financial-exceptions/{financialExceptionId}`
- `POST /api/v1/financial-exceptions/{financialExceptionId}/resolve`

### Request ownership
- Finance

### Response ownership
- Finance for payment trace, allocation state, outstanding balance, and exception status

### Security requirements
- finance permission required
- payment and allocation commands must remain anchored to Service Order commercial truth
- financial APIs must not expose or accept Production Order as the financial source of truth

---

## 16. Fiscal APIs

### Purpose
- manage fiscal document issuance lifecycle and fiscal-status synchronization

### Main endpoints
- `GET /api/v1/fiscal-documents`
- `POST /api/v1/fiscal-documents`
- `GET /api/v1/fiscal-documents/{fiscalDocumentId}`
- `POST /api/v1/fiscal-documents/{fiscalDocumentId}/issue`
- `POST /api/v1/fiscal-documents/{fiscalDocumentId}/cancel`
- `POST /api/v1/fiscal-documents/{fiscalDocumentId}/sync-status`

### Request ownership
- Fiscal

### Response ownership
- Fiscal for issuance state, legal status, and provider-status trace

### Security requirements
- fiscal and finance-authorized roles required
- issuance and cancellation are audit-critical actions
- order/item scope must remain anchored to Service Order commercial truth

---

## 17. Workflow APIs

### Purpose
- manage workflow definitions, statuses, transitions, visibility rules, approvals, and SLA policies

### Main endpoints
- `GET /api/v1/workflows`
- `POST /api/v1/workflows`
- `GET /api/v1/workflows/{workflowId}`
- `PATCH /api/v1/workflows/{workflowId}`
- `POST /api/v1/workflows/{workflowId}/statuses`
- `PATCH /api/v1/workflows/{workflowId}/statuses/{statusId}`
- `POST /api/v1/workflows/{workflowId}/transitions`
- `GET /api/v1/workflows/{workflowId}/sla-rules`
- `POST /api/v1/workflows/{workflowId}/sla-rules`
- `PATCH /api/v1/workflows/{workflowId}/sla-rules/{slaRuleId}`

### Request ownership
- Workflow Engine

### Response ownership
- Workflow Engine for policy state, status semantics, and SLA rules

### Security requirements
- tenant-admin or delegated workflow-governance rights required
- workflow changes must be versioned, auditable, and tenant-scoped
- workflow APIs must not directly mutate transactional source-of-truth records outside governed actions

---

## 18. QR APIs

### Purpose
- manage Production Order QR identity, QR scan traceability, and scan-driven operational actions

### Main endpoints
- `GET /api/v1/production-orders/{productionOrderId}/qr`
- `POST /api/v1/production-orders/{productionOrderId}/qr/reissue`
- `POST /api/v1/qr-events/scan`
- `GET /api/v1/qr-events`
- `GET /api/v1/production-orders/{productionOrderId}/qr-events`

### Request ownership
- QR Tracking for QR identity and scan capture
- Production Orders for resulting operational state change

### Response ownership
- QR Tracking for QR identity and event trace
- Production Orders for resulting operational state after authorized scan-driven transitions

### Security requirements
- authenticated identity required even for scan actions
- scan-triggered state change must validate workflow permission, tenant, branch, and object state
- physical bag context may be referenced in response context but must not replace Production Order QR authority

---

## 19. Pickup APIs

### Purpose
- manage pickup authorization, release credentials, remote approval, and pickup completion evidence

### Main endpoints
- `GET /api/v1/pickup-authorizations`
- `POST /api/v1/service-orders/{serviceOrderId}/pickup-authorizations`
- `GET /api/v1/pickup-authorizations/{pickupAuthorizationId}`
- `POST /api/v1/pickup-authorizations/{pickupAuthorizationId}/tokens`
- `POST /api/v1/pickup-authorizations/{pickupAuthorizationId}/qr-codes`
- `POST /api/v1/pickup-authorizations/{pickupAuthorizationId}/temporary-codes`
- `POST /api/v1/pickup-authorizations/{pickupAuthorizationId}/remote-approval/request`
- `POST /api/v1/pickup-authorizations/{pickupAuthorizationId}/complete`

### Request ownership
- Pickup Authorization

### Response ownership
- Pickup Authorization for authorization state and release-credential lifecycle
- Custody for resulting pickup evidence and handoff trace once completion occurs

### Security requirements
- delivery/pickup authorization rights required
- credential issuance and pickup completion must be fully auditable
- completion must capture required custody evidence and authorization method

---

## 20. Storage Location APIs

### Purpose
- manage location catalog, current assignments, location history, and retrieval visibility

### Main endpoints
- `GET /api/v1/storage-locations`
- `POST /api/v1/storage-locations`
- `GET /api/v1/storage-locations/{locationId}`
- `PATCH /api/v1/storage-locations/{locationId}`
- `GET /api/v1/service-orders/{serviceOrderId}/location`
- `POST /api/v1/service-orders/{serviceOrderId}/location-assignments`
- `GET /api/v1/service-orders/{serviceOrderId}/location-history`

### Request ownership
- Custody / Delivery and Pickup traceability

### Response ownership
- Storage Location for catalog meaning
- Service Order retrieval context for current and historical assignment responses

### Security requirements
- authenticated tenant access required
- branch visibility rules apply
- location changes must be auditable and preserve retrieval visibility

---

## 21. Smart Concierge APIs

### Purpose
- support reception-flow orchestration and future concierge automation without becoming a core transactional source-of-truth domain

### Main endpoints
- `GET /api/v1/smart-concierge/queue`
- `POST /api/v1/smart-concierge/check-ins`
- `GET /api/v1/smart-concierge/check-ins/{checkInId}`
- `POST /api/v1/smart-concierge/check-ins/{checkInId}/handoff`
- `POST /api/v1/smart-concierge/notifications`

### Request ownership
- Smart Concierge

### Response ownership
- Smart Concierge for reception-flow state
- referenced Service Order or customer summaries remain externally owned reference data

### Security requirements
- reception/concierge permission required
- customer-facing automation must honor communication and privacy controls
- this API family must remain extensible because advanced automation is future scope

---

## 22. Audit APIs

### Purpose
- expose immutable audit history, custody evidence history, and investigation-oriented search endpoints

### Main endpoints
- `GET /api/v1/audit-events`
- `GET /api/v1/audit-events/{auditEventId}`
- `GET /api/v1/custody-events`
- `GET /api/v1/custody-events/{custodyEventId}`
- `GET /api/v1/service-orders/{serviceOrderId}/audit-trail`
- `GET /api/v1/production-orders/{productionOrderId}/audit-trail`

### Request ownership
- Audit / Custody

### Response ownership
- Audit for immutable cross-domain event history
- Custody for handoff and evidence traceability history

### Security requirements
- audit-reading rights required
- sensitive evidence references may require stricter role gates than basic audit metadata
- audit APIs are read-only and must never mutate transactional state

---

## 23. Dashboard APIs

### Purpose
- expose read-oriented KPI, workload, SLA, quality, finance, and productivity projections

### Main endpoints
- `GET /api/v1/dashboards/overview`
- `GET /api/v1/dashboards/production`
- `GET /api/v1/dashboards/quality`
- `GET /api/v1/dashboards/finance`
- `GET /api/v1/dashboards/operational-resources`
- `GET /api/v1/dashboards/sla`
- `GET /api/v1/dashboards/delivery`

### Request ownership
- Reporting and Analytics projections governed by the owning source domains

### Response ownership
- derived read models only
- underlying truth remains owned by Service Orders, Production Orders, Finance, Quality, Workflow, and Operational Resources

### Security requirements
- dashboard visibility must respect tenant, branch, and role scopes
- rankings and sensitive performance views may require management-only permissions
- dashboard APIs must remain read-only

---

## 24. Migration APIs

### Purpose
- support onboarding imports, validation workflows, job progress, and controlled activation/go-live readiness

### Main endpoints
- `POST /api/v1/migration/jobs`
- `GET /api/v1/migration/jobs`
- `GET /api/v1/migration/jobs/{jobId}`
- `POST /api/v1/migration/jobs/{jobId}/validate`
- `POST /api/v1/migration/jobs/{jobId}/approve`
- `POST /api/v1/migration/jobs/{jobId}/rollback`
- `GET /api/v1/migration/jobs/{jobId}/errors`
- `GET /api/v1/migration/templates/{domain}`

### Request ownership
- Migration and Onboarding application boundary governed by the owning destination domains

### Response ownership
- migration job state belongs to Migration/Onboarding orchestration
- validated imported business data belongs to the destination domain after approval

### Security requirements
- onboarding or tenant-activation authority required
- imports, approvals, and rollbacks are audit-critical
- job processing must remain tenant-aware and must not silently activate invalid data

---

## 25. API Catalog

| API Family | Primary Domain Owner | Primary Write Truth | Typical Consumers |
|---|---|---|---|
| Authentication APIs | Identity and Access | identity/session state | web app, mobile app, support tools |
| Authorization APIs | Identity and Access | roles, permissions, scopes | admin UI, support tools |
| Tenant APIs | Tenant Management | tenant governance | platform admin, tenant admin |
| Branch APIs | Branch Management | branch governance | tenant admin, branch admin |
| Customer APIs | CRM | customer identity | service, sales, support |
| Measurement APIs | CRM | measurement history | service, technical measurement, production support |
| Service Order APIs | Service Orders | commercial and financial truth | service desk, sales, finance, pickup |
| Production Order APIs | Production Orders | operational execution truth | production floor, supervisors, quality |
| Operational Resource APIs | Operational Resources | resource capability and scope | operations management, scheduling |
| Quality APIs | Quality | inspection and release truth | quality teams, supervisors |
| Rework APIs | Rework | corrective execution case truth | quality, operations |
| Warranty APIs | Warranty | warranty responsibility truth | service, quality, operations |
| Financial APIs | Finance | payment and allocation truth | finance, service desk |
| Fiscal APIs | Fiscal | fiscal lifecycle truth | finance, fiscal operations |
| Workflow APIs | Workflow Engine | lifecycle policy truth | tenant admin, operations governance |
| QR APIs | QR Tracking / Production Orders | QR trace plus operational result | production operators, mobile scanners |
| Pickup APIs | Pickup Authorization | release authorization truth | delivery, reception, pickup teams |
| Storage Location APIs | Custody / Delivery and Pickup | retrieval placement truth | reception, pickup, operations |
| Smart Concierge APIs | Smart Concierge | reception orchestration truth | reception, concierge flows |
| Audit APIs | Audit / Custody | immutable history | compliance, management, support |
| Dashboard APIs | Reporting projections | derived read models only | management, supervisors |
| Migration APIs | Migration/Onboarding orchestration | migration job state | onboarding teams, tenant activation |

---

## 26. Domain Mapping

### 26.1 Commercial and financial mapping
- Service Order APIs own commercial writes and delivery commitments
- Financial and Fiscal APIs remain subordinate to Service Order commercial truth

### 26.2 Operational execution mapping
- Production Order APIs own operational lifecycle writes
- QR APIs may trigger operational actions but only through Production Order authority
- Operational Resource APIs provide capability and scope, not Production Order truth

### 26.3 Corrective flow mapping
- Quality APIs own inspection decisions
- Rework APIs own internal corrective execution cases
- Warranty APIs own post-delivery warranty flows
- all corrective APIs must preserve original Service Order and Production Order lineage

### 26.4 Pickup and traceability mapping
- Pickup APIs own release authorization
- Storage Location APIs own retrieval placement visibility
- Audit APIs own immutable history
- physical bag support context remains optional traceability context only

### 26.5 Governance and configuration mapping
- Tenant, Branch, Authorization, and Workflow APIs own configuration/governance state
- Dashboard APIs consume governed projections but own no transactional truth

---

## 27. Remaining Risks

- API error taxonomy and idempotency policy still need a final platform-wide specification.
- Identity and Access data structures still require final implementation-level formalization.
- Workflow-driven action endpoints may become too numerous without strict endpoint naming and transition-governance conventions.
- Cross-domain read composition must be carefully controlled so response aggregation does not blur source-of-truth ownership.
- QR scan APIs require special care for concurrency, replay protection, and unstable-network scenarios.
- Migration APIs may require high-volume file-processing and validation semantics that should remain asynchronous and operationally isolated.
- Dashboard APIs may eventually require separate read models or caching strategy for performance at scale.

---

## 28. Backend Readiness Score

**Score: 96/100**

Rationale:
- the business, architecture, database, and backend baselines are mature enough to support explicit API design
- API ownership boundaries now align clearly with the approved bounded contexts
- the source-of-truth split between Service Order, Production Order, Workflow, Audit, Pickup, and Finance is preserved in the endpoint model
- the remaining deductions apply mainly to shared error conventions, identity/session detail, concurrency handling, and high-scale read-model tactics rather than to API-boundary uncertainty

---

## 29. Final API Design Statement

ANEXSYS API design is ready to guide backend implementation.

Implementation conditions:
- APIs must preserve Service Order as the commercial and financial source of truth
- APIs must preserve Production Order as the operational execution source of truth
- Production Order QR ownership must remain exclusive for production execution actions
- physical bag support context must never be promoted into an independent API authority
